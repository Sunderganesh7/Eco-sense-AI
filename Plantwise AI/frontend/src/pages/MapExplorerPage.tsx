import React, { useState, useEffect } from 'react';
import { Compass, Search, ArrowRight, MapPin, Layers } from 'lucide-react';
import { LeafletMap } from '../components/common/LeafletMap';
import { api } from '../services/api';
import type { LocationItem } from '../types';
import { MAHARASHTRA_DISTRICTS, MAHARASHTRA_DIVISIONS, MaharashtraDistrict } from '../data/maharashtraDistricts';
import { ComplianceDisclaimer } from '../components/common/ComplianceDisclaimer';
import { lookupDistrictByCoordinates } from '../utils/geoLookup';

interface MapExplorerPageProps {
  onNavigate: (tab: string, state?: any) => void;
}

export const MapExplorerPage: React.FC<MapExplorerPageProps> = ({ onNavigate }) => {
  const [locations, setLocations] = useState<LocationItem[]>(MAHARASHTRA_DISTRICTS);
  const [activeDivision, setActiveDivision] = useState<string>('All Divisions');
  const [activeLandFilter, setActiveLandFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLoc, setSelectedLoc] = useState<LocationItem | null>(MAHARASHTRA_DISTRICTS[0] || null);
  const [zonesGeoJSON, setZonesGeoJSON] = useState<any>(null);

  useEffect(() => {
    const fetchLocs = async () => {
      try {
        const data = await api.getLocations();
        if (data && data.length > 0) {
          setLocations(data);
          setSelectedLoc(data[0]);
          const geo = await api.getZonesGeoJSON(data[0].latitude, data[0].longitude, data[0].land_type);
          setZonesGeoJSON(geo);
        } else if (MAHARASHTRA_DISTRICTS.length > 0) {
          setSelectedLoc(MAHARASHTRA_DISTRICTS[0]);
        }
      } catch (err) {
        console.error('Failed to load map locations from API, using bundled districts:', err);
      }
    };
    fetchLocs();
  }, []);

  const handleSelectLocation = async (loc: LocationItem) => {
    setSelectedLoc(loc);
    try {
      const geo = await api.getZonesGeoJSON(loc.latitude, loc.longitude, loc.land_type);
      setZonesGeoJSON(geo);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMapSelectCoord = async (lat: number, lng: number) => {
    const lookup = await lookupDistrictByCoordinates(lat, lng);
    if (lookup.isInsideMaharashtra && lookup.district) {
      const matched = lookup.districtData;
      setSelectedLoc({
        id: matched ? matched.id : 999,
        name: matched ? matched.name : `${lookup.district} Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        district: lookup.district,
        state: 'Maharashtra',
        latitude: lat,
        longitude: lng,
        land_type: matched ? matched.land_type : 'municipal_public',
        soil_type: matched ? matched.soil_type : 'Clay Loam',
        crz_status: matched ? matched.crz_status : 'Non-CRZ',
        rainfall_annual_mm: matched ? matched.rainfall_annual_mm : 1200,
        existing_canopy_pct: matched ? matched.existing_canopy_pct : 15.0,
        nearest_water_source: matched ? matched.nearest_water_source : 'Municipal Line',
        description: `Coordinates located inside ${lookup.district} district.`,
        is_preset: false
      });
    } else {
      setSelectedLoc({
        id: 999,
        name: `Outside Maharashtra (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        district: 'Outside Maharashtra',
        state: 'N/A',
        latitude: lat,
        longitude: lng,
        land_type: 'municipal_public',
        soil_type: 'Unknown',
        crz_status: 'Non-CRZ',
        rainfall_annual_mm: 0,
        existing_canopy_pct: 0,
        nearest_water_source: 'N/A',
        description: 'Selected point falls outside Maharashtra boundary.',
        is_preset: false
      });
    }
  };

  const getDistrictDivision = (dist: string): string => {
    if (['Mumbai City', 'Mumbai Suburban', 'Thane', 'Palghar', 'Raigad', 'Ratnagiri', 'Sindhudurg'].includes(dist)) return 'Konkan';
    if (['Nashik', 'Dhule', 'Nandurbar', 'Jalgaon', 'Ahmednagar'].includes(dist)) return 'Nashik';
    if (['Pune', 'Satara', 'Sangli', 'Solapur', 'Kolhapur'].includes(dist)) return 'Pune';
    if (['Chhatrapati Sambhajinagar', 'Jalna', 'Beed', 'Latur', 'Dharashiv', 'Nanded', 'Parbhani', 'Hingoli'].includes(dist)) return 'Chhatrapati Sambhajinagar';
    if (['Amravati', 'Akola', 'Washim', 'Buldhana', 'Yavatmal'].includes(dist)) return 'Amravati';
    return 'Nagpur';
  };

  const filteredLocations = locations.filter(loc => {
    const div = getDistrictDivision(loc.district);
    const matchDiv = activeDivision === 'All Divisions' || div === activeDivision;
    const matchType = activeLandFilter === 'All' || loc.land_type === activeLandFilter;
    const matchSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.soil_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDiv && matchType && matchSearch;
  });

  return (
    <div className="py-8 px-6 sm:px-10 lg:px-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131f16] dark:text-[#edf3ee]">
            GIS Map & Zoning Explorer
          </h1>
          <p className="text-xs text-[#506154] dark:text-[#97a69b] mt-0.5">
            Spatial viewer across all 36 Maharashtra districts with suitability buffers, CRZ coastal boundaries, and reserve forests.
          </p>
        </div>

        {selectedLoc && (
          <button
            onClick={() => onNavigate('new-check', { lat: selectedLoc.latitude, lng: selectedLoc.longitude })}
            className="px-3.5 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-subtle"
          >
            <span>Assess {selectedLoc.name.split(',')[0]}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <ComplianceDisclaimer compact />

      {/* Map + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Map View (8 Cols) */}
        <div className="lg:col-span-8 p-1.5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25]">
          <LeafletMap
            center={selectedLoc ? [selectedLoc.latitude, selectedLoc.longitude] : [19.0760, 72.8777]}
            zoom={selectedLoc ? 12 : 7}
            selectedCoord={selectedLoc ? [selectedLoc.latitude, selectedLoc.longitude] : undefined}
            onSelectCoord={handleMapSelectCoord}
            showZones={true}
            zonesGeoJSON={zonesGeoJSON}
            height="560px"
            markers={locations.map(l => ({
              id: l.id,
              position: [l.latitude, l.longitude],
              title: l.name,
              description: `${l.district} • ${l.land_type.replace('_', ' ')} • ${l.soil_type}`,
              badge: l.crz_status
            }))}
          />
        </div>

        {/* Location List & Detail Drawer (4 Cols) */}
        <div className="lg:col-span-4 space-y-3 flex flex-col h-[575px]">
          {/* Search, Division & Land-Type Filter */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#728477] dark:text-[#6e7d72]" />
              <input
                type="text"
                placeholder="Search site, district, soil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg pl-8 pr-3 py-2 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600"
              />
            </div>

            {/* Division Filter Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#506154] dark:text-[#97a69b] block">
                Administrative Division
              </label>
              <select
                value={activeDivision}
                onChange={(e) => setActiveDivision(e.target.value)}
                className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-2.5 py-1.5 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
              >
                {MAHARASHTRA_DIVISIONS.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            {/* Land type chips */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 text-xs">
              {['All', 'municipal_public', 'forest_reserved', 'coastal_crz', 'agricultural'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveLandFilter(type)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium shrink-0 transition-colors cursor-pointer ${
                    activeLandFilter === type
                      ? 'bg-forest-700 text-white dark:bg-forest-600'
                      : 'bg-stone-100 dark:bg-[#19221b] text-[#506154] dark:text-[#97a69b] hover:bg-forest-50/50'
                  }`}
                >
                  {type === 'All' ? 'All Types' : type.split('_')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Locations Scroll List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="px-1 text-[11px] font-medium text-[#728477] dark:text-[#6e7d72] flex justify-between">
              <span>Showing {filteredLocations.length} districts</span>
              <span>MH Total: {locations.length}</span>
            </div>
            {filteredLocations.map((loc) => {
              const isSelected = selectedLoc?.id === loc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => handleSelectLocation(loc)}
                  className={`p-3.5 rounded-xl border transition-colors cursor-pointer text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-forest-50/70 dark:bg-forest-950/40 border-forest-400 dark:border-forest-700 shadow-xs'
                      : 'bg-white dark:bg-[#141a15] border-[#e2e8e2] dark:border-[#232f25] hover:border-forest-300 dark:hover:border-forest-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-[#131f16] dark:text-[#edf3ee] leading-tight">
                      {loc.name}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-forest-50 dark:bg-forest-950 text-forest-800 dark:text-forest-300 border border-forest-200/60 shrink-0">
                      {loc.district}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#506154] dark:text-[#97a69b] line-clamp-2 leading-normal">
                    {loc.description}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-[#728477] dark:text-[#6e7d72] pt-1 border-t border-[#e2e8e2] dark:border-[#232f25]">
                    <span className="font-medium text-forest-800 dark:text-forest-300">{loc.land_type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{loc.soil_type}</span>
                    <span>•</span>
                    <span>{loc.existing_canopy_pct}% canopy</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Location Quick Action */}
          {selectedLoc && (
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] space-y-2 text-xs shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#131f16] dark:text-[#edf3ee] truncate">{selectedLoc.name}</span>
                <span className="font-mono text-[10px] text-forest-700 dark:text-forest-400">
                  {selectedLoc.latitude.toFixed(3)}°, {selectedLoc.longitude.toFixed(3)}°
                </span>
              </div>
              <button
                onClick={() => onNavigate('new-check', { lat: selectedLoc.latitude, lng: selectedLoc.longitude })}
                className="w-full py-2 rounded-lg bg-forest-700 hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle"
              >
                <span>Run Full Compliance Check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
