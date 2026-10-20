import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { fetchSatelliteImage, isSentinelConfigured } from "../services/sentinelService.js";
import { getImage, isId, saveImage } from "../config/storage.js";
import { isDbConnected } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getSatelliteImage = async (req, res) => {
  try {
    const { date, bbox } = req.body;
    if (!date || !bbox) return res.status(400).json({ error: "Missing required fields: date, bbox" });
    const bboxArray = typeof bbox === "string" ? bbox.split(",").map(Number) : bbox;
    if (!Array.isArray(bboxArray) || bboxArray.length !== 4 || bboxArray.some(Number.isNaN)) {
      return res.status(400).json({ error: "BBox must be an array of 4 numbers: [minLon, minLat, maxLon, maxLat]" });
    }

    const isDemo = process.env.DEMO_MODE === "true";
    if (!isSentinelConfigured() || !isDbConnected()) {
      if (isDemo) {
        return res.json({
          success: true,
          isDemo: true,
          isSample: true,
          message: "Demo Mode: Live Sentinel Hub credentials not configured. Displaying calibrated sample demonstration imagery.",
          fileId: "sample_hero",
          filename: "satellite_hero.jpg",
          imageUrl: "/satellite_hero.jpg",
          metadata: {
            fileId: "sample_hero",
            date,
            layer: "Sentinel-2-L2A (Sample Demo)",
            bbox: bboxArray,
            uploadDate: new Date().toISOString(),
            size: "145.20 KB",
            source: "Copernicus Sentinel-2 (Demonstration Sample)",
            isDemo: true
          }
        });
      }
      return res.status(503).json({
        error: "Sentinel Hub credentials not configured and database is unavailable."
      });
    }

    const imageBuffer = await fetchSatelliteImage(date, bboxArray);
    if (!imageBuffer?.length) return res.status(404).json({ error: "No image data received from Sentinel Hub" });
    const filename = `sentinel_${date}_${Date.now()}.jpg`;
    const fileId = await saveImage({ filename, data: imageBuffer, metadata: { date, bbox: bboxArray, source: "Sentinel-2" } });
    res.json({
      success: true,
      message: "Image saved successfully",
      fileId,
      filename,
      imageUrl: `/api/nasa/image/${fileId}`,
      metadata: {
        fileId,
        date,
        layer: "Sentinel-2-L2A",
        bbox: bboxArray,
        uploadDate: new Date().toISOString(),
        size: `${(imageBuffer.length / 1024).toFixed(2)} KB`,
        source: "Sentinel Hub"
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === "development" ? err.stack : undefined });
  }
};

export const getImageById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!isDbConnected() || id === "sample_hero" || id.startsWith("demo")) {
      const fallbackPath = path.join(__dirname, "../../frontend/public/satellite_hero.jpg");
      if (fs.existsSync(fallbackPath)) {
        res.set({ "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" });
        return res.sendFile(fallbackPath);
      }
      return res.status(404).json({ error: "Image file not found" });
    }

    if (!isId(id)) return res.status(400).json({ error: "Invalid image ID format" });
    const file = await getImage(id);
    if (!file) return res.status(404).json({ error: "Image not found in database" });
    res.set({
      "Content-Type": file.content_type,
      "Content-Length": file.image_data.length,
      "Cache-Control": "public, max-age=3600"
    });
    res.send(file.image_data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
