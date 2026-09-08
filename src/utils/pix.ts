/**
 * Official BR Code / Pix EMV Payload Generator (Banco Central do Brasil)
 * Generates genuine CRC16-CCITT EMV "Pix Copia e Cola" strings
 */

export const DEFAULT_PIX_KEY = 'contato@mercadofresco.com.br';
export const DEFAULT_PIX_PHONE_KEY = '11998765432';
export const PIX_RECEIVER_NAME = 'MERCADO FRESCO HORTIFRUTI LTDA';
export const PIX_RECEIVER_CITY = 'SAO PAULO';

/**
 * Calculates standard CRC16-CCITT (0xFFFF) for BR Code standard
 */
function calculateCrc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Generates an authentic BACEN-compliant Pix Copia e Cola code
 */
export function generatePixPayload(
  amount: number,
  orderId: string,
  pixKey: string = DEFAULT_PIX_KEY
): string {
  const formattedAmount = amount.toFixed(2);
  const cleanTxId = (orderId.replace(/[^A-Z0-9]/gi, '') || 'MERCADOFRESCO').slice(0, 25);

  // Merchant Account Info (ID 26)
  const gui = emvField('00', 'BR.GOV.BCB.PIX');
  const keyField = emvField('01', pixKey);
  const merchantAccountInfo = emvField('26', `${gui}${keyField}`);

  // Additional Data Field Template (ID 62) -> Reference Label / txid (ID 05)
  const txIdField = emvField('05', cleanTxId);
  const additionalData = emvField('62', txIdField);

  // Build raw payload without CRC
  const rawPayload =
    emvField('00', '01') + // Payload Format Indicator
    emvField('01', '12') + // Point of Initiation Method (12 = Dynamic QR)
    merchantAccountInfo +
    emvField('52', '0000') + // Merchant Category Code
    emvField('53', '986') + // Transaction Currency (986 = BRL)
    emvField('54', formattedAmount) + // Transaction Amount
    emvField('58', 'BR') + // Country Code
    emvField('59', PIX_RECEIVER_NAME.slice(0, 25)) + // Merchant Name
    emvField('60', PIX_RECEIVER_CITY.slice(0, 15)) + // Merchant City
    additionalData +
    '6304'; // CRC16 Header

  const checksum = calculateCrc16(rawPayload);
  return `${rawPayload}${checksum}`;
}

/**
 * Generates a clean QR Code Image URL for scanning
 */
export function getPixQrCodeImageUrl(pixPayload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=svg&data=${encodeURIComponent(
    pixPayload
  )}`;
}
