import { DOLAR_API_URL } from '@/constants'

interface DolarApiResponse {
  moneda: string
  casa: string
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}

export async function fetchCryptoDollarRate(): Promise<number> {
  const response = await fetch(DOLAR_API_URL)
  if (!response.ok) {
    throw new Error(`Error al obtener el tipo de cambio: ${response.status}`)
  }
  const data: DolarApiResponse = await response.json()
  // Usamos el promedio entre compra y venta
  return (data.compra + data.venta) / 2
}
