/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Retorno y Redireccion del Pagador Khipu
 * Archivo: api/khipu-return.js
 * 
 * Reglas de diseño y seguridad:
 * - Cero emojis en mensajes y textos de retorno.
 * - Cero ampersands en titulos o textos visibles.
 * - Redirige limpiamente al cliente a la pagina de maquetas urbanas con comprobante completado.
 * - No expone ninguna informacion sensible ni credenciales.
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
    let orderId = '';
    let paymentId = '';

    // Extraccion desde query params (GET)
    if (req.query) {
      orderId = req.query.order || req.query.orderId || req.query.transaction_id || '';
      paymentId = req.query.payment_id || req.query.paymentId || '';
    }

    // Extraccion desde body (POST)
    if (!orderId && req.body) {
      if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          orderId = parsed.order || parsed.orderId || parsed.transaction_id || '';
          paymentId = paymentId || parsed.payment_id || parsed.paymentId || '';
        } catch (e) {
          const params = new URLSearchParams(req.body);
          orderId = params.get('order') || params.get('orderId') || params.get('transaction_id') || '';
          paymentId = paymentId || params.get('payment_id') || params.get('paymentId') || '';
        }
      } else if (typeof req.body === 'object') {
        orderId = req.body.order || req.body.orderId || req.body.transaction_id || '';
        paymentId = paymentId || req.body.payment_id || req.body.paymentId || '';
      }
    }

    const cleanOrder = String(orderId || '').replace(/[^a-zA-Z0-9_-]/g, '').trim();
    const cleanPaymentId = String(paymentId || '').replace(/[^a-zA-Z0-9_-]/g, '').trim();

    let queryParams = 'khipu_status=completed';
    if (cleanOrder) {
      queryParams += `&order=${encodeURIComponent(cleanOrder)}`;
    }
    if (cleanPaymentId) {
      queryParams += `&payment_id=${encodeURIComponent(cleanPaymentId)}`;
    }

    const targetUrl = `/maquetas-urbanas.html?${queryParams}`;

    console.info('[ALZADO ROJO Khipu] Retorno de pagador procesado. Orden:', cleanOrder || 'N/A', 'Payment ID:', cleanPaymentId || 'N/A');

    // Redireccion 302 con fallback HTML accesible
    res.writeHead(302, {
      Location: targetUrl
    });

    return res.end(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${targetUrl}">
  <title>Redirigiendo a ALZADO ROJO</title>
  <script>
    window.location.href = ${JSON.stringify(targetUrl)};
  </script>
</head>
<body style="font-family: sans-serif; text-align: center; padding: 40px; color: #111;">
  <p>Procesando confirmacion de pago Khipu...</p>
  <p><a href="${targetUrl}">Haga clic aqui si no es redirigido automaticamente.</a></p>
</body>
</html>`);

  } catch (error) {
    console.error('[ALZADO ROJO Khipu] Error en endpoint khipu-return:', error);
    const fallbackUrl = '/maquetas-urbanas.html?khipu_status=completed';
    res.writeHead(302, {
      Location: fallbackUrl
    });
    return res.end();
  }
};
