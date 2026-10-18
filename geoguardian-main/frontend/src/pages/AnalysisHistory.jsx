// frontend/src/pages/AnalysisHistory.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import AnalysisCard from "../components/AnalysisCard";
import AnalysisDetail from "../components/AnalysisDetail";
import { History, AlertCircle, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import FeatureHero from "../components/FeatureHero";
import config from "../config";

const AnalysisHistory = () => {
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const token = localStorage.getItem("token");

  // Fetch all analyses
  useEffect(() => {
    fetchAnalyses();
  }, [page]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${config.API_URL}/api/analysis?page=${page}&limit=6`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Analyses fetched:", response.data);
      setAnalyses(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error("❌ Error fetching analyses:", err);
      setError(err.response?.data?.error || err.response?.data?.details || err.message || "Failed to load analysis history");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnalysis = async (id) => {
    if (!window.confirm("Delete this analysis? This cannot be undone.")) return;

    try {
      await axios.delete(`${config.API_URL}/api/analysis/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Analysis deleted");
      setSelectedAnalysis(null);
      fetchAnalyses();
    } catch (err) {
      console.error("❌ Error deleting analysis:", err);
      setError("Failed to delete analysis");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <FeatureHero
        icon={History}
        title="Analysis History"
        description="Browse all your saved satellite imagery analyses and detected change events. Review NDVI comparisons and environmental assessments over time."
        imageUrl="/history_hero.jpg"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {selectedAnalysis ? (
          // Show detailed view
          <AnalysisDetail
            analysis={selectedAnalysis}
            onBack={() => setSelectedAnalysis(null)}
            onDelete={() => handleDeleteAnalysis(selectedAnalysis._id)}
          />
        ) : (
          // Show list view
          <div>
            {loading ? (
              <div className="bg-white rounded-xl shadow-lg p-16 text-center border border-slate-200">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
                <p className="text-slate-600 text-lg font-medium">Loading analyses...</p>
              </div>
            ) : !error && analyses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-16 text-center border border-slate-200">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-full mb-6 border border-emerald-100">
                  <FileText className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="gg-page-title mb-3">No analyses yet</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Go to Dashboard and fetch a satellite image to get started!
                </p>
              </div>
            ) : (
              <div>
                {/* Analysis Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {analyses.map((analysis) => (
                    <AnalysisCard
                      key={analysis._id}
                      analysis={analysis}
                      onView={() => setSelectedAnalysis(analysis)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10 mb-4">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <span className="text-slate-500 font-medium px-4 text-sm bg-slate-100 py-2.5 rounded-lg border border-slate-200">
                      Page <span className="font-bold text-slate-700">{page}</span> of <span className="font-bold text-slate-700">{totalPages}</span>
                    </span>

                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisHistory;
