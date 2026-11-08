/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Integracion Oficial Payku Chile (Produccion Oficial)
 * Archivo: api/payku-create.js
 * 
 * Reglas tecnicas y de seguridad:
 * - Operacion 100% Produccion Oficial: https://app.payku.cl (cero simuladores, cero sandbox).
 * - Cero emojis en mensajes y logs.
 * - Cero ampersands en titulos o etiquetas visibles.
 * - Credenciales oficiales de AR ARQ SpA:
 *   Token Publico: tkpudcb500cf54f5ab35609572ce31f2
 *   Token Privado: tkpic31267f96187c8cbc563cafc1f57
 * - Autenticacion verificada: Payku POST /api/transaction con Authorization Bearer y X-Token-Public.
 * - Si la API de Payku no responde satisfactoriamente, devuelve error HTTP claro con fallback inmediato
 *   a Transferencia Bancaria Directa (Banco Bci) y WhatsApp oficial (+56 9 6203 2766).
 */

const OFFICIAL_PHONE = '56962032766';
const OFFICIAL_EMAIL = 'adolchilemods@gmail.com';

// Credenciales oficiales de produccion AR ARQ SpA en Payku Chile
const OFFICIAL_PUBLIC_TOKEN = 'tkpudcb500cf54f5ab35609572ce31f2';
const OFFICIAL_PRIVATE_TOKEN = 'tkpic31267f96187c8cbc563cafc1f57';

// Datos bancarios oficiales para fallback inmediato por transferencia directa
const BANK_DETAILS = {
  accountHolder: 'Ar Arq Spa',
  rut: '78.516.116-5',
  bank: 'Banco Bci',
  accountType: 'Cuenta corriente en pesos',
  accountNumber: '71897223',
  email: OFFICIAL_EMAIL
};

const PAYKU_PRODUCTION_BASE_URL = 'https://app.payku.cl';

/**
 * Obtiene la configuracion activa de Payku en produccion
 */
function getPaykuConfig() {
  const tokenPublic = (process.env.PAYKU_TOKEN_PUBLIC || OFFICIAL_PUBLIC_TOKEN).trim();
  const tokenSecret = (process.env.PAYKU_TOKEN_PRIVATE || process.env.PAYKU_TOKEN_SECRET || OFFICIAL_PRIVATE_TOKEN).trim();

  return {
    tokenPublic,
    tokenSecret,
    baseUrl: PAYKU_PRODUCTION_BASE_URL
  };
}

/**
 * Valida si el token configurado tiene el formato oficial de Payku
 * @param {string} token
 * @returns {boolean}
 */
function isRealToken(token) {
  if (!token) return false;
  const clean = token.trim();
  return clean.length >= 10 && !clean.includes('sandbox');
}

module.exports = async function handler(req, res) {
  // Cabeceras CORS universales y seguras
  const origin = req.headers.origin;
  if (origin && origin !== 'null') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      gateway: 'payku',
      error: 'Metodo no permitido. Se requiere POST.'
    });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (errParse) {
        return res.status(400).json({
          ok: false,
          gateway: 'payku',
          error: 'Cuerpo de solicitud JSON invalido.'
        });
      }
    }
    payload = payload || {};

    const {
      orderId,
      subject,
      amount,
      payer_email,
      payer_name,
      return_url,
      cancel_url
    } = payload;

    const numericAmount = Math.round(Number(amount));
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        ok: false,
        gateway: 'payku',
        error: 'El monto de la orden debe ser un numero mayor a cero.'
      });
    }

    const cleanEmail = String(payer_email || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({
        ok: false,
        gateway: 'payku',
        error: 'Se requiere un correo electronico de pagador valido.'
      });
    }

    // Resolucion dinamica de URLs absolutas para retornos y notificaciones
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'ar-arq.cl';
    const baseUrlApp = `${proto}://${host}`;

    const cleanOrderId = String(orderId || `AR-${Date.now()}`).slice(0, 45);
    const cleanSubject = String(subject || `Orden ALZADO ROJO ${cleanOrderId}`).slice(0, 250);
    const cleanPayerName = String(payer_name || 'Cliente ALZADO ROJO').slice(0, 100);

    const defaultReturnUrl = `${baseUrlApp}/api/payku-return?order=${encodeURIComponent(cleanOrderId)}`;
    const defaultCancelUrl = `${baseUrlApp}/maquetas-urbanas.html?payku_status=cancelled&order=${encodeURIComponent(cleanOrderId)}`;
    const notifyUrl = `${baseUrlApp}/api/payku-confirm`;

    const finalReturnUrl = return_url || defaultReturnUrl;
    const finalCancelUrl = cancel_url || defaultCancelUrl;

    const config = getPaykuConfig();
    const hasRealCreds = isRealToken(config.tokenPublic);

    if (!hasRealCreds) {
      console.warn('[ALZADO ROJO Payku] Token publico de produccion no valido en servidor.');
      return res.status(503).json({
        ok: false,
        gateway: 'payku',
        error: 'Pasarela de pagos en mantencion o configuracion. Por favor transfiera a Banco Bci o coordine via WhatsApp oficial.',
        orderId: cleanOrderId,
        bankDetails: BANK_DETAILS,
        whatsappFallback: `https://wa.me/${OFFICIAL_PHONE}?text=${encodeURIComponent(`Hola Adolfo, deseo pagar mi orden #${cleanOrderId} por transferencia bancaria directa (Banco Bci).`)}`
      });
    }

    // API Oficial Payku Produccion (POST https://app.payku.cl/api/transaction)
    const transactionEndpoint = `${config.baseUrl}/api/transaction`;
    const paykuBody = {
      email: cleanEmail,
      order: cleanOrderId,
      subject: cleanSubject,
      amount: numericAmount,
      urlreturn: finalReturnUrl,
      urlnotify: notifyUrl,
      payment: 1 // 1: Webpay Plus / Tarjetas de debito y credito
    };

    let apiResponse = null;
    let rawText = '';

    try {
      // 1. Intento primario con Token Publico de Produccion
      apiResponse = await fetch(transactionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${config.tokenPublic}`,
          'X-Token-Public': config.tokenPublic
        },
        body: JSON.stringify(paykuBody)
      });
      rawText = await apiResponse.text();

      // 2. Si Payku responde 401, reintentar con Token Privado
      if (apiResponse.status === 401 && config.tokenSecret && config.tokenSecret !== config.tokenPublic) {
        console.warn('[ALZADO ROJO Payku] 401 con Token Publico. Reintentando con Token Privado...');
        apiResponse = await fetch(transactionEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${config.tokenSecret}`
          },
          body: JSON.stringify(paykuBody)
        });
        rawText = await apiResponse.text();
      }
    } catch (errFetch) {
      console.error('[ALZADO ROJO Payku] Error de conexion con Payku API Produccion:', errFetch.message);

      return res.status(502).json({
        ok: false,
        gateway: 'payku',
        error: 'No fue posible establecer comunicacion con la pasarela Payku Chile: ' + errFetch.message,
        orderId: cleanOrderId,
        bankDetails: BANK_DETAILS,
        whatsappFallback: `https://wa.me/${OFFICIAL_PHONE}?text=${encodeURIComponent(`Hola Adolfo, se presento un aviso de conexion con Payku para la orden #${cleanOrderId}. Deseo pagar por transferencia bancaria directa a Banco Bci.`)}`
      });
    }

    let parsedData = null;
    try {
      parsedData = JSON.parse(rawText);
    } catch (eParse) {
      parsedData = { raw: rawText };
    }

    // Evaluacion de exito en Payku API de Produccion
    const paymentUrl = parsedData && (parsedData.url || parsedData.payment_url);
    if (apiResponse && apiResponse.ok && paymentUrl) {
      return res.status(200).json({
        ok: true,
        gateway: 'payku',
        sandbox: false,
        payment_url: paymentUrl,
        token: parsedData.token || parsedData.id || parsedData.transaction_key,
        orderId: cleanOrderId,
        amount: numericAmount
      });
    }

    // Si la pasarela oficial respondio con error o no entrego url de pago
    console.warn(`[ALZADO ROJO Payku] Respuesta no satisfactoria (${apiResponse ? apiResponse.status : 'desconocido'}):`, rawText);

    const errorMessage = (parsedData && (parsedData.message_error || parsedData.message || parsedData.error || parsedData.detail))
      || 'Respuesta no valida de la pasarela oficial Payku Chile.';

    return res.status(400).json({
      ok: false,
      gateway: 'payku',
      error: errorMessage,
      orderId: cleanOrderId,
      bankDetails: BANK_DETAILS,
      whatsappFallback: `https://wa.me/${OFFICIAL_PHONE}?text=${encodeURIComponent(`Hola Adolfo, se presento un aviso al procesar mi orden #${cleanOrderId} en Payku: ${errorMessage}. Deseo coordinar el pago por transferencia a Banco Bci.`)}`
    });

  } catch (error) {
    console.error('[ALZADO ROJO Payku] Error critico en endpoint payku-create:', error);
    return res.status(500).json({
      ok: false,
      gateway: 'payku',
      error: 'Error interno de procesamiento: ' + error.message,
      bankDetails: BANK_DETAILS,
      whatsappFallback: `https://wa.me/${OFFICIAL_PHONE}?text=${encodeURIComponent('Hola Adolfo, deseo coordinar el pago de mi orden por transferencia a Banco Bci.')}`
    });
  }
};
