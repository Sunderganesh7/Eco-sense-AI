import type {
  LocationItem,
  LocationInput,
  ComplianceCheckResponse,
  SpeciesItem,
  SchemeItem,
  MonitoringPlotItem,
  CertificateItem,
  AssistantChatResponse,
  DocumentDraftResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8002/api';

export const api = {
  // Locations
  getLocations: async (): Promise<LocationItem[]> => {
    const res = await fetch(`${API_BASE}/locations`);
    if (!res.ok) throw new Error('Failed to fetch locations');
    return res.json();
  },

  getLocationById: async (id: number): Promise<LocationItem> => {
    const res = await fetch(`${API_BASE}/locations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch location details');
    return res.json();
  },

  // Compliance Engine
  runComplianceCheck: async (payload: LocationInput): Promise<ComplianceCheckResponse> => {
    const res = await fetch(`${API_BASE}/compliance/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Compliance analysis failed');
    return res.json();
  },

  getZonesGeoJSON: async (lat: number, lng: number, landType: string) => {
    const res = await fetch(`${API_BASE}/compliance/zones-geojson?lat=${lat}&lng=${lng}&land_type=${landType}`);
    if (!res.ok) throw new Error('Failed to fetch GIS zones');
    return res.json();
  },

  exportCompliancePDF: async (data: any): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/compliance/export-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to generate PDF');
    return res.blob();
  },

  getRecentChecks: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/compliance/history`);
    if (!res.ok) return [];
    return res.json();
  },

  // Species
  getSpecies: async (filters?: { search?: string; region?: string; soil_type?: string; water_req?: string; purpose?: string }): Promise<SpeciesItem[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.region) params.append('region', filters.region);
    if (filters?.soil_type) params.append('soil_type', filters.soil_type);
    if (filters?.water_req) params.append('water_req', filters.water_req);
    if (filters?.purpose) params.append('purpose', filters.purpose);
    
    const res = await fetch(`${API_BASE}/species?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch species');
    return res.json();
  },

  recommendSpecies: async (payload: { region: string; soil_type: string; water_availability: string; plantation_purpose: string; land_type: string; limit?: number }): Promise<SpeciesItem[]> => {
    const res = await fetch(`${API_BASE}/species/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to recommend species');
    return res.json();
  },

  // Schemes
  getSchemes: async (filters?: { applicant_type?: string; purpose?: string; sponsor_level?: string; search?: string }): Promise<SchemeItem[]> => {
    const params = new URLSearchParams();
    if (filters?.applicant_type) params.append('applicant_type', filters.applicant_type);
    if (filters?.purpose) params.append('purpose', filters.purpose);
    if (filters?.sponsor_level) params.append('sponsor_level', filters.sponsor_level);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE}/schemes?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch schemes');
    return res.json();
  },

  // Monitoring
  getMonitoringPlots: async (): Promise<MonitoringPlotItem[]> => {
    const res = await fetch(`${API_BASE}/monitoring/plots`);
    if (!res.ok) throw new Error('Failed to fetch monitoring plots');
    return res.json();
  },

  simulateNDVI: async (payload: { target_trees: number; area_sqm: number; months_elapsed: number }) => {
    const res = await fetch(`${API_BASE}/monitoring/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to simulate NDVI');
    return res.json();
  },

  // Certificates
  getCertificates: async (): Promise<CertificateItem[]> => {
    const res = await fetch(`${API_BASE}/certificates`);
    if (!res.ok) throw new Error('Failed to fetch certificates');
    return res.json();
  },

  issueCertificate: async (payload: any): Promise<CertificateItem> => {
    const res = await fetch(`${API_BASE}/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to issue certificate');
    return res.json();
  },

  verifyCertificate: async (hash: string) => {
    const res = await fetch(`${API_BASE}/certificates/verify/${hash}`);
    if (!res.ok) throw new Error('Verification request failed');
    return res.json();
  },

  // Assistant
  chatWithAssistant: async (payload: { message: string; land_type?: string; location_name?: string; trees_count?: number; user_role?: string }): Promise<AssistantChatResponse> => {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Assistant communication failed');
    return res.json();
  },

  draftDocument: async (payload: any): Promise<DocumentDraftResponse> => {
    const res = await fetch(`${API_BASE}/assistant/draft-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to draft legal document');
    return res.json();
  }
};
