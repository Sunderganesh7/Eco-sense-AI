#!/usr/bin/env bash
# Render build script -- installs deps, fetches LFS files, retrains ML models

set -e  # Exit on error

# Ensure we are operating from the script directory (Agrisense AI root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== AgriSense AI Render Build Started ==="
echo "Working directory: $(pwd)"

# -------------------------------------------------------------
# 1. Install Git LFS Linux CLI if not already installed
# -------------------------------------------------------------
if ! command -v git-lfs &>/dev/null; then
    echo "=== Git LFS CLI not found. Installing official Git LFS for Linux... ==="
    LFS_VERSION="v3.6.1"
    ARCH=$(uname -m)
    case "$ARCH" in
        x86_64)
            LFS_ARCH="amd64"
            ;;
        aarch64|arm64)
            LFS_ARCH="arm64"
            ;;
        *)
            LFS_ARCH="amd64"
            ;;
    esac

    LFS_TAR="git-lfs-linux-${LFS_ARCH}-${LFS_VERSION}.tar.gz"
    LFS_URL="https://github.com/git-lfs/git-lfs/releases/download/${LFS_VERSION}/${LFS_TAR}"
    LFS_TMP_DIR=$(mktemp -d /tmp/git-lfs-XXXXXX)
    LFS_BIN_DIR="/tmp/git-lfs-bin"

    echo "Downloading Git LFS ${LFS_VERSION} (${LFS_ARCH}) from: ${LFS_URL}"
    if command -v curl &>/dev/null; then
        curl -fsSL --retry 3 --retry-delay 2 "$LFS_URL" -o "${LFS_TMP_DIR}/${LFS_TAR}"
    elif command -v wget &>/dev/null; then
        wget -q --tries=3 "$LFS_URL" -O "${LFS_TMP_DIR}/${LFS_TAR}"
    else
        echo "ERROR: Neither curl nor wget is available to download Git LFS."
        exit 1
    fi

    echo "Extracting Git LFS archive..."
    tar -xzf "${LFS_TMP_DIR}/${LFS_TAR}" -C "$LFS_TMP_DIR"

    # Locate extracted git-lfs executable
    LFS_BIN=$(find "$LFS_TMP_DIR" -type f -name "git-lfs" | head -n 1)
    if [ -z "$LFS_BIN" ] || [ ! -f "$LFS_BIN" ]; then
        echo "ERROR: Could not locate git-lfs binary in extracted archive."
        rm -rf "$LFS_TMP_DIR"
        exit 1
    fi

    mkdir -p "$LFS_BIN_DIR"
    cp "$LFS_BIN" "$LFS_BIN_DIR/git-lfs"
    chmod +x "$LFS_BIN_DIR/git-lfs"
    rm -rf "$LFS_TMP_DIR"

    # Prepend to PATH so git and shell locate it immediately
    export PATH="$LFS_BIN_DIR:$PATH"
    echo "Git LFS CLI successfully installed to $LFS_BIN_DIR/git-lfs"
else
    echo "=== Git LFS CLI is already installed ==="
fi

# Confirm Git LFS is operational
echo "Git LFS binary path: $(command -v git-lfs || echo 'NOT FOUND')"
git lfs version

# -------------------------------------------------------------
# 2. Initialize Git LFS and fetch repository LFS files
# -------------------------------------------------------------
echo "=== Initializing Git LFS and pulling model files ==="
git lfs install
git lfs pull
git lfs checkout

# -------------------------------------------------------------
# 3. Install Python dependencies
# -------------------------------------------------------------
echo "=== Installing Python dependencies ==="
python -m pip install --upgrade pip || pip install --upgrade pip
pip install -r requirements.txt

# -------------------------------------------------------------
# 4. Prepare model directory & inspect datasets
# -------------------------------------------------------------
echo "=== Creating model output directory ==="
mkdir -p latest_model/disease

echo "=== Verifying datasets ==="
echo "Datasets:"
ls -la datasets/ 2>/dev/null || true
wc -l datasets/*.csv 2>/dev/null || true

# -------------------------------------------------------------
# 5. Check whether model files are valid binaries or LFS pointers
# -------------------------------------------------------------
is_pointer_or_missing() {
    local target="$1"
    local min_size="${2:-10000}"

    if [ ! -f "$target" ]; then
        return 0  # Missing -> needs retrain or error
    fi

    # Check for Git LFS pointer text header
    if head -n 2 "$target" 2>/dev/null | grep -q "^version https://git-lfs"; then
        return 0  # Still a pointer
    fi

    # Check file size in bytes
    local size
    size=$(wc -c < "$target" 2>/dev/null | tr -d '[:space:]')
    if [ -z "$size" ] || [ "$size" -lt "$min_size" ]; then
        return 0  # Suspiciously small / empty
    fi

    return 1  # Valid binary
}

if is_pointer_or_missing "latest_model/crop_recommendation_rf.pkl" 100000; then
    echo "=== Models missing or unresolved LFS pointers: Retraining ML models ==="
    cd api
    python retrain_models.py
    cd ..
else
    echo "=== Pre-trained ML models found and verified from Git LFS, skipping retraining to save memory ==="
fi

# -------------------------------------------------------------
# 6. Verify expected files in latest_model/ are actual model files
# -------------------------------------------------------------
echo "=== Verifying expected model files are actual binaries (not LFS pointers) ==="
EXPECTED_MODELS=(
    "latest_model/crop_recommendation_rf.pkl:100000"
    "latest_model/fertilizer_recommendation_rf.pkl:100000"
    "latest_model/crop_yield_xgboost.pkl:50000"
    "latest_model/crop_price_xgboost.pkl:50000"
    "latest_model/disease/corn.tflite:50000"
    "latest_model/disease/potato.tflite:50000"
    "latest_model/disease/rice.tflite:1000000"
    "latest_model/disease/sugarcane.tflite:50000"
)

VERIFICATION_FAILED=0
for item in "${EXPECTED_MODELS[@]}"; do
    model_file="${item%%:*}"
    min_size="${item##*:}"

    if [ ! -f "$model_file" ]; then
        echo "FAIL: Expected model file missing: $model_file"
        VERIFICATION_FAILED=1
    elif head -n 2 "$model_file" 2>/dev/null | grep -q "^version https://git-lfs"; then
        echo "FAIL: Model file is a Git LFS pointer text file, not binary: $model_file"
        echo "  Pointer header: $(head -n 2 "$model_file")"
        VERIFICATION_FAILED=1
    else
        actual_size=$(wc -c < "$model_file" 2>/dev/null | tr -d '[:space:]')
        if [ "$actual_size" -lt "$min_size" ]; then
            echo "FAIL: Model file $model_file is too small (${actual_size} bytes < ${min_size} bytes)."
            VERIFICATION_FAILED=1
        else
            echo "OK: $model_file verified (${actual_size} bytes)"
        fi
    fi
done

if [ "$VERIFICATION_FAILED" -ne 0 ]; then
    echo "ERROR: Model verification failed. Expected actual model binaries in latest_model/."
    exit 1
fi

echo "=== Build complete ==="
echo "Models saved in latest_model/"
ls -la latest_model/
ls -la latest_model/disease/
