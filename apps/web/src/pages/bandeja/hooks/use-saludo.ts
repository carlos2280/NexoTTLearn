interface Saludo {
  readonly saludo: string
}

const HORA_INICIO_TARDE = 12
const HORA_INICIO_NOCHE = 19

export function useSaludo(): Saludo {
  const hora = new Date().getHours()
  if (hora < HORA_INICIO_TARDE) {
    return { saludo: "Buenos días" }
  }
  if (hora < HORA_INICIO_NOCHE) {
    return { saludo: "Buenas tardes" }
  }
  return { saludo: "Buenas noches" }
}
