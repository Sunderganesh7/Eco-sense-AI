# Plantwise AI — GIS-Based Smart Tree Plantation Planning & Legal Compliance System

> **Statutory Compliance Advisory**: *This system provides automated preliminary legal-compliance assessments based on codified municipal, state, and central environmental laws. Final approval remains exclusively with the competent government authority (Tree Authority / Forest Department / MCZMA / PWD / NHAI).*

GreenPermit AI is a full-stack, product-grade GIS platform designed to plan, evaluate, and monitor urban and rural afforestation initiatives with strict statutory compliance and ecological edaphic matching.

---

## 🌟 Key Features

1. **Rule-Based Deterministic Legal Compliance Engine**:
   - Codified statutory rules mapping **13 land categories** (Private Residential/Commercial, Municipal Public, State Reserved Forest, Farmland Agroforestry, NHAI/PWD Highways, Railways, Coastal CRZ-I/II/III, Eco-Sensitive Zones, Industrial MIDC Greenbelts, Riparian Water Buffers).
   - Dynamic document checklist tagged: `Required`, `Conditional`, `Not applicable`, `Verify with authority`.
   - Authority Finder resolving competent Tree Officers, Forest DFOs, and Coastal Management Committees.

2. **0–100 Plantation Compliance Score & 8-Factor Breakdown**:
   - Explainable scoring across Land Title Clarity, Forest Restrictions, CRZ Compliance, Canopy Headroom, Road/Utility Setback, Water Security, Native Soil Edaphic Match, and Regulatory Streamlining.
   - Color-coded verdict banners (`Highly Suitable`, `Conditionally Suitable`, `High Regulatory Barrier / Restricted`).

3. **Spatial GIS Suitability Map & Overlays**:
   - Interactive Leaflet map with satellite/street view switcher.
   - Polygon overlay layers for High Suitability, Medium Setback, and Avoid/Restricted Zones.

4. **Multi-Criteria Native Species Recommendation**:
   - Database of 20 indigenous species ranked by soil compatibility, regional climate, canopy spread, Air Pollution Tolerance Index (APTI), and carbon sequestration potential (kg CO₂/year).

5. **State & Central Government Scheme Finder**:
   - Searchable and filterable catalog of 10 verified plantation schemes (e.g. Maharashtra Social Forestry 50-Crore Tree Mission, Sub-Mission on Agroforestry SMAF, Nagar Van Yojana, MISHTI Mangrove Scheme, BMC/PMC Tax Rebates).

6. **NDVI Satellite Vegetation & Survival Monitoring**:
   - Multi-spectral Before/After split comparison slider.
   - 24-month NDVI growth trajectory graphs and live projection calculator.

7. **Cryptographic Digital Plantation Certificates**:
   - Tamper-proof certificate generator with 24-character SHA-256 verification hash, GPS coordinates, QR payload, and public authenticity verifier.

8. **Grounded AI Legal Assistant & Proposal Drafter**:
   - Statutory legal Q&A citing *Maharashtra Tree Act 1975*, *CRZ Notification 2019*, and *Forest Conservation Act*.
   - Automated drafting of Tree Officer NOC Request Letters, Plantation Proposals, 3-Year Maintenance Undertakings, and Self-Assessment Compliance Reports.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, Leaflet, React-Leaflet, jsPDF, Canvas Confetti.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, SQLite (PostgreSQL-ready), Pydantic v2, ReportLab PDF Generator, Pytest.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+ (or Python launcher `py`)
- Node.js v18+ and `npm`

### 2. Backend Setup
```bash
# Navigate to backend folder
cd backend

# Create & activate virtual environment (Windows PowerShell)
py -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run test suite
pytest -v tests/

# Start backend server (runs on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend folder
cd frontend

# Install packages
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Demo Scenarios (Pre-Seeded Maharashtra Sites)

Select any of the 10 pre-seeded locations from the dropdown in **"New Plantation Check"**:
1. **Aarey Colony Forest Fringe, Mumbai**: Shows Forest Conservation Act restrictions, DFO permissions, and strict endemic species mandate.
2. **Bandra Seaside Promenade, Mumbai**: Shows Municipal Tree Authority jurisdiction and CRZ-II considerations.
3. **Versova Mangrove Creek Buffer, Mumbai**: Shows CRZ-I coastal clearance, Mangrove Cell recommendations, and halophyte species (*Avicennia marina*).
4. **Hinjawadi IT Park Phase 3, Pune**: Shows commercial green belt compliance and high suitability for native shade trees.
5. **Baramati Agricultural Bund, Pune**: Shows 100% suitability for boundary agroforestry and SMAF subsidy matching.
6. **NH-48 Expressway Verge, Khandala**: Shows NHAI Green Highways Policy setback and deep taproot requirements.
7. **Seminary Hills, Nagpur**: Shows Eco-Sensitive Zone (ESZ) buffer compliance and 100% indigenous flora matching.

---

## 📜 License & Compliance Note
Built for academic and environmental planning purposes. Always consult local municipal and forest department circulars for official approvals.
