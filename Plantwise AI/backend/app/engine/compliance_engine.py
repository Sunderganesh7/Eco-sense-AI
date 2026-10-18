import json
import os
from typing import Dict, Any, List
from app.schemas.compliance import ChecklistItem, ProcedureStep

# Path to rules.json
RULES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "rules.json")

def load_rules() -> Dict[str, Any]:
    with open(RULES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def evaluate_legal_compliance(
    land_type: str,
    target_trees: int = 50,
    ownership_type: str = "Private",
    crz_status: str = "Non-CRZ",
    road_distance_m: float = 10.0
) -> Dict[str, Any]:
    rules_data = load_rules()
    rules_map = {r["land_type"]: r for r in rules_data.get("rules", [])}
    
    # Normalize or fallback land_type
    matched_rule = rules_map.get(land_type)
    if not matched_rule:
        matched_rule = rules_map.get("municipal_public", {})

    # Determine if CRZ rule should override or augment
    if crz_status in ["CRZ-I", "CRZ-II", "CRZ-III"] and land_type != "coastal_crz":
        # Augment with CRZ requirements
        crz_rule = rules_map.get("coastal_crz", {})
    else:
        crz_rule = None

    # Determine dynamic document checklist with exact tags
    checklist_items: List[ChecklistItem] = []
    
    for idx, doc in enumerate(matched_rule.get("documents", [])):
        tag = doc.get("tag", "Required")
        # Dynamic adjustments
        if "NGO" in doc.get("name", "") and "NGO" not in ownership_type:
            tag = "Not applicable"
        elif "Stage-I" in doc.get("name", "") and target_trees < 100:
            tag = "Not applicable"
        elif "Stamp Paper" in doc.get("name", "") and target_trees > 50:
            tag = "Required"
            
        checklist_items.append(ChecklistItem(
            id=f"chk-{land_type}-{idx+1}",
            name=doc.get("name", ""),
            tag=tag,
            description=doc.get("description", ""),
            authority_source=matched_rule.get("primary_authority", "Tree Authority")
        ))
        
    # If CRZ is active, add CRZ specific clearance
    if crz_rule and crz_rule != matched_rule:
        checklist_items.append(ChecklistItem(
            id="chk-crz-clearance",
            name="MCZMA Coastal Clearance Certificate (CRZ Notification 2019)",
            tag="Required" if crz_status == "CRZ-I" else "Conditional",
            description=f"Mandatory clearance for {crz_status} coastal ecological zone.",
            authority_source="Maharashtra Coastal Zone Management Authority (MCZMA)"
        ))

    # Build the 11-step Recommended Procedure
    procedure_steps = build_11_step_procedure(land_type, matched_rule.get("primary_authority", "Tree Authority"))

    return {
        "land_type": land_type,
        "land_type_display": matched_rule.get("display_name", "Land Parcel"),
        "governing_law": matched_rule.get("governing_law", "Maharashtra Tree Act 1975"),
        "primary_authority": matched_rule.get("primary_authority", "Municipal Tree Authority"),
        "secondary_authorities": matched_rule.get("secondary_authorities", []),
        "general_feasibility": matched_rule.get("general_feasibility", "Medium"),
        "base_compliance_score": matched_rule.get("base_compliance_score", 70),
        "noc_required": "Mandatory NOC" if matched_rule.get("noc_required") else "Self-Declaration / Intimation",
        "statutory_conditions": matched_rule.get("statutory_conditions", []),
        "prohibited_species": matched_rule.get("prohibited_species", []),
        "recommended_canopy": matched_rule.get("recommended_canopy", "Native Canopy"),
        "checklist": checklist_items,
        "procedure_steps": procedure_steps
    }

def build_11_step_procedure(land_type: str, authority_name: str) -> List[ProcedureStep]:
    is_forest = land_type == "forest_reserved"
    is_highway = "roadside" in land_type
    
    steps = [
        ProcedureStep(
            step_number=1,
            title="Identify Land Ownership & Survey Boundaries",
            description="Verify title deed (7/12 extract, Index-II, Property Card, or Government Allotment Order) to ensure clear boundary jurisdiction.",
            authority="Revenue Department / City Survey Office",
            estimated_timeline="Day 1-3",
            is_current=True,
            is_completed=False
        ),
        ProcedureStep(
            step_number=2,
            title="Classify Statutory Land Category & Buffer Zones",
            description=f"Confirm statutory land classification ({land_type.replace('_', ' ').title()}) and check proximity to CRZ, ESZ, or flood lines.",
            authority="GreenPermit AI GIS Engine / Town Planning Dept",
            estimated_timeline="Day 3-5",
            is_current=False,
            is_completed=False
        ),
        ProcedureStep(
            step_number=3,
            title="Determine Competent Approving Authority",
            description=f"Map jurisdiction to {authority_name} and obtain standard application guidelines.",
            authority=authority_name,
            estimated_timeline="Day 5-7",
            is_current=False,
            is_completed=False
        ),
        ProcedureStep(
            step_number=4,
            title="Assess Prior NOC & Permission Requirements",
            description="Verify whether formal NOC, Stage-1 clearance, or simple intimation is mandated by statutory tree rules.",
            authority=authority_name,
            estimated_timeline="Day 7-10",
            is_current=False,
            is_completed=False
        ),
        ProcedureStep(
            step_number=5,
            title="Prepare Comprehensive Site & Plantation Proposal",
            description="Generate layout map indicating planting pit grid (3m x 3m), water source connection, and native species allocation.",
            authority="Applicant Project Team",
            estimated_timeline="Day 10-14",
            is_current=False,
            is_completed=False
        ),
        ProcedureStep(
            step_number=6,
            title="Submit Statutory Application & Document Dossier",
            description="Submit the structured document checklist along with site layout sketch and ownership proof to the Tree Officer.",
            authority=authority_name,
            estimated_timeline="Day 14-21",
            is_current=False,
            is_completed=False
        ),
        ProcedureStep(
            step_number=7,
            title="Site Joint Inspection & Formal NOC Grant",
            description="Facilitate joint field inspection by the Tree Officer / Ward Engineer and receive official Permit Reference Number.",
            authority=authority_name,
            estimated_timeline="Day 21-30",
            is_current=False,
            is_completed=False
        ),
        ProcedureStep(
            step_number=8,
            title="Procure Certified Indigenous Saplings",
            description="Source certified, healthy native saplings (minimum 5-6 feet height) from Government Social Forestry or accredited nurseries.",
            authority="Social Forestry Directorate / State Nurseries",
            estimated_timeline="Day 30-35",
            is_current=False,
            is_completed=False
        ),
        ProcedureStep(
            step_number=9,
            title="Execute Pit Preparation & Tree Planting Drive",
            description="Excavate 1m x 1m x 1m pits, add organic compost & neem cake, install protective tree guards, and plant saplings.",
            authority="Executing Team / NGO Volunteers",
            estimated_timeline="Day 35-40",
            is_current=False,
            is_completed=False
        ),
        ProcedureStep(
            step_number=10,
            title="Upload Geo-Tagged Evidence & Certificate Issuance",
            description="Capture geo-tagged photos with GPS coordinates of every planted sapling and generate the GreenPermit Digital Plantation Certificate.",
            authority="GreenPermit AI Verification Gateway",
            estimated_timeline="Day 40-42",
            is_current=False,
            is_completed=False
        ),
        ProcedureStep(
            step_number=11,
            title="3-Year Growth, Survival & NDVI Monitoring",
            description="Conduct quarterly survival audits, maintain irrigation logs, and track canopy green-cover evolution via satellite NDVI imagery.",
            authority="Continuous Monitoring Hub",
            estimated_timeline="Months 1-36",
            is_current=False,
            is_completed=False
        )
    ]
    return steps
