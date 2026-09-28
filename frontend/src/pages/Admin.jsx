import { useCallback, useEffect, useMemo, useState } from 'react'
import { downloadCsv, getAdmin, resetDatos } from '../api.js'
import { AREAS } from '../content/areas.js'
import '../admin.css'

const PIN_KEY = 'recursos_pin'
const POR_PAGINA = 20

function leerPin() {
  try { return sessionStorage.getItem(PIN_KEY) || '' } catch { return '' }
}
function guardarPin(pin) {
  try {
    if (pin) sessionStorage.setItem(PIN_KEY, pin)
    else sessionStorage.removeItem(PIN_KEY)
  } catch { /* sin storage */ }
}

const fecha = (iso) =>
  new Date(`${iso}Z`).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—')
const nombreArea = (slug) => AREAS[slug]?.nombre || slug

function Metrica({ label, valor, sub }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <div className="metric-num">{valor}</div>
      {sub ? <div className="metric-sub">{sub}</div> : null}
    </div>
  )
}

function Embudo({ area }) {
  const pasos = [
    ['Desbloqueos', area.desbloqueos],
    ['Formularios', area.solicitudes],
    ['Gratis', area.gratis ?? 0],
    ['WhatsApp', area.whatsapp],
  ]
  const max = Math.max(area.desbloqueos, 1)
  return (
    <div className="chart-card">
      <h3 className="chart-title">{nombreArea(area.area)}</h3>
      <div className="funnel">
        {pasos.map(([label, n]) => (
          <div key={label} className="funnel-row">
            <span className="funnel-label">{label}</span>
            <span className="funnel-track"><span className="funnel-fill" style={{ width: `${(n / max) * 100}%` }} /></span>
            <span className="funnel-value">{n}</span>
          </div>
        ))}
      </div>
      <div className="chart-split">
        <span className="chart-split-label">Conversión</span>
        <span className="split-values">
          <span>{pct(area.solicitudes, area.desbloqueos)} form</span>
          <span className="split-sep">·</span>
          <span className="split-wa">{pct(area.whatsapp, area.solicitudes)} wsp</span>
        </span>
      </div>
    </div>
  )
}

function Cuellos({ slug, solicitudes }) {
  const top = useMemo(() => {
    const cuenta = {}
    for (const s of solicitudes) if (s.area === slug) cuenta[s.cuello] = (cuenta[s.cuello] || 0) + 1
    return Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [slug, solicitudes])
  const max = top[0]?.[1] || 1
  return (
    <div className="chart-card">
      <h3 className="chart-title">Cuellos · {nombreArea(slug)}</h3>
      {top.length === 0 ? (
        <p className="muted">Todavía sin respuestas.</p>
      ) : (
        <div className="hbar-list">
          {top.map(([cuello, n]) => (
            <div key={cuello} className="hbar-row">
              <span className="hbar-label" title={cuello}>{cuello}</span>
              <span className="hbar-track"><span className="hbar-fill" style={{ width: `${(n / max) * 100}%` }} /></span>
              <span className="hbar-value">{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Paginacion({ pagina, total, onCambio }) {
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  if (paginas <= 1) return null
  const desde = (pagina - 1) * POR_PAGINA + 1
  const hasta = Math.min(pagina * POR_PAGINA, total)
  // primera, última y las dos vecinas de la actual
  const numeros = [...new Set([1, pagina - 1, pagina, pagina + 1, paginas])].filter((n) => n >= 1 && n <= paginas).sort((a, b) => a - b)
  return (
    <div className="pager">
      <span className="pager-info">{desde}–{hasta} de {total}</span>
      <div className="pager-buttons">
        <button type="button" className="btn-secondary" disabled={pagina === 1} onClick={() => onCambio(pagina - 1)}>←</button>
        {numeros.map((n, i) => (
          <span key={n} className="pager-group">
            {i > 0 && n - numeros[i - 1] > 1 ? <span className="pager-gap">…</span> : null}
            <button type="button" className={`btn-secondary${n === pagina ? ' btn-active' : ''}`} onClick={() => onCambio(n)}>{n}</button>
          </span>
        ))}
        <button type="button" className="btn-secondary" disabled={pagina === paginas} onClick={() => onCambio(pagina + 1)}>→</button>
      </div>
    </div>
  )
}

export default function Admin() {
  const [pin, setPin] = useState(leerPin)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [actualizado, setActualizado] = useState(null)

  const cargar = useCallback(async (p) => {
    try {
      const res = await getAdmin(p)
      setData(res)
      setError('')
      setActualizado(new Date())
      guardarPin(p)
    } catch (err) {
      setError(err.message)
      if (err.status === 401) { guardarPin(''); setData(null) }
    }
  }, [])

  useEffect(() => {
    if (!data) return undefined
    const t = setInterval(() => cargar(pin), 15000)
    return () => clearInterval(t)
  }, [data, pin, cargar])

  useEffect(() => {
    if (leerPin()) cargar(leerPin())
  }, [cargar])

  const filas = useMemo(() => {
    if (!data) return []
    const q = busqueda.trim().toLowerCase()
    return data.solicitudes.filter((s) =>
      (filtro === 'todas' || s.area === filtro) &&
      (!q || `${s.telefono} ${s.cuello} ${s.intento}`.toLowerCase().includes(q)))
  }, [data, filtro, busqueda])

  // si cambia el filtro o la búsqueda, se vuelve a la primera página; si la lista se achica, no se queda en una página vacía
  const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, paginas)
  const visibles = filas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  if (!data) {
    return (
      <div className="dash">
        <div className="pin-gate">
          <form className="pin-card" onSubmit={(e) => { e.preventDefault(); cargar(pin) }}>
            <img src="/atv-logo.png" alt="ATV" className="pin-logo" width={44} height={54} />
            <h1>Recursos del webinar</h1>
            <p>Ingresá el PIN del equipo</p>
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus />
            {error ? <p className="pin-error">{error}</p> : null}
            <button className="pin-submit" disabled={!pin}>Entrar</button>
          </form>
        </div>
      </div>
    )
  }

  const tot = data.areas.reduce(
    (acc, a) => ({ d: acc.d + a.desbloqueos, s: acc.s + a.solicitudes, w: acc.w + a.whatsapp }),
    { d: 0, s: 0, w: 0 },
  )

  const exportar = async () => {
    const blob = await downloadCsv(pin)
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'solicitudes-recursos.csv' })
    a.click()
    URL.revokeObjectURL(url)
  }
  const vaciar = async () => {
    if (!window.confirm(`Esto borra ${tot.d + tot.s} registros de las tres áreas (desbloqueos y formularios). Usalo antes del vivo para sacar las pruebas. ¿Seguro?`)) return
    await resetDatos(pin)
    setPagina(1)
    cargar(pin)
  }
  const salir = () => { guardarPin(''); setData(null); setPin('') }

  return (
    <div className="dash">
      <nav className="dash-nav">
        <div className="nav-left">
          <img src="/atv-logo.png" alt="ATV" className="nav-logo" width={26} height={32} />
          <div className="nav-titles">
            <h1>Recursos del webinar</h1>
            <p>
              <span className="live-dot" /> En vivo · se actualiza cada 15 s
              {actualizado ? ` · ${actualizado.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
            </p>
          </div>
        </div>
        <div className="nav-actions">
          <button className="btn-secondary" onClick={exportar}>Exportar CSV</button>
          <button className="btn-secondary btn-danger" onClick={vaciar}>Vaciar datos</button>
          <button className="btn-secondary" onClick={salir}>Salir</button>
        </div>
      </nav>

      <main className="dash-content">
        <div className="metrics-grid">
          <Metrica label="Desbloqueos" valor={tot.d} sub="Escucharon la contraseña" />
          <Metrica label="Formularios" valor={tot.s} sub={`${pct(tot.s, tot.d)} de los que desbloquearon`} />
          <Metrica label="WhatsApp" valor={tot.w} sub={`${pct(tot.w, tot.s)} de los que completaron`} />
          <Metrica
            label="Último formulario"
            valor={data.ultima ? new Date(`${data.ultima}Z`).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}
            sub={data.ultima ? new Date(`${data.ultima}Z`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : 'Todavía no entró nadie'}
          />
        </div>

        <div className="charts-grid">
          {data.areas.map((a) => <Embudo key={a.area} area={a} />)}
          {data.areas.map((a) => <Cuellos key={a.area} slug={a.area} solicitudes={data.solicitudes} />)}
        </div>

        <section className="table-card">
          <div className="filters">
            <input
              className="filter-input"
              placeholder="Buscar por número, cuello o respuesta…"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
            />
            {['todas', ...Object.keys(AREAS)].map((k) => (
              <button
                key={k}
                type="button"
                className={`btn-secondary${filtro === k ? ' btn-active' : ''}`}
                onClick={() => { setFiltro(k); setPagina(1) }}
              >
                {k === 'todas' ? 'Todas' : AREAS[k].nombre}
              </button>
            ))}
          </div>
          <span className="table-count">{filas.length} {filas.length === 1 ? 'solicitud' : 'solicitudes'}</span>
          <div className="table-scroll">
            <table className="leads-table">
              <thead>
                <tr><th>Fecha</th><th>Área</th><th>WhatsApp</th><th>Cuello de botella</th><th>Qué intentó</th><th>Gratis</th><th>Tocó wsp</th></tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
                  <tr><td colSpan={7} className="empty">Todavía no hay solicitudes.</td></tr>
                ) : visibles.map((s) => (
                  <tr key={s.id}>
                    <td className="nowrap">{fecha(s.created_at)}</td>
                    <td><span className="badge">{nombreArea(s.area)}</span></td>
                    <td className="nowrap">{s.telefono}</td>
                    <td>{s.cuello}</td>
                    <td className="muted">{s.intento || '—'}</td>
                    <td className="nowrap">{s.gratis ? <span className="pill pill-wa">{s.gratis}/2</span> : <span className="pill pill-idle">0/2</span>}</td>
                    <td>{s.whatsapp_clicks ? <span className="pill pill-wa">Sí</span> : <span className="pill pill-idle">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={paginaActual} total={filas.length} onCambio={setPagina} />
        </section>
      </main>
    </div>
  )
}
