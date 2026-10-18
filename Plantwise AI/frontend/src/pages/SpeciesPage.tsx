import React, { useState, useEffect } from 'react';
import { Search, X, Droplet } from 'lucide-react';
import { api } from '../services/api';
import type { SpeciesItem } from '../types';

export const SpeciesPage: React.FC = () => {
  const [speciesList, setSpeciesList] = useState<SpeciesItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [soilFilter, setSoilFilter] = useState<string>('All');
  const [waterFilter, setWaterFilter] = useState<string>('All');
  const [purposeFilter, setPurposeFilter] = useState<string>('All');
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSpecies = async () => {
      setLoading(true);
      try {
        const data = await api.getSpecies({
          search: search || undefined,
          region: regionFilter !== 'All' ? regionFilter : undefined,
          soil_type: soilFilter !== 'All' ? soilFilter : undefined,
          water_req: waterFilter !== 'All' ? waterFilter : undefined,
          purpose: purposeFilter !== 'All' ? purposeFilter : undefined,
        });
        setSpeciesList(data);
      } catch (err) {
        console.error('Failed to fetch species:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecies();
  }, [search, regionFilter, soilFilter, waterFilter, purposeFilter]);

  return (
    <div className="py-8 px-6 sm:px-10 lg:px-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131f16] dark:text-[#edf3ee]">
          Indigenous Tree Species Database
        </h1>
        <p className="text-xs text-[#506154] dark:text-[#97a69b] mt-0.5">
          Botanical taxonomy, soil compatibility, APTI pollution tolerance, and carbon absorption ratings for Maharashtra.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#728477] dark:text-[#6e7d72]" />
            <input
              type="text"
              placeholder="Search botanical, common, or Marathi name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg pl-8 pr-3 py-2 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-2.5 py-2 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
            >
              <option value="All">All Regions</option>
              <option value="Deccan Plateau">Deccan Plateau</option>
              <option value="Konkan / Coastal">Konkan Coast</option>
              <option value="Western Ghats">Western Ghats</option>
              <option value="Vidarbha">Vidarbha</option>
              <option value="Marathwada">Marathwada</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={soilFilter}
              onChange={(e) => setSoilFilter(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-2.5 py-2 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
            >
              <option value="All">All Soils</option>
              <option value="Clay Loam">Clay Loam</option>
              <option value="Black Cotton Soil">Black Cotton</option>
              <option value="Sandy Loam">Sandy Loam</option>
              <option value="Laterite">Laterite</option>
              <option value="Saline Clay">Saline Clay</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={waterFilter}
              onChange={(e) => setWaterFilter(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-2.5 py-2 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
            >
              <option value="All">Water Need</option>
              <option value="Low">Low (Hardy)</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-2.5 py-2 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
            >
              <option value="All">All Purposes</option>
              <option value="Avenue">Avenue / Road</option>
              <option value="Urban Greening">Urban Greening</option>
              <option value="Agroforestry">Agroforestry</option>
              <option value="Coastal">Coastal Bio-Shield</option>
            </select>
          </div>
        </div>
      </div>

      {/* Species Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {speciesList.map((sp, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedSpecies(sp)}
            className="p-5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] flex flex-col justify-between hover:border-forest-300 dark:hover:border-forest-700 cursor-pointer transition-colors space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm text-[#131f16] dark:text-[#edf3ee] leading-tight">
                    {sp.common_name}
                  </h3>
                  <p className="text-xs text-forest-700 dark:text-forest-400 italic mt-0.5">
                    {sp.botanical_name}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-forest-50 dark:bg-forest-950 text-forest-800 dark:text-forest-300 border border-forest-200/60 shrink-0">
                  {sp.growth_rate}
                </span>
              </div>

              {sp.local_name && (
                <span className="text-[11px] text-[#506154] dark:text-[#97a69b] block font-medium">
                  {sp.local_name}
                </span>
              )}

              <p className="text-xs text-[#506154] dark:text-[#97a69b] line-clamp-2 leading-relaxed">
                {sp.description}
              </p>

              {/* Metric Row */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 rounded-lg bg-stone-50 dark:bg-[#19221b]">
                  <span className="text-[#728477] dark:text-[#6e7d72] text-[10px] block">Height</span>
                  <strong className="text-[#131f16] dark:text-[#edf3ee] font-medium text-xs">{sp.mature_height_m}m</strong>
                </div>
                <div className="p-2 rounded-lg bg-stone-50 dark:bg-[#19221b]">
                  <span className="text-[#728477] dark:text-[#6e7d72] text-[10px] block">CO₂ Sink</span>
                  <strong className="text-forest-700 dark:text-forest-400 font-medium text-xs">{sp.carbon_sequestration_kg_yr} kg</strong>
                </div>
                <div className="p-2 rounded-lg bg-stone-50 dark:bg-[#19221b]">
                  <span className="text-[#728477] dark:text-[#6e7d72] text-[10px] block">APTI</span>
                  <strong className="text-[#131f16] dark:text-[#edf3ee] font-medium text-xs">{sp.apti_score || 22.0}</strong>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e2e8e2] dark:border-[#232f25] flex items-center justify-between text-xs text-[#728477] dark:text-[#6e7d72]">
              <span className="flex items-center gap-1">
                <Droplet className="w-3 h-3 text-forest-600 dark:text-forest-400" /> {sp.water_requirement}
              </span>
              <span className="font-medium text-forest-700 dark:text-forest-400 hover:text-forest-900">
                View Details →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedSpecies && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141a15] max-w-lg w-full rounded-2xl p-6 shadow-xl border border-[#e2e8e2] dark:border-[#232f25] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#131f16] dark:text-[#edf3ee]">
                  {selectedSpecies.common_name}
                </h2>
                <p className="text-xs text-forest-700 dark:text-forest-400 italic">
                  {selectedSpecies.botanical_name} {selectedSpecies.family && `(${selectedSpecies.family})`}
                </p>
                {selectedSpecies.local_name && (
                  <p className="text-xs text-[#506154] dark:text-[#97a69b] mt-0.5">{selectedSpecies.local_name}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedSpecies(null)}
                className="p-1 rounded-lg text-[#728477] hover:text-[#131f16] dark:hover:text-[#edf3ee] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#506154] dark:text-[#97a69b] leading-relaxed">
              {selectedSpecies.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#19221b] space-y-1">
                <span className="text-forest-800 dark:text-forest-300 text-[10px] uppercase font-semibold">Growth & Spread</span>
                <p>Height: <strong>{selectedSpecies.mature_height_m}m</strong></p>
                <p>Canopy: <strong>{selectedSpecies.canopy_spread_m}m</strong></p>
                <p>Rate: <strong>{selectedSpecies.growth_rate}</strong></p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#19221b] space-y-1">
                <span className="text-forest-800 dark:text-forest-300 text-[10px] uppercase font-semibold">Ecological Metrics</span>
                <p>Carbon Sink: <strong className="text-forest-700 dark:text-forest-400">{selectedSpecies.carbon_sequestration_kg_yr} kg/yr</strong></p>
                <p>Water: <strong>{selectedSpecies.water_requirement}</strong></p>
                <p>Air Quality: <strong>APTI {selectedSpecies.apti_score || 22.0}</strong></p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <h4 className="font-semibold text-[#131f16] dark:text-[#edf3ee]">Ecosystem Benefits</h4>
              <div className="flex flex-wrap gap-1">
                {selectedSpecies.ecological_benefits.map((b, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-forest-50 dark:bg-forest-950/80 text-forest-800 dark:text-forest-300 border border-forest-200/60 text-xs">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
