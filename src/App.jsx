import React, { useEffect, useMemo, useState } from 'react'
import GanttTable from '@/components/GanttTable'
import { VEHICULOS_JSON, normalizeVehicles, computeYearBounds } from '@/lib/dataAdapter'
import useOrientation from '@/lib/useOrientation'
import './styles.css'

export default function App() {
  const [raw, setRaw] = useState([])
  const [list, setList] = useState([])
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [engine, setEngine] = useState('')
  const [q, setQ] = useState('')

  const orientation = useOrientation()
  const [mobileMode, setMobileMode] = useState('auto')

  const effectiveMode = (() => {
    if (mobileMode !== 'auto') return mobileMode;
    return orientation === 'landscape' ? 'horizontal' : 'vertical';
  })();
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(VEHICULOS_JSON)
        const json = await res.json()
        setRaw(json)
      } catch (e) {
        console.error('Error cargando vehiculos.json', e)
        setRaw([])
      }
    })()
  }, [])

  const normalized = useMemo(() => normalizeVehicles(raw), [raw])
  const { min: yearMin, max: yearMax } = useMemo(() => computeYearBounds(normalized, 1960, new Date().getFullYear()), [normalized])

  const brands = useMemo(() => Array.from(new Set(normalized.map(x => x.brand))).sort(), [normalized])
  const models = useMemo(() => Array.from(new Set(normalized.filter(x => !brand || x.brand === brand).map(x => x.model))).sort(), [normalized, brand])
  const engines = useMemo(() => {
    const pool = []
    normalized.forEach(x => { if (!brand || x.brand === brand) if (!model || x.model === model) x.variants.forEach(v => pool.push(v.engine)) })
    return Array.from(new Set(pool)).sort()
  }, [normalized, brand, model])

  useEffect(() => {
    const filtered = normalized
      .filter(x => (!brand || x.brand === brand))
      .filter(x => (!model || x.model === model))
      .map(x => ({ ...x, variants: x.variants.filter(v => (!engine || v.engine === engine)) }))
      .map(x => ({ ...x, variants: x.variants.length ? x.variants : [{ engine: '—', start: null, end: null }] }))
      .filter(x => {
        if (!q) return true
        const hay = `${x.brand} ${x.model} ${x.series}`.toLowerCase()
        return hay.includes(q.toLowerCase())
      })
    setList(filtered)
  }, [normalized, brand, model, engine, q])

  return (
    <div className="app">
      <h1>BETERANO PEDIA · Años de fabricación</h1>
      <div className="controls">
        <div>
          <label>Marca</label>
          <select value={brand} onChange={e => { setBrand(e.target.value); setModel(''); setEngine('') }}>
            <option value="">Todas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label>Modelo</label>
          <select value={model} onChange={e => { setModel(e.target.value); setEngine('') }}>
            <option value="">Todos</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label>Motor</label>
          <select value={engine} onChange={e => setEngine(e.target.value)}>
            <option value="">Todos</option>
            {engines.map(en => <option key={en} value={en}>{en}</option>)}
          </select>
        </div>
        <div>
          <label>Buscar</label>
          <input placeholder="Texto libre" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {isMobile && (
        <div className="mobileBar">
          <span>Vista móvil</span>
          <div className="segmented">
            <button className={mobileMode==='auto' ? 'active' : ''} onClick={() => setMobileMode('auto')}>Auto</button>
            <button className={mobileMode==='horizontal' ? 'active' : ''} onClick={() => setMobileMode('horizontal')}>Horiz.</button>
            <button className={mobileMode==='vertical' ? 'active' : ''} onClick={() => setMobileMode('vertical')}>Vert.</button>
          </div>
        </div>
      )}

      <GanttTable data={list} yearMin={yearMin} yearMax={yearMax} mobileLayout={isMobile ? effectiveMode : 'horizontal'} />
    </div>
  );
}