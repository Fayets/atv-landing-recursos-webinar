import { Lock } from './Icons.jsx'

// Las portadas reales de los 5 SOPs flotando a los costados, desenfocadas:
// en el home, oscuras y sin candado; en el formulario, con candado. Posiciones en recursos.css (.rc-side--1 … --5).

export function SopSides({ sops, mobile = true, home = false }) {
  const clase = ['rc-sides', !mobile && 'rc-sides--desktop', home && 'rc-sides--home'].filter(Boolean).join(' ')
  return (
    <div className={clase} aria-hidden="true">
      {sops.map((sop, i) => (
        <div key={sop.titulo} className={`rc-side rc-side--${i + 1}`}>
          <img src={sop.imagen} alt="" />
          {home ? null : <span className="rc-side__lock"><Lock size={16} /></span>}
        </div>
      ))}
    </div>
  )
}
