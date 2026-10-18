// frontend/src/pages/CompareImages.jsx
import React, { useState } from "react";
import { useAnalysis } from "../context/AnalysisContext";
import { Link } from "react-router-dom";
import { Search, Calendar, Map, Globe, Download, Satellite, AlertCircle, TrendingUp, BarChart3, BarChart2, RefreshCw, Save, Image } from "lucide-react";
import FeatureHero from "../components/FeatureHero";
import axios from "axios";
import { resultMatchesConfig } from "../utils/analysisDataset";
import config from "../config";

const API = config.API_URL;

const CompareImages = () => {
  const {
    analysisConfig,
    analysisResult,
    runAnalysis,
    analyzing,
    analysisStep,
    analysisError
  } = useAnalysis();

  const [saving, setSaving] = useState(false);
  const [beforeSatErr, setBeforeSatErr] = useState(false);
  const [afterSatErr, setAfterSatErr] = useState(false);

  const token = localStorage.getItem("token");

  const isDataConsistent = resultMatchesConfig(analysisConfig, analysisResult);

  // Save analysis to database history
  const saveAnalysis = async () => {
    if (!analysisResult) return;
    try {
      setSaving(true);
      console.log("💾 Saving comparison analysis...");
      const a = analysisResult.analysis;

      await axios.post(
        `${API}/api/analysis`,
        {
          title: `Change Detection: ${a.beforeDate} vs ${a.afterDate}`,
          description: a.status,
          location: analysisConfig.locationName || analysisResult?.locationName || "Comparison Area",
          bbox: analysisConfig.bbox.split(",").map(Number),
          nasaLayer: "Sentinel-2-L2A",
          date: a.afterDate,
          imageFileId: analysisResult.changeImageId,
          analysis: {
            changePercentage: a.affectedPercentage,
            changeType: a.status.includes("decline") ? "decline" : "stable",
            severity: a.affectedPercentage > 15 ? "high" : a.affectedPercentage > 5 ? "medium" : "low",
            summary: a.status,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Analysis saved to history!");
    } catch (err) {
      console.error("❌ Error saving analysis:", err);
      alert("Failed to save analysis to history: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getSeverityColor = (percentage) => {
    if (percentage > 15) return "text-red-600 bg-red-50 border-red-200";
    if (percentage > 5) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <FeatureHero
        icon={Satellite}
        title="Compare Satellite Images"
        description="Review Sentinel-2 observations from two dates side-by-side. Detect vegetation decline, land cover change, and environmental impact."
        imageUrl="/compare_hero.jpg"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Placeholder if no bounding box */}
        {!analysisConfig.bbox && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <Globe className="w-16 h-16 mx-auto text-slate-300 mb-4 animate-pulse" />
            <h2 className="gg-section-title">Please select an analysis area.</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
              You must configure a bounding box and timeframe on the main GeoGuardian dashboard to view satellite comparisons.
            </p>
            <Link
              to="/geoguardian"
              className="mt-6 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition shadow-sm"
            >
              Configure Active Area
            </Link>
          </div>
        )}

        {analysisConfig.bbox && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="gg-label">Analysis Parameters</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-slate-700">
                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Location</span>
                  <span className="font-semibold text-slate-800 truncate block" title={analysisConfig.locationName || analysisResult?.locationName}>
                    {analysisConfig.locationName || analysisResult?.locationName || "Location name unavailable"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Bounding Box</span>
                  <span className="font-mono font-medium">{analysisConfig.bbox}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Observation Dates</span>
                  <span className="font-medium">
                    {analysisConfig.beforeDate || "—"} to {analysisConfig.afterDate || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-2xs uppercase">Cloud threshold</span>
                  <span className="font-medium">{analysisConfig.cloudThreshold}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-2xs uppercase">NDVI Change Threshold</span>
                  <span className="font-medium">−{analysisConfig.changeThreshold}</span>
                </div>
              </div>
            </div>

            {/* Run button if result not loaded yet */}
            {!analysisResult && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800">No active comparison result loaded</h3>
                <p className="text-slate-500 text-sm mt-1 mb-5">Run the comparison pipeline using the active dates.</p>
                <button
                  onClick={() => runAnalysis()}
                  disabled={analyzing || !analysisConfig.beforeDate || !analysisConfig.afterDate}
                  className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition flex items-center gap-2 mx-auto"
                >
                  {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {analyzing ? "Processing satellite bands..." : "Compare & Detect Changes"}
                </button>
                {analyzing && (
                  <p className="text-xs text-slate-400 mt-2">
                    Step {analysisStep + 1} of 17 in progress...
                  </p>
                )}
                {analysisError && (
                  <p className="text-sm text-red-600 mt-3">❌ {analysisError}</p>
                )}
              </div>
            )}

            {analysisResult && !isDataConsistent && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center text-red-800 flex flex-col items-center gap-2">
                <AlertCircle className="w-10 h-10 text-red-600" />
                <p className="font-bold text-sm">Analysis data is inconsistent. Please rerun the analysis.</p>
                <p className="text-xs text-red-500">Active configuration does not match the parameters of the loaded comparison result.</p>
              </div>
            )}

            {/* Side-by-side comparison panels */}
            {analysisResult && isDataConsistent && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Before Panel */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h3 className="gg-section-title mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-700" />
                      Before ({analysisResult.analysis.beforeDate})
                    </h3>
                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative flex items-center justify-center">
                      {analysisResult.beforeSatImageUrl && !beforeSatErr ? (
                        <img
                          src={analysisResult.beforeSatImageUrl}
                          alt="Before scene"
                          className="w-full h-full object-cover"
                          onError={() => setBeforeSatErr(true)}
                        />
                      ) : (
                        <div className="text-center text-slate-400 p-4">
                          <AlertCircle className="w-10 h-10 mx-auto text-amber-500 mb-2" />
                          <p className="gg-card-title">Imagery unavailable</p>
                          <p className="text-xs text-slate-400 mt-1">Satellite true color acquisition failed.</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block text-2xs uppercase text-slate-400">Mean NDVI</span>
                        <span className="font-semibold text-slate-700 font-mono">{analysisResult.analysis.beforeMeanNdvi.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="block text-2xs uppercase text-slate-400">Cloud free pixels</span>
                        <span className="font-semibold text-slate-700">{analysisResult.analysis.beforeValidPixels}%</span>
                      </div>
                    </div>
                  </div>

                  {/* After Panel */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h3 className="gg-section-title mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-700" />
                      After ({analysisResult.analysis.afterDate})
                    </h3>
                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative flex items-center justify-center">
                      {analysisResult.afterSatImageUrl && !afterSatErr ? (
                        <img
                          src={analysisResult.afterSatImageUrl}
                          alt="After scene"
                          className="w-full h-full object-cover"
                          onError={() => setAfterSatErr(true)}
                        />
                      ) : (
                        <div className="text-center text-slate-400 p-4">
                          <AlertCircle className="w-10 h-10 mx-auto text-amber-500 mb-2" />
                          <p className="gg-card-title">Imagery unavailable</p>
                          <p className="text-xs text-slate-400 mt-1">Satellite true color acquisition failed.</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <span className="block text-2xs uppercase text-slate-400">Mean NDVI</span>
                        <span className="font-semibold text-slate-700 font-mono">{analysisResult.analysis.afterMeanNdvi.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="block text-2xs uppercase text-slate-400">Cloud free pixels</span>
                        <span className="font-semibold text-slate-700">{analysisResult.analysis.afterValidPixels}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Map & Stats */}
                <div className="gg-card space-y-6">
                  <h3 className="gg-section-title flex items-center gap-2 border-b border-slate-100 pb-4">
                    <Image className="w-6 h-6 text-emerald-700" />
                    Vegetation Change Classification map
                  </h3>

                  <div className="grid lg:grid-cols-3 gap-8">
                    {/* Change Map display */}
                    <div className="lg:col-span-2">
                      <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative shadow-inner">
                        {analysisResult.changeImageUrl && (
                          <img src={analysisResult.changeImageUrl} alt="Change Map" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-1 rounded text-2xs text-slate-500 border border-slate-200">
                          {analysisResult.analysis.beforeDate} to {analysisResult.analysis.afterDate}
                        </div>
                      </div>
                    </div>

                    {/* Stats details */}
                    <div className="space-y-4">
                      {/* KPI Value Card */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                        <span className="gg-primary-kpi text-amber-600 mb-2">
                          {analysisResult.analysis.affectedPercentage}%
                        </span>
                        <span className="gg-label text-amber-700 tracking-[0.05em]">
                          SIGNIFICANT LOCAL DECLINE
                        </span>
                      </div>

                      {/* Scientific Metrics Panel */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3.5">
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                          <span className="text-[13px] text-slate-500 font-medium">Monitored Area</span>
                          <span className="text-[14px] font-semibold text-slate-800">
                            {analysisResult.analysis.totalMonitoredAreaKm2.toFixed(4)} <span className="text-slate-400 font-normal">km²</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                          <span className="text-[13px] text-slate-500 font-medium">Decline Area</span>
                          <span className="text-[14px] font-semibold text-slate-800">
                            {analysisResult.analysis.changedAreaKm2.toFixed(4)} <span className="text-slate-400 font-normal">km²</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                          <span className="text-[13px] text-slate-500 font-medium">NDVI Change</span>
                          <span className={`text-[14px] font-semibold ${analysisResult.analysis.ndviChange < 0 ? "text-red-600" : "text-emerald-700"}`}>
                            {analysisResult.analysis.ndviChange >= 0 ? "+" : ""}{analysisResult.analysis.ndviChange.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] text-slate-500 font-medium">Relative Change</span>
                          <span className={`text-[14px] font-semibold ${analysisResult.analysis.relativeChange < 0 ? "text-red-600" : "text-emerald-700"}`}>
                            {analysisResult.analysis.relativeChange >= 0 ? "+" : ""}{analysisResult.analysis.relativeChange}%
                          </span>
                        </div>
                      </div>

                      {/* Scientific Explanation */}
                      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex gap-3 mt-2">
                        <span className="text-[14px] text-slate-400 mt-0.5">ⓘ</span>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-700 mb-1">Scientific Definition</span>
                          <p className="text-[13px] leading-[1.6] text-slate-500">
                            Significant local decline is defined as pixels with NDVI decrease greater than −{analysisResult.analysis.threshold} change threshold.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 flex gap-3 mt-4">
                    <span className="text-[14px] text-blue-500 mt-0.5">ⓘ</span>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-blue-900 mb-1">Scientific Interpretation</span>
                      <p className="text-[13px] leading-[1.6] text-blue-800/80">
                        {analysisResult.analysis.status}
                      </p>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={saveAnalysis}
                      disabled={saving}
                      className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-lg text-sm transition shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Saving..." : "Save to History"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompareImages;
