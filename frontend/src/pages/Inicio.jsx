import { Link } from 'react-router-dom'
import { AREAS } from '../content/areas.js'

// La raíz no la comparte nadie: los QR van directo a cada área. Esto es por si alguien la abre.
export default function Inicio() {
  return (
    <main className="page">
      <div className="glow" aria-hidden="true" />
      <section className="step step-gate">
        <img className="logo" src="/atv-logo.png" alt="ATV" width={88} height={104} />
        <p className="eyebrow">Recursos del webinar</p>
        <h1 className="title">Elegí tu área</h1>
        <nav className="areas">
          {Object.entries(AREAS).map(([slug, a]) => (
            <Link key={slug} to={`/${slug}`} className="btn btn-ghost">{a.nombre}</Link>
          ))}
        </nav>
      </section>
    </main>
  )
}
