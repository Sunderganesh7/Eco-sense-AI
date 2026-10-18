import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polygon, GeoJSON, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Layers, MapPin, Eye, Compass } from 'lucide-react';
import { loadMaharashtraDistrictsGeoJSON } from '../../utils/geoLookup';

// Fix Leaflet's default marker icon issue in Webpack/Vite
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  selectedCoord?: [number, number];
  onSelectCoord?: (lat: number, lng: number) => void;
  showZones?: boolean;
  zonesGeoJSON?: any;
  showDistrictBoundaries?: boolean;
  markers?: Array<{
    id: string | number;
    position: [number, number];
    title: string;
    description?: string;
    badge?: string;
    color?: string;
  }>;
  height?: string;
  className?: string;
}

// Sub-component to handle map click events
const MapClickHandler: React.FC<{ onSelect?: (lat: number, lng: number) => void }> = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      if (onSelect) {
        onSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Sub-component to animate center shifts
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMapEvents({});
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  zoom = 13,
  selectedCoord,
  onSelectCoord,
  showZones = true,
  zonesGeoJSON,
  showDistrictBoundaries = true,
  markers = [],
  height = '400px',
  className = ''
}) => {
  const [satelliteView, setSatelliteView] = useState(false);
  const [districtBoundaries, setDistrictBoundaries] = useState<any>(null);

  useEffect(() => {
    if (showDistrictBoundaries) {
      loadMaharashtraDistrictsGeoJSON().then(data => {
        if (data && data.features && data.features.length > 0) {
          setDistrictBoundaries(data);
        }
      });
    }
  }, [showDistrictBoundaries]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm ${className}`} style={{ height }}>
      {/* Map Layer Switcher Floating Button */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
        <button
          type="button"
          onClick={() => setSatelliteView(false)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            !satelliteView
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Street
        </button>
        <button
          type="button"
          onClick={() => setSatelliteView(true)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            satelliteView
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Map Legend Overlay */}
      {showZones && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-xs space-y-1">
          <div className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
            GIS Suitability Zones
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></span>
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">High Suitability</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600"></span>
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">Medium / Setback</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600"></span>
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">Avoid / Restricted</span>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={center} zoom={zoom} />
        {onSelectCoord && <MapClickHandler onSelect={onSelectCoord} />}

        {/* Base Tile Layer */}
        {satelliteView ? (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a> &mdash; World Imagery'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {/* District Boundaries from /data/maharashtra_districts.geojson */}
        {districtBoundaries && (
          <GeoJSON
            key="maharashtra-district-boundaries-geojson"
            data={districtBoundaries}
            style={() => ({
              color: '#245e37',
              weight: 1.5,
              opacity: 0.6,
              fillColor: '#245e37',
              fillOpacity: 0.03,
              dashArray: '3, 4'
            })}
            onEachFeature={(feature, layer) => {
              const name = feature.properties?.district || feature.properties?.district_name || 'District';
              layer.bindTooltip(
                `<div style="font-family: inherit; font-size: 11px; font-weight: 600; padding: 2px 6px; background: rgba(255,255,255,0.95); color: #194327; border-radius: 4px; border: 1px solid #245e37;">${name} District</div>`,
                { sticky: true, opacity: 0.95 }
              );
              layer.on({
                mouseover: (e) => {
                  const l = e.target;
                  l.setStyle({
                    weight: 2.5,
                    color: '#15803d',
                    fillOpacity: 0.12,
                    dashArray: ''
                  });
                },
                mouseout: (e) => {
                  const l = e.target;
                  l.setStyle({
                    weight: 1.5,
                    color: '#245e37',
                    fillOpacity: 0.03,
                    dashArray: '3, 4'
                  });
                },
                click: (e) => {
                  if (onSelectCoord) {
                    onSelectCoord(e.latlng.lat, e.latlng.lng);
                  }
                }
              });
            }}
          />
        )}

        {/* Suitability GeoJSON Zones Overlay */}
        {showZones && zonesGeoJSON && (
          <GeoJSON
            key={JSON.stringify(zonesGeoJSON)}
            data={zonesGeoJSON}
            style={(feature) => ({
              color: feature?.properties?.color || '#245e37',
              fillColor: feature?.properties?.fillColor || '#245e37',
              fillOpacity: feature?.properties?.fillOpacity || 0.25,
              weight: 2,
            })}
            onEachFeature={(feature, layer) => {
              if (feature.properties?.name) {
                layer.bindPopup(
                  `<div class="p-1"><strong>${feature.properties.name}</strong><br/><small>${feature.properties.description || ''}</small></div>`
                );
              }
            }}
          />
        )}

        {/* Selected Dropped Pin */}
        {selectedCoord && (
          <Marker position={selectedCoord} icon={defaultIcon}>
            <Popup>
              <div className="p-1 text-slate-900">
                <strong className="text-emerald-700">Selected Plantation Site</strong>
                <br />
                Lat: {selectedCoord[0].toFixed(4)}°, Lng: {selectedCoord[1].toFixed(4)}°
                <br />
                <span className="text-[11px] text-slate-500">Click to evaluate statutory rules</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Additional Markers */}
        {markers.map((m) => (
          <Marker key={m.id} position={m.position} icon={defaultIcon}>
            <Popup>
              <div className="p-1">
                <strong>{m.title}</strong>
                {m.description && <p className="text-xs text-slate-600 mt-1">{m.description}</p>}
                {m.badge && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    {m.badge}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
