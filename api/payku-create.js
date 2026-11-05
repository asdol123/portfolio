/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Integracion Oficial Payku Chile (Webpay Plus / Debito / Credito)
 * Archivo: api/payku-create.js
 * 
 * Reglas tecnicas y de seguridad:
 * - Cero emojis en mensajes y logs.
 * - Cero ampersands en titulos o etiquetas visibles.
 * - Credenciales oficiales de AR ARQ SpA configuradas por defecto y sobreescribibles via process.env.
 * - Deteccion inteligente de entorno: tokens 'tkpu...' / 'tkpi...' apuntan a https://app.payku.cl (Produccion).
 * - Autenticacion verificada: Payku POST /api/transaction requiere Authorization: Bearer <tokenPublic>.
 * - Resiliencia: si un token no es aceptado, intenta conmutar y ofrece fallback a WhatsApp directo.
 */

const OFFICIAL_PHONE = '56962032766';
const OFFICIAL_EMAIL = 'contacto@ar-arq.cl';

// Credenciales oficiales AR ARQ SpA
const DEFAULT_PUBLIC_TOKEN = 'tkpudcb500cf54f5ab35609572ce31f2';
const DEFAULT_PRIVATE_TOKEN = 'tkpic31267f96187c8cbc563cafc1f57';

/**
 * Obtiene y valida la configuracion activa de Payku
 */
function getPaykuConfig() {
  const tokenPublic = (process.env.PAYKU_TOKEN_PUBLIC || DEFAULT_PUBLIC_TOKEN).trim();
  const tokenSecret = (process.env.PAYKU_TOKEN_SECRET || DEFAULT_PRIVATE_TOKEN).trim();

  // Los tokens de produccion oficiales de Payku inician con tkpu (publico) y tkpi (privado)
  const isProductionCredentials = tokenPublic.startsWith('tkpu') || tokenSecret.startsWith('tkpi');

  // Si son credenciales de produccion, apuntar a app.payku.cl a menos que se fuerce sandbox explicitamente
  const forceSandbox = process.env.PAYKU_FORCE_SANDBOX === 'true';
  const isSandbox = forceSandbox || (!isProductionCredentials && process.env.PAYKU_SANDBOX !== 'false');

  const baseUrl = isSandbox ? 'https://des.payku.cl' : 'https://app.payku.cl';

  return {
    tokenPublic,
    tokenSecret,
    isSandbox,
    isProductionCredentials,
    baseUrl
  };
}

/**
 * Valida si el token configurado es una credencial real de Payku
 * @param {string} token
 * @returns {boolean}
 */
function isRealToken(token) {
  if (!token) return false;
  const clean = token.trim();
  if (clean === '' || clean === 'tksc_sandbox_ar_arq' || clean.startsWith('tksc_sandbox_') || clean === 'tkpb_sandbox_ar_arq') {
    return false;
  }
  return clean.length >= 10;
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

    // MODO SIMULADOR RESILIENTE: Si se solicita explicitamente o estamos en Sandbox sin token valido
    const forceSimulator = process.env.PAYKU_SIMULATOR === 'true';
    if (forceSimulator || (config.isSandbox && !hasRealCreds)) {
      const sandboxSimulatorUrl = `/checkout-payku-sandbox.html?order=${encodeURIComponent(cleanOrderId)}&amount=${numericAmount}&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(cleanPayerName)}`;

      console.info(`[ALZADO ROJO Payku] Modo Sandbox Simulator activado para orden: ${cleanOrderId} (Monto: $${numericAmount} CLP)`);

      return res.status(200).json({
        ok: true,
        gateway: 'payku',
        sandbox: true,
        simulator: true,
        payment_url: sandboxSimulatorUrl,
        orderId: cleanOrderId,
        amount: numericAmount,
        subject: cleanSubject
      });
    }

    // MODO OFICIAL PAYKU API (/api/transaction)
    // En la API oficial de Payku, el endpoint POST /api/transaction valida con el Token Publico (tkpu...)
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
    let usedToken = config.tokenPublic;

    try {
      // 1. Intento primario con Token Publico (estandar verificado de Payku para crear transacciones)
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

      // 2. Si Payku responde 401, reintentar con Token Privado por resiliencia
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
        usedToken = config.tokenSecret;
      }
    } catch (errFetch) {
      console.error('[ALZADO ROJO Payku] Error de conexion con Payku API:', errFetch.message);

      // Si falla en Sandbox por red, recurrir al simulador para no bloquear pruebas
      if (config.isSandbox) {
        const fallbackSimulatorUrl = `/checkout-payku-sandbox.html?order=${encodeURIComponent(cleanOrderId)}&amount=${numericAmount}&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(cleanPayerName)}`;
        return res.status(200).json({
          ok: true,
          gateway: 'payku',
          sandbox: true,
          simulator: true,
          payment_url: fallbackSimulatorUrl,
          orderId: cleanOrderId,
          warning: 'Fallback a simulador sandbox tras fallo de conexion con API de Payku: ' + errFetch.message
        });
      }

      return res.status(502).json({
        ok: false,
        gateway: 'payku',
        error: 'No fue posible establecer comunicacion con la pasarela Payku Chile: ' + errFetch.message,
        orderId: cleanOrderId,
        whatsappFallback: `https://wa.me/${OFFICIAL_PHONE}?text=${encodeURIComponent(`Hola Adolfo, no pude conectar con la pasarela Payku para pagar mi orden #${cleanOrderId}. Deseo coordinar el pago directamente.`)}`
      });
    }

    let parsedData = null;
    try {
      parsedData = JSON.parse(rawText);
    } catch (eParse) {
      parsedData = { raw: rawText };
    }

    // Evaluacion de exito en Payku API
    const paymentUrl = parsedData && (parsedData.url || parsedData.payment_url);
    if (apiResponse && apiResponse.ok && paymentUrl) {
      return res.status(200).json({
        ok: true,
        gateway: 'payku',
        sandbox: config.isSandbox,
        simulator: false,
        payment_url: paymentUrl,
        token: parsedData.token || parsedData.id || parsedData.transaction_key,
        orderId: cleanOrderId,
        amount: numericAmount
      });
    }

    // Si la pasarela respondio con error o no entrego url
    console.warn(`[ALZADO ROJO Payku] Respuesta no satisfactoria (${apiResponse ? apiResponse.status : 'desconocido'}):`, rawText);

    // Si estamos en Sandbox y el token no fue aceptado, conmutar al simulador
    if (config.isSandbox) {
      const sandboxSimulatorUrl = `/checkout-payku-sandbox.html?order=${encodeURIComponent(cleanOrderId)}&amount=${numericAmount}&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(cleanPayerName)}`;
      return res.status(200).json({
        ok: true,
        gateway: 'payku',
        sandbox: true,
        simulator: true,
        payment_url: sandboxSimulatorUrl,
        orderId: cleanOrderId,
        amount: numericAmount,
        subject: cleanSubject,
        warning: 'Activado simulador sandbox debido a credenciales no vigentes en des.payku.cl'
      });
    }

    const errorMessage = (parsedData && (parsedData.message_error || parsedData.message || parsedData.error || parsedData.detail))
      || 'Respuesta no valida de pasarela Payku Chile.';

    return res.status(400).json({
      ok: false,
      gateway: 'payku',
      error: errorMessage,
      orderId: cleanOrderId,
      whatsappFallback: `https://wa.me/${OFFICIAL_PHONE}?text=${encodeURIComponent(`Hola Adolfo, se presento un aviso al procesar mi orden #${cleanOrderId} en Payku: ${errorMessage}. Deseo coordinar el pago directamente.`)}`
    });

  } catch (error) {
    console.error('[ALZADO ROJO Payku] Error critico en endpoint payku-create:', error);
    return res.status(500).json({
      ok: false,
      gateway: 'payku',
      error: 'Error interno de procesamiento: ' + error.message,
      whatsappFallback: `https://wa.me/${OFFICIAL_PHONE}`
    });
  }
};
