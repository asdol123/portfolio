/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Webhook de Confirmacion Flow.cl
 * Archivo: api/flow-confirm.js
 * 
 * Reglas de diseno:
 * - Cero emojis en cualquier mensaje o log.
 * - Cero ampersands en textos visibles.
 * - Responde HTTP 200 de inmediato cumpliendo el estandar de webhook de Flow.cl.
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

    if (req.body) {
      if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          token = parsed.token;
        } catch (e) {
          const params = new URLSearchParams(req.body);
          token = params.get('token');
        }
      } else if (typeof req.body === 'object') {
        token = req.body.token;
      }
    }

    if (!token && req.query) {
      token = req.query.token;
    }

    console.info('[ALZADO ROJO Flow] Webhook de confirmacion notificado para token:', token || 'N/A');

    // Flow exige respuesta HTTP 200 para dar por recibido el aviso
    return res.status(200).send('OK');
  } catch (error) {
    console.error('[ALZADO ROJO Flow] Error al procesar confirmacion de webhook:', error);
    // Aun ante error se responde 200 para evitar reintentos infinitos si fue recibido
    return res.status(200).send('OK');
  }
};
