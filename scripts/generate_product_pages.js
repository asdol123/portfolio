/**
 * ALZADO ROJO · AR ARQ SpA
 * Generador Estático de Páginas de Producto (Fase 3 · SSG & SEO Automation)
 * Archivo: scripts/generate_product_pages.js
 * 
 * Lee CATALOG_PRODUCTS desde js/ecommerce.js y la plantilla base producto.html.
 * Genera 27 archivos HTML 100% pre-renderizados e indexables en /productos/{product.id}.html
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'producto.html');
const ECOMMERCE_PATH = path.join(ROOT_DIR, 'js', 'ecommerce.js');
const OUTPUT_DIR = path.join(ROOT_DIR, 'productos');

// Importar catálogo de productos
const ecommerce = require(ECOMMERCE_PATH);
const CATALOG = ecommerce.CATALOG_PRODUCTS || [];

if (!Array.isArray(CATALOG) || CATALOG.length === 0) {
  console.error('Error: No se encontraron productos en CATALOG_PRODUCTS.');
  process.exit(1);
}

// Asegurar directorio de salida
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Cargar plantilla base
const baseTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

function formatCLP(amount) {
  const num = typeof amount === 'number' ? amount : parseInt(String(amount).replace(/[^0-9]/g, ''), 10) || 0;
  if (num === 0) return 'A convenir';
  return `$${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resolveFormats(product) {
  if (product.formats && Array.isArray(product.formats) && product.formats.length > 0) {
    return product.formats;
  }
  const isVolcano = product.category === 'volcanes' || String(product.sku).startsWith('SKU-VOL');
  if (isVolcano) {
    return [
      { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm (Estándar)', active: true },
      { size: 'Otro tamaño', price: 0, label: 'Otro tamaño (Cotizar)', isQuote: true }
    ];
  }
  return [
    { size: '10 × 10 cm', price: 9990, framePrice: 9990, originalPrice: 13290, label: '10 × 10 cm (Edición Bolsillo)' },
    { size: '15 × 15 cm', price: 19990, framePrice: 19990, originalPrice: 26490, label: '15 × 15 cm' },
    { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm', active: true },
    { size: '25 × 25 cm', price: 29990, framePrice: 29990, originalPrice: 39990, label: '25 × 25 cm', highlight: 'MEJOR VALOR' },
    { size: 'Otro tamaño', price: 0, label: 'Otro tamaño (Cotizar)', isQuote: true }
  ];
}

console.log(`Iniciando generación de ${CATALOG.length} páginas estáticas de producto...`);

let generatedCount = 0;

CATALOG.forEach(product => {
  const shortTitle = product.shortName || product.name;
  const baseName = shortTitle.replace(/^maqueta\s*(de\s*)?/i, '').trim();
  const canonicalUrl = `https://ar-arq.cl/productos/${product.id}`;
  const pageTitle = `Maqueta ${baseName} · Maqueta de Arquitectura 3D | ALZADO ROJO`;
  const metaDescription = `Maqueta topográfica y de arquitectura 3D de ${product.name} en Chile. Manufactura de precisión en taller propio, marco shadowbox incluido y despacho a todo Chile.`;
  const ogTitle = `Maqueta ${baseName} · Maqueta de Arquitectura 3D | ALZADO ROJO`;
  const ogDescription = `Compra directa online con Webpay / Débito desde $24.990 CLP con marco shadowbox incluido. Envíos a todo Chile.`;
  const ogImage = `https://ar-arq.cl/${product.main}`;
  const collectionName = product.collection || (product.category === 'volcanes' ? 'Volcanes de Chile' : 'Edición Urbana');
  const promoBadge = product.badge || '25% OFF Apertura';
  const leadTimeText = product.leadTime || 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile';
  const productImg = `/${product.main}`;

  const formats = resolveFormats(product);
  const activeFormat = formats.find(f => f.active) || formats.find(f => f.size.includes('20')) || formats[0];
  const currentPriceCLP = activeFormat.price > 0 ? `${formatCLP(activeFormat.price)} CLP` : 'A convenir';
  const origPriceCLP = activeFormat.originalPrice ? `${formatCLP(activeFormat.originalPrice)} CLP` : '$33.290 CLP';
  const savingsCLP = (activeFormat.originalPrice && activeFormat.price > 0)
    ? `Ahorro de ${formatCLP(activeFormat.originalPrice - activeFormat.price)} CLP (25% OFF Apertura)`
    : 'Ahorro de $8.300 CLP (25% OFF Apertura)';

  // Enlace y mensaje de WhatsApp
  const wspText = `Hola Adolfo, deseo encargar la maqueta ${baseName} en formato ${activeFormat.size}.`;
  const wspUrl = `https://wa.me/56962032766?text=${encodeURIComponent(wspText)}`;

  // Schema.org JSON-LD
  const schemaObj = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonicalUrl}#product`,
        "name": `Maqueta ${baseName} · Maqueta de Arquitectura 3D`,
        "image": [
          ogImage
        ],
        "description": product.description || metaDescription,
        "sku": product.sku,
        "brand": {
          "@type": "Brand",
          "name": "ALZADO ROJO"
        },
        "manufacturer": {
          "@type": "Organization",
          "name": "AR ARQ SpA",
          "url": "https://ar-arq.cl"
        },
        "offers": {
          "@type": "Offer",
          "url": canonicalUrl,
          "priceCurrency": "CLP",
          "price": activeFormat.price > 0 ? activeFormat.price : 24990,
          "priceValidUntil": "2027-12-31",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": "ALZADO ROJO"
          }
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Inicio",
            "item": "https://ar-arq.cl/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Catálogo de Maquetas Urbanas",
            "item": "https://ar-arq.cl/maquetas-urbanas"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": `Maqueta ${baseName}`,
            "item": canonicalUrl
          }
        ]
      }
    ]
  };

  // 1. Selector de vistas
  const views = [];
  if (product.images && typeof product.images === 'object') {
    Object.keys(product.images).forEach(viewName => {
      views.push({ label: viewName, imgUrl: product.images[viewName] });
    });
  } else {
    views.push({ label: 'Con Marco', imgUrl: product.main });
  }
  let viewButtonsHtml = views.map((v, idx) => 
    `<button type="button" class="pdp-view-btn ${idx === 0 ? 'is-active' : ''}" aria-pressed="${idx === 0 ? 'true' : 'false'}">${escapeHtml(v.label)}</button>`
  ).join('\n                            ');
  if (product.video) {
    viewButtonsHtml += `\n                            <button type="button" class="pdp-view-btn" aria-pressed="false">Video 3D</button>`;
  }

  // 2. Miniaturas de Galería
  const galleryItems = (product.gallery && product.gallery.length > 0)
    ? product.gallery
    : [{ url: product.main, label: shortTitle }];
  const thumbnailsHtml = galleryItems.map((item, idx) => 
    `<button type="button" class="pdp-thumb-item ${idx === 0 ? 'is-active' : ''}" aria-label="${escapeHtml(item.label || shortTitle)}"><img src="/${item.url}" alt="${escapeHtml(item.label || shortTitle)}" loading="lazy" decoding="async"></button>`
  ).join('\n                        ');

  // 3. Pastillas de formato
  const formatsHtml = formats.map(f => {
    const isAct = f.size === activeFormat.size;
    const priceStr = f.price > 0 ? formatCLP(f.price) : 'Cotizar';
    const subHtml = f.highlight ? `<span class="pdp-format-sub">${escapeHtml(f.highlight)}</span>` : '';
    return `<button type="button" class="pdp-format-pill ${isAct ? 'is-active' : ''}" role="radio" aria-checked="${isAct ? 'true' : 'false'}"><span class="pdp-format-size">${escapeHtml(f.size)}</span><span class="pdp-format-price">${priceStr}</span>${subHtml}</button>`;
  }).join('\n                            ');

  // 4. Especificaciones técnicas
  const defaultSpecs = {
    escala: '1:1000 / 1:2000',
    tolerancia: '±0.20 mm',
    material: 'PLA Arquitectónico Biobasado Mate',
    marco: 'Shadowbox Negro Mate o Madera Natural',
    origen: 'DEM Satelital Alos Palsar 12.5 m',
    acabado: 'Blanco Tiza Mate Antirreflejo'
  };
  const specs = product.specs || defaultSpecs;
  const specLabels = {
    escala: 'Escala Arquitectónica',
    tolerancia: 'Tolerancia Dimensional',
    material: 'Materialidad',
    marco: 'Marco Perimetral',
    origen: 'Origen Cartográfico',
    acabado: 'Terminación Superficial'
  };
  const specsHtml = Object.keys(specs).map(k => 
    `<div class="pdp-spec-cell"><span class="pdp-spec-label">${escapeHtml(specLabels[k] || k)}</span><span class="pdp-spec-val">${escapeHtml(specs[k])}</span></div>`
  ).join('\n                            ');

  // 5. Productos recomendados (4 productos distintos)
  const relatedCandidates = CATALOG.filter(p => p.sku !== product.sku).slice(0, 4);
  const relatedHtml = relatedCandidates.map(item => {
    const rBasePrice = (item.formats && item.formats[0] && item.formats[0].price) ? item.formats[0].price : 24990;
    const rBadgeHtml = item.badge ? `<span class="pdp-related-badge">${escapeHtml(item.badge)}</span>` : '';
    const rCat = item.collection || (item.category === 'volcanes' ? 'Volcanes de Chile' : 'Edición Urbana');
    return `<a href="/productos/${item.id}" class="pdp-related-card" aria-label="Ver detalles de ${escapeHtml(item.name)}"><div class="pdp-related-thumb-box"><img src="/${item.main}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">${rBadgeHtml}</div><div class="pdp-related-body"><span class="pdp-related-cat">${escapeHtml(rCat)}</span><h3 class="pdp-related-name">${escapeHtml(item.shortName || item.name)}</h3><div class="pdp-related-footer"><span class="pdp-related-price">${formatCLP(rBasePrice)} CLP</span><span class="pdp-related-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span></div></div></a>`;
  }).join('\n                    ');

  // Remplazos precisos en la plantilla
  let html = baseTemplate;

  // Head Meta & Canonical
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`);
  html = html.replace(/<meta name="description" content="[\s\S]*?">/, `<meta name="description" content="${escapeHtml(metaDescription)}">`);
  html = html.replace(/<link rel="canonical" href="[\s\S]*?">/, `<link rel="canonical" href="${canonicalUrl}">`);

  // Open Graph
  html = html.replace(/<meta property="og:url" content="[\s\S]*?">/, `<meta property="og:url" content="${canonicalUrl}">`);
  html = html.replace(/<meta property="og:title" content="[\s\S]*?">/, `<meta property="og:title" content="${escapeHtml(ogTitle)}">`);
  html = html.replace(/<meta property="og:description" content="[\s\S]*?">/, `<meta property="og:description" content="${escapeHtml(ogDescription)}">`);
  html = html.replace(/<meta property="og:image" content="[\s\S]*?">/, `<meta property="og:image" content="${ogImage}">`);

  // Twitter Cards
  html = html.replace(/<meta name="twitter:url" content="[\s\S]*?">/, `<meta name="twitter:url" content="${canonicalUrl}">`);
  html = html.replace(/<meta name="twitter:title" content="[\s\S]*?">/, `<meta name="twitter:title" content="${escapeHtml(ogTitle)}">`);
  html = html.replace(/<meta name="twitter:description" content="[\s\S]*?">/, `<meta name="twitter:description" content="${escapeHtml(ogDescription)}">`);
  html = html.replace(/<meta name="twitter:image" content="[\s\S]*?">/, `<meta name="twitter:image" content="${ogImage}">`);

  // Schema JSON-LD
  html = html.replace(
    /<script type="application\/ld\+json" id="pdp-json-ld">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="pdp-json-ld">\n${JSON.stringify(schemaObj, null, 2)}\n    </script>`
  );

  // Breadcrumb
  html = html.replace(
    /<li aria-current="page"><span class="pdp-breadcrumb-current" id="pdp-breadcrumb-current">[\s\S]*?<\/span><\/li>/,
    `<li aria-current="page"><span class="pdp-breadcrumb-current" id="pdp-breadcrumb-current">Maqueta ${escapeHtml(baseName)}</span></li>`
  );

  // Heading Group
  html = html.replace(
    /<h1 class="pdp-title" id="pdp-title">[\s\S]*?<\/h1>/,
    `<h1 class="pdp-title" id="pdp-title">${escapeHtml(product.name)}</h1>`
  );
  html = html.replace(
    /<span class="pdp-tag-pill" id="pdp-collection-tag">[\s\S]*?<\/span>/,
    `<span class="pdp-tag-pill" id="pdp-collection-tag">${escapeHtml(collectionName)}</span>`
  );
  html = html.replace(
    /<span class="pdp-promo-pill" id="pdp-promo-badge">[\s\S]*?<\/span>/,
    `<span class="pdp-promo-pill" id="pdp-promo-badge">${escapeHtml(promoBadge)}</span>`
  );
  html = html.replace(
    /<span class="pdp-sku-badge" id="pdp-sku-badge">[\s\S]*?<\/span>/,
    `<span class="pdp-sku-badge" id="pdp-sku-badge">${escapeHtml(product.sku)}</span>`
  );

  // Visor principal y video
  html = html.replace(
    /<img id="pdp-main-image" src="[^"]*" alt="[^"]*" draggable="false">/,
    `<img id="pdp-main-image" src="${productImg}" alt="${escapeHtml(shortTitle)} · Maqueta en marco shadowbox" draggable="false">`
  );
  if (product.video) {
    html = html.replace(
      /<video id="pdp-product-video"[\s\S]*?<\/video>/,
      `<video id="pdp-product-video" loop muted playsinline controls preload="auto" poster="${productImg}"><source src="/${product.video}" type="video/mp4">Tu navegador no soporta video HTML5.</video>`
    );
  }

  // Selector de perspectivas
  html = html.replace(
    /<div class="pdp-view-selector" id="pdp-view-selector" role="tablist" aria-label="Perspectivas del modelo">[\s\S]*?<\/div>/,
    `<div class="pdp-view-selector" id="pdp-view-selector" role="tablist" aria-label="Perspectivas del modelo">\n                            ${viewButtonsHtml}\n                        </div>`
  );

  // Tira de miniaturas
  html = html.replace(
    /<div class="pdp-thumbnails-strip" id="pdp-thumbnails-strip" role="group" aria-label="Galería de imágenes secundarias">[\s\S]*?<\/div>/,
    `<div class="pdp-thumbnails-strip" id="pdp-thumbnails-strip" role="group" aria-label="Galería de imágenes secundarias">\n                        ${thumbnailsHtml}\n                    </div>`
  );

  // Lead
  html = html.replace(
    /<p class="pdp-lead" id="pdp-lead">[\s\S]*?<\/p>/,
    `<p class="pdp-lead" id="pdp-lead">${escapeHtml(product.description || '')}</p>`
  );

  // Precios
  html = html.replace(
    /<span class="pdp-price-current" id="pdp-price-current">[\s\S]*?<\/span>/,
    `<span class="pdp-price-current" id="pdp-price-current">${currentPriceCLP}</span>`
  );
  html = html.replace(
    /<span class="pdp-price-original" id="pdp-price-original">[\s\S]*?<\/span>/,
    `<span class="pdp-price-original" id="pdp-price-original">${origPriceCLP}</span>`
  );
  html = html.replace(
    /<div class="pdp-pricing-savings" id="pdp-pricing-savings">[\s\S]*?<\/div>/,
    `<div class="pdp-pricing-savings" id="pdp-pricing-savings">\n                            ${savingsCLP}\n                        </div>`
  );

  // Formatos Grid
  html = html.replace(
    /<div class="pdp-formats-grid" id="pdp-formats-grid" role="radiogroup" aria-label="Formatos disponibles">[\s\S]*?<\/div>/,
    `<div class="pdp-formats-grid" id="pdp-formats-grid" role="radiogroup" aria-label="Formatos disponibles">\n                            ${formatsHtml}\n                        </div>`
  );

  // Botón WhatsApp
  html = html.replace(
    /<a href="[^"]*" target="_blank" rel="noopener noreferrer" class="pdp-btn-wsp" id="pdp-btn-wsp">/,
    `<a href="${wspUrl}" target="_blank" rel="noopener noreferrer" class="pdp-btn-wsp" id="pdp-btn-wsp">`
  );

  // Leadtime text
  html = html.replace(
    /<span class="pdp-leadtime-text" id="pdp-leadtime-text">[\s\S]*?<\/span>/,
    `<span class="pdp-leadtime-text" id="pdp-leadtime-text">${escapeHtml(leadTimeText)}</span>`
  );

  // Specs Grid
  html = html.replace(
    /<div class="pdp-specs-grid" id="pdp-specs-grid">[\s\S]*?<\/div>/,
    `<div class="pdp-specs-grid" id="pdp-specs-grid">\n                            ${specsHtml}\n                        </div>`
  );

  // Descripción completa
  html = html.replace(
    /<p class="pdp-description-text" id="pdp-full-desc">[\s\S]*?<\/p>/,
    `<p class="pdp-description-text" id="pdp-full-desc">\n                            ${escapeHtml(product.description || '')}\n                        </p>`
  );

  // Workshop poster
  html = html.replace(
    /<video class="pdp-workshop-video" autoplay loop muted playsinline preload="auto" poster="[^"]*">/,
    `<video class="pdp-workshop-video" autoplay loop muted playsinline preload="auto" poster="${productImg}">`
  );

  // Productos Recomendados Grid
  html = html.replace(
    /<div class="pdp-related-grid" id="pdp-related-grid">[\s\S]*?<\/div>/,
    `<div class="pdp-related-grid" id="pdp-related-grid">\n                    ${relatedHtml}\n                </div>`
  );

  // Barra sticky inferior para móviles
  html = html.replace(
    /<span class="pdp-sticky-name" id="pdp-sticky-name">[\s\S]*?<\/span>/,
    `<span class="pdp-sticky-name" id="pdp-sticky-name">${escapeHtml(shortTitle)}</span>`
  );
  html = html.replace(
    /<span class="pdp-sticky-price" id="pdp-sticky-price">[\s\S]*?<\/span>/,
    `<span class="pdp-sticky-price" id="pdp-sticky-price">${currentPriceCLP}</span>`
  );
  html = html.replace(
    /<a href="#" target="_blank" rel="noopener noreferrer" class="pdp-sticky-btn-wsp" id="pdp-sticky-btn-wsp"/,
    `<a href="${wspUrl}" target="_blank" rel="noopener noreferrer" class="pdp-sticky-btn-wsp" id="pdp-sticky-btn-wsp"`
  );

  // Guardar archivo estático
  const outFilePath = path.join(OUTPUT_DIR, `${product.id}.html`);
  fs.writeFileSync(outFilePath, html, 'utf8');
  generatedCount++;
  console.log(`[OK] Generada página ${generatedCount}/${CATALOG.length}: productos/${product.id}.html`);
});

console.log(`\n¡Éxito! Se han generado las ${generatedCount} páginas estáticas de producto en ${OUTPUT_DIR}`);
