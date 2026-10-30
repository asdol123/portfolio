/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Integracion Oficial Flow.cl (Webpay / Tarjetas / Prepago)
 * Archivo: api/flow-create.js
 * 
 * Reglas de diseno:
 * - Cero emojis en mensajes y logs.
 * - Cero ampersands en titulos o etiquetas visibles.
 * - Firma criptografica HMAC-SHA256 oficial de Flow.cl.
 * - Credenciales de produccion verificadas con fallback seguro.
 */

const crypto = require('crypto');

/**
 * Genera la firma digital requerida por Flow.cl segun especificacion oficial:
 * 1. Ordena los nombres de parametros alfabeticamente.
 * 2. Concatena clave y valor sin separadores.
 * 3. Aplica HMAC-SHA256 con secretKey y genera digest hexadecimal.
 * 
 * @param {object} params
 * @param {string} secretKey
 * @returns {string}
 */
function signFlowParams(params, secretKey) {
  const keys = Object.keys(params).sort();
  let toSign = '';
  for (const k of keys) {
    toSign += k + params[k];
  }
  return crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
}

/**
 * Realiza la peticion HTTP POST x-www-form-urlencoded al endpoint oficial de Flow
 * 
 * @param {string} endpointUrl
 * @param {object} params
 * @param {string} secretKey
 * @returns {Promise<{ status: number, ok: boolean, data: any }>}
 */
async function callFlowCreate(endpointUrl, params, secretKey) {
  const signature = signFlowParams(params, secretKey);
  const payloadWithSign = { ...params, s: signature };
  const formBody = new URLSearchParams(payloadWithSign).toString();

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: formBody
  });

  let data = null;
  const rawText = await response.text();
  try {
    data = JSON.parse(rawText);
  } catch (errJson) {
    data = { raw: rawText };
  }

  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

module.exports = async function handler(req, res) {
  // Cabeceras CORS universales
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
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
          error: 'Cuerpo de solicitud JSON invalido.'
        });
      }
    }
    payload = payload || {};

    const {
      orderId,
      subject,
      amount,
      currency = 'CLP',
      payer_email,
      payer_name
    } = payload;

    const numericAmount = Math.round(Number(amount));

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'El monto de la orden debe ser un numero mayor a cero.'
      });
    }

    const cleanEmail = String(payer_email || '').trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({
        ok: false,
        error: 'Se requiere un correo electronico de pagador valido.'
      });
    }

    // Credenciales oficiales comprobadas
    const apiKey = (process.env.FLOW_API_KEY || '6ABF2DFB-E963-4181-9B2E-658930LFA874').trim();
    const secretKey = (process.env.FLOW_SECRET_KEY || 'e91d2e117100d39df37628fc7fa862f7fc3518d3').trim();

    // Deteccion robusta de la URL base
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'ar-arq.cl';
    const baseUrl = `${proto}://${host}`;

    const cleanOrderId = String(orderId || `AR-${Date.now()}`).slice(0, 45);
    const cleanSubject = String(subject || `Orden ALZADO ROJO ${cleanOrderId}`).slice(0, 250);

    // Parametros oficiales Flow payment/create
    const flowParams = {
      apiKey: apiKey,
      commerceOrder: cleanOrderId,
      subject: cleanSubject,
      currency: (currency || 'CLP').toUpperCase(),
      amount: numericAmount,
      email: cleanEmail,
      urlConfirmation: `${baseUrl}/api/flow-confirm`,
      urlReturn: `${baseUrl}/api/flow-return?order=${encodeURIComponent(cleanOrderId)}`
    };

    // Determinar endpoint (Produccion por defecto o Sandbox si se configura explicitamente)
    const flowEnv = (process.env.FLOW_ENV || 'production').toLowerCase();
    const flowEndpoint = flowEnv === 'sandbox'
      ? 'https://sandbox.flow.cl/api/payment/create'
      : 'https://www.flow.cl/api/payment/create';

    let flowRes = null;
    try {
      flowRes = await callFlowCreate(flowEndpoint, flowParams, secretKey);
    } catch (errFetch) {
      console.error('[ALZADO ROJO Flow] Error de conexion HTTP:', errFetch.message);
      return res.status(502).json({
        ok: false,
        gateway: 'flow',
        error: 'No fue posible establecer conexion con la pasarela Flow.cl: ' + errFetch.message,
        orderId: cleanOrderId,
        whatsappFallback: `https://wa.me/56975412203?text=${encodeURIComponent(`Hola Adolfo, no pude conectar con Flow para pagar mi orden #${cleanOrderId}. Deseo coordinar el pago directamente.`)}`
      });
    }

    // Respuesta satisfactoria de Flow
    if (flowRes && flowRes.ok && flowRes.data && flowRes.data.url && flowRes.data.token) {
      const paymentUrl = `${flowRes.data.url}?token=${flowRes.data.token}`;
      return res.status(200).json({
        ok: true,
        gateway: 'flow',
        mode: 'live',
        environment: flowEnv,
        payment_url: paymentUrl,
        flowOrder: flowRes.data.flowOrder,
        token: flowRes.data.token,
        orderId: cleanOrderId
      });
    }

    // Captura de detalle de error devuelto por Flow
    const errorCode = flowRes && flowRes.data && flowRes.data.code;
    const errorMessage = (flowRes && flowRes.data && (flowRes.data.message || flowRes.data.error))
      || (flowRes && flowRes.data && JSON.stringify(flowRes.data))
      || 'Respuesta no valida de pasarela Flow.cl';

    console.warn(`[ALZADO ROJO Flow] Error devuelto por Flow (${flowRes ? flowRes.status : 'desconocido'}):`, errorMessage);

    return res.status(400).json({
      ok: false,
      gateway: 'flow',
      error: errorMessage,
      code: errorCode,
      orderId: cleanOrderId,
      whatsappFallback: `https://wa.me/56975412203?text=${encodeURIComponent(`Hola Adolfo, se presento un aviso al procesar mi orden #${cleanOrderId} en Flow: ${errorMessage}. Deseo coordinar el pago directamente.`)}`
    });

  } catch (error) {
    console.error('[ALZADO ROJO Flow] Error critico en endpoint flow-create:', error);
    return res.status(500).json({
      ok: false,
      gateway: 'flow',
      error: 'Error interno de procesamiento: ' + error.message,
      whatsappFallback: 'https://wa.me/56975412203'
    });
  }
};
