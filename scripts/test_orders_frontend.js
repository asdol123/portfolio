/**
 * Script de Verificacion Frontend para pedidos.html, css/editorial.css y js/orders-auth.js
 * ALZADO ROJO · AR ARQ SpA
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pedidosHtml = fs.readFileSync(path.join(ROOT, 'pedidos.html'), 'utf-8');
const editorialCss = fs.readFileSync(path.join(ROOT, 'css', 'editorial.css'), 'utf-8');
const ordersAuth = require(path.join(ROOT, 'js', 'orders-auth.js'));

console.log('='.repeat(70));
console.log('EJECUTANDO SUITE DE AUDITORÍA FRONTEND: PEDIDOS Y AUTH GATE');
console.log('='.repeat(70));

let failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failures++;
    console.error(`  [FAIL] ${name}: ${err.message}`);
  }
}

// 1. Navigation Header
test('Header nav contiene enlaces "Ir a la web pública" y "Catálogo Maquetas"', () => {
  if (!pedidosHtml.includes('<a href="index.html" class="bionova-nav-link">Ir a la web pública</a>')) {
    throw new Error('Falta enlace a index.html en bionova-nav-link');
  }
  if (!pedidosHtml.includes('<a href="maquetas-urbanas.html" class="bionova-nav-link">Catálogo Maquetas</a>')) {
    throw new Error('Falta enlace a maquetas-urbanas.html en bionova-nav-link');
  }
});

test('Header nav actions contiene botón #btn-lock-orders con clase btn-lock-taller', () => {
  if (!pedidosHtml.includes('id="btn-lock-orders"')) {
    throw new Error('Falta id="btn-lock-orders"');
  }
  if (!pedidosHtml.includes('btn-lock-taller')) {
    throw new Error('Falta clase btn-lock-taller');
  }
  if (!pedidosHtml.includes('Bloquear Taller</span>')) {
    throw new Error('Falta texto "Bloquear Taller"');
  }
});

// 2. Auth Gate Screen
test('Pantalla de acceso privado #orders-auth-gate con estructura completa', () => {
  if (!pedidosHtml.includes('id="orders-auth-gate"')) throw new Error('Falta id="orders-auth-gate"');
  if (!pedidosHtml.includes('class="orders-auth-card"')) throw new Error('Falta .orders-auth-card');
  if (!pedidosHtml.includes('class="orders-auth-badge"')) throw new Error('Falta .orders-auth-badge');
  if (!pedidosHtml.includes('class="auth-badge-dot"')) throw new Error('Falta .auth-badge-dot');
  if (!pedidosHtml.includes('class="auth-badge-text"')) throw new Error('Falta .auth-badge-text');
  if (!pedidosHtml.includes('class="orders-auth-icon-wrap"')) throw new Error('Falta .orders-auth-icon-wrap');
  if (!pedidosHtml.includes('class="orders-auth-title"')) throw new Error('Falta .orders-auth-title');
  if (!pedidosHtml.includes('class="orders-auth-desc"')) throw new Error('Falta .orders-auth-desc');
  if (!pedidosHtml.includes('id="orders-auth-form"')) throw new Error('Falta #orders-auth-form');
  if (!pedidosHtml.includes('id="orders-auth-pin"')) throw new Error('Falta #orders-auth-pin');
  if (!pedidosHtml.includes('id="btn-toggle-pin-visibility"')) throw new Error('Falta #btn-toggle-pin-visibility');
  if (!pedidosHtml.includes('id="orders-auth-remember"')) throw new Error('Falta #orders-auth-remember');
  if (!pedidosHtml.includes('id="orders-auth-error"')) throw new Error('Falta #orders-auth-error');
  if (!pedidosHtml.includes('id="btn-auth-submit"')) throw new Error('Falta #btn-auth-submit');
  if (!pedidosHtml.includes('class="orders-auth-footer-note"')) throw new Error('Falta .orders-auth-footer-note');
});

// 3. Private Dashboard Wrap
test('Contenedor privado #orders-private-dashboard envuelve el contenido de taller', () => {
  const dashStart = pedidosHtml.indexOf('id="orders-private-dashboard"');
  const heroIndex = pedidosHtml.indexOf('orders-hero-header');
  const kpiIndex = pedidosHtml.indexOf('orders-kpi-grid');
  const tableIndex = pedidosHtml.indexOf('id="orders-list-container"');
  const modalFormIndex = pedidosHtml.indexOf('id="modal-order-form"');
  const modalSheetIndex = pedidosHtml.indexOf('id="modal-taller-sheet"');
  const dashEnd = pedidosHtml.lastIndexOf('<!-- /#orders-private-dashboard -->');

  if (dashStart === -1) throw new Error('Falta #orders-private-dashboard');
  if (!(dashStart < heroIndex)) throw new Error('#orders-private-dashboard debe abrirse antes del hero');
  if (!(heroIndex < kpiIndex)) throw new Error('hero debe preceder a KPIs');
  if (!(kpiIndex < tableIndex)) throw new Error('KPIs deben preceder a orders-list-container');
  if (!(tableIndex < modalFormIndex)) throw new Error('orders-list-container precede a modal-order-form');
  if (!(modalFormIndex < modalSheetIndex)) throw new Error('modal-order-form precede a modal-taller-sheet');
  if (!(modalSheetIndex < dashEnd)) throw new Error('#orders-private-dashboard debe cerrarse después de modal-taller-sheet');
});

// 4. Footer Cleanliness
test('Footer legal no contiene enlace a pedidos.html', () => {
  const footerLegalStart = pedidosHtml.indexOf('class="ed-footer-legal-row"');
  const footerLegalEnd = pedidosHtml.indexOf('</div>', footerLegalStart);
  const footerLegalSnippet = pedidosHtml.slice(footerLegalStart, footerLegalEnd);

  if (footerLegalSnippet.includes('pedidos.html')) {
    throw new Error('El footer legal aún contiene enlace a pedidos.html');
  }
  if (!footerLegalSnippet.includes('politica-privacidad.html') ||
      !footerLegalSnippet.includes('terminos-condiciones.html') ||
      !footerLegalSnippet.includes('politica-cookies.html')) {
    throw new Error('El footer legal debe contener Privacidad, Términos y Cookies');
  }
});

test('Footer contiene enlace mailto:adolchilemods@gmail.com con <span>CORREO</span>', () => {
  if (!pedidosHtml.includes('href="mailto:adolchilemods@gmail.com"')) {
    throw new Error('Falta mailto:adolchilemods@gmail.com');
  }
  if (!pedidosHtml.includes('<span>CORREO</span>')) {
    throw new Error('Falta <span>CORREO</span>');
  }
});

// 5. CSS Rules
test('editorial.css contiene todas las clases y animaciones requeridas', () => {
  const requiredSelectors = [
    '.btn-lock-taller',
    '.orders-auth-gate',
    '.orders-auth-card',
    '.orders-auth-badge',
    '.auth-badge-dot',
    '.auth-badge-text',
    '.orders-auth-icon-wrap',
    '.orders-auth-title',
    '.orders-auth-desc',
    '.orders-auth-input',
    '.orders-auth-eye-btn',
    '.orders-auth-error',
    '.orders-auth-submit-btn',
    '.orders-private-dashboard',
    '@keyframes arFadeIn'
  ];

  for (const sel of requiredSelectors) {
    if (!editorialCss.includes(sel)) {
      throw new Error(`Falta selector en editorial.css: ${sel}`);
    }
  }
});

// 6. Restricciones Mandatorias: CERO ampersands visibles en HTML
test('CERO ampersands en textos visibles de pedidos.html', () => {
  // Regex para buscar ampersands que no sean entidades tecnicas (&copy;, &nbsp;) o query strings en links
  const visibleLines = pedidosHtml.split('\n').filter(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('<link') || trimmed.startsWith('<meta') || trimmed.startsWith('<!--')) return false;
    return true;
  });

  const ampersandMatch = visibleLines.find(line => {
    // Buscar & que no sea &copy; o &nbsp; o parte de una URL en href
    const cleaned = line.replace(/https?:\/\/[^\s"']+/g, '').replace(/&copy;/g, '').replace(/&nbsp;/g, '');
    return cleaned.includes('&');
  });

  if (ampersandMatch) {
    throw new Error(`Ampersand encontrado en linea: ${ampersandMatch.trim()}`);
  }
});

// 7. Restricciones Mandatorias: CERO emojis
test('CERO emojis en pedidos.html', () => {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(pedidosHtml)) {
    throw new Error('Se encontró al menos un emoji en pedidos.html');
  }
});

// 8. Auth Logic Testing
test('orders-auth.js valida credenciales autorizadas y rechaza incorrectas', () => {
  // Clave autorizada
  const res1 = ordersAuth.login('7541', false);
  if (!res1.ok || !res1.token) throw new Error('login con PIN 7541 falló');

  // Comprobar estado autenticado
  if (!ordersAuth.isAuthenticated()) throw new Error('isAuthenticated debe ser true tras login');

  // Logout
  ordersAuth.logout();
  if (ordersAuth.isAuthenticated()) throw new Error('isAuthenticated debe ser false tras logout');

  // Clave errónea
  const res2 = ordersAuth.login('clave-invalida', false);
  if (res2.ok) throw new Error('login con clave inválida debió fallar');
});

console.log('='.repeat(70));
if (failures === 0) {
  console.log('TODAS LAS PRUEBAS PASARON EXITOSAMENTE (0 ERRORES)');
} else {
  console.error(`SE ENCONTRARON ${failures} ERRORES`);
  process.exit(1);
}
console.log('='.repeat(70));
