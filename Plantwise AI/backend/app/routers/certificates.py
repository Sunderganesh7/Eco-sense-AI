import uuid
import hashlib
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.certificate import Certificate
from app.schemas.compliance import CertificateCreateRequest

router = APIRouter(prefix="/certificates", tags=["Digital Certificates"])

@router.get("")
def list_certificates(db: Session = Depends(get_db)):
    return db.query(Certificate).order_by(Certificate.created_at.desc()).all()

@router.get("/{cert_id}")
def get_certificate(cert_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.certificate_id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert

@router.get("/verify/{v_hash}")
def verify_certificate_hash(v_hash: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.verification_hash == v_hash).first()
    if not cert:
        return {"valid": False, "message": "Certificate hash not recognized on the GreenPermit registry."}
    return {
        "valid": True,
        "certificate_id": cert.certificate_id,
        "project_name": cert.project_name,
        "planter_name": cert.planter_name,
        "location_name": cert.location_name,
        "trees_count": cert.trees_count,
        "status": cert.status,
        "issue_date": cert.created_at.strftime("%B %d, %Y")
    }

@router.post("", response_model=Dict[str, Any])
def issue_certificate(req: CertificateCreateRequest, db: Session = Depends(get_db)):
    cert_id = f"GP-CERT-{uuid.uuid4().hex[:8].upper()}"
    raw_hash_str = f"{cert_id}:{req.project_name}:{req.planter_name}:{req.latitude}:{req.longitude}:{req.trees_count}"
    v_hash = hashlib.sha256(raw_hash_str.encode('utf-8')).hexdigest()[:24].upper()
    
    qr_payload = f"https://greenpermit.ai/verify/{v_hash}?cert_id={cert_id}"

    new_cert = Certificate(
        certificate_id=cert_id,
        created_at=datetime.utcnow(),
        project_name=req.project_name,
        planter_name=req.planter_name,
        planter_role=req.planter_role,
        organization=req.organization or "Citizen Initiative",
        location_name=req.location_name,
        district=req.district,
        latitude=req.latitude,
        longitude=req.longitude,
        land_type=req.land_type,
        trees_count=req.trees_count,
        species_planted=req.species_planted,
        authority_reference=req.authority_reference or "Municipal Tree Authority Registered Reference",
        compliance_score=req.compliance_score or 88,
        verification_hash=v_hash,
        qr_data=qr_payload,
        status="Verified & Active"
    )
    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)

    return {
        "id": new_cert.id,
        "certificate_id": new_cert.certificate_id,
        "created_at": new_cert.created_at,
        "project_name": new_cert.project_name,
        "planter_name": new_cert.planter_name,
        "planter_role": new_cert.planter_role,
        "organization": new_cert.organization,
        "location_name": new_cert.location_name,
        "district": new_cert.district,
        "latitude": new_cert.latitude,
        "longitude": new_cert.longitude,
        "land_type": new_cert.land_type,
        "trees_count": new_cert.trees_count,
        "species_planted": new_cert.species_planted,
        "authority_reference": new_cert.authority_reference,
        "compliance_score": new_cert.compliance_score,
        "verification_hash": new_cert.verification_hash,
        "qr_data": new_cert.qr_data,
        "status": new_cert.status
    }
