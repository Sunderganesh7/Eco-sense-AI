import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Trees,
  Scale,
  FileText,
  Download,
  Check,
  AlertTriangle,
  Award,
  ArrowRight,
  Clock,
  Layers,
  ChevronRight,
  Bot
} from 'lucide-react';
import { api } from '../services/api';
import type { LocationItem, LocationInput, ComplianceCheckResponse } from '../types';
import { MAHARASHTRA_DISTRICTS, MaharashtraDistrict } from '../data/maharashtraDistricts';
import { LeafletMap } from '../components/common/LeafletMap';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { ComplianceDisclaimer } from '../components/common/ComplianceDisclaimer';
import { lookupDistrictByCoordinates } from '../utils/geoLookup';

interface NewCheckPageProps {
  initialCoordinates?: { lat: number; lng: number };
  onNavigate: (tab: string, state?: any) => void;
}

export const NewCheckPage: React.FC<NewCheckPageProps> = ({ initialCoordinates, onNavigate }) => {
  const [locations, setLocations] = useState<LocationItem[]>(MAHARASHTRA_DISTRICTS);
  const [selectedLocationId, setSelectedLocationId] = useState<number | string>('custom');
  
  // Input parameters
  const [siteName, setSiteName] = useState<string>('Custom Maharashtra Site');
  const [latitude, setLatitude] = useState<number>(initialCoordinates?.lat || 18.9388);
  const [longitude, setLongitude] = useState<number>(initialCoordinates?.lng || 72.8354);
  const [landType, setLandType] = useState<string>('municipal_public');
  const [soilType, setSoilType] = useState<string>('Sandy Loam');
  const [crzStatus, setCrzStatus] = useState<string>('CRZ-II');
  const [targetTrees, setTargetTrees] = useState<number>(50);
  const [plantationPurpose, setPlantationPurpose] = useState<string>('Urban Greening');
  const [ownershipType, setOwnershipType] = useState<string>('Citizen / NGO Group');
  const [waterSource, setWaterSource] = useState<string>('Municipal Water Supply');
  const [roadDistance, setRoadDistance] = useState<number>(10.0);
  const [existingCanopyPct, setExistingCanopyPct] = useState<number>(28.0);
  const [detectedDistrict, setDetectedDistrict] = useState<string | null>(null);

  // Analysis result state
  const [result, setResult] = useState<ComplianceCheckResponse | null>(null);
  const [zonesGeoJSON, setZonesGeoJSON] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  
  // Sub-tabs for sorted organization
  const [activeResultTab, setActiveResultTab] = useState<'factors' | 'checklist' | 'species' | 'roadmap'>('factors');
  const [checklistFilter, setChecklistFilter] = useState<string>('All');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const data = await api.getLocations();
        if (data && data.length > 0) {
          setLocations(data);
          if (!initialCoordinates) {
            handleSelectPreset(data[0]);
          }
        } else if (!initialCoordinates && MAHARASHTRA_DISTRICTS.length > 0) {
          handleSelectPreset(MAHARASHTRA_DISTRICTS[0]);
        }
        
        if (initialCoordinates) {
          handleMapClick(initialCoordinates.lat, initialCoordinates.lng);
        }
      } catch (err) {
        console.error('Failed to load presets from API, using bundled 36 districts:', err);
        if (!initialCoordinates && MAHARASHTRA_DISTRICTS.length > 0) {
          handleSelectPreset(MAHARASHTRA_DISTRICTS[0]);
        }
      }
    };
    loadPresets();
  }, []);

  const handleSelectPreset = (loc: LocationItem | MaharashtraDistrict) => {
    setSelectedLocationId(loc.id);
    setSiteName(loc.name);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setLandType(loc.land_type);
    setSoilType(loc.soil_type);
    setCrzStatus(loc.crz_status);
    setExistingCanopyPct(loc.existing_canopy_pct);
    setWaterSource(loc.nearest_water_source);
    setDetectedDistrict(loc.district);
    
    runAnalysis({
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      district: loc.district,
      land_type: loc.land_type,
      soil_type: loc.soil_type,
      crz_status: loc.crz_status,
      target_trees: targetTrees,
      plantation_purpose: plantationPurpose,
      ownership_type: ownershipType,
      water_source: loc.nearest_water_source,
      existing_canopy_pct: loc.existing_canopy_pct,
      road_distance_m: roadDistance
    });
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedLocationId('custom');
    setLatitude(lat);
    setLongitude(lng);

    const lookup = await lookupDistrictByCoordinates(lat, lng);
    
    let resolvedSiteName = `Map Pin (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
    let effectiveSoil = soilType;
    let effectiveCrz = crzStatus;
    let effectiveCanopy = existingCanopyPct;
    let effectiveWater = waterSource;

    if (lookup.isInsideMaharashtra && lookup.district) {
      setDetectedDistrict(lookup.district);
      resolvedSiteName = `Map Pin in ${lookup.district} (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
      
      // Fallback to district-level defaults if regional metadata exists
      if (lookup.districtData) {
        effectiveSoil = lookup.districtData.soil_type;
        effectiveCrz = lookup.districtData.crz_status;
        effectiveCanopy = lookup.districtData.existing_canopy_pct;
        effectiveWater = lookup.districtData.nearest_water_source;
        
        setSoilType(effectiveSoil);
        setCrzStatus(effectiveCrz);
        setExistingCanopyPct(effectiveCanopy);
        setWaterSource(effectiveWater);
      }
    } else {
      setDetectedDistrict(null);
      resolvedSiteName = `Out-of-Region Point (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
    }
    
    setSiteName(resolvedSiteName);

    runAnalysis({
      name: resolvedSiteName,
      latitude: lat,
      longitude: lng,
      district: lookup.district || undefined,
      land_type: landType,
      soil_type: effectiveSoil,
      crz_status: effectiveCrz,
      target_trees: targetTrees,
      plantation_purpose: plantationPurpose,
      ownership_type: ownershipType,
      water_source: effectiveWater,
      existing_canopy_pct: effectiveCanopy,
      road_distance_m: roadDistance
    });
  };

  const runAnalysis = async (inputOverrides?: Partial<LocationInput>) => {
    setLoading(true);
    try {
      const payload: LocationInput = {
        name: siteName,
        latitude,
        longitude,
        district: detectedDistrict || undefined,
        land_type: landType,
        soil_type: soilType,
        crz_status: crzStatus,
        target_trees: targetTrees,
        plantation_purpose: plantationPurpose,
        ownership_type: ownershipType,
        water_source: waterSource,
        existing_canopy_pct: existingCanopyPct,
        road_distance_m: roadDistance,
        ...inputOverrides
      };

      const [checkRes, geoRes] = await Promise.all([
        api.runComplianceCheck(payload),
        api.getZonesGeoJSON(payload.latitude, payload.longitude, payload.land_type)
      ]);

      setResult(checkRes);
      setZonesGeoJSON(geoRes);
    } catch (err) {
      console.error('Error running compliance check:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setDownloadingPdf(true);
    try {
      const blob = await api.exportCompliancePDF(result);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Compliance-Report-${result.check_ref}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const filteredChecklist = result?.checklist.filter(item => {
    if (checklistFilter === 'All') return true;
    return item.tag === checklistFilter;
  }) || [];

  const completedCount = result?.checklist.filter(item => checkedItems[item.id]).length || 0;
  const totalChecklist = result?.checklist.length || 0;

  // Group locations by division
  const divisionsMap: Record<string, typeof locations> = {
    'Konkan (7 Districts)': [],
    'Nashik (5 Districts)': [],
    'Pune (5 Districts)': [],
    'Chhatrapati Sambhajinagar (8 Districts)': [],
    'Amravati (5 Districts)': [],
    'Nagpur (6 Districts)': []
  };

  locations.forEach(loc => {
    const dist = loc.district;
    if (['Mumbai City', 'Mumbai Suburban', 'Thane', 'Palghar', 'Raigad', 'Ratnagiri', 'Sindhudurg'].includes(dist)) {
      divisionsMap['Konkan (7 Districts)'].push(loc);
    } else if (['Nashik', 'Dhule', 'Nandurbar', 'Jalgaon', 'Ahmednagar'].includes(dist)) {
      divisionsMap['Nashik (5 Districts)'].push(loc);
    } else if (['Pune', 'Satara', 'Sangli', 'Solapur', 'Kolhapur'].includes(dist)) {
      divisionsMap['Pune (5 Districts)'].push(loc);
    } else if (['Chhatrapati Sambhajinagar', 'Jalna', 'Beed', 'Latur', 'Dharashiv', 'Nanded', 'Parbhani', 'Hingoli'].includes(dist)) {
      divisionsMap['Chhatrapati Sambhajinagar (8 Districts)'].push(loc);
    } else if (['Amravati', 'Akola', 'Washim', 'Buldhana', 'Yavatmal'].includes(dist)) {
      divisionsMap['Amravati (5 Districts)'].push(loc);
    } else {
      divisionsMap['Nagpur (6 Districts)'].push(loc);
    }
  });

  return (
    <div className="py-8 px-6 sm:px-10 lg:px-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131f16] dark:text-[#edf3ee]">
            Plantation Regulatory Assessment
          </h1>
          <p className="text-xs text-[#506154] dark:text-[#97a69b] mt-0.5">
            Select across all 36 Maharashtra districts or drop a GPS pin to evaluate statutory clearance and native species fit.
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportPDF}
              disabled={downloadingPdf}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#141a15] text-[#131f16] dark:text-[#edf3ee] border border-[#e2e8e2] dark:border-[#232f25] hover:bg-forest-50/60 dark:hover:bg-forest-950/40 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-subtle"
            >
              <Download className="w-3.5 h-3.5 text-forest-700 dark:text-forest-400" />
              <span>{downloadingPdf ? 'Exporting...' : 'Export PDF Report'}</span>
            </button>
          </div>
        )}
      </div>

      <ComplianceDisclaimer compact />

      {/* Main 2-Column Sorted Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Inputs & Map Selector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] space-y-4">
            {/* Preset Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#131f16] dark:text-[#edf3ee] block">
                  Select Maharashtra District / Scenario
                </label>
                <span className="text-[10px] font-medium text-forest-700 dark:text-forest-400">
                  {locations.length} Districts Available
                </span>
              </div>
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setSelectedLocationId('custom');
                  } else {
                    const loc = locations.find(l => l.id === Number(val));
                    if (loc) handleSelectPreset(loc);
                  }
                }}
                className="w-full text-xs font-medium bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-3 py-2 text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
              >
                <option value="custom">-- Custom Map Pin / GPS Point --</option>
                {Object.entries(divisionsMap).map(([divName, locs]) => (
                  locs.length > 0 && (
                    <optgroup key={divName} label={divName}>
                      {locs.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.district})
                        </option>
                      ))}
                    </optgroup>
                  )
                ))}
              </select>
            </div>

            {/* Map Pin Dropper */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#506154] dark:text-[#97a69b] font-medium">Click map to adjust pin</span>
                <span className="font-mono text-[11px] text-forest-700 dark:text-forest-400">
                  {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                </span>
              </div>
              <LeafletMap
                center={[latitude, longitude]}
                zoom={selectedLocationId === 'custom' ? 14 : 12}
                selectedCoord={[latitude, longitude]}
                onSelectCoord={handleMapClick}
                showZones={true}
                zonesGeoJSON={zonesGeoJSON}
                height="200px"
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-3 pt-2 border-t border-[#e2e8e2] dark:border-[#232f25] text-xs">
              <div>
                <label className="block font-medium text-[#131f16] dark:text-[#edf3ee] mb-1">
                  Site Name / Landmark
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-3 py-2 text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#131f16] dark:text-[#edf3ee] mb-1">
                    Land Type
                  </label>
                  <select
                    value={landType}
                    onChange={(e) => setLandType(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-2.5 py-2 text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
                  >
                    <option value="private_residential">Private Residential</option>
                    <option value="private_commercial">Private Commercial</option>
                    <option value="municipal_public">Municipal Public Ground</option>
                    <option value="forest_reserved">State Reserved Forest</option>
                    <option value="agricultural">Agricultural Farmland</option>
                    <option value="roadside_nhai">National Highway (NHAI)</option>
                    <option value="roadside_pwd">State PWD Roadside</option>
                    <option value="railway">Railway Land</option>
                    <option value="coastal_crz">Coastal Zone (CRZ)</option>
                    <option value="protected_area_esz">Eco-Sensitive Zone (ESZ)</option>
                    <option value="campus_institutional">Campus / Institutional</option>
                    <option value="industrial_greenbelt">Industrial Greenbelt</option>
                    <option value="waterbody_vicinity">Riverbank / Lake Riparian</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#131f16] dark:text-[#edf3ee] mb-1">
                    Soil Type
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-2.5 py-2 text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
                  >
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Black Cotton Soil">Black Cotton</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Laterite">Laterite</option>
                    <option value="Alluvial">Alluvial</option>
                    <option value="Saline Clay">Saline Clay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#131f16] dark:text-[#edf3ee] mb-1">
                    Saplings Count
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="10000"
                    value={targetTrees}
                    onChange={(e) => setTargetTrees(Number(e.target.value))}
                    className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-3 py-2 text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#131f16] dark:text-[#edf3ee] mb-1">
                    Road Setback (m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={roadDistance}
                    onChange={(e) => setRoadDistance(Number(e.target.value))}
                    className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-3 py-2 text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => runAnalysis()}
                disabled={loading}
                className="w-full py-2.5 mt-1 rounded-lg bg-forest-700 hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-subtle"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{loading ? 'Evaluating...' : 'Re-Evaluate Compliance'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results with Sorted Sub-Tabs (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {loading && (
            <div className="p-12 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] flex flex-col items-center justify-center space-y-2 text-center">
              <div className="w-6 h-6 rounded-full border-2 border-forest-300 border-t-forest-700 dark:border-forest-800 dark:border-t-forest-400 animate-spin"></div>
              <p className="text-xs font-medium text-[#506154] dark:text-[#97a69b]">
                Evaluating statutory rules and edaphic constraints...
              </p>
            </div>
          )}

          {!loading && result && (
            <>
              {/* Outside Supported Region Alert */}
              {result.is_inside_maharashtra === false ? (
                <div className="p-6 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/70 text-rose-950 dark:text-rose-200 space-y-3 shadow-subtle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-700 dark:text-rose-300 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-rose-950 dark:text-rose-100">
                        Outside Supported Region
                      </h3>
                      <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400">
                        Lat: {result.latitude.toFixed(4)}°, Lng: {result.longitude.toFixed(4)}°
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                    This coordinate falls outside the 36 districts of Maharashtra state boundary. PlantWise AI statutory compliance checks, native species recommendations, and subsidy schemes are calibrated specifically under Maharashtra Forest & Tree Authority regulations.
                  </p>
                  <div className="pt-2 border-t border-rose-200/70 dark:border-rose-900/50 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
                      Please click anywhere inside Maharashtra on the map or select a district preset.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultLoc = locations[0] || MAHARASHTRA_DISTRICTS[0];
                        handleSelectPreset(defaultLoc);
                      }}
                      className="px-3 py-1 rounded-md bg-rose-900 hover:bg-rose-800 text-white text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Reset to Maharashtra
                    </button>
                  </div>
                </div>
              ) : (
                /* Score & Verdict Card */
                <div className="p-5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] space-y-3">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="shrink-0">
                      <ScoreGauge
                        score={result.compliance_score}
                        verdict={result.verdict}
                        badge={result.verdict_badge}
                        size={130}
                      />
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                        <span className="text-[11px] font-mono text-forest-800 dark:text-forest-400">
                          Ref: {result.check_ref}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-forest-50 dark:bg-forest-950/60 text-forest-800 dark:text-forest-300 border border-forest-200/80 dark:border-forest-800/60">
                          {result.land_type_display}
                        </span>
                        {result.district && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-earth-100 dark:bg-earth-950/60 text-earth-800 dark:text-earth-300 border border-earth-200 dark:border-earth-800">
                            {result.district} District
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#506154] dark:text-[#97a69b] leading-relaxed">
                        {result.verdict_summary}
                      </p>

                      <div className="pt-2 text-xs text-[#506154] dark:text-[#97a69b] space-y-1 border-t border-[#e2e8e2] dark:border-[#232f25]">
                        <p>
                          <strong className="text-[#131f16] dark:text-[#edf3ee]">Authority:</strong>{' '}
                          {result.primary_authority}
                        </p>
                        <p>
                          <strong className="text-[#131f16] dark:text-[#edf3ee]">Permission:</strong>{' '}
                          <span className="font-semibold text-forest-900 dark:text-forest-200">{result.noc_required_display}</span>
                        </p>
                        {result.granularity_label && (
                          <p className="text-[11px] text-forest-700 dark:text-forest-400 font-medium">
                            Data Granularity: {result.granularity_label}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sorted Sub-Navigation Tabs */}
              <div className="bg-white dark:bg-[#141a15] rounded-xl border border-[#e2e8e2] dark:border-[#232f25] overflow-hidden">
                <div className="flex border-b border-[#e2e8e2] dark:border-[#232f25] bg-stone-50/70 dark:bg-[#19221b] px-2 pt-2 gap-1 text-xs">
                  <button
                    onClick={() => setActiveResultTab('factors')}
                    className={`px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer border-b-2 ${
                      activeResultTab === 'factors'
                        ? 'border-forest-700 dark:border-forest-400 text-forest-950 dark:text-forest-50 bg-white dark:bg-[#141a15]'
                        : 'border-transparent text-[#506154] hover:text-forest-900 dark:hover:text-forest-100'
                    }`}
                  >
                    Factors ({result.factors.length})
                  </button>
                  <button
                    onClick={() => setActiveResultTab('checklist')}
                    className={`px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer border-b-2 ${
                      activeResultTab === 'checklist'
                        ? 'border-forest-700 dark:border-forest-400 text-forest-950 dark:text-forest-50 bg-white dark:bg-[#141a15]'
                        : 'border-transparent text-[#506154] hover:text-forest-900 dark:hover:text-forest-100'
                    }`}
                  >
                    Checklist ({completedCount}/{totalChecklist})
                  </button>
                  <button
                    onClick={() => setActiveResultTab('species')}
                    className={`px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer border-b-2 ${
                      activeResultTab === 'species'
                        ? 'border-forest-700 dark:border-forest-400 text-forest-950 dark:text-forest-50 bg-white dark:bg-[#141a15]'
                        : 'border-transparent text-[#506154] hover:text-forest-900 dark:hover:text-forest-100'
                    }`}
                  >
                    Species ({result.recommended_species_top5.length})
                  </button>
                  <button
                    onClick={() => setActiveResultTab('roadmap')}
                    className={`px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer border-b-2 ${
                      activeResultTab === 'roadmap'
                        ? 'border-forest-700 dark:border-forest-400 text-forest-950 dark:text-forest-50 bg-white dark:bg-[#141a15]'
                        : 'border-transparent text-[#506154] hover:text-forest-900 dark:hover:text-forest-100'
                    }`}
                  >
                    Roadmap & Subsidies
                  </button>
                </div>

                {/* TAB CONTENT: 8 Factors */}
                {activeResultTab === 'factors' && (
                  <div className="p-4 divide-y divide-[#e2e8e2] dark:divide-[#232f25] text-xs">
                    {result.factors.map((f) => (
                      <div key={f.factor_id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#131f16] dark:text-[#edf3ee]">{f.factor_name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              f.status === 'optimal'
                                ? 'bg-forest-50 text-forest-800 dark:bg-forest-950 dark:text-forest-200 border border-forest-300 dark:border-forest-700'
                                : f.status === 'moderate'
                                ? 'bg-earth-50 text-earth-800 dark:bg-earth-950 dark:text-earth-200 border border-earth-300 dark:border-earth-700'
                                : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                            }`}>
                              {f.status}
                            </span>
                          </div>
                          <span className="font-mono text-[#506154] dark:text-[#97a69b] text-[11px]">
                            {f.score_awarded} / {f.weight} pts
                          </span>
                        </div>
                        <p className="text-[11px] text-[#506154] dark:text-[#97a69b] leading-normal">
                          {f.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB CONTENT: Document Checklist */}
                {activeResultTab === 'checklist' && (
                  <div className="p-4 space-y-3 text-xs">
                    {/* Filter chips */}
                    <div className="flex gap-1.5">
                      {['All', 'Required', 'Conditional', 'Verify with authority'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setChecklistFilter(tag)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                            checklistFilter === tag
                              ? 'bg-forest-700 text-white dark:bg-forest-600'
                              : 'bg-stone-100 dark:bg-[#19221b] text-[#506154] dark:text-[#97a69b] hover:bg-forest-50/50'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 pt-1">
                      {filteredChecklist.map((item) => {
                        const isChecked = !!checkedItems[item.id];
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleCheck(item.id)}
                            className="p-3 rounded-lg border border-[#e2e8e2] dark:border-[#232f25] flex items-start gap-2.5 cursor-pointer hover:bg-forest-50/40 dark:hover:bg-forest-950/20 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="mt-0.5 rounded border-stone-300 text-forest-700 focus:ring-0 cursor-pointer"
                            />
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`font-semibold ${isChecked ? 'line-through text-stone-400 dark:text-stone-600' : 'text-[#131f16] dark:text-[#edf3ee]'}`}>
                                  {item.name}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-forest-50/80 dark:bg-forest-950/80 text-forest-800 dark:text-forest-300 border border-forest-200/60 dark:border-forest-800/60 shrink-0">
                                  {item.tag}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#506154] dark:text-[#97a69b] leading-normal">
                                {item.description}
                              </p>
                              <span className="text-[10px] text-[#728477] dark:text-[#6e7d72] block">
                                Authority: {item.authority_source}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: Species Recommendations */}
                {activeResultTab === 'species' && (
                  <div className="p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.recommended_species_top5.slice(0, 4).map((sp, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-[#e2e8e2] dark:border-[#232f25] bg-white dark:bg-[#141a15] space-y-1.5"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-[#131f16] dark:text-[#edf3ee]">
                                {sp.common_name}
                              </h4>
                              <p className="text-[11px] text-forest-700 dark:text-forest-400 italic">
                                {sp.botanical_name}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-forest-700 dark:text-forest-400 font-mono px-1.5 py-0.5 rounded bg-forest-50 dark:bg-forest-950/80 border border-forest-200/60">
                              {sp.compatibility_score}% Match
                            </span>
                          </div>

                          <p className="text-[11px] text-[#506154] dark:text-[#97a69b] line-clamp-2 leading-normal">
                            {sp.description}
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-[#728477] dark:text-[#6e7d72] pt-1 border-t border-[#e2e8e2] dark:border-[#232f25]">
                            <span>Height: {sp.mature_height_m}m</span>
                            <span>•</span>
                            <span>CO₂: {sp.carbon_sequestration_kg_yr} kg/yr</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: Roadmap & Subsidies */}
                {activeResultTab === 'roadmap' && (
                  <div className="p-4 space-y-4 text-xs">
                    {/* Subsidies */}
                    <div className="space-y-2">
                      <span className="font-semibold text-[#131f16] dark:text-[#edf3ee] block">
                        Matched Government Subsidies
                      </span>
                      <div className="space-y-1.5">
                        {result.matched_schemes_top3.map((sc, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg border border-[#e2e8e2] dark:border-[#232f25] flex items-center justify-between gap-2 bg-stone-50/50 dark:bg-[#19221b]/50"
                          >
                            <div>
                              <span className="font-semibold text-[#131f16] dark:text-[#edf3ee] block">{sc.name}</span>
                              <p className="text-[11px] text-forest-700 dark:text-forest-400">{sc.financial_incentive}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-forest-50 dark:bg-forest-950 text-forest-800 dark:text-forest-300 font-medium shrink-0 border border-forest-200/60">
                              {sc.sponsor_level}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Steps */}
                    <div className="space-y-2 pt-2 border-t border-[#e2e8e2] dark:border-[#232f25]">
                      <span className="font-semibold text-[#131f16] dark:text-[#edf3ee] block">
                        Statutory Procedure Roadmap
                      </span>
                      <div className="space-y-2">
                        {result.procedure_steps.slice(0, 5).map((step) => (
                          <div key={step.step_number} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded bg-forest-100 dark:bg-forest-900 text-forest-900 dark:text-forest-100 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                              {step.step_number}
                            </span>
                            <div className="space-y-0.5">
                              <span className="font-semibold text-[#131f16] dark:text-[#edf3ee] block">{step.title}</span>
                              <p className="text-[11px] text-[#506154] dark:text-[#97a69b] leading-normal">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#506154] dark:text-[#97a69b] font-medium">
                  Proceed to documentation or official certification
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('assistant', { siteName, landType, targetTrees })}
                    className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#19221b] text-forest-900 dark:text-forest-100 border border-[#e2e8e2] dark:border-[#232f25] hover:bg-forest-50/60 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Draft NOC Application
                  </button>
                  <button
                    onClick={() => onNavigate('certificates', { siteName, latitude, longitude, landType, targetTrees })}
                    className="px-3.5 py-1.5 rounded-lg bg-forest-700 hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500 text-white text-xs font-medium cursor-pointer shadow-subtle transition-colors"
                  >
                    Issue Certificate
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
