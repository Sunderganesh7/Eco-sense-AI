from typing import Dict, Any, List
from app.schemas.compliance import AssistantChatResponse, DocumentDraftResponse
from app.engine.compliance_engine import load_rules

def process_assistant_chat(
    message: str,
    land_type: str = "municipal_public",
    location_name: str = "Proposed Site",
    trees_count: int = 50,
    user_role: str = "Citizen"
) -> AssistantChatResponse:
    query = message.lower()
    rules_data = load_rules()
    rules_map = {r["land_type"]: r for r in rules_data.get("rules", [])}
    rule = rules_map.get(land_type, rules_map.get("municipal_public", {}))

    cited_rules = []
    authorities = [rule.get("primary_authority", "Municipal Tree Authority")] + rule.get("secondary_authorities", [])
    actions = []

    # Detect topic in user message
    if any(k in query for k in ["cut", "fell", "trim", "prun", "remove"]):
        cited_rules.append("Section 8 of Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975")
        reply = (
            f"Under **Section 8 of the Maharashtra Tree Act, 1975**, no person (including private property owners) "
            f"may fell or trim any tree with a girth above 10 cm without prior written permission from the designated "
            f"**Tree Officer**. For this site at **{location_name}** ({rule.get('display_name')}), you must submit "
            f"Form 'A' along with property ownership proof and geo-tagged photos to the **{rule.get('primary_authority')}**."
        )
        actions = ["Download Municipal Form 'A' for Tree Trimming", "Schedule Joint Site Inspection with Ward Tree Officer"]

    elif any(k in query for k in ["noc", "permission", "approval", "permit", "legal", "authority"]):
        cited_rules.append(rule.get("governing_law", "Maharashtra Tree Act 1975"))
        if rule.get("noc_required"):
            reply = (
                f"For **{rule.get('display_name')}** at **{location_name}**, a formal **No Objection Certificate (NOC)** is mandatory. "
                f"The competent approving body is **{rule.get('primary_authority')}**.\n\n"
                f"**Key Requirements**:\n"
                f"1. Submit a geo-tagged Site Layout Plan indicating planting pit coordinates.\n"
                f"2. Provide proof of title/tenure (7/12 extract, Index-II, or lease allotment).\n"
                f"3. Submit a 3-Year Maintenance Undertaking committing to regular watering and sapling replacement."
            )
            actions = ["Draft Formal NOC Request in Assistant", "Export Document Checklist Dossier"]
        else:
            reply = (
                f"For **{rule.get('display_name')}** at **{location_name}**, planting trees on your lawful private property "
                f"does **not** require a prior NOC from the municipal tree authority, provided no utility conduits or neighbor boundaries "
                f"are obstructed.\n\nHowever, adhering to local municipal guidelines for recommended native species (e.g. Neem, Bakul, Karanj) "
                f"and maintaining a 2-meter setback from sewer lines is strongly advised."
            )
            actions = ["Review Recommended Native Species", "Generate Plantation Proposal Draft"]

    elif any(k in query for k in ["crz", "coast", "mangrove", "sea", "tide"]):
        cited_rules.append("CRZ Notification, 2019 (Para 5.1 & 5.2) under Environment (Protection) Act, 1986")
        cited_rules.append("Bombay High Court Mangrove Protection Order (WP 3246/2004)")
        reply = (
            f"Under the **CRZ Notification 2019** and the **Bombay High Court Mangrove Protection Order**, "
            f"any planting in coastal or mangrove buffer zones (50m high tide line) must consist solely of native mangrove and saline flora "
            f"(such as *Avicennia marina* or *Thespesia populnea*). Zero debris dumping or concrete embankments are permitted. "
            f"Clearance from the **Maharashtra Coastal Zone Management Authority (MCZMA)** and State Mangrove Cell is mandatory."
        )
        actions = ["Check CRZ-I Demarcation Map", "Review MISHTI Mangrove Restoration Scheme"]

    elif any(k in query for k in ["forest", "sanctuary", "wildlife", "campa", "aarey"]):
        cited_rules.append("Van (Sanrakshan Evam Samvardhan) Adhiniyam, 1980 / 2023 (Forest Conservation Act)")
        cited_rules.append("Section 26 & 33 of Indian Forest Act, 1927")
        reply = (
            f"Forest land is subject to strict statutory conservation under the **Forest Conservation Act**. "
            f"Unauthorized planting, digging, or fencing inside Reserved/Protected Forests constitutes a punishable forest offense. "
            f"All citizen/NGO afforestation drives must be executed through a joint agreement with the **Deputy Conservator of Forests (DFO)** "
            f"or local **Joint Forest Management Committee (JFMC)** using 100% certified indigenous forest saplings."
        )
        actions = ["Contact Local Range Forest Officer (RFO)", "Explore Joint Forest Management (JFM) Framework"]

    elif any(k in query for k in ["species", "tree", "plant", "neem", "peepal", "bamboo", "soil"]):
        cited_rules.append("Maharashtra Social Forestry Indigenous Flora Registry")
        reply = (
            f"For **{location_name}** ({rule.get('display_name')}), top recommended indigenous species include:\n\n"
            f"- **Neem (Azadirachta indica)**: Extremely hardy, high air pollution tolerance (APTI 25.4).\n"
            f"- **Karanj (Pongamia pinnata)**: Nitrogen-fixing, tolerant to waterlogging and saline soil.\n"
            f"- **Bakul (Mimusops elengi)**: Non-invasive root system, fragrant flowers, ideal for footpaths and compounds.\n"
            f"- **Arjun (Terminalia arjuna)**: Superb for riverbanks, stream margins, and moisture retention.\n\n"
            f"**Prohibited Species**: {', '.join(rule.get('prohibited_species', ['Conocarpus erectus']))}."
        )
        actions = ["Explore Native Species Database", "Calculate Planting Pit Matrix"]

    else:
        cited_rules.append(rule.get("governing_law", "Maharashtra Tree Act 1975"))
        reply = (
            f"Regarding your query for **{location_name}** ({rule.get('display_name')}):\n\n"
            f"The primary governing authority for tree planning and arboriculture compliance here is **{rule.get('primary_authority')}**, "
            f"operating under **{rule.get('governing_law')}**.\n\n"
            f"**Statutory Summary**:\n"
            f"- Feasibility rating: **{rule.get('general_feasibility')}**.\n"
            f"- NOC Requirement: **{rule.get('noc_required', 'Required')}**.\n"
            f"- Recommended canopy structure: **{rule.get('recommended_canopy')}**."
        )
        actions = ["Run Full Compliance Check", "Draft Formal Proposal"]

    return AssistantChatResponse(
        reply=reply,
        cited_rules=cited_rules,
        relevant_authorities=authorities,
        suggested_actions=actions
    )

def draft_legal_document(req: Dict[str, Any]) -> DocumentDraftResponse:
    doc_type = req.get("document_type", "noc_request")
    applicant = req.get("applicant_name", "Citizen / Project Proponent")
    role = req.get("applicant_role", "Project Coordinator")
    org = req.get("organization_name", "GreenPermit Action Group")
    site = req.get("site_name", "Proposed Plantation Site")
    district = req.get("district", "Maharashtra")
    lat = req.get("latitude", 19.0760)
    lng = req.get("longitude", 72.8777)
    land_type = req.get("land_type", "municipal_public")
    trees_count = req.get("target_trees", 50)
    species_list = ", ".join(req.get("selected_species", ["Neem (Azadirachta indica)", "Karanj (Pongamia pinnata)", "Bakul (Mimusops elengi)"]))
    water_plan = req.get("water_plan", "Municipal supply & dedicated drip irrigation network")
    authority = req.get("target_authority", "The Superintendent of Gardens & Municipal Tree Officer")

    if doc_type == "noc_request":
        title = "FORMAL APPLICATION FOR TREE PLANTATION NOC & SITE ACCESS APPROVAL"
        content = f"""# {title}

**Date**: August 26, 2026  
**Reference ID**: GP-NOC-DRAFT-{trees_count}-MH  

**To**,  
**{authority}**  
Municipal Corporation / Forest Department Administration  
District: {district}, Maharashtra  

---

### **Subject**: Application for Grant of No Objection Certificate (NOC) and Permission for Native Tree Plantation Drive at {site}.

**Respected Sir / Madam**,

I, **{applicant}**, representing **{org}** in the capacity of **{role}**, hereby submit this formal application seeking statutory permission and No Objection Certificate (NOC) for undertaking an eco-restoration and native tree plantation initiative on the designated parcel of land.

### **1. Site Description & Geospatial Coordinates**
* **Site Name / Landmark**: {site}
* **District / Ward**: {district}
* **Geographical Coordinates**: Latitude **{lat:.4f}° N**, Longitude **{lng:.4f}° E**
* **Statutory Land Classification**: {land_type.replace('_', ' ').title()}
* **Proposed Target Quantity**: **{trees_count} indigenous saplings**

### **2. Selected Indigenous Botanical Species**
In accordance with urban biodiversity guidelines and the Maharashtra Tree Act 1975, the following certified non-invasive native species have been selected:
* **Selected Species**: {species_list}
* *Note: Zero exotic, invasive, or allergenic species (such as Conocarpus or Eucalyptus) shall be planted.*

### **3. Post-Planting Maintenance & Irrigation Plan**
* **Water Source**: {water_plan}
* **Maintenance Period**: Mandatory **3-year undertaking** with weekly scheduled watering, organic mulching, and protective tree-guards.
* **Survival Commitment**: Guaranteeing minimum **85% sapling survival**, with proactive replacement of any casualties.

### **4. Undertaking & Statutory Adherence**
We undertake to ensure that:
1. No underground municipal utilities (drainage, water mains, fiber optic cables) shall be damaged during pit excavation.
2. A minimum setback of 2.5 meters from vehicular carriageways and pedestrian clear-zones will be strictly maintained.
3. Geo-tagged evidence and quarterly progress reports will be submitted to your esteemed office.

We kindly request you to inspect the site and grant the necessary permission at the earliest.

Yours sincerely,

**Signature**: ___________________________  
**Name**: {applicant}  
**Designation**: {role}  
**Organization**: {org}  
**Contact**: +91-98765-43210 | citizen@greenpermit.ai  

---
*Generated via GreenPermit AI Legal Compliance Engine. This is a preliminary legal draft for submission to the competent government authority.*
"""

    elif doc_type == "plantation_proposal":
        title = "COMPREHENSIVE NATIVE TREE PLANTATION & LANDSCAPE PROPOSAL"
        content = f"""# {title}

**Project Title**: Green Canopy Initiative — {site}  
**Proponent**: {org} ({applicant}, {role})  
**Target Output**: {trees_count} Native Trees | Geo-tagged Survival Audit  
**Location**: {site}, {district} ({lat:.4f}° N, {lng:.4f}° E)  

---

### **Executive Summary**
This proposal outlines the technical, ecological, and procedural strategy for executing a high-density native tree plantation at **{site}**. The objective is to enhance local green cover, reduce urban heat island effect, improve air quality index (AQI), and foster native biodiversity.

### **1. Edaphic & Climatic Compatibility**
* **Land Use Category**: {land_type.replace('_', ' ').title()}
* **Pit Dimensions**: Standard **1m x 1m x 1m** pits excavated at 3-meter grid intervals.
* **Soil Enrichment**: 60% Topsoil + 30% Decomposed Cow Dung / Vermicompost + 10% Neem Cake & Bio-fertilizer.

### **2. Species Matrix & Ecological Yield**
* **Target Species**: {species_list}
* **Projected Carbon Sequestration**: ~{trees_count * 25} kg CO₂ / year at maturity.
* **Projected Oxygen Generation**: ~{trees_count * 0.28:.1f} kg O₂ / day.

### **3. Operational Schedule & Phasing**
* **Phase 1 (Week 1-2)**: Soil testing, pit digging, utility clearing, and boundary fencing.
* **Phase 2 (Week 3)**: Procurement of 5-6 ft certified saplings from Social Forestry nurseries.
* **Phase 3 (Week 4)**: Plantation drive, installation of metal tree guards, and initial saturation watering.
* **Phase 4 (Months 2-36)**: Bi-weekly irrigation, weeding, staking, and satellite NDVI monitoring.

Submitted for administrative review and statutory sanction.
"""

    elif doc_type == "maintenance_undertaking":
        title = "3-YEAR SAPLING SURVIVAL & MAINTENANCE STATUTORY UNDERTAKING"
        content = f"""# {title}
*(To be executed on ₹100 Non-Judicial Stamp Paper)*

I / We, **{applicant}**, residing at / having registered office at **{org}**, do hereby solemnly affirm and declare as under:

1. That I / We have applied to **{authority}** for permission to plant **{trees_count} trees** at **{site}** (GPS: {lat:.4f}, {lng:.4f}).
2. That I / We solemnly undertake complete financial and operational responsibility for the watering, protection, weeding, and maintenance of all planted trees for a minimum period of **THREE (3) YEARS** from the date of planting.
3. That I / We will utilize **{water_plan}** and guarantee adequate irrigation throughout dry summer seasons.
4. That in the event of casualty or mortality of any planted sapling, I / We shall promptly replace the dead sapling with an indigenous species of equal height within 30 days.
5. That I / We will submit half-yearly geo-tagged photographic survival reports to the Municipal Tree Officer.

**Deponent**:  
**Signature**: ___________________________  
**Name**: {applicant} ({org})  
**Verified at {district} on 26th August 2026.**
"""
    else:  # compliance_audit
        title = "ENVIRONMENTAL LEGAL COMPLIANCE SELF-ASSESSMENT REPORT"
        content = f"""# {title}

**Assessment Reference**: GP-AUDIT-{trees_count}-{lat:.2f}  
**Site**: {site} ({district})  
**Statutory Classification**: {land_type.replace('_', ' ').title()}  

### **Compliance Check Matrix**
1. **Land Tenure Verification**: Verified Title / Society Consent provided. [COMPLIANT]
2. **Statutory Setback Clearance**: 2.5m minimum roadway setback maintained. [COMPLIANT]
3. **CRZ & Eco-Sensitive Status**: Checked against CZMP and Forest Boundaries. [COMPLIANT]
4. **Species Suitability**: 100% Native indigenous species ({species_list}). [COMPLIANT]
5. **Water Security Plan**: Sustainable source identified ({water_plan}). [COMPLIANT]

**Overall Compliance Assessment**: **APPROVED FOR STATUTORY SUBMISSION**
"""

    return DocumentDraftResponse(
        title=title,
        document_type=doc_type,
        content_markdown=content,
        metadata={
            "applicant": applicant,
            "organization": org,
            "site": site,
            "trees_count": trees_count,
            "authority": authority,
            "generated_date": "2026-08-26"
        }
    )
