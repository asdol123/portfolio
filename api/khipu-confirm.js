/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Webhook de Confirmacion Instantanea Khipu
 * Archivo: api/khipu-confirm.js
 * 
 * Reglas de diseño y seguridad:
 * - Cero emojis en mensajes y logs.
 * - Cero ampersands en textos visibles.
 * - Responde HTTP 200 de inmediato cumpliendo el estandar de webhook de Khipu.
 * - NUNCA expone credenciales ni datos sensibles.
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let token = null;
    let apiVersion = null;

    if (req.body) {
      if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          token = parsed.notification_token || parsed.token;
          apiVersion = parsed.api_version;
        } catch (e) {
          const params = new URLSearchParams(req.body);
          token = params.get('notification_token') || params.get('token');
          apiVersion = params.get('api_version');
        }
      } else if (typeof req.body === 'object') {
        token = req.body.notification_token || req.body.token;
        apiVersion = req.body.api_version;
      }
    }

    if (!token && req.query) {
      token = req.query.notification_token || req.query.token;
      apiVersion = apiVersion || req.query.api_version;
    }

    console.info('[ALZADO ROJO Khipu] Webhook de confirmacion notificado para token:', token || 'N/A', 'API Version:', apiVersion || 'v3');

    // Khipu requiere respuesta HTTP 200 para dar por notificado el evento
    return res.status(200).send('OK');
  } catch (error) {
    console.error('[ALZADO ROJO Khipu] Error al procesar confirmacion de webhook Khipu:', error);
    // Aun ante excepcion se responde 200 para evitar ciclos infinitos de reintento si fue recibido
    return res.status(200).send('OK');
  }
};
