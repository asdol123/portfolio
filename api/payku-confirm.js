/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Webhook de Notificacion Asincrona Payku Chile
 * Archivo: api/payku-confirm.js
 * 
 * Reglas de diseno y seguridad:
 * - Cero emojis en mensajes y logs.
 * - Cero ampersands en textos visibles.
 * - Responde HTTP 200 de inmediato cumpliendo el estandar de webhook de Payku.
 * - Emite correo transaccional order_received al confirmar pago exitoso.
 */

const OFFICIAL_EMAIL = 'adolchilemods@gmail.com';

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

  try {
    let orderId = '';
    let status = '';
    let amount = 0;
    let customerEmail = '';
    let customerName = '';
    let transactionKey = '';

    // Extraer datos desde body
    if (req.body) {
      let bodyObj = req.body;
      if (typeof bodyObj === 'string') {
        try {
          bodyObj = JSON.parse(bodyObj);
        } catch (e) {
          const params = new URLSearchParams(req.body);
          orderId = params.get('order') || params.get('orderId') || '';
          status = params.get('status') || params.get('status_order') || '';
          amount = params.get('amount') || 0;
          customerEmail = params.get('email') || '';
          customerName = params.get('name') || '';
          transactionKey = params.get('trx_id') || params.get('token') || '';
        }
      }
      if (typeof bodyObj === 'object' && bodyObj !== null) {
        orderId = bodyObj.order || bodyObj.orderId || bodyObj.order_id || '';
        status = bodyObj.status || bodyObj.status_order || '';
        amount = bodyObj.amount || bodyObj.total || 0;
        customerEmail = bodyObj.email || bodyObj.payer_email || '';
        customerName = bodyObj.name || bodyObj.payer_name || '';
        transactionKey = bodyObj.trx_id || bodyObj.token || bodyObj.transaction_key || '';
      }
    }

    // Extraer desde querystring si no vinieron en body
    if (!orderId && req.query) {
      orderId = req.query.order || req.query.orderId || '';
      status = status || req.query.status || '';
      amount = amount || req.query.amount || 0;
      customerEmail = customerEmail || req.query.email || '';
      transactionKey = transactionKey || req.query.token || req.query.trx_id || '';
    }

    const cleanOrder = String(orderId || '').trim();
    const cleanStatus = String(status || '').toLowerCase().trim();
    const numericAmount = Math.round(Number(amount) || 0);

    console.info(`[ALZADO ROJO Payku] Webhook recibido para orden: ${cleanOrder || 'N/A'}, Estado: ${cleanStatus || 'N/A'}, Trx: ${transactionKey || 'N/A'}`);

    const isApproved = (
      cleanStatus === 'approved' ||
      cleanStatus === 'success' ||
      cleanStatus === 'completado' ||
      cleanStatus === 'pagado' ||
      cleanStatus === '1'
    );

    // Si el pago es exitoso, emitir notificacion de confirmacion de pedido
    if (isApproved && cleanOrder) {
      try {
        const proto = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'ar-arq.cl';
        const emailEndpoint = `${proto}://${host}/api/email-notify`;

        const emailPayload = {
          type: 'order_received',
          orderId: cleanOrder,
          customerName: customerName || 'Cliente ALZADO ROJO',
          customerEmail: customerEmail || OFFICIAL_EMAIL,
          productName: 'Relieve Arquitectonico 3D · Maqueta Urbana',
          size: 'Formato de Catalogo',
          amount: numericAmount || 29990,
          address: 'Confirmado via Pasarela Payku Chile',
          city: 'Santiago / Envio Nacional',
          phone: '+56 9 6203 2766'
        };

        // Disparo asincrono garantizado antes de terminar la invocacion serverless
        try {
          const resFetch = await fetch(emailEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload),
            signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(4000) : undefined
          });
          const resEmail = await resFetch.json().catch(() => ({}));
          console.info(`[ALZADO ROJO Payku] Correo transaccional emitido tras confirmacion de Payku para orden #${cleanOrder}:`, resEmail.ok);
        } catch (errFetchEmail) {
          console.warn('[ALZADO ROJO Payku] Aviso al emitir correo transaccional en confirmacion:', errFetchEmail.message);
        }

      } catch (errEmail) {
        console.warn('[ALZADO ROJO Payku] Error al preparar notificacion transaccional:', errEmail.message);
      }
    }

    // Payku exige respuesta HTTP 200 con cuerpo JSON o texto OK para dar por recibido el evento
    return res.status(200).json({
      status: 'success',
      received: true,
      order: cleanOrder,
      message: 'Notificacion procesada exitosamente por ALZADO ROJO'
    });

  } catch (error) {
    console.error('[ALZADO ROJO Payku] Error critico al procesar webhook de Payku:', error);
    // Aun ante error se responde 200 para prevenir ciclos infinitos de reintento si fue recibido
    return res.status(200).json({
      status: 'success',
      received: true,
      warning: 'Procesado con advertencia interna'
    });
  }
};
