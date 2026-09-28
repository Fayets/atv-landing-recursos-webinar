export const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, { method = 'GET', body, pin } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (pin) headers['X-Admin-Pin'] = pin
  const res = await fetch(`${BASE}${path}`, {
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

export const crearSolicitud = (area, body) =>
  request(`/api/recursos/${area}/solicitudes`, { method: 'POST', body }).then((r) => r.json())

// El click se cuenta en el server, que después redirige a wa.me.
export function whatsappHref(area, solicitudId, recurso) {
  const params = new URLSearchParams()
  if (solicitudId) params.set('s', solicitudId)
  if (recurso) params.set('r', recurso)
  const qs = params.toString()
  return `${BASE}/api/recursos/${area}/whatsapp${qs ? `?${qs}` : ''}`
}

export const getAdmin = (pin) => request('/api/admin/solicitudes', { pin }).then((r) => r.json())
export const downloadCsv = (pin) => request('/api/admin/solicitudes.csv', { pin }).then((r) => r.blob())
