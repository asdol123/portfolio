/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Integracion Oficial Khipu v3
 * Archivo: api/khipu-create.js
 * 
 * Reglas de seguridad y diseño:
 * - Credenciales 100% resguardadas en entorno de servidor (Node.js).
 * - NUNCA expone api keys, secrets ni tokens internos en las respuestas JSON.
 * - Cero emojis en mensajes, logs y payloads.
 * - Cero ampersands en textos visibles.
 */

const KHIPU_CONFIG = {
  apiKey: (process.env.KHIPU_API_KEY || '').trim(),
  receiverId: (process.env.KHIPU_RECEIVER_ID || '').trim(),
  secret: (process.env.KHIPU_SECRET || '').trim(),
  defaultOrigin: 'https://alzado-rojo.cl'
};

/**
 * Sanitiza cadenas de texto para evitar inyecciones o caracteres de control
 * @param {string} val
 * @param {number} maxLen
 * @returns {string}
 */
function sanitizeString(val, maxLen = 250) {
  if (!val || typeof val !== 'string') return '';
  return val.replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLen);
}

/**
 * Valida formato estándar de correo electrónico
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

module.exports = async function handler(req, res) {
  // Cabeceras CORS
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
      payer_name,
      body,
      return_url,
      cancel_url
    } = payload;

    // 1. Validacion estricta del monto
    const numericAmount = Math.round(Number(amount));
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'El monto de la orden debe ser un numero mayor a cero.'
      });
    }

    // 2. Sanitizacion de campos
    const cleanOrderId = sanitizeString(orderId, 60) || `AR-${Date.now()}`;
    const cleanSubject = sanitizeString(subject, 200) || `Orden ALZADO ROJO ${cleanOrderId}`;
    const cleanName = sanitizeString(payer_name, 120);
    const cleanBody = sanitizeString(body, 500);

    // 3. Validacion y saneamiento de correo
    let cleanEmail = typeof payer_email === 'string' ? payer_email.trim().toLowerCase() : '';
    if (cleanEmail && !isValidEmail(cleanEmail)) {
      return res.status(400).json({
        ok: false,
        error: 'El correo electronico ingresado no es valido.'
      });
    }

    // 4. Resolucion de host base dinamico para retornos
    const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
    const protoHeader = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = hostHeader ? `${protoHeader}://${hostHeader}` : KHIPU_CONFIG.defaultOrigin;

    const finalReturnUrl = return_url || `${baseUrl}/api/khipu-return?order=${encodeURIComponent(cleanOrderId)}`;
    const finalCancelUrl = cancel_url || `${baseUrl}/maquetas-urbanas.html?khipu_status=cancelled&order=${encodeURIComponent(cleanOrderId)}`;
    const finalNotifyUrl = `${baseUrl}/api/khipu-confirm`;

    // 5. Construccion del payload oficial Khipu v3
    const khipuPayload = {
      amount: numericAmount,
      currency: currency === 'CLP' ? 'CLP' : 'CLP',
      subject: cleanSubject,
      transaction_id: cleanOrderId,
      payer_email: cleanEmail || undefined,
      payer_name: cleanName || undefined,
      body: cleanBody || undefined,
      return_url: finalReturnUrl,
      cancel_url: finalCancelUrl,
      notify_url: finalNotifyUrl
    };

    // 6. Solicitud directa y segura al endpoint oficial Khipu v3
    if (!KHIPU_CONFIG.apiKey) {
      console.warn('[ALZADO ROJO Khipu] Credenciales no configuradas en servidor. Activando fallback de WhatsApp.');
      const wspFallbackText = encodeURIComponent(
        `Hola Adolfo, estuve intentando realizar el pago de la orden ${cleanOrderId} por ${numericAmount} CLP con Khipu y deseo coordinar la transferencia directa o link de pago.`
      );
      return res.status(200).json({
        ok: false,
        gateway: 'khipu',
        error: 'Pasarela Khipu en mantenimiento. Le sugerimos seleccionar Transferencia Bancaria Directa para procesar su orden de inmediato.',
        orderId: cleanOrderId,
        whatsappFallback: `https://wa.me/56962032766?text=${wspFallbackText}`
      });
    }

    const khipuResponse = await fetch('https://payment-api.khipu.com/v3/payments', {
      method: 'POST',
      headers: {
        'x-api-key': KHIPU_CONFIG.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(khipuPayload)
    });

    const responseStatus = khipuResponse.status;
    let responseData = null;
    const rawText = await khipuResponse.text();
    try {
      responseData = JSON.parse(rawText);
    } catch (e) {
      responseData = { message: rawText };
    }

    // 7. Respuesta exitosa de Khipu
    if (khipuResponse.ok && responseData && (responseData.payment_url || responseData.payment_id)) {
      console.info('[ALZADO ROJO Khipu] Orden de pago creada con exito:', cleanOrderId, 'Payment ID:', responseData.payment_id);
      
      // Se retorna a la web UNICAMENTE informacion publica de operacion
      // NUNCA se devuelven api keys, secrets ni cabeceras internas
      return res.status(200).json({
        ok: true,
        payment_url: responseData.payment_url,
        payment_id: responseData.payment_id,
        simplified_transfer_url: responseData.simplified_transfer_url || null,
        orderId: cleanOrderId
      });
    }

    // 8. Manejo de error retornado por la pasarela Khipu
    console.warn('[ALZADO ROJO Khipu] Respuesta no satisfactoria de Khipu API:', responseStatus, responseData);

    let safeErrorMessage = 'No fue posible iniciar el cobro con Khipu en este momento.';
    if (responseData && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      const firstErr = responseData.errors[0];
      if (firstErr.field === 'amount' && firstErr.message && firstErr.message.includes('5000')) {
        safeErrorMessage = 'El monto de la orden excede el limite temporal de $5.000 CLP configurado en la cuenta Khipu (cuenta en verificacion inicial). Le sugerimos seleccionar Transferencia Bancaria Directa para procesar su orden de inmediato.';
      } else {
        safeErrorMessage = String(firstErr.message || responseData.message || safeErrorMessage).replace(/[<>]/g, '');
      }
    } else if (responseData && responseData.message) {
      safeErrorMessage = String(responseData.message).replace(/[<>]/g, '');
    }

    const wspFallbackText = encodeURIComponent(
      `Hola Adolfo, estuve intentando realizar el pago de la orden ${cleanOrderId} por ${numericAmount} CLP con Khipu y deseo coordinar la transferencia directa o link de pago.`
    );
    const whatsappFallback = `https://wa.me/56962032766?text=${wspFallbackText}`;

    return res.status(200).json({
      ok: false,
      gateway: 'khipu',
      error: safeErrorMessage,
      orderId: cleanOrderId,
      whatsappFallback
    });

  } catch (error) {
    console.error('[ALZADO ROJO Khipu] Excepcion critica en endpoint khipu-create:', error.message);

    return res.status(500).json({
      ok: false,
      gateway: 'khipu',
      error: 'Error interno de conexion con la pasarela Khipu.',
      whatsappFallback: 'https://wa.me/56962032766?text=Hola%20Adolfo,%20deseo%20coordinar%20mi%20orden%20con%20Alzado%20Rojo'
    });
  }
};
