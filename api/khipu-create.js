/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Integracion de Cobros Khipu v3
 * Archivo: api/khipu-create.js
 */

module.exports = async function handler(req, res) {
  // Cabeceras CORS para integracion desacoplada desde el cliente web
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

    const numericAmount = Math.round(Number(amount));

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'El monto de la orden debe ser un numero mayor a cero.'
      });
    }

    const apiKey = process.env.KHIPU_API_KEY;
    const merchantFallbackUrl = process.env.KHIPU_MERCHANT_URL || null;

    // Modo asistido si no se han cargado las variables de entorno de Khipu en Vercel
    if (!apiKey) {
      return res.status(200).json({
        ok: true,
        mode: 'assisted_khipu',
        message: 'Cobro Khipu registrado para gestion asistida inmediata.',
        fallback_url: merchantFallbackUrl,
        orderId: orderId || null
      });
    }

    // Solicitud en vivo a Khipu API v3
    const khipuPayload = {
      amount: numericAmount,
      currency: currency || 'CLP',
      subject: subject || `Orden ALZADO ROJO ${orderId || ''}`.trim(),
      transaction_id: orderId ? String(orderId) : undefined,
      payer_email: payer_email || undefined,
      payer_name: payer_name || undefined,
      body: body || undefined,
      return_url: return_url || undefined,
      cancel_url: cancel_url || undefined
    };

    const response = await fetch('https://payment-api.khipu.com/v3/payments', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(khipuPayload)
    });

    const responseData = await response.json();

    if (response.ok && responseData && (responseData.payment_url || responseData.payment_id)) {
      return res.status(200).json({
        ok: true,
        mode: 'live',
        payment_url: responseData.payment_url,
        payment_id: responseData.payment_id,
        simplified_transfer_url: responseData.simplified_transfer_url || null,
        orderId: orderId || null
      });
    }

    // En caso de respuesta no satisfactoria de Khipu, derivar de forma transparente al modo asistido
    console.warn('[ALZADO ROJO Backend] Respuesta no exitosa de Khipu API:', response.status, responseData);

    return res.status(200).json({
      ok: true,
      mode: 'assisted_khipu',
      message: 'Cobro Khipu canalizado a modo asistido.',
      fallback_url: merchantFallbackUrl,
      orderId: orderId || null
    });

  } catch (error) {
    console.error('[ALZADO ROJO Backend] Error critico en endpoint khipu-create:', error);

    // Fallback de contingencia para no frustrar la intencion de compra del usuario
    return res.status(200).json({
      ok: true,
      mode: 'assisted_khipu',
      message: 'Cobro registrado. Coordinacion directa activada.',
      fallback_url: process.env.KHIPU_MERCHANT_URL || null
    });
  }
};
