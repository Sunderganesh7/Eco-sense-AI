export type UserRole = 'citizen' | 'ngo' | 'officer';

export interface LocationItem {
  id: number;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  land_type: string;
  soil_type: string;
  crz_status: string;
  rainfall_annual_mm: number;
  existing_canopy_pct: number;
  nearest_water_source: string;
  description: string;
  is_preset: boolean;
}

export interface LocationInput {
  name: string;
  latitude: number;
  longitude: number;
  district?: string;
  land_type: string;
  soil_type: string;
  crz_status?: string;
  target_trees?: number;
  plantation_purpose?: string;
  ownership_type?: string;
  existing_canopy_pct?: number;
  water_source?: string;
  road_distance_m?: number;
}

export interface FactorScore {
  factor_id: string;
  factor_name: string;
  weight: number;
  score_awarded: number;
  status: 'optimal' | 'moderate' | 'strict' | 'critical';
  explanation: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  tag: 'Required' | 'Conditional' | 'Not applicable' | 'Verify with authority';
  description: string;
  authority_source: string;
  is_completed?: boolean;
}

export interface ProcedureStep {
  step_number: number;
  title: string;
  description: string;
  authority: string;
  estimated_timeline: string;
  is_current?: boolean;
  is_completed?: boolean;
}

export interface SpeciesItem {
  id?: number;
  botanical_name: string;
  common_name: string;
  local_name?: string;
  family?: string;
  growth_rate: string;
  mature_height_m: number;
  canopy_spread_m: number;
  canopy_type?: string;
  water_requirement: string;
  soil_types?: string[];
  regions?: string[];
  carbon_sequestration_kg_yr: number;
  maintenance_level: string;
  ecological_benefits: string[];
  suitable_purposes?: string[];
  apti_score?: number;
  compatibility_score?: number;
  suitability_reasons?: string[];
  description?: string;
}

export interface SchemeItem {
  id: number;
  name: string;
  sponsor_level: string;
  state: string;
  category: string;
  eligible_applicants: string[];
  purpose_tags: string[];
  financial_incentive: string;
  free_saplings_provided: boolean;
  eligibility_criteria: string;
  required_documents: string[];
  application_authority: string;
  application_portal_url: string;
  last_verified: string;
  summary: string;
}

export interface ComplianceCheckResponse {
  check_ref: string;
  timestamp: string;
  location_name: string;
  latitude: number;
  longitude: number;
  district?: string;
  division?: string;
  is_inside_maharashtra?: boolean;
  granularity_label?: string;
  outside_region_warning?: string;
  land_type: string;
  land_type_display: string;
  governing_law: string;
  primary_authority: string;
  secondary_authorities: string[];
  compliance_score: number;
  verdict: string;
  verdict_badge: 'green' | 'amber' | 'red';
  verdict_summary: string;
  noc_required_display: string;
  factors: FactorScore[];
  checklist: ChecklistItem[];
  procedure_steps: ProcedureStep[];
  recommended_species_top5: SpeciesItem[];
  matched_schemes_top3: SchemeItem[];
  prohibited_species: string[];
  statutory_conditions: string[];
  disclaimer: string;
}

export interface MonitoringPlotItem {
  id: number;
  plot_code: string;
  project_name: string;
  location_name: string;
  district: string;
  latitude: number;
  longitude: number;
  area_hectares: number;
  planting_date: string;
  total_saplings_planted: number;
  current_surviving_trees: number;
  survival_rate_pct: number;
  baseline_ndvi: number;
  current_ndvi: number;
  ndvi_growth_pct: number;
  estimated_carbon_offset_tons: number;
  species_distribution: { species: string; count: number; survival_pct: number }[];
  timeline_records: { month: string; ndvi: number; canopy_cover_pct: number; avg_height_m: number; trees_surviving: number }[];
  last_drone_survey: string;
}

export interface CertificateItem {
  id: number;
  certificate_id: string;
  created_at: string;
  project_name: string;
  planter_name: string;
  planter_role: string;
  organization: string;
  location_name: string;
  district: string;
  latitude: number;
  longitude: number;
  land_type: string;
  trees_count: number;
  species_planted: string[];
  authority_reference: string;
  compliance_score: number;
  verification_hash: string;
  qr_data: string;
  status: string;
}

export interface AssistantChatResponse {
  reply: string;
  cited_rules: string[];
  relevant_authorities: string[];
  suggested_actions: string[];
  disclaimer: string;
}

export interface DocumentDraftResponse {
  title: string;
  document_type: string;
  content_markdown: string;
  metadata: Record<string, any>;
  disclaimer: string;
}
