import { useCallback, useEffect, useState } from 'react'
import { downloadCsv, getAdmin } from '../api.js'
import { AREAS } from '../content/areas.js'

const PIN_KEY = 'recursos_pin'

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

export default function Admin() {
  const [pin, setPin] = useState(leerPin)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todas')

  const cargar = useCallback(async (p) => {
    try {
      const res = await getAdmin(p)
      setData(res)
      setError('')
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

  if (!data) {
    return (
      <main className="page">
        <section className="step step-gate">
          <img className="logo" src="/atv-logo.png" alt="ATV" width={64} height={76} />
          <p className="eyebrow">Recursos · Panel</p>
          <form className="gate" onSubmit={(e) => { e.preventDefault(); cargar(pin) }}>
            <input className="gate-input" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" autoFocus />
            {error ? <p className="error">{error}</p> : null}
            <button className="btn" disabled={!pin}>Entrar</button>
          </form>
        </section>
      </main>
    )
  }

  const filas = data.solicitudes.filter((s) => filtro === 'todas' || s.area === filtro)
  const exportar = async () => {
    const blob = await downloadCsv(pin)
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: 'solicitudes-recursos.csv' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="admin">
      <header className="admin-head">
        <div>
          <p className="eyebrow">Recursos · Panel</p>
          <h1 className="admin-title">Solicitudes del webinar</h1>
        </div>
        <button className="btn btn-ghost" onClick={exportar}>Exportar CSV</button>
      </header>

      <div className="stats">
        {data.areas.map((a) => (
          <article key={a.area} className="stat">
            <h2>{AREAS[a.area]?.nombre || a.area}</h2>
            <dl>
              <div><dt>Desbloqueos</dt><dd>{a.desbloqueos}</dd></div>
              <div><dt>Formularios</dt><dd>{a.solicitudes}</dd></div>
              <div><dt>WhatsApp</dt><dd>{a.whatsapp}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      <div className="tabs" role="tablist">
        {['todas', ...Object.keys(AREAS)].map((k) => (
          <button key={k} role="tab" aria-selected={filtro === k} className={`chip${filtro === k ? ' is-on' : ''}`} onClick={() => setFiltro(k)}>
            {k === 'todas' ? 'Todas' : AREAS[k].nombre}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Fecha</th><th>Área</th><th>WhatsApp</th><th>Cuello de botella</th><th>Qué intentó</th><th>Tocó wsp</th></tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr><td colSpan={6} className="empty">Todavía no hay solicitudes.</td></tr>
            ) : filas.map((s) => (
              <tr key={s.id}>
                <td className="nowrap">{fecha(s.created_at)}</td>
                <td>{AREAS[s.area]?.nombre || s.area}</td>
                <td className="nowrap">{s.telefono}</td>
                <td>{s.cuello}</td>
                <td className="muted">{s.intento || '—'}</td>
                <td>{s.whatsapp_clicks ? 'Sí' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
