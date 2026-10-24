/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Retorno y Redireccion del Pagador Flow.cl
 * Archivo: api/flow-return.js
 * 
 * Reglas de diseno:
 * - Cero emojis en mensajes y textos de retorno.
 * - Cero ampersands en titulos o textos visibles.
 * - Redirige limpiamente al cliente a la pagina de maquetas con comprobante completado.
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
    let token = '';

    if (req.query) {
      orderId = req.query.order || req.query.orderId || req.query.commerceOrder || '';
      token = req.query.token || '';
    }

    if (!orderId && req.body) {
      if (typeof req.body === 'string') {
        try {
          const parsed = JSON.parse(req.body);
          orderId = parsed.order || parsed.orderId || parsed.commerceOrder || '';
          token = token || parsed.token || '';
        } catch (e) {
          const params = new URLSearchParams(req.body);
          orderId = params.get('order') || params.get('orderId') || params.get('commerceOrder') || '';
          token = token || params.get('token') || '';
        }
      } else if (typeof req.body === 'object') {
        orderId = req.body.order || req.body.orderId || req.body.commerceOrder || '';
        token = token || req.body.token || '';
      }
    }

    const cleanOrder = String(orderId || '').trim();
    const targetUrl = `/maquetas-urbanas.html?flow_status=completed&order=${encodeURIComponent(cleanOrder)}`;

    console.info('[ALZADO ROJO Flow] Retorno de pagador procesado. Orden:', cleanOrder, 'Token:', token || 'N/A');

    // 302 Redirect con fallback HTML
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
  <p>Procesando confirmacion de pago Flow.cl...</p>
  <p><a href="${targetUrl}">Haga clic aqui si no es redirigido automaticamente.</a></p>
</body>
</html>`);

  } catch (error) {
    console.error('[ALZADO ROJO Flow] Error en endpoint flow-return:', error);
    const fallbackUrl = '/maquetas-urbanas.html?flow_status=completed';
    res.writeHead(302, {
      Location: fallbackUrl
    });
    return res.end();
  }
};
