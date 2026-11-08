/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Retorno y Redireccion del Pagador Payku Chile
 * Archivo: api/payku-return.js
 * 
 * Reglas de diseno:
 * - Cero emojis en mensajes y textos de retorno.
 * - Cero ampersands en titulos o textos visibles.
 * - Redirige limpiamente al cliente a la pagina de maquetas urbanas con estado de pago.
 */

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
    let token = '';

    // Extraer desde querystring
    if (req.query) {
      orderId = req.query.order || req.query.orderId || req.query.order_id || '';
      status = req.query.status || req.query.payku_status || req.query.result || '';
      token = req.query.token || req.query.transaction_key || req.query.id || req.query.trx_id || '';
    }

    // Extraer desde body en caso de POST de retorno
    if (req.body) {
      let bodyObj = req.body;
      if (typeof bodyObj === 'string') {
        try {
          bodyObj = JSON.parse(bodyObj);
        } catch (e) {
          const params = new URLSearchParams(req.body);
          orderId = orderId || params.get('order') || params.get('orderId') || params.get('order_id') || '';
          status = status || params.get('status') || params.get('payku_status') || params.get('result') || '';
          token = token || params.get('token') || params.get('transaction_key') || params.get('id') || params.get('trx_id') || '';
        }
      }
      if (typeof bodyObj === 'object' && bodyObj !== null) {
        orderId = orderId || bodyObj.order || bodyObj.orderId || bodyObj.order_id || '';
        status = status || bodyObj.status || bodyObj.payku_status || bodyObj.result || '';
        token = token || bodyObj.token || bodyObj.transaction_key || bodyObj.id || bodyObj.trx_id || '';
      }
    }

    const cleanOrder = String(orderId || '').trim();
    let normalizedStatus = String(status || '').toLowerCase().trim();

    // Verificacion activa contra API oficial de Payku si tenemos token de transaccion
    const publicToken = (process.env.PAYKU_TOKEN_PUBLIC || 'tkpudcb500cf54f5ab35609572ce31f2').trim();
    if (token && publicToken) {
      try {
        const queryRes = await fetch(`https://app.payku.cl/api/transaction/${encodeURIComponent(token)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicToken}`
          },
          signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(3000) : undefined
        });
        if (queryRes.ok) {
          const trxData = await queryRes.json();
          if (trxData && trxData.status) {
            normalizedStatus = String(trxData.status).toLowerCase().trim();
            console.info(`[ALZADO ROJO Payku] Estado real verificado con API Payku para trx ${token}: ${normalizedStatus}`);
          }
        }
      } catch (errApiQuery) {
        console.warn('[ALZADO ROJO Payku] Aviso al consultar estado en Payku API:', errApiQuery.message);
      }
    }

    const isApproved = (
      normalizedStatus === 'approved' ||
      normalizedStatus === 'success' ||
      normalizedStatus === 'completado' ||
      normalizedStatus === 'pagado' ||
      normalizedStatus === '1'
    );

    const isRejectedOrCancelled = (
      normalizedStatus === 'cancelled' ||
      normalizedStatus === 'canceled' ||
      normalizedStatus === 'rejected' ||
      normalizedStatus === 'rechazado' ||
      normalizedStatus === 'cancelado' ||
      normalizedStatus === 'failed' ||
      normalizedStatus === '0'
    );

    let finalStatus = 'pending';
    if (isApproved) {
      finalStatus = 'approved';
    } else if (isRejectedOrCancelled) {
      finalStatus = 'cancelled';
    } else {
      finalStatus = 'pending';
    }

    const targetUrl = `/maquetas-urbanas.html?payku_status=${finalStatus}&order=${encodeURIComponent(cleanOrder)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

    console.info(`[ALZADO ROJO Payku] Retorno de pagador procesado. Orden: ${cleanOrder || 'N/A'}, Estado: ${finalStatus}, Token: ${token || 'N/A'}`);

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
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 48px 24px; color: #111; background-color: #fafafa;">
  <p style="font-size: 16px; font-weight: 600; letter-spacing: 0.05em;">Procesando retorno de pasarela Payku Chile...</p>
  <p><a href="${targetUrl}" style="color: #c82333; text-decoration: underline;">Haga clic aqui si no es redirigido automaticamente.</a></p>
</body>
</html>`);

  } catch (error) {
    console.error('[ALZADO ROJO Payku] Error en endpoint payku-return:', error);
    const fallbackUrl = '/maquetas-urbanas.html?payku_status=pending';
    res.writeHead(302, {
      Location: fallbackUrl
    });
    return res.end();
  }
};
