import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { crearSolicitud, unlock, whatsappHref } from '../api.js'
import { Lock, WhatsApp } from '../components/Icons.jsx'
import { SopSides } from '../components/SopPreview.jsx'
import { AREAS } from '../content/areas.js'
import { guardarProgreso, leerProgreso } from '../lib/progreso.js'

export default function Recurso() {
  const { area } = useParams()
  const info = AREAS[area]
  const [progreso, setProgreso] = useState(() => leerProgreso(area))

  if (!info) return <Navigate to="/" replace />

  const avanzar = (cambios) => {
    setProgreso(guardarProgreso(area, cambios))
    window.scrollTo(0, 0)
  }

  // Sin pase firmado no hay acceso: el viejo { desbloqueado: true } ya no alcanza.
  if (!progreso.token) {
    return <Contrasena area={area} info={info} aviso={progreso.aviso} onOk={(token) => setProgreso(guardarProgreso(area, { token, aviso: '' }))} />
  }
  return (
    <div className="rc-root">
      <header className="rc-head">
        <img src="/atv-logo.png" alt="ATV" width={22} height={28} />
      </header>
      {progreso.solicitudId ? null : <SopSides sops={info.sops} mobile={false} />}
      {progreso.solicitudId ? (
        <Sops area={area} info={info} solicitudId={progreso.solicitudId} token={progreso.token} />
      ) : (
        <Formulario
          area={area}
          info={info}
          token={progreso.token}
          onOk={(id) => avanzar({ solicitudId: id })}
          onVencido={(aviso) => setProgreso(guardarProgreso(area, { token: '', aviso }))}
        />
      )}
    </div>
  )
}

// El textarea se estira con lo que se escribe, en vez de mostrar scroll.
function crecer(el) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight + 2}px`
}

function Spinner() {
  return <span className="rc-spin" aria-hidden="true" />
}

function Contrasena({ area, info, aviso, onOk }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(aviso || '')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await unlock(area, password)
      onOk(token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rc-root rc-center">
      <div className="rc-light" aria-hidden="true" />
      <SopSides sops={info.sops} home />
      <main className="rc-panel">
        <form className="rc-gate" onSubmit={onSubmit} noValidate>
          <img src="/atv-logo.png" alt="ATV" className="rc-logo" width={56} height={73} />
          <h1 className="rc-title">
            Desbloqueá los recursos de <em>{info.nombre}</em>
          </h1>
          {error ? <p className="rc-error" role="alert">{error}</p> : null}
          <div className="rc-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className={`rc-input rc-input--code${error ? ' is-invalid' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError('')
              }}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={loading}
            />
          </div>
          <button className="rc-submit" disabled={loading || !password.trim()}>
            {loading ? <Spinner /> : <Lock size={16} />}
            {loading ? 'Verificando…' : 'Desbloquear'}
          </button>
        </form>
      </main>
    </div>
  )
}

function Formulario({ area, info, token, onOk, onVencido }) {
  const [telefono, setTelefono] = useState('')
  const [cuello, setCuello] = useState('')
  const [otro, setOtro] = useState('')
  const [intento, setIntento] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const cuelloFinal = cuello === 'Otro' ? otro.trim() : cuello
  const listo = telefono.replace(/\D/g, '').length >= 8 && cuelloFinal

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { id } = await crearSolicitud(area, { telefono, cuello: cuelloFinal, intento }, token)
      onOk(id)
    } catch (err) {
      if (err.status === 401) return onVencido(err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="rc-main">
      <h1 className="rc-title">
        Te voy a dar mis <em>mejores 5 SOPs</em> para solucionar tu problema
      </h1>

      <form className="rc-form" onSubmit={onSubmit} noValidate>
        <div className="rc-field">
          <label htmlFor="telefono"><span className="rc-num">1</span>Tu WhatsApp</label>
          <input
            id="telefono"
            className="rc-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+54 9 11 1234 5678"
          />
          <small className="rc-hint">Ahí te enviamos los SOPs.</small>
        </div>

        <fieldset className="rc-field">
          <legend><span className="rc-num">2</span>¿Cuál es tu cuello de botella?</legend>
          <div className="rc-options">
            {[...info.cuellos, 'Otro'].map((opcion) => (
              <button
                type="button"
                key={opcion}
                className={`rc-option${cuello === opcion ? ' is-on' : ''}`}
                aria-pressed={cuello === opcion}
                onClick={() => setCuello(opcion)}
              >
                <span className="rc-radio" aria-hidden="true" />
                {opcion}
              </button>
            ))}
          </div>
          {cuello === 'Otro' ? (
            <input
              className="rc-input"
              value={otro}
              onChange={(e) => setOtro(e.target.value)}
              placeholder="Contanos cuál"
              maxLength={300}
              autoFocus
            />
          ) : null}
        </fieldset>

        <div className="rc-field">
          <label htmlFor="intento"><span className="rc-num">3</span>¿Qué intentaste hasta ahora?</label>
          <textarea
            id="intento"
            className="rc-input"
            rows={3}
            value={intento}
            onChange={(e) => {
              setIntento(e.target.value)
              crecer(e.target)
            }}
            placeholder="Ej: probé con anuncios, contraté un setter…"
            maxLength={2000}
          />
        </div>

        {error ? <p className="rc-error" role="alert">{error}</p> : null}
        <button className="rc-submit" disabled={loading || !listo}>
          {loading ? <Spinner /> : null}
          {loading ? 'Enviando…' : 'Listo'}
        </button>
      </form>
    </main>
  )
}

function Sops({ area, info, solicitudId, token }) {
  const href = whatsappHref(area, solicitudId, undefined, token)
  return (
    <main className="rc-main rc-main--wide">
      <h1 className="rc-title">
        Tus SOPs de <em>{info.nombre}</em> están listos
      </h1>
      <p className="rc-sub">Tocá cualquiera para desbloquearlo por WhatsApp.</p>

      <div className="rc-sops">
        {info.sops.map((sop, i) => (
          <a
            key={sop.titulo}
            className={`rc-sop${sop.imagen ? ' rc-sop--cover' : ''}`}
            href={whatsappHref(area, solicitudId, sop.titulo, token)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Desbloquear ${sop.titulo} por WhatsApp`}
            style={{ '--i': i }}
          >
            {sop.imagen ? (
              <>
                <img className="rc-sop__cover" src={sop.imagen} alt="" loading="lazy" />
                <span className="rc-sop__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="rc-sop__name">{sop.titulo}</span>
              </>
            ) : (
              <>
                <span className="rc-sop__num">{String(i + 1).padStart(2, '0')}</span>
                <div className="rc-sop__body" aria-hidden="true">
                  <span className="rc-sop__title">{sop.titulo}</span>
                  <span className="rc-sop__line" />
                  <span className="rc-sop__line" />
                  <span className="rc-sop__line rc-sop__line--short" />
                  <span className="rc-sop__line" />
                  <span className="rc-sop__line rc-sop__line--short" />
                </div>
              </>
            )}
            <span className="rc-sop__lock"><Lock size={16} /></span>
          </a>
        ))}
      </div>

      <a className="rc-submit rc-submit--light" href={href} target="_blank" rel="noopener noreferrer">
        <WhatsApp size={18} />
        Desbloquear por WhatsApp
      </a>
    </main>
  )
}
