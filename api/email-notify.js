/**
 * ALZADO ROJO · AR ARQ SpA
 * Endpoint Serverless Vercel: Correos Transaccionales (Resend API)
 * Archivo: api/email-notify.js
 * 
 * Reglas de diseno:
 * - Cero emojis en asuntos, cuerpo y registros.
 * - Estetica darkroom arquitectonica (blanco, negro, acento rojo carmesi #C82333).
 * - Fallback resiliente si no hay RESEND_API_KEY sin error 500.
 * - Cabeceras CORS universales para ejecucion remota y local.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const OFFICIAL_FROM = (process.env.RESEND_FROM_EMAIL || 'ALZADO ROJO <pedidos@ar-arq.cl>').trim();
const OFFICIAL_REPLY_TO = 'ALZADO ROJO <pedidos@ar-arq.cl>';
const FALLBACK_FROM = 'ALZADO ROJO <onboarding@resend.dev>';
const WORKSHOP_EMAIL = 'adolchilemods@gmail.com';
const WORKSHOP_PHONE = '+56 9 6203 2766';

/**
 * Sanitiza cadenas de texto para insercion segura en plantillas HTML
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formatea valores numericos a pesos chilenos
 * @param {number|string} val
 * @returns {string}
 */
function formatCLP(val) {
  const num = Math.round(Number(val) || 0);
  return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' CLP';
}

/**
 * Genera la plantilla HTML arquitectonica darkroom para notificacion de pedido recibido
 * @param {object} data
 * @returns {string}
 */
function buildOrderReceivedTemplate(data) {
  const orderId = escapeHtml(data.orderId || 'AR-TALLER');
  const customerName = escapeHtml(data.customerName || 'Cliente');
  const productName = escapeHtml(data.productName || 'Relieve Arquitectonico 3D');
  const size = escapeHtml(data.size || 'Estandar');
  const amountFormatted = escapeHtml(formatCLP(data.amount));
  const address = escapeHtml(data.address || 'Retiro en taller o por coordinar');
  const city = escapeHtml(data.city || 'Santiago');
  const phone = escapeHtml(data.phone || 'No especificado');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibimos tu pedido · ALZADO ROJO</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d0d; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#e0e0e0; line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0d0d0d; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px; background-color:#141414; border:1px solid #262626; border-top:4px solid #C82333;">
          <!-- Cabecera de Marca -->
          <tr>
            <td style="padding:28px 32px 20px 32px; border-bottom:1px solid #222222;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:18px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:#ffffff;">
                      ALZADO <span style="color:#C82333;">ROJO</span>
                    </div>
                    <div style="font-size:11px; font-weight:600; letter-spacing:0.2em; text-transform:uppercase; color:#888888; margin-top:4px;">
                      Taller de Maqueteria Digital y Relieves 3D · Santiago, Chile
                    </div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <div style="font-family:'SF Mono', Monaco, monospace; font-size:12px; font-weight:700; color:#C82333; background-color:#201012; border:1px solid #4a151b; padding:4px 8px; display:inline-block;">
                      FOLIO #${orderId}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Titulo Principal -->
          <tr>
            <td style="padding:32px 32px 16px 32px;">
              <div style="font-size:11px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:#C82333; margin-bottom:8px;">
                Confirmacion Oficial de Orden
              </div>
              <h1 style="margin:0; font-size:22px; font-weight:700; letter-spacing:-0.01em; color:#ffffff; line-height:1.3;">
                Recibimos tu encargo formalmente
              </h1>
              <p style="margin:16px 0 0 0; font-size:14px; color:#cccccc; line-height:1.6;">
                Estimado/a <strong>${customerName}</strong>, tu orden ha sido ingresada satisfactoriamente a la agenda de manufactura de nuestro taller. A continuacion encuentras el desglose del encargo registrado.
              </p>
            </td>
          </tr>

          <!-- Cuadro Informativo del Proceso de Taller -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1a1a1a; border-left:3px solid #C82333; padding:18px 20px;">
                <tr>
                  <td>
                    <div style="font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#ffffff; margin-bottom:6px;">
                      Proceso de Fabricacion Digital
                    </div>
                    <div style="font-size:13px; color:#bbbbbb; line-height:1.6;">
                      Cada pieza se elabora mediante manufactura aditiva de alta resolucion en biopolimero PLA mate biobasado, seguido del ensamble artesanal en marco tipo shadowbox y control dimensional riguroso. El tiempo estimado de produccion es de <strong>3 a 5 dias habiles</strong> antes del despacho oficial.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tabla de Resumen de Orden -->
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <div style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#888888; margin-bottom:12px; border-bottom:1px solid #262626; padding-bottom:6px;">
                Especificaciones del Encargo
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;">
                <tr>
                  <td style="padding:8px 0; color:#888888; width:38%; border-bottom:1px solid #1f1f1f;">Pieza / Modelo:</td>
                  <td style="padding:8px 0; color:#ffffff; font-weight:600; border-bottom:1px solid #1f1f1f;">${productName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; color:#888888; border-bottom:1px solid #1f1f1f;">Formato / Dimensiones:</td>
                  <td style="padding:8px 0; color:#ffffff; font-family:'SF Mono', Monaco, monospace; border-bottom:1px solid #1f1f1f;">${size}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; color:#888888; border-bottom:1px solid #1f1f1f;">Valor Total de la Orden:</td>
                  <td style="padding:8px 0; color:#ffffff; font-weight:700; font-family:'SF Mono', Monaco, monospace; border-bottom:1px solid #1f1f1f;">${amountFormatted}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; color:#888888; border-bottom:1px solid #1f1f1f;">Direccion de Entrega:</td>
                  <td style="padding:8px 0; color:#dddddd; border-bottom:1px solid #1f1f1f;">${address}, ${city}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; color:#888888; border-bottom:1px solid #1f1f1f;">Telefono de Contacto:</td>
                  <td style="padding:8px 0; color:#dddddd; border-bottom:1px solid #1f1f1f;">${phone}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contacto Directo Taller -->
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#181818; border:1px solid #282828; padding:18px 20px;">
                <tr>
                  <td>
                    <div style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#ffffff; margin-bottom:4px;">
                      Contacto Directo con el Arquitecto de Taller
                    </div>
                    <div style="font-size:12px; color:#aaaaaa; line-height:1.6;">
                      Adolfo Risopatron · Telefono / WhatsApp: <a href="https://wa.me/56962032766" style="color:#ffffff; text-decoration:underline;">+56 9 6203 2766</a><br>
                      Correo de taller: <a href="mailto:adolchilemods@gmail.com" style="color:#ffffff; text-decoration:underline;">adolchilemods@gmail.com</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie de Pagina -->
          <tr>
            <td style="padding:20px 32px; background-color:#0f0f0f; border-top:1px solid #222222; text-align:center;">
              <div style="font-size:11px; color:#666666; letter-spacing:0.04em;">
                ALZADO ROJO · AR ARQ SpA · Santiago, Chile · Todos los derechos reservados.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Genera la plantilla HTML arquitectonica darkroom para notificacion de pedido despachado
 * @param {object} data
 * @returns {string}
 */
function buildOrderShippedTemplate(data) {
  const orderId = escapeHtml(data.orderId || 'AR-TALLER');
  const customerName = escapeHtml(data.customerName || 'Cliente');
  const trackingNumber = escapeHtml(data.trackingNumber || 'BX-PENDIENTE');
  const courier = escapeHtml(data.courier || 'Blue Express');
  const trackingUrl = escapeHtml(data.trackingUrl || `https://www.bluex.cl/seguimiento/?tracking=${data.trackingNumber || ''}`);
  const estimatedDays = escapeHtml(data.estimatedDays || '2 a 4 dias habiles');
  const address = escapeHtml(data.address || 'Direccion registrada');
  const city = escapeHtml(data.city || 'Destino');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu pedido va en camino · ALZADO ROJO</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d0d; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#e0e0e0; line-height:1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0d0d0d; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px; background-color:#141414; border:1px solid #262626; border-top:4px solid #C82333;">
          <!-- Cabecera de Marca -->
          <tr>
            <td style="padding:28px 32px 20px 32px; border-bottom:1px solid #222222;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:18px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:#ffffff;">
                      ALZADO <span style="color:#C82333;">ROJO</span>
                    </div>
                    <div style="font-size:11px; font-weight:600; letter-spacing:0.2em; text-transform:uppercase; color:#888888; margin-top:4px;">
                      Despacho Oficial de Taller · Blue Express Chile
                    </div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <div style="font-family:'SF Mono', Monaco, monospace; font-size:12px; font-weight:700; color:#C82333; background-color:#201012; border:1px solid #4a151b; padding:4px 8px; display:inline-block;">
                      FOLIO #${orderId}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Titulo Principal -->
          <tr>
            <td style="padding:32px 32px 16px 32px;">
              <div style="font-size:11px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:#C82333; margin-bottom:8px;">
                Despacho en Transito
              </div>
              <h1 style="margin:0; font-size:22px; font-weight:700; letter-spacing:-0.01em; color:#ffffff; line-height:1.3;">
                Tu pedido va en camino
              </h1>
              <p style="margin:16px 0 0 0; font-size:14px; color:#cccccc; line-height:1.6;">
                Estimado/a <strong>${customerName}</strong>, tu pieza ha completado satisfactoriamente los procesos de manufactura, enmarcado y control de calidad. El paquete ya fue retirado por <strong>${courier}</strong> y se encuentra en ruta a tu destino.
              </p>
            </td>
          </tr>

          <!-- Bloque de Seguimiento Blue Express -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#1c1c1c; border:1px solid #333333; padding:22px 24px;">
                <tr>
                  <td>
                    <div style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#888888; margin-bottom:4px;">
                      Operador Logistico
                    </div>
                    <div style="font-size:16px; font-weight:700; color:#ffffff; margin-bottom:12px;">
                      ${courier}
                    </div>

                    <div style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#888888; margin-bottom:4px;">
                      Numero de Seguimiento Oficial
                    </div>
                    <div style="font-family:'SF Mono', Monaco, monospace; font-size:20px; font-weight:800; color:#ffffff; letter-spacing:0.05em; margin-bottom:14px;">
                      ${trackingNumber}
                    </div>

                    <div style="font-size:13px; color:#bbbbbb; margin-bottom:18px;">
                      Plazo estimado de entrega: <strong>${estimatedDays}</strong><br>
                      Destino: ${address}, ${city}
                    </div>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#C82333;">
                          <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:12px 24px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#ffffff; text-decoration:none;">
                            Rastrear Envio en Blue Express
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Recomendaciones de Cuidado del Relieve 3D -->
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <div style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#888888; margin-bottom:12px; border-bottom:1px solid #262626; padding-bottom:6px;">
                Recomendaciones de Conservacion y Cuidado
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px; color:#bbbbbb; line-height:1.6;">
                <tr>
                  <td style="padding:8px 0; vertical-align:top; width:24px; color:#C82333; font-weight:700;">1.</td>
                  <td style="padding:8px 0;"><strong>Temperatura y Exposicion:</strong> Evitar la exposicion solar directa continua y no situar la pieza cerca de fuentes termicas sobre 50°C para preservar la rigidez estructural del biopolimero mate.</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; vertical-align:top; width:24px; color:#C82333; font-weight:700;">2.</td>
                  <td style="padding:8px 0;"><strong>Limpieza en Seco:</strong> Realizar mantenimiento unicamente con brocha de cerdas suaves o paño de microfibra limpio. No emplear liquidos, solventes ni alcoholes sobre el relieve 3D.</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; vertical-align:top; width:24px; color:#C82333; font-weight:700;">3.</td>
                  <td style="padding:8px 0;"><strong>Montaje Seguro:</strong> Utilizar fijacion mural nivelada acorde al peso del marco shadowbox para garantizar una exhibicion vertical segura.</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contacto Directo Taller -->
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#181818; border:1px solid #282828; padding:18px 20px;">
                <tr>
                  <td>
                    <div style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#ffffff; margin-bottom:4px;">
                      Atencion de Encomiendas y Soporte
                    </div>
                    <div style="font-size:12px; color:#aaaaaa; line-height:1.6;">
                      Adolfo Risopatron · Telefono / WhatsApp: <a href="https://wa.me/56962032766" style="color:#ffffff; text-decoration:underline;">+56 9 6203 2766</a><br>
                      Correo corporativo: <a href="mailto:adolchilemods@gmail.com" style="color:#ffffff; text-decoration:underline;">adolchilemods@gmail.com</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie de Pagina -->
          <tr>
            <td style="padding:20px 32px; background-color:#0f0f0f; border-top:1px solid #222222; text-align:center;">
              <div style="font-size:11px; color:#666666; letter-spacing:0.04em;">
                ALZADO ROJO · AR ARQ SpA · Santiago, Chile · Todos los derechos reservados.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Handler principal del endpoint serverless
 */
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

    const type = String(payload.type || '').trim();
    if (type !== 'order_received' && type !== 'order_shipped') {
      return res.status(400).json({
        ok: false,
        error: 'El campo "type" es obligatorio y debe ser "order_received" o "order_shipped".'
      });
    }

    const customerEmail = String(payload.customerEmail || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail)) {
      return res.status(400).json({
        ok: false,
        error: 'Se requiere un correo electronico de cliente valido.'
      });
    }

    const orderId = String(payload.orderId || `AR-${Date.now()}`).trim();
    const customerName = String(payload.customerName || 'Cliente').trim();

    let subject = '';
    let htmlContent = '';
    let plainTextSummary = '';

    if (type === 'order_received') {
      subject = `Recibimos tu pedido ${orderId} · ALZADO ROJO`;
      htmlContent = buildOrderReceivedTemplate(payload);
      plainTextSummary = `Hola ${customerName}, recibimos tu orden ${orderId} en taller ALZADO ROJO. Pieza: ${payload.productName || 'Relieve 3D'} (${payload.size || 'Estandar'}). Fabricacion en PLA mate y marco shadowbox (3 a 5 dias habiles). Contacto: ${WORKSHOP_PHONE}`;
    } else {
      subject = `Tu pedido ${orderId} va en camino · ALZADO ROJO`;
      htmlContent = buildOrderShippedTemplate(payload);
      plainTextSummary = `Hola ${customerName}, tu orden ${orderId} ha sido despachada por ${payload.courier || 'Blue Express'}. Numero de seguimiento: ${payload.trackingNumber || 'BX-PENDIENTE'}. Rastreo: ${payload.trackingUrl || 'https://www.bluex.cl'}. Contacto taller: ${WORKSHOP_PHONE}`;
    }

    const mailtoFallback = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainTextSummary)}`;

    const apiKey = (process.env.RESEND_API_KEY || '').trim();

    // Modo simulado transparente si no hay API key configurada
    if (!apiKey) {
      console.log(`[ALZADO ROJO Email] Simulacion de correo (${type}) a ${customerEmail} para orden ${orderId}`);
      return res.status(200).json({
        ok: true,
        simulated: true,
        type,
        orderId,
        recipient: customerEmail,
        subject,
        mailtoFallback,
        previewHtml: htmlContent,
        message: `Correo simulado correctamente (${type}). Se genero enlace de respaldo mailto.`
      });
    }

    // Envio real con Resend API
    try {
      const resendPayload = {
        from: OFFICIAL_FROM,
        to: [customerEmail],
        reply_to: OFFICIAL_REPLY_TO,
        bcc: [WORKSHOP_EMAIL],
        subject: subject,
        html: htmlContent
      };

      let resendResponse = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resendPayload)
      });

      // Si falla por dominio no verificado en Resend (error comun con correos personalizados), reintentar con fallback
      let lastErrorData = null;
      if (!resendResponse.ok) {
        lastErrorData = await resendResponse.json().catch(() => ({}));
        console.warn('[ALZADO ROJO Email] Advertencia en envio primario con Resend:', lastErrorData);

        if (OFFICIAL_FROM !== FALLBACK_FROM) {
          resendPayload.from = FALLBACK_FROM;
          resendResponse = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(resendPayload)
          });
          if (!resendResponse.ok) {
            lastErrorData = await resendResponse.json().catch(() => ({}));
          }
        }
      }

      if (resendResponse.ok) {
        const resendData = await resendResponse.json();
        return res.status(200).json({
          ok: true,
          simulated: false,
          id: resendData.id,
          type,
          orderId,
          recipient: customerEmail,
          message: `Correo transaccional enviado exitosamente a ${customerEmail}.`
        });
      } else {
        const errData = lastErrorData || {};
        console.warn('[ALZADO ROJO Email] Resend retorno estado no satisfactorio:', errData);
        // Fallback seguro sin 500
        return res.status(200).json({
          ok: true,
          simulated: true,
          type,
          orderId,
          recipient: customerEmail,
          subject,
          mailtoFallback,
          error: errData.message || 'Resend retorno estado no satisfactorio',
          message: `Envio no completado por Resend. Enlace mailto generado como respaldo.`
        });
      }
    } catch (errResend) {
      console.warn('[ALZADO ROJO Email] Error de red al comunicar con Resend:', errResend);
      return res.status(200).json({
        ok: true,
        simulated: true,
        type,
        orderId,
        recipient: customerEmail,
        subject,
        mailtoFallback,
        error: errResend.message,
        message: 'Fallo de comunicacion con Resend. Se provee enlace de respaldo mailto.'
      });
    }

  } catch (error) {
    console.error('[ALZADO ROJO Email] Error critico en endpoint email-notify:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno en el procesador de correos: ' + error.message
    });
  }
};
