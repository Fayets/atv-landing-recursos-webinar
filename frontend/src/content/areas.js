// Las tres landings: recursos.atvos.io/marketing, /ventas y /back-end.
// Los 5 SOPs de cada área, con la portada real del entregable desenfocada detrás del candado.
// Salen del doc maestro de SOPs; las capturas viven en public/sops/.

export const AREAS = {
  marketing: {
    nombre: 'Marketing',
    cuellos: [
      'No sé qué contenido publicar',
      'Publico pero no genero leads',
      'No puedo delegar la creación de contenido',
      'Mi contenido no llega a suficiente gente',
      'No tengo sistema de contenido',
    ],
        sops: [
      { titulo: 'SOP: Laboratorio de Contenido', imagen: '/sops/marketing-laboratorio.jpg' },
      { titulo: 'Sistema de Generación de Leads', imagen: '/sops/marketing-leads.jpg' },
      { titulo: 'SOP: Cómo Crear Reels', imagen: '/sops/marketing-reels.jpg' },
      { titulo: 'SOP: Videos de YouTube', imagen: '/sops/marketing-youtube.jpg' },
      { titulo: 'SOP: Calendario de Contenido', imagen: '/sops/marketing-calendario.jpg' },
    ],
  },
  ventas: {
    nombre: 'Ventas',
    cuellos: [
      'No tengo suficientes llamadas agendadas',
      'Las leads no se presentan a la call',
      'No cierro suficiente',
      'No puedo delegar las ventas',
      'No tengo proceso de seguimiento',
    ],
    sops: [
      { titulo: 'Laboratorio de Ventas', imagen: '/sops/ventas-laboratorio.jpg' },
      { titulo: 'Estándar de Equipo de Ventas', imagen: '/sops/ventas-estandar.jpg' },
      { titulo: 'Rol y Responsabilidades del Director de Ventas', imagen: '/sops/ventas-director.jpg' },
      { titulo: 'Reporte de Calls', imagen: '/sops/ventas-reporte.jpg' },
      { titulo: 'Hábitos del Closer', imagen: '/sops/ventas-habitos.jpg' },
    ],
  },
  'back-end': {
    nombre: 'Back-end',
    cuellos: [
      'No tengo claro cómo está estructurado mi negocio',
      'No sé si mi producto es el correcto',
      'No conozco bien a mi audiencia',
      'No puedo medir mi negocio',
      'No tengo diagnóstico claro de dónde estoy parado',
    ],
    sops: [
      { titulo: 'SOP: Diagnóstico de Negocio', imagen: '/sops/backend-diagnostico.jpg' },
      { titulo: 'SOP: Diagnóstico de Capas de Negocio', imagen: '/sops/backend-capas.jpg' },
      { titulo: 'SOP: Lectura y Acción en Ciclos de Mercado', imagen: '/sops/backend-ciclos.jpg' },
      { titulo: 'Prompt: Análisis de Investigación de Audiencia', imagen: '/sops/backend-audiencia.jpg' },
      { titulo: 'SOP: Auditoría de Producto', imagen: '/sops/backend-auditoria.jpg' },
    ],
  },
}
