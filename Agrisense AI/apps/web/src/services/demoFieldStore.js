/**
 * Demo Field Store — Client-side database-free field & crop-rotation storage
 * Specifically used for public demonstration sessions (demo users) when no
 * active database connection is available.
 */

export const DEMO_FIELDS_STORAGE_KEY = 'agrisense_demo_fields';
export const DEMO_INITIALIZED_KEY = 'agrisense_demo_fields_initialized';
export const DEMO_PLANS_STORAGE_KEY = 'agrisense_demo_crop_plans';
export const DEMO_PLANS_INITIALIZED_KEY = 'agrisense_demo_plans_initialized';

export const FIELD_IMAGES = [
  '/test-croprows.jpg',
  '/test-cornfield.jpg',
  '/test-soja.jpg',
  '/field-aerial.jpg',
  '/card-crop.jpg',
  '/test-sprouts.jpg',
];

export const INITIAL_DEMO_FIELDS = [
  {
    id: 101,
    label: 'Plot A',
    area_ha: 2.5,
    irrigation: 'tubewell',
    soil_n: 95,
    soil_p: 45,
    soil_k: 48,
    soil_ph: 6.8,
    soil_type: 'Alluvial Soil',
    previous_crop: 'Rice',
    current_crop: 'Wheat',
    status: 'active',
    image: '/test-croprows.jpg',
    created_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 102,
    label: 'Plot B',
    area_ha: 1.8,
    irrigation: 'rainfed',
    soil_n: 68,
    soil_p: 34,
    soil_k: 38,
    soil_ph: 6.4,
    soil_type: 'Black Soil',
    previous_crop: 'Maize',
    current_crop: 'Soyabean',
    status: 'active',
    image: '/test-cornfield.jpg',
    created_at: '2026-02-10T09:30:00.000Z',
  },
];

export const INITIAL_DEMO_PLANS = [
  // Plot A 2026 Rotation
  {
    id: 1,
    field_id: 101,
    plot_label: 'Plot A',
    year: 2026,
    crop: 'Wheat',
    season: 'rabi',
    start_month: 11,
    end_month: 3,
    reason: 'Cereal benefits from nitrogen-enriched soil',
  },
  {
    id: 2,
    field_id: 101,
    plot_label: 'Plot A',
    year: 2026,
    crop: 'Moong(Green Gram)',
    season: 'zaid',
    start_month: 3,
    end_month: 6,
    reason: 'Legume after cereal restores soil nitrogen',
  },
  {
    id: 3,
    field_id: 101,
    plot_label: 'Plot A',
    year: 2026,
    crop: 'Rice',
    season: 'kharif',
    start_month: 6,
    end_month: 10,
    reason: 'High water-retention Kharif cereal staple',
  },
  {
    id: 4,
    field_id: 101,
    plot_label: 'Plot A',
    year: 2026,
    crop: 'Chickpea',
    season: 'rabi',
    start_month: 11,
    end_month: 3,
    reason: 'Legume phase disrupts cereal pest cycles',
  },
  // Plot B 2026 Rotation
  {
    id: 5,
    field_id: 102,
    plot_label: 'Plot B',
    year: 2026,
    crop: 'Mustard',
    season: 'rabi',
    start_month: 11,
    end_month: 3,
    reason: 'Deep taproot loosens compact soil layers',
  },
  {
    id: 6,
    field_id: 102,
    plot_label: 'Plot B',
    year: 2026,
    crop: 'Sunflower',
    season: 'zaid',
    start_month: 3,
    end_month: 6,
    reason: 'Drought-tolerant oilseed catch crop',
  },
  {
    id: 7,
    field_id: 102,
    plot_label: 'Plot B',
    year: 2026,
    crop: 'Soyabean',
    season: 'kharif',
    start_month: 6,
    end_month: 10,
    reason: 'Legume rotation naturally fixes atmospheric nitrogen',
  },
  {
    id: 8,
    field_id: 102,
    plot_label: 'Plot B',
    year: 2026,
    crop: 'Barley',
    season: 'rabi',
    start_month: 11,
    end_month: 3,
    reason: 'Hardy drought-resilient winter cereal',
  },
];

/**
 * Detect whether current authenticated session is the restricted demo user.
 */
export function isDemoUser() {
  try {
    const raw = localStorage.getItem('smartcrop_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (
        u &&
        (u.is_demo === true ||
          u.role === 'demo_user' ||
          (u.email && u.email.toLowerCase() === 'admin@capportal.gov.in'))
      ) {
        return true;
      }
    }
    const token = localStorage.getItem('smartcrop_token');
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (
          payload &&
          (payload.is_demo === true ||
            payload.role === 'demo_user' ||
            (payload.email && payload.email.toLowerCase() === 'admin@capportal.gov.in'))
        ) {
          return true;
        }
      }
    }
  } catch {
    // ignore decoding errors
  }
  return false;
}

/**
 * Retrieve all demo fields from localStorage.
 * Seeds Plot A and Plot B on first run; subsequent reads are idempotent.
 */
export function getDemoFields() {
  const initialized = localStorage.getItem(DEMO_INITIALIZED_KEY);
  if (!initialized) {
    try {
      localStorage.setItem(DEMO_FIELDS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_FIELDS));
      localStorage.setItem(DEMO_INITIALIZED_KEY, 'true');
    } catch (e) {
      console.error('Failed to initialize demo fields:', e);
    }
    return [...INITIAL_DEMO_FIELDS];
  }
  try {
    const raw = localStorage.getItem(DEMO_FIELDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse demo fields:', e);
    return [];
  }
}

/**
 * Retrieve a single demo field by ID.
 */
export function getDemoFieldById(fieldId) {
  const fields = getDemoFields();
  return fields.find(f => String(f.id) === String(fieldId)) || null;
}

/**
 * Add a new field for demo user in localStorage.
 * Validates data and verifies persistence before returning.
 */
export function createDemoField(fieldData) {
  if (!fieldData || !fieldData.label || !fieldData.label.trim()) {
    throw new Error('Please enter a field name');
  }
  const area = parseFloat(fieldData.area_ha);
  if (isNaN(area) || area <= 0) {
    throw new Error('Please enter a valid area in hectares (must be greater than 0)');
  }

  const currentFields = getDemoFields();

  // Pick an image matching the crop if available, or cycle from FIELD_IMAGES
  let image = fieldData.image;
  if (!image) {
    const cropLower = (fieldData.current_crop || fieldData.previous_crop || '').toLowerCase();
    if (cropLower.includes('wheat') || cropLower.includes('rice') || cropLower.includes('barley')) {
      image = '/test-croprows.jpg';
    } else if (cropLower.includes('maize') || cropLower.includes('corn') || cropLower.includes('sugarcane')) {
      image = '/test-cornfield.jpg';
    } else if (cropLower.includes('soya') || cropLower.includes('bean') || cropLower.includes('gram') || cropLower.includes('pulse')) {
      image = '/test-soja.jpg';
    } else {
      const idx = currentFields.length % FIELD_IMAGES.length;
      image = FIELD_IMAGES[idx];
    }
  }

  const newField = {
    id: Date.now(),
    label: fieldData.label.trim(),
    area_ha: area,
    irrigation: fieldData.irrigation || 'rainfed',
    soil_n: parseFloat(fieldData.soil_n) || 0,
    soil_p: parseFloat(fieldData.soil_p) || 0,
    soil_k: parseFloat(fieldData.soil_k) || 0,
    soil_ph: parseFloat(fieldData.soil_ph) || 7.0,
    soil_type: fieldData.soil_type || 'Alluvial Soil',
    previous_crop: fieldData.previous_crop || '',
    current_crop: fieldData.current_crop || '',
    status: fieldData.status || 'active',
    image: image,
    created_at: new Date().toISOString(),
  };

  const updatedFields = [...currentFields, newField];
  localStorage.setItem(DEMO_FIELDS_STORAGE_KEY, JSON.stringify(updatedFields));

  // Verify storage was written
  const verify = localStorage.getItem(DEMO_FIELDS_STORAGE_KEY);
  if (!verify || !verify.includes(String(newField.id))) {
    throw new Error('Failed to verify field persistence in localStorage');
  }

  return { field: newField, message: 'Field created successfully' };
}

/**
 * Update an existing demo field in localStorage.
 */
export function updateDemoField(fieldId, updates) {
  const currentFields = getDemoFields();
  const idx = currentFields.findIndex(f => String(f.id) === String(fieldId));
  if (idx === -1) {
    throw new Error('Field not found');
  }

  const updatedField = {
    ...currentFields[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.area_ha !== undefined) {
    updatedField.area_ha = parseFloat(updates.area_ha) || 1.0;
  }
  if (updates.soil_n !== undefined) updatedField.soil_n = parseFloat(updates.soil_n) || 0;
  if (updates.soil_p !== undefined) updatedField.soil_p = parseFloat(updates.soil_p) || 0;
  if (updates.soil_k !== undefined) updatedField.soil_k = parseFloat(updates.soil_k) || 0;
  if (updates.soil_ph !== undefined) updatedField.soil_ph = parseFloat(updates.soil_ph) || 7.0;

  currentFields[idx] = updatedField;
  localStorage.setItem(DEMO_FIELDS_STORAGE_KEY, JSON.stringify(currentFields));
  return { field: updatedField, message: 'Field updated successfully' };
}

/**
 * Delete a demo field from localStorage and clean up its associated rotation plans.
 */
export function deleteDemoField(fieldId) {
  const currentFields = getDemoFields();
  const target = currentFields.find(f => String(f.id) === String(fieldId));
  if (!target) {
    throw new Error('Field not found');
  }

  const filtered = currentFields.filter(f => String(f.id) !== String(fieldId));
  localStorage.setItem(DEMO_FIELDS_STORAGE_KEY, JSON.stringify(filtered));

  // Remove corresponding demo plans for this field
  try {
    const rawPlans = localStorage.getItem(DEMO_PLANS_STORAGE_KEY);
    if (rawPlans) {
      const plans = JSON.parse(rawPlans);
      const filteredPlans = plans.filter(
        p =>
          String(p.field_id) !== String(fieldId) &&
          (!target.label || p.plot_label?.toLowerCase() !== target.label.toLowerCase())
      );
      localStorage.setItem(DEMO_PLANS_STORAGE_KEY, JSON.stringify(filteredPlans));
    }
  } catch {
    // ignore
  }

  return { message: 'Field deleted successfully' };
}

/**
 * Get demo crop rotation plans.
 * Supports both grouped (by plot) and flat list formats.
 */
export function getDemoCropPlans(year = null, grouped = true) {
  const initialized = localStorage.getItem(DEMO_PLANS_INITIALIZED_KEY);
  let plans = [];
  if (!initialized) {
    try {
      localStorage.setItem(DEMO_PLANS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PLANS));
      localStorage.setItem(DEMO_PLANS_INITIALIZED_KEY, 'true');
    } catch (e) {
      console.error('Failed to initialize demo plans in localStorage:', e);
    }
    plans = [...INITIAL_DEMO_PLANS];
  } else {
    try {
      const raw = localStorage.getItem(DEMO_PLANS_STORAGE_KEY);
      plans = raw ? JSON.parse(raw) : [];
    } catch {
      plans = [];
    }
  }

  const filtered = year ? plans.filter(p => !p.year || Number(p.year) === Number(year)) : plans;

  if (grouped) {
    const groups = {};
    for (const plan of filtered) {
      const plot = plan.plot_label || 'Plot';
      if (!groups[plot]) groups[plot] = [];
      groups[plot].push({
        id: plan.id,
        crop: plan.crop,
        start: Math.max(0, (plan.start_month || 1) - 1),
        end: plan.end_month,
        season: plan.season,
        field_id: plan.field_id,
        reason: plan.reason,
      });
    }
    const groupedList = Object.entries(groups).map(([plot, entries]) => ({ plot, entries }));
    return { plans: groupedList, total: filtered.length, is_demo: true };
  }

  return { plans: filtered, total: filtered.length, is_demo: true };
}
