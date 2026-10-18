import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { getFields, createField, updateField, deleteFieldById } from '../services/api'
import AzureTranslate from '../components/AzureTranslate'

const IRRIGATION_TYPES = ['Tubewell', 'Canal', 'Rainfed', 'Drip', 'Sprinkler']
const SOIL_HEALTH_OPTIONS = [
  { label: 'Excellent', ph: 6.8, n: 120, p: 55, k: 55 },
  { label: 'Good', ph: 6.5, n: 90, p: 42, k: 43 },
  { label: 'Moderate', ph: 7.2, n: 60, p: 30, k: 35 },
  { label: 'Poor', ph: 5.5, n: 30, p: 15, k: 20 },
]
const CROP_LIST = [
  'Rice', 'Wheat', 'Maize', 'Sugarcane', 'Cotton', 'Groundnut', 'Soyabean',
  'Potato', 'Onion', 'Bajra', 'Jowar', 'Barley', 'Gram', 'Urad',
  'Moong', 'Ragi', 'Banana', 'Coconut', 'Jute', 'Tobacco', 'Turmeric',
  'Mustard', 'Sunflower', 'Chickpea', 'Lentil', 'Tomato', 'Chilli',
]

const SOIL_STATUS = (ph) => {
  if (ph >= 6.0 && ph <= 7.5) return { label: 'Optimal', color: 'bg-primary/10 text-primary' }
  if (ph >= 5.5 && ph <= 8.0) return { label: 'Moderate', color: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' }
  return { label: 'Poor', color: 'bg-error/10 text-error' }
}

const FIELD_IMAGES = [
  '/field-aerial.jpg',
  '/dashboard-banner.jpg',
  '/crop-advisory-banner.jpg',
  '/weather-sunny.jpg',
]

const EMPTY_FORM = {
  label: '', area_ha: 1.0, irrigation: 'Rainfed', soil_health: 'Good',
  soil_n: 90, soil_p: 42, soil_k: 43, soil_ph: 6.5, soil_type: '',
  previous_crop: '', current_crop: '', status: 'active',
}

export default function Fields() {
  const [fields, setFields] = useState([])
  const [fieldsLoading, setFieldsLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)
  const { t } = useLanguage()

  const loadFields = async () => {
    setFieldsLoading(true)
    try { const data = await getFields(); setFields(data.fields || []) }
    catch (err) { console.error('Failed to load fields:', err); setFields([]) }
    finally { setFieldsLoading(false) }
  }
  useEffect(() => { loadFields() }, [])

  const handleSoilPreset = (preset) => setAddForm(f => ({ ...f, soil_health: preset.label, soil_n: preset.n, soil_p: preset.p, soil_k: preset.k, soil_ph: preset.ph }))

  const handleAddField = async (e) => {
    e.preventDefault()
    if (!addForm.label.trim()) { setError('Please enter a field name'); return }
    setSaving(true); setError(null)
    try {
      await createField({ label: addForm.label.trim(), area_ha: addForm.area_ha, irrigation: addForm.irrigation.toLowerCase(), soil_n: addForm.soil_n, soil_p: addForm.soil_p, soil_k: addForm.soil_k, soil_ph: addForm.soil_ph, soil_type: addForm.soil_type, previous_crop: addForm.previous_crop, current_crop: addForm.current_crop, status: addForm.status })
      setShowAddModal(false); setAddForm({ ...EMPTY_FORM }); await loadFields()
      window.dispatchEvent(new Event('fields-updated'))
    } catch (err) { setError(err.message || 'Failed to create field') }
    finally { setSaving(false) }
  }

  const handleDeleteField = async (fieldId) => {
    if (!confirm('Are you sure you want to delete this field?')) return
    setDeleting(fieldId)
    try {
      await deleteFieldById(fieldId)
      if (selected?.id === fieldId) setSelected(null)
      await loadFields()
      window.dispatchEvent(new Event('fields-updated'))
    } catch (err) { console.error('Failed to delete field:', err) }
    finally { setDeleting(null) }
  }

  const handleToggleStatus = async (plot, e) => {
    if (e) e.stopPropagation()
    const nextStatus = plot.status === 'active' ? 'inactive' : 'active'
    try {
      await updateField(plot.id, {
        label: plot.label,
        area_ha: plot.area_ha,
        irrigation: (plot.irrigation || 'rainfed').toLowerCase(),
        soil_n: plot.soil_n,
        soil_p: plot.soil_p,
        soil_k: plot.soil_k,
        soil_ph: plot.soil_ph,
        soil_type: plot.soil_type,
        previous_crop: plot.previous_crop,
        current_crop: plot.current_crop,
        status: nextStatus,
      })
      await loadFields()
      window.dispatchEvent(new Event('fields-updated'))
    } catch (err) {
      console.error('Failed to update field status:', err)
    }
  }

  const totalArea = fields.reduce((s, p) => s + (parseFloat(p.area_ha) || 0), 0)

  const inputClass = "w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-[#17251F]">
      {/* ── Feature Hero Banner with Aerial Farmland Asset ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#042F25] text-white p-6 sm:p-10 md:p-12 shadow-sm border border-[#0A4D3D] min-h-[250px] sm:min-h-[320px] md:min-h-[360px] lg:min-h-[380px] flex flex-col justify-center">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/field-aerial.jpg"
            alt="Cultivated farmland and field parcel boundaries"
            className="w-full h-full object-cover object-center md:object-[center_35%]"
            style={{ opacity: 1 }}
            loading="eager"
          />
          {/* Subtle left-side gradient overlay behind text only, rest of image fully visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#042F25]/90 via-[#042F25]/60 35% via-[#042F25]/10 55% to-transparent hidden sm:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#042F25]/95 via-[#042F25]/60 55% to-transparent sm:hidden" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#063D2E]/80 border border-[#9DEBC1]/30 text-[10px] font-bold text-[#9DEBC1] uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
              <span><AzureTranslate text="Farm Plot Management" /></span>
            </div>
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
              <AzureTranslate text="My Cultivated Fields & Boundaries" />
            </h1>
            <p className="font-label text-xs sm:text-sm text-[#D4E8DC] mt-2 leading-relaxed max-w-lg">
              <AzureTranslate text={`${fields.length} plots registered · ${totalArea.toFixed(2)} ha total acreage monitored across your farm parcels.`} />
            </p>
          </div>

          <button
            onClick={() => { setShowAddModal(true); setError(null); setAddForm({ ...EMPTY_FORM }) }}
            className="px-6 py-3.5 bg-[#087F5B] hover:bg-[#063D2E] text-white font-bold rounded-2xl shadow-lg shadow-[#087F5B]/25 flex items-center gap-2 transition-all text-xs sm:text-sm shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>{t('fields_addField')}</span>
          </button>
        </div>
      </section>

      {/* Stats Banner */}
      {fields.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Fields', value: fields.length, icon: 'map', color: 'bg-primary/10 text-primary' },
            { label: 'Total Area', value: `${totalArea.toFixed(2)} ha`, icon: 'crop_landscape', color: 'bg-tertiary-fixed/30 text-tertiary' },
            { label: 'Active', value: fields.filter(f => f.status === 'active').length, icon: 'check_circle', color: 'bg-secondary-container/30 text-secondary' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl editorial-shadow p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-lg">{s.icon}</span>
              </div>
              <div>
                <div className="font-label text-[10px] text-on-surface-variant/40 font-bold uppercase">{s.label}</div>
                <div className="font-headline font-extrabold text-lg text-on-surface">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Field Cards */}
      {fieldsLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4"><div className="spinner" /><span className="font-label text-sm text-on-surface-variant"><AzureTranslate text="Loading fields..." /></span></div>
      ) : fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">map</span>
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2"><AzureTranslate text="No Fields Added Yet" /></h3>
          <p className="text-sm text-on-surface-variant/60"><AzureTranslate text='Click "Add Field" to register your first farm plot' /></p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((plot, idx) => (
            <div key={plot.id}
              onClick={() => setSelected(selected?.id === plot.id ? null : plot)}
              className={`bg-white rounded-2xl editorial-shadow cursor-pointer transition-all hover:-translate-y-1 duration-200 overflow-hidden group ${
                selected?.id === plot.id ? 'ring-2 ring-primary/30' : ''
              }`}>
              {/* Field Hero Image */}
              <div className="h-28 relative overflow-hidden">
                <img src={FIELD_IMAGES[idx % FIELD_IMAGES.length]} alt={plot.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                  <div>
                    <h3 className="font-headline font-bold text-white text-sm">{plot.label}</h3>
                    <button
                      type="button"
                      onClick={e => handleToggleStatus(plot, e)}
                      title="Click to toggle Active / Inactive status"
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 transition-all cursor-pointer ${
                        plot.status === 'active' ? 'bg-primary text-white hover:bg-primary-container' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {plot.status}
                    </button>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDeleteField(plot.id) }} disabled={deleting === plot.id}
                    className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-error/80 transition-colors">
                    <span className="material-symbols-outlined text-sm">{deleting === plot.id ? 'hourglass_empty' : 'delete'}</span>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t('fields_area'), value: `${parseFloat(plot.area_ha || 0).toFixed(2)} ha` },
                    { label: t('fields_irrigation'), value: plot.irrigation, cap: true },
                    { label: t('fields_previousCrop'), value: plot.previous_crop || '—', cap: true },
                    { label: 'Current Crop', value: plot.current_crop || '—', cap: true },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="font-label text-[10px] text-on-surface-variant/40 font-bold uppercase">{item.label}</div>
                      <div className={`font-headline font-bold text-sm text-on-surface ${item.cap ? 'capitalize' : ''}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="font-label text-[10px] text-on-surface-variant/40 font-bold uppercase">{t('fields_soilHealth')}</div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${SOIL_STATUS(plot.soil_ph || 7).color}`}>{SOIL_STATUS(plot.soil_ph || 7).label}</span>
                  </div>
                  <span className="font-label text-xs text-on-surface-variant/40">pH {plot.soil_ph || '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="bg-white rounded-2xl editorial-shadow overflow-hidden animate-fade-in-up">
          <div className="p-5 bg-surface-container-low flex items-center justify-between">
            <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">assignment</span> {selected.label} — Details
            </h3>
            <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Soil */}
            <div className="space-y-4">
              <h4 className="font-headline font-bold flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-primary text-sm">science</span> <AzureTranslate text="Soil Nutrients (kg/ha)" />
              </h4>
              {[
                { label: 'Nitrogen (N)', value: selected.soil_n || 0, max: 200, color: '#006b47' },
                { label: 'Phosphorus (P)', value: selected.soil_p || 0, max: 100, color: '#a36a00' },
                { label: 'Potassium (K)', value: selected.soil_k || 0, max: 100, color: '#3c6842' },
              ].map(nutrient => (
                <div key={nutrient.label}>
                  <div className="flex justify-between mb-1">
                    <span className="font-label text-sm text-on-surface">{nutrient.label}</span>
                    <span className="font-headline font-bold text-sm">{nutrient.value}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(nutrient.value / nutrient.max) * 100}%`, background: nutrient.color }} />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <span className="font-label text-sm text-on-surface">Soil pH:</span>
                <span className="font-headline font-bold">{selected.soil_ph || '—'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SOIL_STATUS(selected.soil_ph || 7).color}`}>{SOIL_STATUS(selected.soil_ph || 7).label}</span>
              </div>
            </div>
            {/* Info Table */}
            <div>
              <h4 className="font-headline font-bold flex items-center gap-2 text-on-surface mb-4">
                <span className="material-symbols-outlined text-primary text-sm">info</span> <AzureTranslate text="Plot Information" />
              </h4>
              <div className="space-y-0">
                {[
                  ['Label', selected.label], ['Area', `${selected.area_ha} hectares`],
                  ['Irrigation', selected.irrigation], ['Previous Crop', selected.previous_crop || '—'],
                  ['Current Crop', selected.current_crop || '—'], ['Soil Type', selected.soil_type || '—'], ['Status', selected.status],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-3 border-b border-surface-container-high/50 last:border-0">
                    <span className="font-label text-sm text-on-surface-variant/60">{k}</span>
                    <span className="font-headline font-bold text-sm text-on-surface capitalize">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl editorial-shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto hide-scrollbar animate-fade-in-scale" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-gradient-to-r from-primary to-primary-container text-white flex items-center justify-between rounded-t-3xl">
              <h3 className="font-headline font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">agriculture</span> <AzureTranslate text="Add New Field" />
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              {error && (
                <div className="bg-error-container/30 text-on-error-container p-3 rounded-2xl text-sm mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-error">error</span> {error}
                </div>
              )}
              <form onSubmit={handleAddField} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-label text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider"><AzureTranslate text="Field Name" /> *</label>
                  <input className={inputClass} placeholder="e.g. South Field, Plot A"
                    value={addForm.label} onChange={e => setAddForm(f => ({...f, label: e.target.value}))} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider"><AzureTranslate text="Area (hectares)" /> *</label>
                    <input className={inputClass} type="number" step="0.1" min="0.01"
                      value={addForm.area_ha} onChange={e => setAddForm(f => ({...f, area_ha: +e.target.value}))} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider"><AzureTranslate text="Status" /></label>
                    <select className={inputClass} value={addForm.status} onChange={e => setAddForm(f => ({...f, status: e.target.value}))}>
                      <option value="active">Active</option>
                      <option value="fallow">Fallow</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-label text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider"><AzureTranslate text="Irrigation Type" /></label>
                  <select className={inputClass} value={addForm.irrigation} onChange={e => setAddForm(f => ({...f, irrigation: e.target.value}))}>
                    {IRRIGATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {/* Soil health presets */}
                <div className="space-y-2">
                  <label className="font-label text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider"><AzureTranslate text="Soil Health" /></label>
                  <div className="flex flex-wrap gap-2">
                    {SOIL_HEALTH_OPTIONS.map(opt => (
                      <button key={opt.label} type="button" onClick={() => handleSoilPreset(opt)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          addForm.soil_health === opt.label ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                        }`}>{opt.label}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'soil_n', label: 'N' }, { key: 'soil_p', label: 'P' },
                      { key: 'soil_k', label: 'K' }, { key: 'soil_ph', label: 'pH' },
                    ].map(f => (
                      <div key={f.key} className="space-y-1">
                        <label className="font-label text-[10px] text-on-surface-variant/50">{f.label}</label>
                        <input className={inputClass} type="number" value={addForm[f.key]}
                          onChange={e => setAddForm(fm => ({...fm, [f.key]: +e.target.value, soil_health: 'Custom'}))}
                          step={f.key === 'soil_ph' ? '0.1' : '1'} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider"><AzureTranslate text="Previous Crop" /></label>
                    <select className={inputClass} value={addForm.previous_crop} onChange={e => setAddForm(f => ({...f, previous_crop: e.target.value}))}>
                      <option value="">— None —</option>
                      {CROP_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-label text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider"><AzureTranslate text="Current Crop" /></label>
                    <select className={inputClass} value={addForm.current_crop} onChange={e => setAddForm(f => ({...f, current_crop: e.target.value}))}>
                      <option value="">— None —</option>
                      {CROP_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary-container transition-all disabled:opacity-60">
                  {saving ? <><div className="spinner-sm !border-white/30 !border-t-white" /> <AzureTranslate text="Saving..." /></>
                    : <><span className="material-symbols-outlined">agriculture</span> <AzureTranslate text="Add Field" /></>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
