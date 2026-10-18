import React, { useState } from "react";
import config from "../config";
import {
  ArrowLeft,
  Trash2,
  FileText,
  Satellite,
  MapPin,
  Calendar,
  Clock,
  Globe2,
  Target,
  Activity,
  Edit3,
  Check,
  Image as ImageIcon
} from "lucide-react";

const AnalysisDetail = ({ analysis, onBack, onDelete }) => {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    title: analysis.title || "",
    description: analysis.description || "",
    location: analysis.location || "",
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateArea = (bbox) => {
    if (!bbox || bbox.length !== 4) return "N/A";
    const [west, south, east, north] = bbox;
    const width = Math.abs(east - west);
    const height = Math.abs(north - south);
    const area = width * height;
    return `${area.toFixed(4)}°²`;
  };

  const renderBBox = (bbox) => {
    if (!bbox || bbox.length !== 4) return <div className="text-sm text-slate-500">N/A</div>;
    const [west, south, east, north] = bbox;
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">West</span>
          <span className="text-[13px] font-mono text-slate-700">{Number(west).toFixed(4)}</span>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">South</span>
          <span className="text-[13px] font-mono text-slate-700">{Number(south).toFixed(4)}</span>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">East</span>
          <span className="text-[13px] font-mono text-slate-700">{Number(east).toFixed(4)}</span>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col shadow-sm">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">North</span>
          <span className="text-[13px] font-mono text-slate-700">{Number(north).toFixed(4)}</span>
        </div>
      </div>
    );
  };

  const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-emerald-600";
      default:
        return "text-blue-600";
    }
  };

  const isCompleted = analysis.status === "completed";

  return (
    <div className="bg-transparent pb-8">
      {/* Top Navigation */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 font-semibold text-sm transition-colors w-fit px-3 py-1.5 -ml-3 rounded-lg hover:bg-emerald-50"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Analysis History
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 pb-6 border-b border-slate-200">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              NDVI Analysis
            </span>
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {analysis.status?.toUpperCase() || "UNKNOWN"}
            </div>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mb-2">
            {editData.title || "Untitled Analysis"}
          </h1>
          <p className="text-[15px] text-slate-500 font-medium">
            {editData.description || "No description provided"}
          </p>
        </div>
        
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg text-sm font-semibold transition-all shadow-sm flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" /> Delete Analysis
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Info Cards (40%) */}
        <div className="lg:w-[40%] flex flex-col gap-6 order-2 lg:order-1">
          
          {/* Analysis Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
            <div className="absolute top-0 left-6 w-12 h-1 bg-emerald-500 rounded-b-md" />
            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest mb-6 mt-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Analysis Overview
            </h3>

            {editMode ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-1 block">Title</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-1 block">Description</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows="3"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-1 block">Location</label>
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <button
                  onClick={() => setEditMode(false)}
                  className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                <div className="col-span-1 sm:col-span-2 flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Description</span>
                  <span className="text-sm text-slate-800 font-medium">{analysis.description || "No description"}</span>
                </div>
                
                <div className="col-span-1 sm:col-span-2 flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Location</span>
                  <span className="text-sm text-slate-800 font-medium">{analysis.location || "Unknown"}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Analysis Date</span>
                  <span className="text-[13px] font-medium text-slate-800">{formatDate(analysis.date)}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Captured</span>
                  <span className="text-[13px] font-medium text-slate-800">{formatDate(analysis.createdAt)}</span>
                </div>
              </div>
            )}

            {!editMode && (
              <button 
                onClick={() => setEditMode(true)} 
                className="mt-6 w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 text-slate-600 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Edit Analysis
              </button>
            )}
          </div>

          {/* Geographic Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
            <div className="absolute top-0 left-6 w-12 h-1 bg-emerald-500 rounded-b-md" />
            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest mb-6 mt-1 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-600" /> Geographic Information
            </h3>
            
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Bounding Box</span>
                {renderBBox(analysis.bbox)}
              </div>
              
              <div className="h-px bg-slate-100 w-full" />
              
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> Area Size</span>
                <span className="text-[15px] font-mono font-bold text-slate-700">{calculateArea(analysis.bbox)}</span>
              </div>
            </div>
          </div>

          {/* Analysis Results Card (if exists) */}
          {analysis.analysis && analysis.analysis.changePercentage != null && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
              <div className="absolute top-0 left-6 w-12 h-1 bg-emerald-500 rounded-b-md" />
              <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest mb-6 mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Analysis Results
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Change Detected</span>
                  <span className="text-2xl font-bold font-mono text-blue-600">{analysis.analysis.changePercentage}%</span>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col shadow-sm">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Severity</span>
                  <span className={`text-xl font-bold ${getSeverityStyle(analysis.analysis.severity)}`}>
                    {analysis.analysis.severity?.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {analysis.analysis.summary && (
                <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2 block">Summary</span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{analysis.analysis.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Satellite Visual (60%) */}
        <div className="lg:w-[60%] flex flex-col order-1 lg:order-2">
          
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-200 relative group min-h-[400px] flex items-center justify-center">
            
            {/* Visual Overlay Badge */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-white/10 text-white px-4 py-2.5 rounded-xl flex flex-col shadow-lg z-10">
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold mb-0.5">Satellite Observation</span>
              <span className="text-[13px] font-semibold flex items-center gap-2"><Satellite className="w-3.5 h-3.5"/> {analysis.nasaLayer}</span>
            </div>

            {analysis.imageFileId ? (
              <img
                src={`${config.API_URL}/api/nasa/image/${analysis.imageFileId}`}
                alt="Satellite Observation"
                className="w-full h-full max-h-[700px] object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
            ) : null}
            
            <div 
              style={{ display: analysis.imageFileId ? "none" : "flex" }} 
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 w-full h-full min-h-[400px]"
            >
              <ImageIcon className="w-16 h-16 mb-4 text-slate-300" strokeWidth={1} />
              <p className="font-medium">No satellite imagery available</p>
              <p className="text-xs mt-1">The image file may have been removed or is unavailable.</p>
            </div>
          </div>

          {/* Info Strip below image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Satellite</span>
              <span className="text-[13px] font-semibold text-slate-800 truncate">{analysis.nasaLayer}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Capture Date</span>
              <span className="text-[13px] font-semibold text-slate-800 truncate">{formatDate(analysis.date).split(',')[0]}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Location</span>
              <span className="text-[13px] font-semibold text-slate-800 truncate" title={analysis.location}>{analysis.location || "Unknown"}</span>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default AnalysisDetail;