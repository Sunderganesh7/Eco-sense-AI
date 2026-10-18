from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class LocationInput(BaseModel):
    name: Optional[str] = "Selected Map Coordinate"
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    land_type: str = "municipal_public"
    soil_type: str = "Clay Loam"
    crz_status: Optional[str] = "Non-CRZ"
    target_trees: Optional[int] = 50
    plantation_purpose: Optional[str] = "Urban Greening"
    ownership_type: Optional[str] = "Citizen / NGO Group"
    existing_canopy_pct: Optional[float] = 15.0
    water_source: Optional[str] = "Municipal Supply / Recycled Water"
    road_distance_m: Optional[float] = 10.0
    district: Optional[str] = None

class FactorScore(BaseModel):
    factor_id: str
    factor_name: str
    weight: int
    score_awarded: int
    status: str  # optimal, moderate, strict, critical
    explanation: str

class ChecklistItem(BaseModel):
    id: str
    name: str
    tag: str  # Required, Conditional, Not applicable, Verify with authority
    description: str
    authority_source: str
    is_completed: bool = False

class ProcedureStep(BaseModel):
    step_number: int
    title: str
    description: str
    authority: str
    estimated_timeline: str
    is_current: bool = False
    is_completed: bool = False

class ComplianceCheckResponse(BaseModel):
    check_ref: str
    timestamp: datetime
    location_name: str
    latitude: float
    longitude: float
    district: Optional[str] = None
    division: Optional[str] = None
    is_inside_maharashtra: bool = True
    granularity_label: str = "parcel-level"  # e.g., "based on Pune regional data" or "parcel-level"
    outside_region_warning: Optional[str] = None
    
    land_type: str
    land_type_display: str
    governing_law: str
    primary_authority: str
    secondary_authorities: List[str]
    
    compliance_score: int  # 0 to 100
    verdict: str  # e.g., "Highly Suitable", "Conditionally Suitable", "High Regulatory Barrier / Restricted"
    verdict_badge: str  # green, amber, red
    verdict_summary: str
    noc_required_display: str
    
    factors: List[FactorScore]
    checklist: List[ChecklistItem]
    procedure_steps: List[ProcedureStep]
    recommended_species_top5: List[Dict[str, Any]]
    matched_schemes_top3: List[Dict[str, Any]]
    prohibited_species: List[str]
    statutory_conditions: List[str]
    disclaimer: str = "This is a preliminary legal-compliance assessment. Final approval remains with the competent government authority."

class LocationOut(BaseModel):
    id: int
    name: str
    district: str
    state: str
    latitude: float
    longitude: float
    land_type: str
    soil_type: str
    crz_status: str
    rainfall_annual_mm: int
    existing_canopy_pct: float
    nearest_water_source: str
    description: str
    is_preset: bool

    class Config:
        from_attributes = True

class SpeciesFilter(BaseModel):
    region: Optional[str] = None
    soil_type: Optional[str] = None
    water_requirement: Optional[str] = None
    purpose: Optional[str] = None
    max_height_m: Optional[float] = None
    search: Optional[str] = None

class SchemeFilter(BaseModel):
    applicant_type: Optional[str] = None
    purpose: Optional[str] = None
    sponsor_level: Optional[str] = None
    search: Optional[str] = None

class AssistantChatRequest(BaseModel):
    message: str
    land_type: Optional[str] = "municipal_public"
    location_name: Optional[str] = "Site Location"
    trees_count: Optional[int] = 50
    user_role: Optional[str] = "Citizen"
    context_data: Optional[Dict[str, Any]] = None

class AssistantChatResponse(BaseModel):
    reply: str
    cited_rules: List[str]
    relevant_authorities: List[str]
    suggested_actions: List[str]
    disclaimer: str = "This is a preliminary legal-compliance assessment. Final approval remains with the competent government authority."

class DocumentDraftRequest(BaseModel):
    document_type: str  # noc_request, plantation_proposal, maintenance_undertaking, compliance_audit
    applicant_name: str
    applicant_role: str
    organization_name: Optional[str] = "Green Action Alliance"
    site_name: str
    district: str
    latitude: float
    longitude: float
    land_type: str
    target_trees: int
    selected_species: List[str]
    water_plan: str
    target_authority: str

class DocumentDraftResponse(BaseModel):
    title: str
    document_type: str
    content_markdown: str
    metadata: Dict[str, Any]
    disclaimer: str = "This is a preliminary legal-compliance assessment. Final approval remains with the competent government authority."

class CertificateCreateRequest(BaseModel):
    project_name: str
    planter_name: str
    planter_role: str = "Citizen / Green Volunteer"
    organization: Optional[str] = "Independent Citizen Initiative"
    location_name: str
    district: str = "Maharashtra"
    latitude: float
    longitude: float
    land_type: str = "Municipal Public Ground"
    trees_count: int = 50
    species_planted: List[str]
    authority_reference: Optional[str] = "Tree Authority Registered Project"
    compliance_score: Optional[int] = 88
