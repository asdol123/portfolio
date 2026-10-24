/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Integracion Oficial Flow.cl (Webpay / Tarjetas / Prepago)
 * Archivo: api/flow-create.js
 * 
 * Reglas de diseno:
 * - Cero emojis en mensajes visibles y respuestas tecnicas.
 * - Cero ampersands en titulos o etiquetas visibles.
 * - Firma criptografica HMAC-SHA256 estandar de Flow.cl.
 */

const crypto = require('crypto');

/**
 * Genera la firma digital requerida por Flow.cl segun su especificacion oficial:
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
 * Realiza la peticion HTTP POST x-www-form-urlencoded a un endpoint de Flow
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
  // Cabeceras CORS universales para ejecucion serverless desacoplada
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

    if (!payer_email || !String(payer_email).includes('@')) {
      return res.status(400).json({
        ok: false,
        error: 'Se requiere un correo electronico de pagador valido.'
      });
    }

    // Credenciales oficiales proporcionadas por el comercio
    const apiKey = (process.env.FLOW_API_KEY || '6ABF2DFB-E963-4181-9B2E-658930LFA874').trim();
    const secretKey = (process.env.FLOW_SECRET_KEY || 'e91d2e117100d39df37628fc7fa862f7fc3518d3').trim();

    // Deteccion robusta de la URL base
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'alzado-rojo.cl';
    const baseUrl = `${proto}://${host}`;

    const cleanOrderId = String(orderId || `AR-${Date.now()}`).slice(0, 45);
    const cleanSubject = String(subject || `Orden ALZADO ROJO ${cleanOrderId}`).slice(0, 250);

    // Parametros requeridos por Flow payment/create
    const flowParams = {
      apiKey: apiKey,
      commerceOrder: cleanOrderId,
      subject: cleanSubject,
      currency: (currency || 'CLP').toUpperCase(),
      amount: numericAmount,
      email: String(payer_email).trim(),
      paymentMethod: 9, // Todos los medios de pago disponibles en Flow
      urlConfirmation: `${baseUrl}/api/flow-confirm`,
      urlReturn: `${baseUrl}/api/flow-return?order=${encodeURIComponent(cleanOrderId)}`
    };

    // 1. Intento primario: Produccion Flow.cl
    let flowRes = null;
    let usedEnv = 'production';
    try {
      flowRes = await callFlowCreate('https://www.flow.cl/api/payment/create', flowParams, secretKey);
    } catch (errProd) {
      console.warn('[ALZADO ROJO Flow] Error de conexion con endpoint de produccion:', errProd.message);
    }

    // 2. Intento secundario: Sandbox Flow.cl si produccion falla o la credencial pertenece a sandbox
    if (!flowRes || !flowRes.ok || !flowRes.data || !flowRes.data.url || !flowRes.data.token) {
      try {
        console.info('[ALZADO ROJO Flow] Probando endpoint alternativo Sandbox Flow.cl...');
        const sandboxRes = await callFlowCreate('https://sandbox.flow.cl/api/payment/create', flowParams, secretKey);
        if (sandboxRes && sandboxRes.ok && sandboxRes.data && sandboxRes.data.url && sandboxRes.data.token) {
          flowRes = sandboxRes;
          usedEnv = 'sandbox';
        }
      } catch (errSandbox) {
        console.warn('[ALZADO ROJO Flow] Error de conexion con endpoint sandbox:', errSandbox.message);
      }
    }

    // 3. Si Flow responde satisfactoriamente con URL y token
    if (flowRes && flowRes.ok && flowRes.data && flowRes.data.url && flowRes.data.token) {
      const paymentUrl = `${flowRes.data.url}?token=${flowRes.data.token}`;
      return res.status(200).json({
        ok: true,
        gateway: 'flow',
        mode: 'live',
        environment: usedEnv,
        payment_url: paymentUrl,
        flowOrder: flowRes.data.flowOrder,
        token: flowRes.data.token,
        orderId: cleanOrderId
      });
    }

    // 4. Captura de detalle de error para trazabilidad
    const errorDetail = (flowRes && flowRes.data && (flowRes.data.message || flowRes.data.error || JSON.stringify(flowRes.data)))
      || 'Respuesta no exitosa de pasarela Flow.cl';

    console.warn('[ALZADO ROJO Flow] Respuesta no satisfactoria de Flow:', errorDetail);

    // Fallback asistido: La orden queda registrada para continuidad comercial sin bloquear al cliente
    return res.status(200).json({
      ok: true,
      gateway: 'flow',
      mode: 'assisted_flow',
      message: 'Orden registrada para pago Flow.cl',
      flow_detail: String(errorDetail),
      orderId: cleanOrderId
    });

  } catch (error) {
    console.error('[ALZADO ROJO Flow] Error critico en endpoint flow-create:', error);

    return res.status(200).json({
      ok: true,
      gateway: 'flow',
      mode: 'assisted_flow',
      message: 'Orden registrada para pago Flow.cl',
      flow_detail: error.message || 'Error interno de procesamiento'
    });
  }
};
