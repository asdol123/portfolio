/**
 * ALZADO ROJO · AR ARQ SpA
 * Controlador Frontend de la Página de Producto (PDP)
 * Archivo: js/producto.js
 * 
 * Reglas de diseño y marca:
 * - Cero emojis en textos y botones visibles.
 * - Cero ampersands en títulos (uso de 'y', 'e' o '·').
 * - Integración nativa con window.AR_CATALOG, window.AR_ECOMMERCE y window.AR_CHECKOUT.
 * - Soporte para deep-linking con parámetros ?id= o ?sku= o slugs de ruta.
 */

(function () {
  'use strict';

  // Configuración y Fallback por Defecto (Volcán Villarrica)
  const DEFAULT_SKU = 'SKU-VOL-01';
  const WHATSAPP_RAW = '56962032766';

  // Estado reactivo de la PDP
  const state = {
    product: null,
    currentImage: '',
    currentView: 'Con Marco',
    selectedFormat: null,
    isVideoMode: false
  };

  /**
   * Da formato a moneda chilena (CLP)
   * @param {number|string} amount
   * @returns {string}
   */
  function formatCLP(amount) {
    const num = typeof amount === 'number' ? amount : parseInt(String(amount).replace(/[^0-9]/g, ''), 10) || 0;
    if (num === 0) return 'A convenir';
    return `$${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }

  /**
   * Obtiene los parámetros de la URL (?id= o ?sku= o pathname)
   * @returns {{ id: string, sku: string }}
   */
  function getUrlParams() {
    const searchParams = new URLSearchParams(window.location.search);
    const id = (searchParams.get('id') || searchParams.get('slug') || '').trim();
    const sku = (searchParams.get('sku') || '').trim();

    let pathSlug = '';
    const cleanPath = window.location.pathname.replace(/\/$/, '').replace(/\.html$/i, '');
    const parts = cleanPath.split('/');
    if (parts.length >= 2) {
      const parentDir = parts[parts.length - 2];
      if (parentDir === 'productos' || parentDir === 'producto') {
        pathSlug = parts[parts.length - 1];
      }
    }

    return { id: id || pathSlug, sku };
  }

  /**
   * Resuelve el producto desde window.AR_CATALOG
   * @param {string} id
   * @param {string} sku
   * @returns {object}
   */
  function resolveProduct(id, sku) {
    const catalog = window.AR_CATALOG || (window.AR_ECOMMERCE && window.AR_ECOMMERCE.CATALOG_PRODUCTS) || [];

    if (!catalog.length) return null;

    // 1. Buscar por ID / Slug exacto
    if (id) {
      const matchId = catalog.find(p => p.id && p.id.toLowerCase() === id.toLowerCase());
      if (matchId) return matchId;
    }

    // 2. Buscar por SKU
    if (sku) {
      const matchSku = catalog.find(p => p.sku && p.sku.toLowerCase() === sku.toLowerCase());
      if (matchSku) return matchSku;
    }

    // 3. Fallback a Volcán Villarrica
    const defaultProd = catalog.find(p => p.sku === DEFAULT_SKU) || catalog[0];
    return defaultProd;
  }

  /**
   * Resuelve o genera la lista de formatos para el producto
   * @param {object} product
   * @returns {Array<object>}
   */
  function resolveFormats(product) {
    if (product.formats && Array.isArray(product.formats) && product.formats.length > 0) {
      return product.formats;
    }

    const isVolcano = window.AR_ECOMMERCE && typeof window.AR_ECOMMERCE.isVolcanoCategory === 'function'
      ? window.AR_ECOMMERCE.isVolcanoCategory(product)
      : (product.category === 'volcanes' || String(product.sku).startsWith('SKU-VOL'));

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

  /**
   * Actualiza el Schema.org JSON-LD en el head para SEO y Rich Snippets
   * @param {object} product
   * @param {object} selectedFormat
   */
  function updateStructuredData(product, selectedFormat) {
    let script = document.getElementById('pdp-json-ld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'pdp-json-ld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const currentUrl = `https://ar-arq.cl/productos/${product.id || product.sku}`;
    const priceVal = selectedFormat.price > 0 ? selectedFormat.price : 24990;

    const data = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          "@id": `${currentUrl}#product`,
          "name": `${product.shortName || product.name} · Maqueta de Arquitectura 3D`,
          "image": [
            `https://ar-arq.cl/${product.main || product.image || 'catalog/volcan-villarrica-marco.jpg'}`
          ],
          "description": product.description || 'Maqueta topográfica y urbana de alta precisión en relieve 3D fabricada en PLA arquitectónico biobasado con marco shadowbox.',
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
            "url": currentUrl,
            "priceCurrency": "CLP",
            "price": priceVal,
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
          "@id": `${currentUrl}#breadcrumb`,
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
              "name": product.shortName || product.name,
              "item": currentUrl
            }
          ]
        }
      ]
    };

    script.textContent = JSON.stringify(data, null, 2);
  }

  /**
   * Renderiza el producto en todos los módulos de la página
   * @param {object} product
   */
  function renderProduct(product) {
    if (!product) return;

    state.product = product;
    state.currentImage = product.main || product.image || 'catalog/volcan-villarrica-marco.jpg';
    state.currentView = 'Con Marco';
    state.isVideoMode = false;

    const shortTitle = product.shortName || product.name;
    const displayH1 = shortTitle.toLowerCase().includes('maqueta') ? shortTitle : `${shortTitle} · Maqueta 3D`;
    const cleanMetaTitle = `${displayH1} | ALZADO ROJO`;
    document.title = cleanMetaTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `Comprar ${displayH1}. Relieve topográfico satelital de alta precisión en marco shadowbox. Despacho a todo Chile vía Blue Express.`);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', cleanMetaTitle);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', `https://ar-arq.cl/${state.currentImage}`);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://ar-arq.cl/productos/${product.id || product.sku}`);
    }

    // Breadcrumb
    const bcCurrent = document.getElementById('pdp-breadcrumb-current');
    if (bcCurrent) bcCurrent.textContent = shortTitle;

    // Titulares Desktop y Móvil (1 o 2 líneas, sin desborde)
    const titleElems = document.querySelectorAll('.pdp-title');
    titleElems.forEach(el => {
      el.textContent = displayH1;
    });

    const subTitleElems = document.querySelectorAll('.pdp-subtitle');
    subTitleElems.forEach(el => {
      el.textContent = 'Relieve topográfico satelital con marco shadowbox de taller';
    });

    // Metadatos
    const tagElems = document.querySelectorAll('.pdp-tag-pill');
    tagElems.forEach(el => {
      el.textContent = product.collection || (product.category === 'volcanes' ? 'Volcanes de Chile' : 'Edición Urbana');
    });

    const promoBadges = document.querySelectorAll('.pdp-promo-pill');
    promoBadges.forEach(el => {
      el.textContent = product.badge || '25% OFF Apertura';
    });

    const skuBadges = document.querySelectorAll('.pdp-sku-badge');
    skuBadges.forEach(el => {
      el.textContent = product.sku;
    });

    const leadElem = document.getElementById('pdp-lead');
    if (leadElem) {
      leadElem.textContent = product.description || 'Pieza escultórica y arquitectónica fabricada mediante manufactura aditiva con microestratificación de alta fidelidad.';
    }

    // Lead Time
    const leadtimeElem = document.getElementById('pdp-leadtime-text');
    if (leadtimeElem) {
      leadtimeElem.textContent = product.leadTime || 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile';
    }

    // Imagen Principal
    const mainImg = document.getElementById('pdp-main-image');
    if (mainImg) {
      mainImg.src = state.currentImage;
      mainImg.alt = `${shortTitle} en marco shadowbox`;
    }

    // Video
    const videoElem = document.getElementById('pdp-product-video');
    if (product.video && videoElem) {
      videoElem.src = product.video;
      videoElem.load();
    }

    // Selector de Vistas / Perspectivas
    const viewSelector = document.getElementById('pdp-view-selector');
    const videoViewer = document.getElementById('pdp-video-viewer');
    const mainViewer = document.getElementById('pdp-main-viewer');

    if (viewSelector) {
      viewSelector.innerHTML = '';
      const views = [];

      if (product.images && typeof product.images === 'object') {
        Object.keys(product.images).forEach(viewName => {
          views.push({ label: viewName, imgUrl: product.images[viewName], isVideo: false });
        });
      } else {
        views.push({ label: 'Con Marco', imgUrl: state.currentImage, isVideo: false });
      }

      if (product.video) {
        views.push({ label: 'Video 3D', isVideo: true });
      }

      views.forEach((v, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `pdp-view-btn ${idx === 0 ? 'is-active' : ''}`;
        btn.setAttribute('aria-pressed', idx === 0 ? 'true' : 'false');
        btn.textContent = v.label;

        btn.addEventListener('click', () => {
          viewSelector.querySelectorAll('.pdp-view-btn').forEach(b => {
            b.classList.remove('is-active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');

          if (v.isVideo) {
            state.isVideoMode = true;
            if (mainViewer) mainViewer.style.display = 'none';
            if (videoViewer) {
              videoViewer.classList.add('is-active');
              if (videoElem) videoElem.play().catch(() => {});
            }
          } else {
            state.isVideoMode = false;
            if (videoViewer) {
              videoViewer.classList.remove('is-active');
              if (videoElem) videoElem.pause();
            }
            if (mainViewer) {
              mainViewer.style.display = 'flex';
              mainImg.style.opacity = '0.5';
              mainImg.src = v.imgUrl;
              state.currentImage = v.imgUrl;
              setTimeout(() => { mainImg.style.opacity = '1'; }, 50);
            }
          }
        });

        viewSelector.appendChild(btn);
      });
    }

    // Miniaturas
    const thumbStrip = document.getElementById('pdp-thumbnails-strip');
    if (thumbStrip) {
      thumbStrip.innerHTML = '';
      const galleryItems = product.gallery && product.gallery.length > 0
        ? product.gallery
        : [{ url: state.currentImage, label: shortTitle }];

      galleryItems.forEach((item, idx) => {
        const thumbBtn = document.createElement('button');
        thumbBtn.type = 'button';
        thumbBtn.className = `pdp-thumb-item ${idx === 0 ? 'is-active' : ''}`;
        thumbBtn.setAttribute('aria-label', item.label || `Vista ${idx + 1}`);

        const img = document.createElement('img');
        img.src = item.url;
        img.alt = item.label || shortTitle;
        img.loading = 'lazy';
        img.decoding = 'async';
        thumbBtn.appendChild(img);

        thumbBtn.addEventListener('click', () => {
          thumbStrip.querySelectorAll('.pdp-thumb-item').forEach(t => t.classList.remove('is-active'));
          thumbBtn.classList.add('is-active');

          if (state.isVideoMode) {
            state.isVideoMode = false;
            if (videoViewer) videoViewer.classList.remove('is-active');
            if (mainViewer) mainViewer.style.display = 'flex';
          }

          if (mainImg) {
            mainImg.style.opacity = '0.4';
            mainImg.src = item.url;
            state.currentImage = item.url;
            setTimeout(() => { mainImg.style.opacity = '1'; }, 60);
          }
        });

        thumbStrip.appendChild(thumbBtn);
      });
    }

    // Formatos y Precios
    const formats = resolveFormats(product);
    const activeFormat = formats.find(f => f.active) || formats[0];
    state.selectedFormat = activeFormat;

    renderFormatsList(formats, activeFormat);
    updatePriceDisplay(activeFormat);

    // Especificaciones
    renderSpecsGrid(product.specs);

    // Descripción
    const fullDesc = document.getElementById('pdp-full-desc');
    if (fullDesc) fullDesc.textContent = product.description;

    // Productos Recomendados
    renderRelatedProducts(product);

    // Sticky Bar
    updateStickyBar(product, activeFormat);

    // Datos estructurados
    updateStructuredData(product, activeFormat);
  }

  /**
   * Renderiza las pastillas de formato / tamaño
   * @param {Array<object>} formats
   * @param {object} activeFormat
   */
  function renderFormatsList(formats, activeFormat) {
    const container = document.getElementById('pdp-formats-grid');
    if (!container) return;

    container.innerHTML = '';

    formats.forEach(f => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `pdp-format-pill ${f.size === activeFormat.size ? 'is-active' : ''}`;
      pill.setAttribute('role', 'radio');
      pill.setAttribute('aria-checked', f.size === activeFormat.size ? 'true' : 'false');

      const sizeSpan = document.createElement('span');
      sizeSpan.className = 'pdp-format-size';
      sizeSpan.textContent = f.size;
      pill.appendChild(sizeSpan);

      const priceSpan = document.createElement('span');
      priceSpan.className = 'pdp-format-price';
      priceSpan.textContent = f.price > 0 ? formatCLP(f.price) : 'Cotizar';
      pill.appendChild(priceSpan);

      if (f.highlight) {
        const subSpan = document.createElement('span');
        subSpan.className = 'pdp-format-sub';
        subSpan.textContent = f.highlight;
        pill.appendChild(subSpan);
      }

      pill.addEventListener('click', () => {
        container.querySelectorAll('.pdp-format-pill').forEach(p => {
          p.classList.remove('is-active');
          p.setAttribute('aria-checked', 'false');
        });
        pill.classList.add('is-active');
        pill.setAttribute('aria-checked', 'true');

        state.selectedFormat = f;
        updatePriceDisplay(f);
        updateStickyBar(state.product, f);
        updateStructuredData(state.product, f);
      });

      container.appendChild(pill);
    });
  }

  /**
   * Actualiza el bloque de precios según el formato seleccionado
   * @param {object} format
   */
  function updatePriceDisplay(format) {
    const priceCurrent = document.getElementById('pdp-price-current');
    const priceOriginal = document.getElementById('pdp-price-original');
    const savingsElem = document.getElementById('pdp-pricing-savings');
    const btnBuy = document.getElementById('pdp-btn-buy');
    const btnWsp = document.getElementById('pdp-btn-wsp');

    if (format.isQuote || format.price === 0) {
      if (priceCurrent) priceCurrent.textContent = 'A convenir';
      if (priceOriginal) priceOriginal.style.display = 'none';
      if (savingsElem) savingsElem.style.display = 'none';
      if (btnBuy) {
        btnBuy.innerHTML = `<span>SOLICITAR COTIZACIÓN A MEDIDA</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
      }
    } else {
      if (priceCurrent) priceCurrent.textContent = `${formatCLP(format.price)} CLP`;
      
      const origPrice = format.originalPrice || Math.round(format.price / 0.75);
      if (priceOriginal) {
        priceOriginal.style.display = 'inline-block';
        priceOriginal.textContent = `${formatCLP(origPrice)} CLP`;
      }

      if (savingsElem) {
        savingsElem.style.display = 'flex';
        const ahorro = origPrice - format.price;
        savingsElem.textContent = `Ahorro de ${formatCLP(ahorro)} CLP (25% OFF Apertura)`;
      }

      if (btnBuy) {
        btnBuy.innerHTML = `<span>COMPRAR AHORA (WEBPAY / DÉBITO)</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
      }
    }

    if (btnWsp && state.product) {
      const prodName = state.product.shortName || state.product.name;
      const sizeText = format.size;
      const priceText = format.price > 0 ? formatCLP(format.price) : 'a convenir';
      const msg = `Hola Adolfo, deseo encargar/consultar por la maqueta ${prodName} en formato ${sizeText} (${priceText}). ¿Tienen disponibilidad de despacho?`;
      btnWsp.href = `https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent(msg)}`;
    }
  }

  /**
   * Renderiza la cuadrícula de especificaciones técnicas
   * @param {object} specs
   */
  function renderSpecsGrid(specs) {
    const grid = document.getElementById('pdp-specs-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const defaultSpecs = {
      escala: '1:1000 / 1:2000',
      tolerancia: '±0.20 mm',
      material: 'PLA Arquitectónico Biobasado Mate',
      marco: 'Shadowbox Negro Mate o Madera Natural',
      origen: 'DEM Satelital Alos Palsar 12.5 m',
      acabado: 'Blanco Tiza Mate Antirreflejo'
    };

    const finalSpecs = specs || defaultSpecs;

    const labels = {
      escala: 'Escala Arquitectónica',
      tolerancia: 'Tolerancia Dimensional',
      material: 'Materialidad',
      marco: 'Marco Perimetral',
      origen: 'Origen Cartográfico',
      acabado: 'Terminación Superficial'
    };

    Object.keys(finalSpecs).forEach(key => {
      const cell = document.createElement('div');
      cell.className = 'pdp-spec-cell';

      const label = document.createElement('span');
      label.className = 'pdp-spec-label';
      label.textContent = labels[key] || key;
      cell.appendChild(label);

      const val = document.createElement('span');
      val.className = 'pdp-spec-val';
      val.textContent = finalSpecs[key];
      cell.appendChild(val);

      grid.appendChild(cell);
    });
  }

  /**
   * Renderiza productos recomendados / relacionados (Link equity SEO)
   * @param {object} currentProduct
   */
  function renderRelatedProducts(currentProduct) {
    const grid = document.getElementById('pdp-related-grid');
    if (!grid) return;

    const catalog = window.AR_CATALOG || (window.AR_ECOMMERCE && window.AR_ECOMMERCE.CATALOG_PRODUCTS) || [];
    if (!catalog.length) return;

    const candidates = catalog.filter(p => p.sku !== currentProduct.sku);
    const related = candidates.slice(0, 4);

    grid.innerHTML = '';

    related.forEach(item => {
      const card = document.createElement('a');
      card.href = `/productos/${item.id || item.sku}`;
      card.className = 'pdp-related-card';
      card.setAttribute('aria-label', `Ver detalles de ${item.name}`);

      const thumbBox = document.createElement('div');
      thumbBox.className = 'pdp-related-thumb-box';

      const img = document.createElement('img');
      img.src = item.main || item.image || 'catalog/santiago-costanera-marco.jpg';
      img.alt = item.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      thumbBox.appendChild(img);

      if (item.badge) {
        const badge = document.createElement('span');
        badge.className = 'pdp-related-badge';
        badge.textContent = item.badge;
        thumbBox.appendChild(badge);
      }

      card.appendChild(thumbBox);

      const body = document.createElement('div');
      body.className = 'pdp-related-body';

      const cat = document.createElement('span');
      cat.className = 'pdp-related-cat';
      cat.textContent = item.collection || (item.category === 'volcanes' ? 'Volcanes de Chile' : 'Edición Urbana');
      body.appendChild(cat);

      const name = document.createElement('h3');
      name.className = 'pdp-related-name';
      name.textContent = item.shortName || item.name;
      body.appendChild(name);

      const footer = document.createElement('div');
      footer.className = 'pdp-related-footer';

      const price = document.createElement('span');
      price.className = 'pdp-related-price';
      const basePrice = (item.formats && item.formats[0] && item.formats[0].price) ? item.formats[0].price : 24990;
      price.textContent = `${formatCLP(basePrice)} CLP`;
      footer.appendChild(price);

      const arrow = document.createElement('span');
      arrow.className = 'pdp-related-arrow';
      arrow.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
      footer.appendChild(arrow);

      body.appendChild(footer);
      card.appendChild(body);

      grid.appendChild(card);
    });
  }

  /**
   * Actualiza la barra inferior flotante de conversión para móviles
   * @param {object} product
   * @param {object} format
   */
  function updateStickyBar(product, format) {
    const nameElem = document.getElementById('pdp-sticky-name');
    const priceElem = document.getElementById('pdp-sticky-price');
    const wspBtn = document.getElementById('pdp-sticky-btn-wsp');

    if (nameElem && product) {
      nameElem.textContent = product.shortName || product.name;
    }

    if (priceElem && format) {
      priceElem.textContent = format.price > 0 ? `${formatCLP(format.price)} CLP` : 'Cotizar';
    }

    if (wspBtn && product && format) {
      const prodName = product.shortName || product.name;
      const sizeText = format.size;
      const priceText = format.price > 0 ? formatCLP(format.price) : 'a convenir';
      const msg = `Hola Adolfo, deseo encargar/consultar por la maqueta ${prodName} en formato ${sizeText} (${priceText}). ¿Tienen disponibilidad de despacho?`;
      wspBtn.href = `https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent(msg)}`;
    }
  }

  /**
   * Configura la lupa y zoom interactivo del visor
   */
  function setupZoomLens() {
    const viewer = document.getElementById('pdp-main-viewer');
    const mainImg = document.getElementById('pdp-main-image');
    if (!viewer || !mainImg) return;

    viewer.addEventListener('mousemove', e => {
      const rect = viewer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      mainImg.style.transformOrigin = `${x}% ${y}%`;
      viewer.classList.add('is-zoomed');
    });

    viewer.addEventListener('mouseleave', () => {
      viewer.classList.remove('is-zoomed');
      mainImg.style.transformOrigin = 'center center';
    });

    let lastTap = 0;
    viewer.addEventListener('touchend', e => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        viewer.classList.toggle('is-zoomed');
        e.preventDefault();
      }
      lastTap = currentTime;
    });
  }

  /**
   * Conecta el botón de compra con window.AR_CHECKOUT.openCheckout
   */
  function setupCheckoutTrigger() {
    const handleBuy = () => {
      if (!state.product) return;

      const f = state.selectedFormat || { size: '20 × 20 cm', price: 24990 };

      if (f.isQuote || f.price === 0) {
        const prodName = state.product.shortName || state.product.name;
        const msg = `Hola Adolfo, deseo cotizar la maqueta ${prodName} en un tamaño personalizado. Mis coordenadas o ciudad de interés son: `;
        window.open(`https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent(msg)}`, '_blank');
        return;
      }

      if (window.AR_CHECKOUT && typeof window.AR_CHECKOUT.openCheckout === 'function') {
        window.AR_CHECKOUT.openCheckout({
          sku: state.product.sku,
          category: state.product.category,
          productName: `${state.product.name} (${f.size})`,
          size: f.size,
          finish: 'Con Marco Shadowbox',
          unitPrice: f.price,
          thumbImg: state.currentImage,
          quantity: 1
        });
      } else {
        const prodName = state.product.shortName || state.product.name;
        const msg = `Hola Adolfo, deseo comprar la maqueta ${prodName} en formato ${f.size} (${formatCLP(f.price)}). ¿Cómo procedo al pago con Payku / Transferencia?`;
        window.open(`https://wa.me/${WHATSAPP_RAW}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    };

    const buyBtn = document.getElementById('pdp-btn-buy');
    if (buyBtn) buyBtn.addEventListener('click', handleBuy);

    const stickyBuyBtn = document.getElementById('pdp-sticky-btn-buy');
    if (stickyBuyBtn) stickyBuyBtn.addEventListener('click', handleBuy);

    // Controlar visibilidad del sticky bar según el scroll y el bloque CTA
    const ctaBlock = document.querySelector('.pdp-cta-block');
    const stickyBar = document.getElementById('pdp-sticky-bar');
    if (ctaBlock && stickyBar) {
      const relatedSec = document.querySelector('.pdp-related-section');
      const workshopSec = document.querySelector('.pdp-workshop-section');
      const footer = document.querySelector('.ed-footer');

      function updateStickyVisibility() {
        const ctaRect = ctaBlock.getBoundingClientRect();
        const relRect = relatedSec ? relatedSec.getBoundingClientRect() : null;
        const wsRect = workshopSec ? workshopSec.getBoundingClientRect() : null;
        const footRect = footer ? footer.getBoundingClientRect() : null;

        // Ocultar si está cerca de workshop, recomendados o footer para no tapar texto
        const nearBottom = (relRect && relRect.top < window.innerHeight - 40) ||
                           (wsRect && wsRect.top < window.innerHeight - 40) ||
                           (footRect && footRect.top < window.innerHeight);

        if (nearBottom) {
          stickyBar.classList.remove('is-visible');
        } else if (ctaRect.top < 0 && window.scrollY > 300) {
          stickyBar.classList.add('is-visible');
        } else {
          stickyBar.classList.remove('is-visible');
        }
      }

      window.addEventListener('scroll', updateStickyVisibility, { passive: true });
      window.addEventListener('resize', updateStickyVisibility, { passive: true });
    }
  }

  /**
   * Inicialización global de la página de producto
   */
  function initPDP() {
    const { id, sku } = getUrlParams();
    const product = resolveProduct(id, sku);

    if (product) {
      renderProduct(product);
    }

    setupZoomLens();
    setupCheckoutTrigger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPDP);
  } else {
    initPDP();
  }
})();
