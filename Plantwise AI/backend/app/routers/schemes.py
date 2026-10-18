from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.scheme import Scheme

router = APIRouter(prefix="/schemes", tags=["Government Schemes"])

@router.get("")
def list_schemes(
    applicant_type: Optional[str] = None,
    purpose: Optional[str] = None,
    sponsor_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Scheme)
    if search:
        s_term = f"%{search}%"
        query = query.filter(
            (Scheme.name.ilike(s_term)) |
            (Scheme.category.ilike(s_term)) |
            (Scheme.summary.ilike(s_term))
        )
    if sponsor_level and sponsor_level != "All":
        query = query.filter(Scheme.sponsor_level.ilike(f"%{sponsor_level}%"))

    schemes_list = query.all()
    results = []
    for sc in schemes_list:
        if applicant_type and applicant_type != "All":
            if not any(applicant_type.lower() in str(app).lower() for app in (sc.eligible_applicants or [])):
                continue
        if purpose and purpose != "All":
            if not any(purpose.lower() in str(p).lower() for p in (sc.purpose_tags or [])):
                continue
        results.append(sc)

    return results

@router.get("/{scheme_id}")
def get_scheme_by_id(scheme_id: int, db: Session = Depends(get_db)):
    return db.query(Scheme).filter(Scheme.id == scheme_id).first()
