import { useState, useEffect, useRef } from 'react'
import { getDiseaseCrops, detectDisease } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import AzureTranslate from '../components/AzureTranslate'

function getGeminiApiKey() {
  return (
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    ''
  ).trim()
}

const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-3.8-flash']

function sanitizeErrorMessage(msg, key) {
  if (!msg) return 'Gemini API request failed'
  let clean = String(msg)
  if (key) {
    clean = clean.split(key).join('[REDACTED]')
  }
  return clean.replace(/key=[a-zA-Z0-9_\-\.]+/gi, 'key=[REDACTED]')
}

const LANGUAGE_NAMES = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada',
  ml: 'Malayalam', bn: 'Bengali', or: 'Odia', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi'
}

const CROP_ICONS = {
  potato: '🥔', corn: '🌽', rice: '🌾', sugarcane: '🌿', other: '🌱',
}

const CROP_MATERIAL_ICONS = {
  potato: 'nutrition', corn: 'grass', rice: 'rice_bowl', sugarcane: 'park', other: 'eco',
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Call Gemini Vision API for "Other" crops
async function analyzeWithGemini(imageFile, language) {
  const apiKey = getGeminiApiKey()

  // If no client-side key is available, call the backend's crop='other' endpoint
  if (!apiKey) {
    try {
      const backendRes = await detectDisease('other', imageFile)
      if (backendRes && (backendRes.success || backendRes.is_valid_leaf === false)) {
        return backendRes
      }
      throw new Error(backendRes?.error || 'Gemini API key not configured')
    } catch (backendErr) {
      if (backendErr.message && backendErr.message.toLowerCase().includes('not configured')) {
        throw new Error('Gemini API key not configured')
      }
      throw backendErr
    }
  }

  const base64Image = await fileToBase64(imageFile)
  const langName = LANGUAGE_NAMES[language] || 'English'

  const prompt = `You are an expert agricultural plant pathologist. Analyze this image of a plant/crop leaf.

FIRST: Determine if this image shows a plant leaf. If it does NOT show a plant leaf (e.g., it shows a person, animal, object, food, landscape, etc.), respond with EXACTLY this JSON and nothing else:
{"is_leaf": false}

If it IS a plant leaf, analyze it for diseases and respond with EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "is_leaf": true,
  "crop": "name of the crop/plant identified",
  "disease": "name of disease detected, or 'Healthy' if no disease",
  "is_healthy": true or false,
  "confidence": 75 to 98 (your confidence percentage as integer),
  "description": "Brief description of the disease or health status in ${langName}",
  "treatment": {
    "spray": "Recommended pesticide/fungicide name in ${langName}",
    "dosage": "Dosage instructions in ${langName}",
    "interval": "Application interval in ${langName}"
  },
  "prevention": "Prevention tips in ${langName}",
  "severity": "mild, moderate, or severe"
}

IMPORTANT: Respond ONLY with the JSON object. No markdown formatting, no code blocks, no explanation text. Just the raw JSON.
All text fields (description, treatment, prevention) must be in ${langName}.`

  let lastError = null

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: imageFile.type || 'image/jpeg', data: base64Image } }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          }
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const rawMsg = errData.error?.message || `Gemini API error: ${res.status}`
        lastError = new Error(sanitizeErrorMessage(rawMsg, apiKey))
        continue
      }

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      // Clean up response — remove markdown code blocks if present
      let cleaned = text.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      }

      try {
        const parsed = JSON.parse(cleaned)
        return parsed
      } catch {
        throw new Error('Failed to parse AI response. Please try again.')
      }
    } catch (err) {
      lastError = new Error(sanitizeErrorMessage(err.message, apiKey))
    }
  }

  // If direct client API failed, attempt backend fallback as safety net
  try {
    const backendRes = await detectDisease('other', imageFile)
    if (backendRes && (backendRes.success || backendRes.is_valid_leaf === false)) {
      return backendRes
    }
  } catch {
    // ignore backend error, surface the sanitized primary error
  }

  throw lastError || new Error('Gemini API request failed')
}

export default function FieldScanner() {
  const { language } = useLanguage()
  const [crops, setCrops] = useState([])
  const [selectedCrop, setSelectedCrop] = useState('potato')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [result, setResult] = useState(null)
  const [geminiResult, setGeminiResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getDiseaseCrops().then(data => {
      const apiCrops = data.crops || []
      setCrops([
        ...apiCrops,
        { key: 'other', name: 'Other Crop', available: true, isGemini: true },
      ])
      if (apiCrops.length > 0) setSelectedCrop(apiCrops[0].key)
    }).catch(() => {
      setCrops([
        { key: 'potato', name: 'Potato', available: true },
        { key: 'corn', name: 'Corn / Maize', available: true },
        { key: 'rice', name: 'Rice', available: true },
        { key: 'sugarcane', name: 'Sugarcane', available: true },
        { key: 'other', name: 'Other Crop', available: true, isGemini: true },
      ])
    })
  }, [])

  const isGeminiMode = selectedCrop === 'other'
  const selectedCropData = crops.find(c => c.key === selectedCrop)

  function handleFileSelect(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file (JPG, PNG, etc.)'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image too large. Max size: 10MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
    setResult(null)
    setGeminiResult(null)
  }

  function handleDrop(e) { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]) }

  function handleReset() {
    setImageFile(null)
    setImagePreview(null)
    setResult(null)
    setGeminiResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDetect() {
    if (!selectedCrop) { setError('Please select a crop'); return }
    if (!imageFile) { setError('Please upload a leaf image'); return }
    setLoading(true)
    setError(null)
    setResult(null)
    setGeminiResult(null)

    try {
      if (isGeminiMode) {
        // Use Gemini Vision API
        const gemData = await analyzeWithGemini(imageFile, language)
        if (gemData.is_leaf === false || gemData.is_valid_leaf === false) {
          // Not a leaf — show invalid image
          setResult({ is_valid_leaf: false, success: true })
        } else {
          setGeminiResult(gemData)
        }
      } else {
        // Use existing TFLite backend
        const data = await detectDisease(selectedCrop, imageFile)
        setResult(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const showInvalid = (result && result.is_valid_leaf === false)
  const showTfliteResult = result && !loading && result.is_valid_leaf !== false && result.success
  const showGeminiResult = geminiResult && !loading

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-[#17251F]">
      {/* ── Feature Hero Banner with Generated Asset ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#042F25] text-white p-6 sm:p-10 md:p-12 shadow-sm border border-[#0A4D3D] min-h-[250px] sm:min-h-[320px] md:min-h-[340px] lg:min-h-[360px] flex flex-col justify-center">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/leaf-inspection.jpg"
            alt="Plant pathology leaf diagnostic examination"
            className="w-full h-full object-cover object-center md:object-[center_30%]"
            style={{ opacity: 1 }}
            loading="eager"
          />
          {/* Subtle left-side gradient overlay behind text only, rest of image fully visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#042F25]/90 via-[#042F25]/60 35% via-[#042F25]/10 55% to-transparent hidden sm:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#042F25]/95 via-[#042F25]/60 55% to-transparent sm:hidden" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#063D2E]/80 border border-[#9DEBC1]/30 text-[10px] font-bold text-[#9DEBC1] uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>document_scanner</span>
              <span><AzureTranslate text="AI Plant Pathology & Diagnosis" /></span>
            </div>
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
              <AzureTranslate text="Crop Disease Diagnostic Scanner" />
            </h1>
            <p className="font-label text-xs sm:text-sm text-[#D4E8DC] mt-2 leading-relaxed max-w-lg">
              <AzureTranslate text="Upload high-resolution leaf photos to detect pathogens, fungal infections, and nutritional deficiencies with verified treatment recommendations." />
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#087F5B] text-white text-xs font-bold shadow-xs">
              <span className="material-symbols-outlined text-sm">psychiatry</span>
              <span><AzureTranslate text="TFLite + Vision Engine" /></span>
            </span>
          </div>
        </div>
      </section>

      {/* Expert Tips Banner */}
      <div className="bg-[#E7F0E8] border border-[#D1E0D4] rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#087F5B] text-lg mt-0.5">lightbulb</span>
        <div>
          <p className="font-headline font-bold text-xs sm:text-sm text-[#17251F]"><AzureTranslate text="Expert Tips for Accurate Diagnosis" /></p>
          <p className="font-label text-xs text-[#526359] mt-0.5">
            <AzureTranslate text="📸 Use natural daytime lighting • 🍃 Focus directly on symptomatic leaf spots • 📐 Keep the leaf flat and centered in frame" />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Input Panel ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E3ECE6] shadow-xs overflow-hidden">
            <div className="p-5 bg-[#FAFBF9] border-b border-[#F0F5F2] flex items-center justify-between">
              <h3 className="font-headline font-bold text-[#17251F] flex items-center gap-2 text-sm sm:text-base">
                <span className="material-symbols-outlined text-[#087F5B]">photo_camera</span>
                <AzureTranslate text="Upload Leaf Sample" />
              </h3>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isGeminiMode ? 'bg-amber-100 text-amber-800' : 'bg-[#E7F0E8] text-[#087F5B]'}`}>
                {isGeminiMode ? 'Gemini AI Vision' : 'TFLite Local Model'}
              </span>
            </div>
            <div className="p-5 space-y-5">
              {/* Crop Selection */}
              <div className="space-y-2">
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                  <AzureTranslate text="Select Crop Type" />
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {crops.map(crop => (
                    <button key={crop.key}
                      onClick={() => { setSelectedCrop(crop.key); setResult(null); setGeminiResult(null) }}
                      disabled={!crop.available}
                      className={`p-3 rounded-2xl text-center transition-all ${
                        selectedCrop === crop.key
                          ? crop.key === 'other'
                            ? 'bg-tertiary-fixed/20 ring-2 ring-tertiary/30 editorial-shadow'
                            : 'bg-primary/5 ring-2 ring-primary/30 editorial-shadow'
                          : 'bg-surface-container-low hover:bg-surface-container'
                      } ${!crop.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`material-symbols-outlined text-xl mb-1 ${
                        selectedCrop === crop.key
                          ? crop.key === 'other' ? 'text-tertiary' : 'text-primary'
                          : 'text-on-surface-variant/50'
                      }`}>
                        {CROP_MATERIAL_ICONS[crop.key] || 'eco'}
                      </span>
                      <div className="font-headline font-bold text-[11px] leading-tight">
                        <AzureTranslate text={crop.name?.split('/')[0]?.trim() || crop.key} />
                      </div>
                      {crop.key === 'other' && (
                        <div className="font-label text-[8px] text-tertiary font-bold mt-0.5">GEMINI</div>
                      )}
                      {!crop.available && (
                        <div className="font-label text-[8px] text-on-surface-variant mt-0.5"><AzureTranslate text="Not loaded" /></div>
                      )}
                    </button>
                  ))}
                </div>
                {isGeminiMode && (
                  <div className="bg-tertiary-fixed/10 rounded-xl p-3 flex items-start gap-2 mt-1">
                    <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">auto_awesome</span>
                    <p className="font-label text-xs text-on-surface-variant/70 leading-relaxed">
                      <AzureTranslate text="Gemini AI can identify diseases for any crop type — not limited to the 4 pre-trained models. Results will be in your selected language." />
                    </p>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50"><AzureTranslate text="Upload Leaf Image" /></label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`upload-zone rounded-3xl cursor-pointer transition-all relative overflow-hidden ${
                    dragOver ? 'dragover' : ''
                  } ${imagePreview ? 'p-3' : 'p-10'}`}
                >
                  {imagePreview ? (
                    <div className="text-center">
                      <img src={imagePreview} alt="Leaf preview" className="max-w-full max-h-60 rounded-2xl object-contain mx-auto" />
                      <div className="font-label text-xs text-on-surface-variant/60 mt-2">{imageFile?.name} ({(imageFile?.size / 1024).toFixed(0)} KB)</div>
                      <button onClick={e => { e.stopPropagation(); handleReset() }}
                        className="mt-2 px-4 py-1.5 rounded-full bg-error/10 text-error text-xs font-bold hover:bg-error/20 transition-colors">
                        <span className="material-symbols-outlined text-sm align-middle mr-1">close</span><AzureTranslate text="Remove" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
                      </div>
                      <p className="font-headline font-bold text-sm text-on-surface"><AzureTranslate text="Drop image here or click to browse" /></p>
                      <p className="font-label text-xs text-on-surface-variant/40 mt-1">JPG, PNG — Max 10MB</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />
                </div>
              </div>

              <button onClick={handleDetect} disabled={loading || !imageFile || !selectedCrop}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary-container transition-all disabled:opacity-60">
                <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : isGeminiMode ? 'auto_awesome' : 'shutter_speed'}</span>
                {loading
                  ? <AzureTranslate text={isGeminiMode ? 'Gemini Analyzing...' : 'Analyzing...'} />
                  : <AzureTranslate text="Detect Disease" />
                }
              </button>
            </div>
          </div>

          {/* Detectable diseases list (only for TFLite models) */}
          {!isGeminiMode && selectedCropData?.diseases?.length > 0 && (
            <div className="bg-white rounded-2xl editorial-shadow overflow-hidden">
              <div className="p-5 bg-surface-container-low">
                <h4 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">info</span> <AzureTranslate text="Detectable Diseases" />
                </h4>
              </div>
              <div className="p-5 space-y-1">
                {selectedCropData.diseases.map((d, i) => (
                  <div key={i} className="py-2.5 flex items-center gap-2.5 font-label text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm" style={{ color: d.includes('Healthy') ? '#006b47' : '#ba1a1a' }}>
                      {d.includes('Healthy') ? 'check_circle' : 'bug_report'}
                    </span>
                    <AzureTranslate text={d} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Results Panel ── */}
        <div className="lg:col-span-7 space-y-4">
          {error && (
            <div className="bg-error-container/30 text-on-error-container p-4 rounded-2xl flex items-center gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-error">error</span> <AzureTranslate text={error} />
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="spinner" />
              <span className="font-label text-sm text-on-surface-variant">
                <AzureTranslate text={isGeminiMode ? 'Gemini AI is analyzing your image...' : 'Analyzing leaf image with AI model...'} />
              </span>
              {isGeminiMode && (
                <p className="text-xs text-on-surface-variant/50 max-w-xs text-center">
                  <AzureTranslate text="Gemini can detect diseases for any crop type and will respond in your language" />
                </p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!result && !geminiResult && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-4xl">shutter_speed</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface mb-2"><AzureTranslate text="Upload a Leaf Image" /></h3>
              <p className="text-sm text-on-surface-variant/60 max-w-sm">
                <AzureTranslate text="Select your crop, upload a photo of the affected leaf, and our AI will detect the disease and suggest treatment." />
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {Object.entries(CROP_ICONS).map(([k, v]) => (
                  <span key={k} className="smart-chip bg-surface-container-low text-on-surface-variant">{v} {k.charAt(0).toUpperCase() + k.slice(1)}</span>
                ))}
              </div>
            </div>
          )}

          {/* Invalid Image (both TFLite & Gemini) */}
          {showInvalid && (
            <div className="bg-tertiary-container/20 text-on-surface p-8 rounded-3xl flex flex-col items-center justify-center text-center animate-fade-in-up editorial-shadow ring-1 ring-tertiary/30">
              <div className="w-20 h-20 rounded-full bg-tertiary/10 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-tertiary text-4xl">hide_image</span>
              </div>
              <h3 className="font-headline font-bold text-xl mb-2"><AzureTranslate text="Invalid Image Detected" /></h3>
              <p className="font-label text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
                <AzureTranslate text="Our AI detected that this might not be a plant leaf. Please upload a clear, focused photo of the affected plant leaf to get an accurate disease diagnosis." />
              </p>
              <button onClick={handleReset} className="px-6 py-2.5 bg-tertiary text-white font-bold rounded-full shadow-lg shadow-tertiary/20 hover:bg-tertiary/90 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">refresh</span>
                <AzureTranslate text="Try a Different Image" />
              </button>
            </div>
          )}

          {/* ── TFLite Model Result ── */}
          {showTfliteResult && (
            <div className="space-y-4 animate-fade-in-up stagger-children">
              {/* Main Result */}
              <div className={`bg-white rounded-2xl editorial-shadow p-6 ${result.is_healthy ? 'ring-2 ring-primary/20' : 'ring-2 ring-tertiary/20'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="smart-chip bg-surface-container text-on-surface-variant"><AzureTranslate text="ANALYSIS RESULT" /></span>
                  <span className="smart-chip bg-primary/10 text-primary">TFLite</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result.is_healthy ? 'bg-primary/10' : 'bg-tertiary-fixed/30'}`}>
                    <span className="material-symbols-outlined text-3xl" style={{ color: result.is_healthy ? '#006b47' : '#825400' }}>
                      {result.is_healthy ? 'eco' : 'bug_report'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-headline font-extrabold text-xl text-on-surface"><AzureTranslate text={result.disease} /></h2>
                    <p className="font-label text-xs text-on-surface-variant/60"><AzureTranslate text={`Crop: ${result.crop}`} /></p>
                  </div>
                  <div className="text-right">
                    <div className={`font-headline font-extrabold text-3xl ${result.is_healthy ? 'text-primary' : 'text-tertiary'}`}>{result.confidence}%</div>
                    <div className="font-label text-[10px] text-on-surface-variant/50 uppercase"><AzureTranslate text="confidence" /></div>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${result.confidence}%`,
                    background: result.is_healthy
                      ? 'linear-gradient(90deg, #006b47, #00875a)'
                      : 'linear-gradient(90deg, #a36a00, #825400)',
                  }} />
                </div>
              </div>

              {/* Treatment */}
              {result.treatment && (
                <div className="bg-white rounded-2xl editorial-shadow overflow-hidden">
                  <div className="p-5 bg-surface-container-low">
                    <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">medication</span> <AzureTranslate text="Treatment Plan" /> 💊
                    </h3>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="bg-secondary-container/20 rounded-2xl p-4">
                      <div className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40 mb-1"><AzureTranslate text="Spray / Medicine" /></div>
                      <div className="font-headline font-bold text-on-surface"><AzureTranslate text={result.treatment.spray} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-tertiary-fixed/20 rounded-2xl p-4">
                        <div className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40 mb-1"><AzureTranslate text="Dosage" /></div>
                        <div className="font-headline font-bold text-sm text-on-surface"><AzureTranslate text={result.treatment.dosage} /></div>
                      </div>
                      <div className="bg-primary/5 rounded-2xl p-4">
                        <div className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40 mb-1"><AzureTranslate text="Interval" /></div>
                        <div className="font-headline font-bold text-sm text-on-surface"><AzureTranslate text={result.treatment.interval} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Predictions */}
              {result.all_predictions && (
                <div className="bg-white rounded-2xl editorial-shadow overflow-hidden">
                  <div className="p-5 bg-surface-container-low">
                    <h4 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">analytics</span> <AzureTranslate text="All Predictions" />
                    </h4>
                  </div>
                  <div className="p-5 space-y-1">
                    {result.all_predictions.map((pred, i) => (
                      <div key={i} className="flex items-center gap-3 py-3">
                        <span className="material-symbols-outlined text-sm" style={{ color: pred.disease.includes('Healthy') ? '#006b47' : '#ba1a1a' }}>
                          {pred.disease.includes('Healthy') ? 'check_circle' : 'bug_report'}
                        </span>
                        <span className="flex-1 font-label text-sm"><AzureTranslate text={pred.disease} /></span>
                        <div className="w-24 h-2 bg-surface-container-low rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${pred.confidence}%`,
                            background: pred.confidence > 50 ? '#006b47' : '#bdcac0',
                          }} />
                        </div>
                        <span className="font-headline font-bold text-sm w-12 text-right">{pred.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleReset}
                className="w-full py-3 bg-surface-container-low text-on-surface font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">photo_camera</span>
                <AzureTranslate text="Scan Another Image" />
              </button>
            </div>
          )}

          {/* ── Gemini Result ── */}
          {showGeminiResult && (
            <div className="space-y-4 animate-fade-in-up stagger-children">
              {/* Main Result */}
              <div className={`bg-white rounded-2xl editorial-shadow p-6 ${geminiResult.is_healthy ? 'ring-2 ring-primary/20' : 'ring-2 ring-tertiary/20'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="smart-chip bg-surface-container text-on-surface-variant"><AzureTranslate text="ANALYSIS RESULT" /></span>
                  <span className="smart-chip bg-tertiary-fixed/30 text-on-tertiary-fixed-variant">
                    <span className="material-symbols-outlined text-[10px]">auto_awesome</span> Gemini AI
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${geminiResult.is_healthy ? 'bg-primary/10' : 'bg-tertiary-fixed/30'}`}>
                    <span className="material-symbols-outlined text-3xl" style={{ color: geminiResult.is_healthy ? '#006b47' : '#825400' }}>
                      {geminiResult.is_healthy ? 'eco' : 'bug_report'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-headline font-extrabold text-xl text-on-surface">{geminiResult.disease}</h2>
                    <p className="font-label text-xs text-on-surface-variant/60">{geminiResult.crop}</p>
                  </div>
                  <div className="text-right">
                    <div className={`font-headline font-extrabold text-3xl ${geminiResult.is_healthy ? 'text-primary' : 'text-tertiary'}`}>{geminiResult.confidence}%</div>
                    <div className="font-label text-[10px] text-on-surface-variant/50 uppercase"><AzureTranslate text="confidence" /></div>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${geminiResult.confidence}%`,
                    background: geminiResult.is_healthy
                      ? 'linear-gradient(90deg, #006b47, #00875a)'
                      : 'linear-gradient(90deg, #a36a00, #825400)',
                  }} />
                </div>

                {/* Severity Badge */}
                {geminiResult.severity && !geminiResult.is_healthy && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-label text-[10px] font-bold text-on-surface-variant/50 uppercase"><AzureTranslate text="Severity" />:</span>
                    <span className={`smart-chip ${
                      geminiResult.severity === 'severe' ? 'bg-error text-white' :
                      geminiResult.severity === 'moderate' ? 'bg-tertiary text-white' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {geminiResult.severity === 'severe' ? '🔴' : geminiResult.severity === 'moderate' ? '🟡' : '🟢'} {geminiResult.severity}
                    </span>
                  </div>
                )}

                {/* Description */}
                {geminiResult.description && (
                  <div className="mt-4 bg-surface-container-low rounded-xl p-3">
                    <p className="text-sm text-on-surface-variant leading-relaxed">{geminiResult.description}</p>
                  </div>
                )}
              </div>

              {/* Treatment */}
              {geminiResult.treatment && (
                <div className="bg-white rounded-2xl editorial-shadow overflow-hidden">
                  <div className="p-5 bg-surface-container-low">
                    <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">medication</span> <AzureTranslate text="Treatment Plan" /> 💊
                    </h3>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="bg-secondary-container/20 rounded-2xl p-4">
                      <div className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40 mb-1"><AzureTranslate text="Spray / Medicine" /></div>
                      <div className="font-headline font-bold text-on-surface">{geminiResult.treatment.spray}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-tertiary-fixed/20 rounded-2xl p-4">
                        <div className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40 mb-1"><AzureTranslate text="Dosage" /></div>
                        <div className="font-headline font-bold text-sm text-on-surface">{geminiResult.treatment.dosage}</div>
                      </div>
                      <div className="bg-primary/5 rounded-2xl p-4">
                        <div className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40 mb-1"><AzureTranslate text="Interval" /></div>
                        <div className="font-headline font-bold text-sm text-on-surface">{geminiResult.treatment.interval}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prevention Tips */}
              {geminiResult.prevention && (
                <div className="bg-white rounded-2xl editorial-shadow overflow-hidden">
                  <div className="p-5 bg-surface-container-low">
                    <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">shield</span> <AzureTranslate text="Prevention Tips" />
                    </h3>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-on-surface-variant leading-relaxed">{geminiResult.prevention}</p>
                  </div>
                </div>
              )}

              <button onClick={handleReset}
                className="w-full py-3 bg-surface-container-low text-on-surface font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">photo_camera</span>
                <AzureTranslate text="Scan Another Image" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
