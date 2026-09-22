"""
GreenPath AI — Custom YOLO Training Router
Endpoints for dataset upload, training configuration, and status tracking.
"""

import os
import uuid
import shutil
import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/training", tags=["Model Training"])

DATASETS_DIR = "datasets"
TRAINING_JOBS: dict = {}   # In-memory job store (use DB/Redis in production)


class TrainingConfig(BaseModel):
    model_config = {"protected_namespaces": ()}   # suppress pydantic model_ warning
    epochs: int = 50
    batch_size: int = 16
    image_size: int = 640
    learning_rate: float = 0.01
    base_model: str = "yolov8n"   # yolov8n / yolov8s / yolov8m  (renamed from model_base)
    project_name: str = "greenpath_custom"


# ================================================================
# POST /training/upload-dataset
# ================================================================
@router.post("/upload-dataset")
async def upload_dataset(
    dataset_zip: UploadFile = File(..., description="ZIP file with images/ and labels/ folders"),
    dataset_name: str = Form(...),
):
    """
    Upload a custom YOLOv8-format dataset (ZIP).
    Expected ZIP structure:
      /images/train/*.jpg
      /images/val/*.jpg
      /labels/train/*.txt
      /labels/val/*.txt
      data.yaml
    """
    if not dataset_zip.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Dataset must be a .zip file.")

    job_id = uuid.uuid4().hex
    dataset_dir = os.path.join(DATASETS_DIR, job_id)
    os.makedirs(dataset_dir, exist_ok=True)

    zip_path = os.path.join(dataset_dir, "dataset.zip")
    with open(zip_path, "wb") as f:
        shutil.copyfileobj(dataset_zip.file, f)

    # Extract ZIP
    try:
        import zipfile
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(dataset_dir)
        os.remove(zip_path)
    except Exception as e:
        shutil.rmtree(dataset_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to extract ZIP: {e}")

    # Validate structure
    has_yaml = any(f.endswith(".yaml") for f in os.listdir(dataset_dir))
    images_exist = os.path.exists(os.path.join(dataset_dir, "images"))
    labels_exist = os.path.exists(os.path.join(dataset_dir, "labels"))

    if not (has_yaml and images_exist and labels_exist):
        shutil.rmtree(dataset_dir, ignore_errors=True)
        raise HTTPException(
            status_code=400,
            detail="Invalid dataset structure. Expected: images/, labels/, and data.yaml",
        )

    TRAINING_JOBS[job_id] = {
        "job_id": job_id,
        "dataset_name": dataset_name,
        "dataset_dir": dataset_dir,
        "status": "dataset_ready",
        "progress": 0,
        "metrics": {},
    }

    logger.info(f"📁 Dataset uploaded: {dataset_name} → {dataset_dir}")
    return {
        "success": True,
        "job_id": job_id,
        "dataset_name": dataset_name,
        "message": "Dataset uploaded. Call /training/start/{job_id} to begin training.",
    }


# ================================================================
# POST /training/start/{job_id}
# ================================================================
@router.post("/start/{job_id}")
async def start_training(
    job_id: str,
    background_tasks: BackgroundTasks,
    config: TrainingConfig = TrainingConfig(),
):
    """
    Start YOLO model training using the uploaded dataset.
    Training runs in the background. Poll /training/status/{job_id}.
    """
    if job_id not in TRAINING_JOBS:
        raise HTTPException(status_code=404, detail="Training job not found.")

    job = TRAINING_JOBS[job_id]
    if job["status"] not in ("dataset_ready",):
        raise HTTPException(
            status_code=400,
            detail=f"Job status is '{job['status']}'. Cannot start training.",
        )

    job["status"] = "training"
    job["config"] = config.model_dump()
    background_tasks.add_task(_run_training, job_id, config)

    return {
        "success": True,
        "job_id": job_id,
        "message": "Training started in background.",
        "config": config.model_dump(),
    }


def _run_training(job_id: str, config: TrainingConfig):
    """Background task: run YOLO training."""
    try:
        from ultralytics import YOLO

        job = TRAINING_JOBS[job_id]
        dataset_dir = job["dataset_dir"]

        # Find the YAML config file
        yaml_path = None
        for f in os.listdir(dataset_dir):
            if f.endswith(".yaml"):
                yaml_path = os.path.join(dataset_dir, f)
                break

        if not yaml_path:
            job["status"] = "failed"
            job["error"] = "No data.yaml found in dataset."
            return

        model = YOLO(f"{config.base_model}.pt")

        results = model.train(
            data=yaml_path,
            epochs=config.epochs,
            batch=config.batch_size,
            imgsz=config.image_size,
            lr0=config.learning_rate,
            project=os.path.join("outputs", "training"),
            name=config.project_name,
            exist_ok=True,
        )

        # Extract metrics
        metrics = {
            "mAP50": float(results.results_dict.get("metrics/mAP50(B)", 0)),
            "mAP50-95": float(results.results_dict.get("metrics/mAP50-95(B)", 0)),
            "precision": float(results.results_dict.get("metrics/precision(B)", 0)),
            "recall": float(results.results_dict.get("metrics/recall(B)", 0)),
        }

        best_model_path = str(results.save_dir / "weights" / "best.pt")

        job["status"] = "completed"
        job["progress"] = 100
        job["metrics"] = metrics
        job["best_model_path"] = best_model_path

        logger.info(f"✅ Training {job_id} complete. mAP50: {metrics['mAP50']:.3f}")

    except Exception as e:
        logger.error(f"❌ Training {job_id} failed: {e}", exc_info=True)
        TRAINING_JOBS[job_id]["status"] = "failed"
        TRAINING_JOBS[job_id]["error"] = str(e)


# ================================================================
# GET /training/status/{job_id}
# ================================================================
@router.get("/status/{job_id}")
async def training_status(job_id: str):
    """Poll training progress and metrics."""
    if job_id not in TRAINING_JOBS:
        raise HTTPException(status_code=404, detail="Training job not found.")
    return TRAINING_JOBS[job_id]


# ================================================================
# GET /training/jobs
# ================================================================
@router.get("/jobs")
async def list_training_jobs():
    """List all training jobs."""
    return {
        "total": len(TRAINING_JOBS),
        "jobs": [
            {
                "job_id": jid,
                "status": j["status"],
                "dataset_name": j.get("dataset_name"),
                "progress": j.get("progress", 0),
                "metrics": j.get("metrics", {}),
            }
            for jid, j in TRAINING_JOBS.items()
        ],
    }
