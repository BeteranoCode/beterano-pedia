// Fuente: beterano-data (rama main)
export const VEHICULOS_JSON =
  'https://raw.githubusercontent.com/BeteranoCode/beterano-data/main/data/vehiculos.json';

/**
 * Normaliza el array de vehículos a la estructura esperada por la UI del Gantt:
 * {
 *   id, brand, brandLogo?, model, series?, modelImg, variants: [{ engine, start, end }]
 * }
 */
export function normalizeVehicles(rawArray = []) {
  return rawArray.map((r, idx) => {
    const brand = r.marca || r.brand || '—';
    const model = r.modelo || r.model || '—';
    const series = r.serie_generacion || r.serie || r.generacion || '';
    const modelImg = r.Image || r.image || r.img || null; // ← usar el link directo del JSON

    // Variantes de motor:
    // - Preferimos r.motores: [{ motor, year_start, year_end }]
    // - Fallback a plano: motor / year_start / year_end en el propio vehículo
    const variants = Array.isArray(r.motores) && r.motores.length
      ? r.motores
      : [{
          motor: r.motor || '—',
          year_start: r.year_start ?? r.vin_year?.start ?? r.inicio ?? null,
          year_end:   r.year_end   ?? r.vin_year?.end   ?? r.fin    ?? null
        }];

    return {
      id: r.id || `${slug(brand)}-${slug(model)}-${idx}`,
      brand,
      // Si más adelante añadimos logos al JSON, se mapearán aquí:
      brandLogo: r.logo || null,
      model,
      series,
      modelImg,
      variants: variants.map(v => ({
        engine: v.motor || v.engine || '—',
        start: toNum(v.year_start ?? v.start),
        end:   toNum(v.year_end   ?? v.end)
      }))
    };
  });
}

/** Calcula el rango global de años para el encabezado del Gantt */
export function computeYearBounds(list = [], fallbackMin = 1960, fallbackMax = new Date().getFullYear()) {
  let min = Infinity, max = -Infinity;
  for (const item of list) {
    for (const v of (item.variants || [])) {
      if (isFinite(v.start)) min = Math.min(min, v.start);
      if (isFinite(v.end))   max = Math.max(max, v.end);
    }
  }
  if (!isFinite(min)) min = fallbackMin;
  if (!isFinite(max)) max = fallbackMax;
  return { min, max };
}

// Utils
function slug(s = '') {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function toNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
}
