import { generateTimelapseFrames, generateDateRange, saveTimelapseFrames } from "../services/timelapseService.js";
import { getImage, getTimelapseFrames as findTimelapseFrames, isId } from "../config/storage.js";
import { searchSentinelScenes } from "../services/geoguardianService.js";
import { isSentinelConfigured } from "../services/sentinelService.js";
import { isDbConnected } from "../config/db.js";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseBbox = (bbox) => {
  const values = (typeof bbox === "string" ? bbox.split(",") : bbox).map(Number);
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) throw new Error("BBox must be an array of 4 numbers");
  const [west, south, east, north] = values;
  if (west >= east || south >= north || west < -180 || east > 180 || south < -90 || north > 90) throw new Error("BBox coordinates are invalid");
  return values;
};

const addDays = (date, days) => new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86400000).toISOString().slice(0, 10);

export const createTimelapse = async (req, res) => {
  try {
    const { startDate, endDate, bbox, intervalDays = 15, cloudThreshold = 20, width = 512, height = 512 } = req.body;
    if (!startDate || !endDate || !bbox) return res.status(400).json({ success: false, error: "Missing required fields: startDate, endDate, bbox" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return res.status(400).json({ success: false, error: "Dates must use YYYY-MM-DD" });
    const bboxArray = parseBbox(bbox);
    const maxCloud = Number(cloudThreshold);
    if (!Number.isFinite(maxCloud) || maxCloud < 0 || maxCloud > 100) return res.status(400).json({ success: false, error: "cloudThreshold must be between 0 and 100" });
    const isDemo = process.env.DEMO_MODE === "true";
    if (!isSentinelConfigured() && isDemo) {
      const demoFrames = [
        { frameId: "demo-frame-1", frameNumber: 1, date: startDate, url: "/satellite_hero.jpg" },
        { frameId: "demo-frame-2", frameNumber: 2, date: endDate, url: "/compare_hero.jpg" }
      ];
      return res.json({
        success: true,
        isDemo: true,
        message: "Demo Mode: Live Sentinel Hub credentials not configured. Showing sample demonstration time-lapse frames.",
        timelapseId: "demo-timelapse",
        frames: demoFrames,
        metadata: {
          startDate,
          endDate,
          frameCount: 2,
          requestedFrameCount: 2,
          dates: [startDate, endDate],
          dimensions: `${width}x${height}`,
          totalFrames: 2,
          delay: 800,
          satelliteSource: "Sentinel-2 L2A (Sample Demonstration Frames)",
          cloudThreshold: maxCloud,
          isDemo: true
        }
      });
    }
    const targetDates = generateDateRange(startDate, endDate, Number(intervalDays), 20);

    const sceneRequests = [];
    const skipped = [];
    for (const targetDate of targetDates) {
      const scenes = await searchSentinelScenes(bboxArray, addDays(targetDate, -7), addDays(targetDate, 7), maxCloud);
      const selected = scenes.filter((scene) => scene.usable && scene.date >= startDate && scene.date <= endDate).sort((a, b) => a.cloudCover - b.cloudCover)[0];
      if (selected) sceneRequests.push(selected);
      else skipped.push({ date: targetDate, reason: `No suitable satellite scene found within 7 days at or below ${maxCloud}% cloud coverage.` });
    }
    const uniqueScenes = [...new Map(sceneRequests.map((scene) => [scene.id, scene])).values()];
    if (uniqueScenes.length < 2) return res.status(422).json({ success: false, error: "No suitable satellite scenes found for the selected period.", details: skipped });

    const data = await generateTimelapseFrames(uniqueScenes, bboxArray, Number(width), Number(height));
    const saved = await saveTimelapseFrames(data.frames, { startDate, endDate, bbox: bboxArray });
    res.json({ success: true, message: "Time-lapse generated successfully", timelapseId: saved.parentId, frames: saved.frames, metadata: { startDate, endDate, frameCount: data.frameCount, requestedFrameCount: targetDates.length, dates: data.dates, dimensions: `${width}x${height}`, totalFrames: saved.frames.length, delay: 800, satelliteSource: "Sentinel-2 L2A", cloudThreshold: maxCloud, skipped: [...skipped, ...data.skipped] } });
  } catch (error) {
    const status = /No suitable satellite scenes|Sentinel Hub|Copernicus/.test(error.message) ? 502 : 500;
    res.status(status).json({ success: false, error: "Time-lapse generation failed", details: error.message });
  }
};

export const getTimelapseFrames = async (req, res) => { try { const frames = await findTimelapseFrames(req.params.parentId); if (!frames.length) return res.status(404).json({ error: "Time-lapse frames not found" }); const metadata = typeof frames[0].metadata === "string" ? JSON.parse(frames[0].metadata) : frames[0].metadata; res.json({ success: true, parentId: req.params.parentId, frameCount: frames.length, frames: frames.map(f => ({ frameId: String(f.id), frameNumber: f.frame_number, date: f.frame_date, url: `/api/timelapse/frame/${f.id}` })), metadata: { startDate: metadata.startDate, endDate: metadata.endDate, bbox: metadata.bbox } }); } catch (error) { res.status(500).json({ error: error.message }); } };
export const getFrame = async (req, res) => {
  try {
    if (!isDbConnected() || String(req.params.frameId).startsWith("demo")) {
      const fallbackPath = path.join(__dirname, "../../frontend/public/satellite_hero.jpg");
      if (fs.existsSync(fallbackPath)) {
        res.set({ "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400", "Access-Control-Allow-Origin": "*" });
        return res.sendFile(fallbackPath);
      }
      return res.status(404).json({ error: "Frame not found in demo mode" });
    }
    if (!isId(req.params.frameId)) return res.status(400).json({ error: "Invalid frame ID" });
    const file = await getImage(req.params.frameId); if (!file) return res.status(404).json({ error: "Frame not found" }); res.set({ "Content-Type": file.content_type, "Content-Length": file.image_data.length, "Cache-Control": "public, max-age=86400", "Access-Control-Allow-Origin": "*" }); res.send(file.image_data); } catch (error) { res.status(500).json({ error: error.message }); } };
