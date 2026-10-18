import React, { useEffect, useState } from 'react';
import {
  Trees,
  MapPin,
  ArrowRight,
  Scale,
  Compass,
  Activity,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import type { LocationItem } from '../types';
import { MAHARASHTRA_DISTRICTS } from '../data/maharashtraDistricts';
import { LeafletMap } from '../components/common/LeafletMap';
import { ComplianceDisclaimer } from '../components/common/ComplianceDisclaimer';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardPageProps {
  onNavigate: (tab: string, state?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [locations, setLocations] = useState<LocationItem[]>(MAHARASHTRA_DISTRICTS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locData = await api.getLocations();
        if (locData && locData.length > 0) {
          setLocations(locData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Mapped Districts', value: String(locations.length || 36), desc: 'All 6 administrative divisions of Maharashtra' },
    { label: 'Statutory Land Types', value: '13', desc: 'Codified regulatory profiles' },
    { label: 'Cataloged Species', value: '20', desc: 'Indigenous botanical entries' },
    { label: 'Indexed Subsidies', value: '10', desc: 'Active Central & State programs' },
  ];

  const distributionData = [
    { name: 'Private / Institutional', value: 35, color: '#245e37' },
    { name: 'Municipal Public', value: 25, color: '#3d9258' },
    { name: 'Agroforestry Farmland', value: 20, color: '#828e62' },
    { name: 'Highway / Infra Verge', value: 12, color: '#bd8958' },
    { name: 'Coastal CRZ / Forest', value: 8, color: '#835234' },
  ];

  return (
    <div className="py-8 px-6 sm:px-10 lg:px-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131f16] dark:text-[#edf3ee]">
            Operational Dashboard
          </h1>
          <p className="text-xs text-[#506154] dark:text-[#97a69b] mt-0.5">
            System overview of all 36 Maharashtra districts, species taxonomy, and statutory rules.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-check')}
          className="px-3.5 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-subtle"
        >
          <span>New Assessment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <ComplianceDisclaimer compact />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] space-y-1"
          >
            <span className="text-2xl font-bold text-[#131f16] dark:text-[#edf3ee] block font-sans">
              {st.value}
            </span>
            <span className="text-xs font-semibold text-forest-800 dark:text-forest-300 block">
              {st.label}
            </span>
            <p className="text-[11px] text-[#506154] dark:text-[#97a69b]">
              {st.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Map & Land Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Preview (8 Cols) */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-[#131f16] dark:text-[#edf3ee]">
              Maharashtra 36 Districts Map
            </h2>
            <button
              onClick={() => onNavigate('map-explorer')}
              className="text-xs text-forest-700 dark:text-forest-400 hover:text-forest-900 dark:hover:text-forest-200 flex items-center gap-1 cursor-pointer font-medium"
            >
              Full GIS View <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <LeafletMap
            center={[19.6633, 75.3003]}
            zoom={7}
            height="320px"
            showZones={false}
            markers={locations.map(loc => ({
              id: loc.id,
              position: [loc.latitude, loc.longitude],
              title: loc.name,
              description: `${loc.district} • ${loc.land_type.replace('_', ' ')} • ${loc.soil_type}`,
              badge: loc.crz_status
            }))}
            onSelectCoord={(lat, lng) => {
              onNavigate('new-check', { lat, lng });
            }}
          />
        </div>

        {/* Land Category Distribution (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-semibold text-sm text-[#131f16] dark:text-[#edf3ee]">
              Land Use Allocation
            </h2>
            <p className="text-xs text-[#506154] dark:text-[#97a69b] mt-0.5">
              Breakdown across planned parcels
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {distributionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[#506154] dark:text-[#97a69b]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate text-[11px] font-medium">{item.name}</span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#131f16] dark:text-[#edf3ee] shrink-0">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
