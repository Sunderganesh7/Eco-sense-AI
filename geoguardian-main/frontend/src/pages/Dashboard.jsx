import React, { useState } from "react";
import axios from "axios";
import MapSelector from "../components/MapSelector";
import CoordinatesConverter from "../components/CoordinatesConverter";
import { Satellite, Calendar, Map, Calculator, Download, Info, AlertCircle, CheckCircle, Cloud, RefreshCw, MapPin, Globe, Leaf, Settings, ArrowRight } from "lucide-react";
import FeatureHero from "../components/FeatureHero";
import config from "../config";

const Dashboard = () => {
  const [date, setDate] = useState("2024-07-25");
  const [bbox, setBbox] = useState("-121.8,39.8,-121.3,40.2");
  const [imageUrl, setImageUrl] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(null);
  const [imageRetry, setImageRetry] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const token = localStorage.getItem("token");

  const fetchImage = async () => {
    try {
      setLoading(true);
      setError(null);
      setImageUrl(null);
      setImageLoadError(null);

      const bboxArray = bbox.split(",").map((val) => parseFloat(val.trim()));

      console.log("📤 Sending request to backend:", {
        date,
        bbox: bboxArray,
      });

      const response = await axios.post(
        `${config.API_URL}/api/nasa/image`,
        {
          date,
          bbox: bboxArray,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Response from backend:", response.data);

      if (response.data.imageUrl) {
        setImageUrl(response.data.imageUrl?.startsWith("/") ? `${config.API_URL}${response.data.imageUrl}` : response.data.imageUrl);
        setMetadata(response.data.metadata);
        setImageLoading(true);
        console.log("✅ Image URL set to:", response.data.imageUrl);
      } else {
        throw new Error("No imageUrl in response");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch image";
      console.error("❌ Error fetching image:", errorMessage);
      setError(errorMessage);
      alert(`Failed to fetch image: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const describeImageLoadFailure = async () => {
    try {
      await axios.get(imageUrl, { responseType: "blob", timeout: 10000 });
      return "The image response could not be rendered by the browser.";
    } catch (requestError) {
      const body = requestError.response?.data;
      const details = body instanceof Blob ? await body.text() : body;
      try {
        const parsed = typeof details === "string" ? JSON.parse(details) : details;
        return parsed?.error || parsed?.details || `Image endpoint returned HTTP ${requestError.response?.status}.`;
      } catch {
        return `Image endpoint returned HTTP ${requestError.response?.status || "an unavailable response"}.`;
      }
    }
  };

  const retryImage = () => {
    setImageLoadError(null);
    setError(null);
    setImageLoading(true);
    setImageRetry((value) => value + 1);
  };

  const saveAnalysis = async () => {
    try {
      if (!metadata || !imageUrl) {
        alert("Image data missing");
        return;
      }

      setSaving(true);
      console.log("💾 Saving analysis...");

      const response = await axios.post(
        `${config.API_URL}/api/analysis`,
        {
          title: `Analysis - ${date}`,
          description: `Sentinel-2 satellite imagery analysis`,
          location: "User Location",
          bbox: metadata.bbox,
          nasaLayer: "Sentinel-2-L2A",
          date: metadata.date,
          imageFileId: imageUrl.split('/').pop(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Analysis saved:", response.data);
      alert("✅ Analysis saved to history!");

      setImageUrl(null);
      setMetadata(null);
    } catch (error) {
      console.error("❌ Error saving analysis:", error);
      alert("Failed to save analysis");
    } finally {
      setSaving(false);
    }
  };

  const handleMapBBoxSelect = (mapBbox) => {
    const bboxString = `${mapBbox.west},${mapBbox.south},${mapBbox.east},${mapBbox.north}`;
    setBbox(bboxString);
    setShowMap(false);
  };

  const handleConverterBBoxSelect = (converterBbox) => {
    setBbox(converterBbox);
    setShowConverter(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <FeatureHero
        icon={Globe}
        title="Dashboard"
        description="Fetch high-resolution Sentinel-2 satellite imagery (10m resolution) for any region on Earth. Cloud-masked, professionally calibrated data."
        imageUrl="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Input Form Section */}
        <div className="bg-white rounded-[24px] shadow-[0_12px_40px_rgb(0,0,0,0.12)] p-10 mb-12 border border-slate-100">
          <div className="flex items-center gap-5 mb-10">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <Settings className="w-8 h-8 text-emerald-700" />
            </div>
            <div>
              <h2 className="gg-page-title">Configure Your Query</h2>
              <p className="text-[15px] text-slate-500 font-medium mt-1">Set date, select satellite source and define the region to fetch high-resolution imagery.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-8">
            {/* Date Input */}
            <div>
              <label className="flex items-center gap-2 text-[15px] font-bold text-slate-600 mb-3">
                <Calendar className="w-5 h-5 text-emerald-700" />
                Date (YYYY-MM-DD)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="2024-07-25"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium text-slate-700 text-base"
                />
                <Calendar className="w-6 h-6 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[12px] text-slate-500 mt-3 font-medium">Sentinel-2 data available from 2015 onwards, updated every 5 days</p>
            </div>

            {/* Satellite Source */}
            <div>
              <label className="flex items-center gap-2 text-[15px] font-bold text-slate-600 mb-3">
                <Satellite className="w-5 h-5 text-emerald-700" />
                Satellite Source
              </label>
              <div className="relative">
                <select className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium text-slate-700 text-base appearance-none bg-white">
                  <option>Sentinel-2 L2A (High Resolution, Cloud-Masked)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <div className="flex items-center gap-5 text-[12px] text-emerald-700 mt-3 font-bold">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> 10m resolution</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Automatic cloud masking</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Professional-grade data</span>
              </div>
            </div>
          </div>

          {/* Bounding Box */}
          <div className="mb-10">
            <label className="flex items-center gap-2 text-[15px] font-bold text-slate-600 mb-3">
              <MapPin className="w-5 h-5 text-emerald-700" />
              Bounding Box (Region)
            </label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="-121.8,39.8,-121.3,40.2"
                  value={bbox}
                  onChange={(e) => setBbox(e.target.value)}
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium text-slate-700 text-base pr-12"
                />
                <MapPin className="w-6 h-6 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                onClick={() => {
                  setShowMap(!showMap);
                  setShowConverter(false);
                }}
                className="px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 bg-[#059669] hover:bg-[#047857] text-white text-base shadow-lg shadow-emerald-500/20"
              >
                <Map className="w-5 h-5" />
                {showMap ? "Close" : "Map"}
              </button>
              <button
                onClick={() => {
                  setShowConverter(!showConverter);
                  setShowMap(false);
                }}
                className="px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-base shadow-lg shadow-blue-500/20"
              >
                <Calculator className="w-5 h-5" />
                {showConverter ? "Close" : "Convert"}
              </button>
            </div>
            <p className="text-[12px] text-slate-500 mt-3 font-medium">Format: west,south,east,north (e.g., -121.8,39.8,-121.3,40.2 for California wildfire)</p>
          </div>

          {/* Fetch Button */}
          <button
            onClick={fetchImage}
            disabled={loading}
            className="w-full bg-[#059669] hover:bg-[#047857] text-white py-5 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20"
          >
            <Download className="w-6 h-6" />
            {loading ? "Fetching from Sentinel..." : "Fetch Satellite Image"}
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Map Selector */}
        {showMap && (
          <div className="mb-8">
            <MapSelector
              onBBoxSelect={handleMapBBoxSelect}
              initialBBox={
                bbox
                  ? {
                    west: parseFloat(bbox.split(",")[0]),
                    south: parseFloat(bbox.split(",")[1]),
                    east: parseFloat(bbox.split(",")[2]),
                    north: parseFloat(bbox.split(",")[3]),
                  }
                  : null
              }
            />
          </div>
        )}

        {/* Coordinates Converter */}
        {showConverter && (
          <div className="mb-8">
            <CoordinatesConverter
              onBBoxSelect={handleConverterBBoxSelect}
              initialBBox={bbox}
            />
          </div>
        )}

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

        {/* Metadata Box */}
        {metadata && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="gg-section-title mb-4 flex items-center gap-2">
              <Info className="w-6 h-6 text-blue-600" />
              Image Information
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-1">File ID</p>
                <p className="text-sm text-slate-800 font-mono">{metadata.fileId}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-1">Date</p>
                <p className="text-sm text-slate-800">{metadata.date}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-1">Source</p>
                <p className="text-sm text-slate-800">{metadata.source || "Sentinel-2"}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-1">Size</p>
                <p className="text-sm text-slate-800">{metadata.size}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-1">Uploaded</p>
                <p className="text-sm text-slate-800">{new Date(metadata.uploadDate).toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-1">Coordinates</p>
                <p className="text-sm text-slate-800 font-mono">{metadata.bbox?.join(", ")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Image Result */}
        {imageUrl && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-slate-200">
            <h3 className="gg-page-title mb-6 flex items-center gap-2">
              <Satellite className="w-6 h-6 text-emerald-600" />
              Satellite Image Result
            </h3>
            <div className="rounded-lg overflow-hidden shadow-xl border border-slate-200 mb-4">
              {imageLoading && !imageLoadError && <div className="p-10 text-center text-slate-600">Loading satellite image…</div>}
              {!imageLoadError && <img
                key={imageRetry}
                src={imageUrl}
                alt="Satellite"
                className="w-full h-auto"
                onLoad={() => { setImageLoading(false); setImageLoadError(null); }}
                onError={async () => {
                  const message = await describeImageLoadFailure();
                  setImageLoading(false);
                  setImageLoadError(message);
                  setError(message);
                }}
              />}
              {imageLoadError && <div className="p-8 text-center text-red-700"><p className="font-semibold">Satellite image could not be loaded</p><p className="text-sm mt-1">{imageLoadError}</p><button onClick={retryImage} className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white">Retry image load</button></div>}
            </div>
            <div className="bg-slate-50 p-4 rounded-lg mb-4">
              <p className="text-xs font-semibold text-slate-600 mb-1">Image URL</p>
              <p className="text-sm text-slate-800 font-mono break-all">{imageUrl}</p>
            </div>
            <button
              onClick={saveAnalysis}
              disabled={saving}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <CheckCircle className="w-6 h-6" />
              {saving ? "💾 Saving..." : "💾 Save to Analysis History"}
            </button>
          </div>
        )}

        {/* Placeholder - Get Started */}
        {!imageUrl && !loading && !error && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-[32px] p-16 text-center border border-emerald-100 relative overflow-hidden mt-8 shadow-sm">
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
            <div className="relative z-10 max-w-5xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6 shadow-sm border border-emerald-200">
                <Satellite className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-800 mb-4">Get Started</h3>
              <p className="text-slate-600 mb-12 max-w-2xl mx-auto font-medium text-lg">Select a date and region, then click "Fetch Satellite Image" to view high-resolution satellite imagery</p>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 text-lg">High Resolution</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">10m per pixel clarity</p>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                    <Cloud className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 text-lg">Cloud Masked</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Maximum 30% cloud coverage</p>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all">
                  <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center shrink-0">
                    <RefreshCw className="w-8 h-8 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 text-lg">Updated Regularly</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Fresh data every 5 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
