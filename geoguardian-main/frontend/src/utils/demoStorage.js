/**
 * GeoGuardian Demo Storage Manager
 * Uses browser localStorage for complete client-side CRUD persistence
 * when running in demo mode or without a MySQL database.
 */

export const DEMO_ANALYSES_KEY = "geoguardian_demo_analyses";
export const DEMO_REGIONS_KEY = "geoguardian_demo_regions";
export const DEMO_MODE_KEY = "geoguardian_mode";

/**
 * Realistic initial demonstration analyses matching GeoGuardian schema
 */
export const INITIAL_DEMO_ANALYSES = [
  {
    _id: "demo-analysis-1",
    id: 1,
    title: "Wildfire Burn Scar Recovery - Butte County",
    description: "Post-fire canopy regeneration and vegetation recovery assessment in the Sierra Nevada foothills.",
    location: "Chico, CA, USA",
    nasaLayer: "Sentinel-2 L2A",
    date: "2024-08-15T00:00:00.000Z",
    createdAt: "2024-08-16T10:30:00.000Z",
    status: "completed",
    bbox: [-121.85, 39.75, -121.35, 40.15],
    imageFileId: "/satellite_hero.jpg",
    imageUrl: "/satellite_hero.jpg",
    isDemo: true,
    analysis: {
      beforeDate: "2024-06-10",
      afterDate: "2024-08-15",
      beforeMeanNdvi: 0.5842,
      afterMeanNdvi: 0.3120,
      ndviChange: -0.2722,
      changePercentage: -46.59,
      relativeChange: -46.59,
      affectedPercentage: 38.4,
      affectedAreaKm2: 124.50,
      severity: "high",
      changeType: "decline",
      status: "Significant local vegetation decline detected affecting 124.50 km² (38.4% of monitored area). (Demo Baseline)",
      summary: "Significant local vegetation decline detected affecting 124.50 km² (38.4% of monitored area)."
    }
  },
  {
    _id: "demo-analysis-2",
    id: 2,
    title: "Jamari National Forest Canopy Disturbance",
    description: "Tropical rainforest canopy degradation and fragmentation analysis in Rondônia basin.",
    location: "Rondônia, Brazil",
    nasaLayer: "Sentinel-2 L2A",
    date: "2024-07-20T00:00:00.000Z",
    createdAt: "2024-07-21T14:15:00.000Z",
    status: "completed",
    bbox: [-63.20, -8.95, -62.80, -8.55],
    imageFileId: "/compare_hero.jpg",
    imageUrl: "/compare_hero.jpg",
    isDemo: true,
    analysis: {
      beforeDate: "2024-05-01",
      afterDate: "2024-07-20",
      beforeMeanNdvi: 0.7410,
      afterMeanNdvi: 0.6385,
      ndviChange: -0.1025,
      changePercentage: -13.83,
      relativeChange: -13.83,
      affectedPercentage: 11.2,
      affectedAreaKm2: 45.80,
      severity: "medium",
      changeType: "decline",
      status: "Moderate local vegetation decline detected affecting 45.80 km² (11.2% of monitored area). (Demo Baseline)",
      summary: "Moderate local vegetation decline detected affecting 45.80 km² (11.2% of monitored area)."
    }
  },
  {
    _id: "demo-analysis-3",
    id: 3,
    title: "Agricultural Crop Season Growth - Central Valley",
    description: "Seasonal NDVI vigor index tracking across irrigated agricultural parcels.",
    location: "Fresno County, CA, USA",
    nasaLayer: "Sentinel-2 L2A",
    date: "2024-06-30T00:00:00.000Z",
    createdAt: "2024-07-01T08:00:00.000Z",
    status: "completed",
    bbox: [-119.90, 36.65, -119.60, 36.85],
    imageFileId: "/satellite_hero.jpg",
    imageUrl: "/satellite_hero.jpg",
    isDemo: true,
    analysis: {
      beforeDate: "2024-04-15",
      afterDate: "2024-06-30",
      beforeMeanNdvi: 0.3210,
      afterMeanNdvi: 0.6845,
      ndviChange: 0.3635,
      changePercentage: 113.24,
      relativeChange: 113.24,
      affectedPercentage: 62.5,
      affectedAreaKm2: 88.20,
      severity: "low",
      changeType: "growth",
      status: "Stable or improved vegetation detected across 88.20 km² (62.5% of monitored area). (Demo Baseline)",
      summary: "Stable or improved vegetation detected across 88.20 km² (62.5% of monitored area)."
    }
  }
];

/**
 * Realistic initial demonstration monitored regions
 */
export const INITIAL_DEMO_REGIONS = [
  {
    _id: "demo-reg-1",
    id: 1,
    name: "Chico Forest Reserve",
    description: "Continuous forest canopy and burn scar regeneration tracking",
    location: "Chico, CA, USA",
    bbox: [-121.85, 39.75, -121.35, 40.15],
    monitoring: {
      enabled: true,
      frequency: "weekly",
      alertOnSeverity: ["high", "medium"]
    },
    lastChecked: "2024-08-16T10:00:00.000Z",
    lastChangePercentage: -4.2,
    totalAlertsSent: 1,
    createdAt: "2024-07-01T00:00:00.000Z",
    isDemo: true
  },
  {
    _id: "demo-reg-2",
    id: 2,
    name: "Amazon Jamari Sector 4",
    description: "Tropical rainforest deforestation early warning zone",
    location: "Rondônia, Brazil",
    bbox: [-63.20, -8.95, -62.80, -8.55],
    monitoring: {
      enabled: true,
      frequency: "daily",
      alertOnSeverity: ["high"]
    },
    lastChecked: "2024-08-18T06:00:00.000Z",
    lastChangePercentage: -8.7,
    totalAlertsSent: 3,
    createdAt: "2024-06-15T00:00:00.000Z",
    isDemo: true
  }
];

/**
 * Seed initial sample demo records ONLY if the key is null in localStorage.
 * Never overwrites existing demo data if the key already exists (e.g. across reloads).
 */
export const ensureDemoInitialized = () => {
  if (typeof window === "undefined" || !window.localStorage) return;

  try {
    if (localStorage.getItem(DEMO_ANALYSES_KEY) === null) {
      localStorage.setItem(DEMO_ANALYSES_KEY, JSON.stringify(INITIAL_DEMO_ANALYSES));
      console.info("[DEMO] Initialized sample demo analyses in localStorage.");
    }
    if (localStorage.getItem(DEMO_REGIONS_KEY) === null) {
      localStorage.setItem(DEMO_REGIONS_KEY, JSON.stringify(INITIAL_DEMO_REGIONS));
      console.info("[DEMO] Initialized sample demo regions in localStorage.");
    }
  } catch (err) {
    console.warn("[DEMO] localStorage access error:", err);
  }
};

/**
 * --- Analysis Operations ---
 */

export const getDemoAnalyses = ({ page = 1, limit = 6 } = {}) => {
  ensureDemoInitialized();
  try {
    const raw = localStorage.getItem(DEMO_ANALYSES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const paginated = list.slice(offset, offset + limit);

    return {
      data: paginated,
      pagination: {
        total,
        pages,
        page,
        limit
      }
    };
  } catch (err) {
    console.error("[DEMO] getDemoAnalyses error:", err);
    return { data: [], pagination: { total: 0, pages: 1, page: 1, limit } };
  }
};

export const getDemoAnalysisById = (id) => {
  ensureDemoInitialized();
  try {
    const raw = localStorage.getItem(DEMO_ANALYSES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.find((item) => String(item._id) === String(id) || String(item.id) === String(id)) || null;
  } catch (err) {
    console.error("[DEMO] getDemoAnalysisById error:", err);
    return null;
  }
};

export const saveDemoAnalysis = (data) => {
  ensureDemoInitialized();
  try {
    const raw = localStorage.getItem(DEMO_ANALYSES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const newId = "demo-" + Date.now();
    const newDoc = {
      _id: newId,
      id: newId,
      title: data.title || "Satellite Analysis",
      description: data.description || "Sentinel-2 satellite imagery analysis",
      location: data.location || "User Location",
      bbox: Array.isArray(data.bbox) ? data.bbox : String(data.bbox || "").split(",").map(Number),
      nasaLayer: data.nasaLayer || "Sentinel-2-L2A",
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      imageFileId: data.imageFileId || "/satellite_hero.jpg",
      imageUrl: data.imageUrl || (data.imageFileId?.startsWith("/") || data.imageFileId?.startsWith("http") ? data.imageFileId : "/satellite_hero.jpg"),
      status: data.status || "completed",
      createdAt: new Date().toISOString(),
      isDemo: true,
      analysis: data.analysis || {
        changePercentage: data.changePercentage || 0,
        severity: data.severity || "low",
        status: data.status || "Demo analysis completed."
      }
    };

    list.unshift(newDoc);
    localStorage.setItem(DEMO_ANALYSES_KEY, JSON.stringify(list));
    return newDoc;
  } catch (err) {
    console.error("[DEMO] saveDemoAnalysis error:", err);
    return null;
  }
};

export const updateDemoAnalysis = (id, updates) => {
  ensureDemoInitialized();
  try {
    const raw = localStorage.getItem(DEMO_ANALYSES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((item) => String(item._id) === String(id) || String(item.id) === String(id));
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(DEMO_ANALYSES_KEY, JSON.stringify(list));
    return list[index];
  } catch (err) {
    console.error("[DEMO] updateDemoAnalysis error:", err);
    return null;
  }
};

export const deleteDemoAnalysis = (id) => {
  ensureDemoInitialized();
  try {
    const raw = localStorage.getItem(DEMO_ANALYSES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((item) => String(item._id) !== String(id) && String(item.id) !== String(id));
    localStorage.setItem(DEMO_ANALYSES_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error("[DEMO] deleteDemoAnalysis error:", err);
    return false;
  }
};

/**
 * --- Monitored Regions Operations ---
 */

export const getDemoRegions = () => {
  ensureDemoInitialized();
  try {
    const raw = localStorage.getItem(DEMO_REGIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("[DEMO] getDemoRegions error:", err);
    return [];
  }
};

export const addDemoRegion = (data) => {
  ensureDemoInitialized();
  try {
    const raw = localStorage.getItem(DEMO_REGIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const id = Date.now();
    const bboxArray = Array.isArray(data.bbox)
      ? data.bbox
      : typeof data.bbox === "string"
        ? data.bbox.split(",").map(Number)
        : [-121.8, 39.8, -121.3, 40.2];

    const newRegion = {
      _id: "demo-reg-" + id,
      id,
      name: data.name || "Monitored Region",
      description: data.description || "",
      location: data.location || "Custom Region",
      bbox: bboxArray,
      monitoring: {
        enabled: true,
        frequency: data.frequency || "weekly",
        alertOnSeverity: Array.isArray(data.alertOnSeverity) ? data.alertOnSeverity : ["high", "medium"]
      },
      lastChecked: null,
      lastChangePercentage: 0,
      totalAlertsSent: 0,
      createdAt: new Date().toISOString(),
      isDemo: true
    };

    list.unshift(newRegion);
    localStorage.setItem(DEMO_REGIONS_KEY, JSON.stringify(list));
    return newRegion;
  } catch (err) {
    console.error("[DEMO] addDemoRegion error:", err);
    return null;
  }
};

export const deleteDemoRegion = (id) => {
  ensureDemoInitialized();
  try {
    const raw = localStorage.getItem(DEMO_REGIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((item) => String(item._id) !== String(id) && String(item.id) !== String(id));
    localStorage.setItem(DEMO_REGIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error("[DEMO] deleteDemoRegion error:", err);
    return false;
  }
};

export const checkDemoRegion = (id) => {
  ensureDemoInitialized();
  try {
    const raw = localStorage.getItem(DEMO_REGIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((item) => String(item._id) === String(id) || String(item.id) === String(id));
    if (index === -1) return null;

    const change = Number((Math.random() * -4.5 - 0.5).toFixed(1));
    const now = new Date().toISOString();
    list[index] = {
      ...list[index],
      lastChecked: now,
      lastChangePercentage: change,
      totalAlertsSent: (list[index].totalAlertsSent || 0) + (Math.abs(change) > 3 ? 1 : 0)
    };

    localStorage.setItem(DEMO_REGIONS_KEY, JSON.stringify(list));
    return {
      message: `Satellite check completed using demonstration baseline. Last change: ${change}%`,
      region: list[index]
    };
  } catch (err) {
    console.error("[DEMO] checkDemoRegion error:", err);
    return null;
  }
};
