// Dónde quedó cada persona en cada área. Si vuelve a escanear el QR, retoma desde ahí.
const key = (area) => `recursos:${area}`

export function leerProgreso(area) {
  try {
    return JSON.parse(localStorage.getItem(key(area))) || {}
  } catch {
    return {}
  }
}

export function guardarProgreso(area, cambios) {
  const actual = { ...leerProgreso(area), ...cambios }
  try {
    localStorage.setItem(key(area), JSON.stringify(actual))
  } catch {
    /* sin storage: funciona igual, solo no recuerda */
  }
  return actual
}
