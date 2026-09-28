export const BASE = import.meta.env.VITE_API_BASE_URL || ''

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

// Con todo el webinar entrando a la vez, un corte de red o un 502/503/504 puntual no
// tiene que llegarle a la persona: se reintenta dos veces antes de mostrar el error.
// El 429 es el límite de pedidos del nginx: esperar un segundo alcanza.
async function fetchConReintento(url, init) {
  const pausas = [700, 1800]
  for (let intento = 0; ; intento++) {
    try {
      const res = await fetch(url, init)
      if (![429, 502, 503, 504].includes(res.status) || intento >= pausas.length) return res
    } catch (err) {
      if (intento >= pausas.length) throw new Error('Se cortó la conexión. Probá de nuevo.', { cause: err })
    }
    await esperar(pausas[intento])
  }
}

async function request(path, { method = 'GET', body, pin, token } = {}) {
  const headers = {}
  if (token) headers['X-Recursos-Token'] = token
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (pin) headers['X-Admin-Pin'] = pin
  const res = await fetchConReintento(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let detail = 'No se pudo conectar con el servidor.'
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') detail = data.detail
      else if (res.status === 422) detail = 'Revisá los datos: falta completar algo.'
    } catch {
      /* respuesta sin JSON */
    }
    const error = new Error(detail)
    error.status = res.status
    throw error
  }
  return res
}

export const unlock = (area, password) =>
  request(`/api/recursos/${area}/unlock`, { method: 'POST', body: { password } }).then((r) => r.json())

export const crearSolicitud = (area, body, token) =>
  request(`/api/recursos/${area}/solicitudes`, { method: 'POST', body, token }).then((r) => r.json())

// El click se cuenta en el server, que después redirige a wa.me.
export function whatsappHref(area, solicitudId, recurso, token) {
  const params = new URLSearchParams()
  if (solicitudId) params.set('s', solicitudId)
  if (token) params.set('t', token)
  if (recurso) params.set('r', recurso)
  const qs = params.toString()
  return `${BASE}/api/recursos/${area}/whatsapp${qs ? `?${qs}` : ''}`
}

// Los SOPs gratis: el server valida pase y formulario y recién ahí redirige al documento.
export function gratisHref(area, solicitudId, recurso, token) {
  const params = new URLSearchParams({ r: recurso })
  if (solicitudId) params.set('s', solicitudId)
  if (token) params.set('t', token)
  return `${BASE}/api/recursos/${area}/gratis?${params}`
}

export const getAdmin = (pin) => request('/api/admin/solicitudes', { pin }).then((r) => r.json())
export const resetDatos = (pin) => request('/api/admin/reset', { method: 'POST', pin }).then((r) => r.json())
export const downloadCsv = (pin) => request('/api/admin/solicitudes.csv', { pin }).then((r) => r.blob())
