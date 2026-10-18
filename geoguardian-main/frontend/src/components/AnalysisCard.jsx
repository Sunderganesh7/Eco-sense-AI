import React from "react";
import { MapPin, Satellite, Calendar, Target, ArrowRight } from "lucide-react";

const AnalysisCard = ({ analysis, onView }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const formatBBox = (bbox) => {
    if (!bbox || bbox.length !== 4) return "N/A";
    const [west, south, east, north] = bbox;
    return `(${west.toFixed(2)}, ${south.toFixed(2)})`;
  };

  const isCompleted = analysis.status === "completed";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden group">
      <div className="h-1.5 w-full bg-emerald-600/90 group-hover:bg-emerald-500 transition-colors" />

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="flex-1 pr-2">
            <h3 className="gg-section-title leading-[1.4] mb-1">
              {analysis.title?.startsWith('Change Detection:') ? (
                <>
                  Change Detection:<br />
                  <span className="inline-block mt-0.5">{analysis.title.replace('Change Detection: ', '')}</span>
                </>
              ) : (
                analysis.title || "Satellite Analysis"
              )}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
              {analysis.description || "No description provided"}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex-shrink-0">
            {formatDate(analysis.createdAt)}
          </span>
        </div>

        <div className="flex flex-col gap-3 mb-6 flex-1">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2} />
            <span className="text-[13px] text-slate-700 font-medium truncate" title={analysis.location || "Unknown"}>
              {analysis.location || "Unknown"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Satellite className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2} />
            <span className="text-[13px] text-slate-700 font-medium truncate" title={analysis.nasaLayer}>
              {analysis.nasaLayer}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2} />
            <span className="text-[13px] text-slate-700 font-medium">
              {formatDate(analysis.date)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Target className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2} />
            <span className="text-[13px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
              {formatBBox(analysis.bbox)}
            </span>
          </div>
        </div>

        {analysis.analysis && analysis.analysis.changePercentage != null && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5 flex items-center justify-between">
            <div className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getSeverityStyle(analysis.analysis.severity)}`}>
              <span className="mr-1.5 opacity-75">●</span>
              {analysis.analysis.severity || "N/A"}
            </div>
            <div className="gg-card-title">
              Change: <span className="font-mono ml-1">{analysis.analysis.changePercentage}%</span>
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center">
            <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {analysis.status?.toUpperCase() || "UNKNOWN"}
            </div>
          </div>

          <button
            onClick={onView}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors duration-200 group/btn"
          >
            View Details
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;