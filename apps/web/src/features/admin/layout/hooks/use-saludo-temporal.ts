interface SaludoTemporal {
  readonly saludo: string
  readonly fechaLarga: string
}

const HORA_INICIO_TARDE = 12
const HORA_INICIO_NOCHE = 19

export function useSaludoTemporal(): SaludoTemporal {
  const ahora = new Date()
  const hora = ahora.getHours()

  let saludo: string
  if (hora < HORA_INICIO_TARDE) {
    saludo = "Buenos días"
  } else if (hora < HORA_INICIO_NOCHE) {
    saludo = "Buenas tardes"
  } else {
    saludo = "Buenas noches"
  }

  const fechaLarga = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(ahora)

  return { saludo, fechaLarga }
}
