from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.monitoring import MonitoringPlot
from app.engine.gis_engine import calculate_ndvi_simulation

router = APIRouter(prefix="/monitoring", tags=["Plantation Monitoring & NDVI"])

@router.get("/plots")
def list_monitoring_plots(db: Session = Depends(get_db)):
    return db.query(MonitoringPlot).all()

@router.get("/plots/{plot_id}")
def get_monitoring_plot(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(MonitoringPlot).filter(MonitoringPlot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Monitoring plot not found")
    return plot

@router.post("/simulate")
def simulate_ndvi(req: Dict[str, Any]):
    trees = int(req.get("target_trees", 50))
    area = float(req.get("area_sqm", 2000.0))
    months = int(req.get("months_elapsed", 24))
    return calculate_ndvi_simulation(target_trees=trees, area_sqm=area, months_elapsed=months)
