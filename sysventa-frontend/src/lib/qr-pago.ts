/**
 * Genera QR en formato EMVCo MPM compatible con Yape.
 * Yape reconoce el GUID 'pe.com.yape.app' y número en formato +51XXXXXXXXX.
 */

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function emv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, '0')}${value}`
}

/**
 * @param phone  Número de celular (9 dígitos, sin prefijo — se agrega +51 automáticamente)
 * @param amount Monto exacto a cobrar
 * @param nombre Nombre del negocio (máx 25 caracteres)
 */
export function generarQRPago(phone: string, amount: number, nombre = 'NEGOCIO'): string {
  // Normalizar número: quitar +51 o 51 si ya viene con prefijo, luego agregar +51
  const digits = phone.replace(/^\+?51/, '')
  const fullPhone = `+51${digits}`

  // Campo 26 – Merchant Account Information (GUID oficial Yape)
  const mai =
    emv('00', 'pe.com.yape.app') +
    emv('01', fullPhone)

  let payload = ''
  payload += emv('00', '01')                       // Payload Format Indicator
  payload += emv('01', '12')                       // 12 = QR dinámico (monto incluido)
  payload += emv('26', mai)                        // Merchant Account Info
  payload += emv('52', '0000')                     // Merchant Category Code
  payload += emv('53', '604')                      // Moneda: 604 = Soles (PEN)
  payload += emv('54', amount.toFixed(2))          // Monto
  payload += emv('58', 'PE')                       // País
  payload += emv('59', nombre.slice(0, 25))        // Nombre del negocio
  payload += emv('60', 'LIMA')                     // Ciudad
  payload += '6304'                                // Tag CRC

  return payload + crc16(payload)
}
