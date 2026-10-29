/**
 * ALZADO ROJO · AR ARQ SpA
 * Controlador Frontend del Modal de Producto Inmersivo / Quick View E-Commerce
 * Archivo: js/quickview.js
 * 
 * Funcionalidades:
 * - Visor interactivo con Lupa 2.5x acelerada por hardware (transform-origin dinamico).
 * - Tira de miniaturas de angulos y perspectivas (product.gallery).
 * - Selector reactivo de variantes de tamano y precio dinamico en JetBrains Mono.
 * - Cuadricula de especificaciones tecnicas (escala, tolerancia, material, marco, origen satelital).
 * - Enlace directo al checkout formal de Flow.cl (window.AR_CHECKOUT.openCheckout).
 * - Enlace con WhatsApp preformateado y video reel de fabricacion.
 * - Integracion con las tarjetas del catalogo (.ecom-thumb-box, .ecom-zoom-hint, .ecom-title).
 * 
 * Reglas de marca:
 * - Cero ampersands en textos o etiquetas visibles (uso estricto de 'y' o '·').
 * - Cero emojis.
 * - 100% borderless.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AR_QUICKVIEW = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  // Referencias al DOM del Quick View Modal
  let modal = null;
  let dialog = null;
  let closeBtn = null;
  let viewer = null;
  let mainImg = null;
  let galleryStrip = null;
  let badgeElem = null;
  let skuElem = null;
  let titleElem = null;
  let priceElem = null;
  let descElem = null;
  let formatsList = null;
  let leadtimeElem = null;
  let specsGrid = null;
  let btnBuy = null;
  let btnWsp = null;
  let btnVideo = null;

  // Estado reactivo del producto actualmente visualizado
  let currentProduct = null;
  let selectedFormat = null;
  let currentViewerImg = '';
  let isZoomActive = false;
  let lastActiveElement = null;

  /**
   * Inicializa las referencias a los elementos del DOM
   */
  function initDom() {
    modal = document.getElementById('ar-quickview-modal');
    if (!modal) return false;

    dialog = document.getElementById('ar-quickview-dialog');
    closeBtn = document.getElementById('ar-quickview-close-btn');
    viewer = document.getElementById('ar-quickview-viewer');
    mainImg = document.getElementById('ar-quickview-main-img');
    galleryStrip = document.getElementById('ar-quickview-gallery-strip');
    badgeElem = document.getElementById('ar-quickview-badge');
    skuElem = document.getElementById('ar-quickview-sku');
    titleElem = document.getElementById('ar-quickview-title');
    priceElem = document.getElementById('ar-quickview-price');
    descElem = document.getElementById('ar-quickview-desc');
    formatsList = document.getElementById('ar-quickview-formats-list');
    leadtimeElem = document.getElementById('ar-quickview-leadtime');
    specsGrid = document.getElementById('ar-quickview-specs-grid');
    btnBuy = document.getElementById('ar-quickview-btn-buy');
    btnWsp = document.getElementById('ar-quickview-btn-wsp');
    btnVideo = document.getElementById('ar-quickview-btn-video');

    bindEvents();
    return true;
  }

  /**
   * Vincula todos los escuchadores de eventos
   */
  function bindEvents() {
    if (closeBtn) {
      closeBtn.addEventListener('click', closeQuickView);
    }

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          closeQuickView();
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
        closeQuickView();
      }
    });

    // --- COMPORTAMIENTO DE LUPA INTERACTIVA 2.5X ---
    if (viewer && mainImg) {
      // Desktop: movimiento del raton
      viewer.addEventListener('mouseenter', function () {
        isZoomActive = true;
        viewer.classList.add('is-zoomed');
      });

      viewer.addEventListener('mousemove', function (e) {
        if (!isZoomActive) return;
        const rect = viewer.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        mainImg.style.transformOrigin = `${x.toFixed(2)}% ${y.toFixed(2)}%`;
        mainImg.style.transform = 'scale(2.5)';
      });

      viewer.addEventListener('mouseleave', function () {
        isZoomActive = false;
        viewer.classList.remove('is-zoomed');
        mainImg.style.transformOrigin = 'center center';
        mainImg.style.transform = 'scale(1)';
      });

      // Mobile / Touch: soporte tactil fluido
      viewer.addEventListener('touchstart', function (e) {
        if (e.touches && e.touches.length === 1) {
          isZoomActive = true;
          viewer.classList.add('is-zoomed');
          handleTouchZoom(e.touches[0]);
        }
      }, { passive: true });

      viewer.addEventListener('touchmove', function (e) {
        if (isZoomActive && e.touches && e.touches.length === 1) {
          handleTouchZoom(e.touches[0]);
        }
      }, { passive: true });

      viewer.addEventListener('touchend', function () {
        isZoomActive = false;
        viewer.classList.remove('is-zoomed');
        mainImg.style.transformOrigin = 'center center';
        mainImg.style.transform = 'scale(1)';
      }, { passive: true });
    }

    // Boton de Compra Directa: lanza el checkout de Flow.cl
    if (btnBuy) {
      btnBuy.addEventListener('click', function () {
        if (!currentProduct) return;
        const prodToCheckout = {
          sku: currentProduct.sku,
          productName: currentProduct.name,
          size: selectedFormat ? selectedFormat.size : '10 × 10 cm',
          finish: 'Con Marco Shadowbox',
          unitPrice: selectedFormat ? selectedFormat.formattedPrice : (currentProduct.formattedBasePrice || '$19.990 CLP'),
          thumbImg: currentViewerImg || currentProduct.main,
          quantity: 1
        };

        closeQuickView();

        if (window.AR_CHECKOUT && typeof window.AR_CHECKOUT.openCheckout === 'function') {
          window.AR_CHECKOUT.openCheckout(prodToCheckout);
        } else {
          console.warn('[QuickView] window.AR_CHECKOUT no disponible.');
        }
      });
    }

    // Boton de Video: abre el modal de video si existe
    if (btnVideo) {
      btnVideo.addEventListener('click', function () {
        if (!currentProduct || !currentProduct.video) return;
        const videoModal = document.getElementById('ar-video-modal');
        const videoPlayer = document.getElementById('ar-video-player');
        const videoTitle = document.getElementById('ar-video-modal-title');

        if (videoPlayer) {
          videoPlayer.src = currentProduct.video;
        }
        if (videoTitle) {
          videoTitle.textContent = currentProduct.name + ' · Fabricacion 3D';
        }
        if (videoModal) {
          videoModal.classList.add('is-open');
          videoModal.setAttribute('aria-hidden', 'false');
          if (videoPlayer) {
            videoPlayer.play().catch(function () {});
          }
        }
      });
    }
  }

  /**
   * Calcula y aplica las coordenadas del zoom en dispositivos tactiles
   */
  function handleTouchZoom(touch) {
    if (!viewer || !mainImg) return;
    const rect = viewer.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));

    mainImg.style.transformOrigin = `${x.toFixed(2)}% ${y.toFixed(2)}%`;
    mainImg.style.transform = 'scale(2.2)';
  }

  /**
   * Abre el Quick View con los datos del producto
   * @param {string|object} skuOrIdOrProduct
   */
  function openQuickView(skuOrIdOrProduct) {
    if (!modal) {
      const initialized = initDom();
      if (!initialized) {
        console.error('[QuickView] No se encontro el modal #ar-quickview-modal en el DOM.');
        return;
      }
    }

    lastActiveElement = document.activeElement;

    // Obtener el objeto de producto detallado
    let product = null;
    if (typeof skuOrIdOrProduct === 'object' && skuOrIdOrProduct !== null) {
      product = skuOrIdOrProduct;
    } else if (window.AR_ECOMMERCE && typeof window.AR_ECOMMERCE.getProductDetails === 'function') {
      product = window.AR_ECOMMERCE.getProductDetails(skuOrIdOrProduct);
    }

    // Fallback defensivo si no fue encontrado
    if (!product) {
      console.warn('[QuickView] Producto no encontrado para:', skuOrIdOrProduct);
      product = {
        sku: 'SKU-VOL-01',
        name: 'Volcan Villarrica · Relieve Topografico 3D',
        badge: 'NUEVA COLECCION · CRATER 3D',
        leadTime: 'Fabricacion en taller propio · Despacho en 3 a 5 dias habiles a todo Chile',
        description: 'Relieve del cono volcanico, glaciar y crater activo con curvas de nivel extruidas a 0.20 mm de precision en marco shadowbox negro mate.',
        main: 'catalog/volcan-villarrica-marco.jpg',
        gallery: [
          { url: 'catalog/volcan-villarrica-marco.jpg', label: 'Marco Shadowbox Negro' },
          { url: 'catalog/volcan-villarrica-detalle.jpg', label: 'Detalle Crater y Curvas' },
          { url: 'catalog/volcan-osorno-shadowbox.jpg', label: 'Relieve Blanco Tiza' }
        ],
        formats: [
          { size: '10 × 10 cm', price: 19990, formattedPrice: '$19.990 CLP' },
          { size: '15 × 15 cm', price: 34990, formattedPrice: '$34.990 CLP' },
          { size: '20 × 20 cm', price: 49990, formattedPrice: '$49.990 CLP' },
          { size: '30 × 30 cm', price: 79990, formattedPrice: '$79.990 CLP' }
        ],
        specs: {
          escala: '1:1000 / 1:2000',
          tolerancia: '±0.20 mm',
          material: 'PLA Arquitectonico Biobasado Mate',
          marco: 'Shadowbox Negro Mate',
          origen: 'DEM Satelital Alos Palsar 12.5 m',
          acabado: 'Blanco Tiza Mate Antirreflejo'
        }
      };
    }

    currentProduct = product;
    currentViewerImg = product.main || (product.gallery && product.gallery[0] && product.gallery[0].url) || 'catalog/santiago-costanera-marco.jpg';

    // 1. Llenar Metadatos Basicos
    if (badgeElem) badgeElem.textContent = product.badge || 'COLECCION OFICIAL';
    if (skuElem) skuElem.textContent = product.sku || '';
    if (titleElem) titleElem.textContent = product.name || 'Maqueta Tridimensional';
    if (descElem) descElem.textContent = product.description || 'Modelo topografico arquitectonico de alta fidelidad.';
    if (leadtimeElem) leadtimeElem.textContent = product.leadTime || 'Fabricacion en taller propio · Despacho en 3 a 5 dias habiles a todo Chile';

    // 2. Establecer Imagen Principal en Visor
    if (mainImg) {
      mainImg.src = currentViewerImg;
      mainImg.alt = product.name || 'Detalle de producto';
      mainImg.style.transform = 'scale(1)';
      mainImg.style.transformOrigin = 'center center';
    }
    if (viewer) {
      viewer.classList.remove('is-zoomed');
    }

    // 3. Renderizar Tira de Miniaturas (Gallery Strip)
    renderGalleryStrip(product.gallery, currentViewerImg);

    // 4. Renderizar Selector de Formatos y Establecer Precio
    const formats = Array.isArray(product.formats) && product.formats.length > 0
      ? product.formats
      : [{ size: '10 × 10 cm', price: 19990, formattedPrice: '$19.990 CLP' }];

    selectedFormat = formats[0];
    renderFormats(formats);
    updatePriceAndWsp();

    // 5. Renderizar Especificaciones Tecnicas
    renderSpecs(product.specs);

    // 6. Gestionar Boton de Video
    if (btnVideo) {
      if (product.video) {
        btnVideo.style.display = 'inline-flex';
      } else {
        btnVideo.style.display = 'none';
      }
    }

    // 7. Mostrar Modal con Animacion
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Foco accesible al boton de cierre
    if (closeBtn) {
      setTimeout(function () {
        closeBtn.focus();
      }, 50);
    }
  }

  /**
   * Cierra el Quick View Modal
   */
  function closeQuickView() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (viewer && mainImg) {
      viewer.classList.remove('is-zoomed');
      mainImg.style.transform = 'scale(1)';
      mainImg.style.transformOrigin = 'center center';
    }

    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      try {
        lastActiveElement.focus();
      } catch (err) {}
    }
  }

  /**
   * Renderiza la tira horizontal de miniaturas
   */
  function renderGalleryStrip(gallery, activeUrl) {
    if (!galleryStrip) return;
    galleryStrip.innerHTML = '';

    const list = Array.isArray(gallery) && gallery.length > 0
      ? gallery
      : [{ url: activeUrl, label: 'Vista Principal' }];

    list.forEach(function (item, idx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ar-qv-thumb-btn' + (item.url === activeUrl ? ' is-active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', item.url === activeUrl ? 'true' : 'false');
      btn.setAttribute('aria-label', 'Ver ' + (item.label || ('perspectiva ' + (idx + 1))));
      btn.title = item.label || 'Perspectiva ' + (idx + 1);

      const img = document.createElement('img');
      img.src = item.url;
      img.alt = item.label || 'Angulo';
      img.loading = 'lazy';
      btn.appendChild(img);

      btn.addEventListener('click', function () {
        const allThumbs = galleryStrip.querySelectorAll('.ar-qv-thumb-btn');
        allThumbs.forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');

        // Transicion de desvanecimiento suave para la imagen principal
        if (mainImg) {
          mainImg.style.opacity = '0.35';
          setTimeout(function () {
            mainImg.src = item.url;
            mainImg.alt = item.label || currentProduct.name;
            currentViewerImg = item.url;
            mainImg.style.opacity = '1';
            mainImg.style.transform = 'scale(1)';
            mainImg.style.transformOrigin = 'center center';
            if (viewer) viewer.classList.remove('is-zoomed');
          }, 140);
        }
      });

      galleryStrip.appendChild(btn);
    });
  }

  /**
   * Renderiza las pildoras interactivas de tamano / formato
   */
  function renderFormats(formats) {
    if (!formatsList) return;
    formatsList.innerHTML = '';

    formats.forEach(function (fmt, idx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ar-qv-size-pill' + (idx === 0 ? ' is-active' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', idx === 0 ? 'true' : 'false');
      btn.textContent = fmt.size;

      btn.addEventListener('click', function () {
        const allPills = formatsList.querySelectorAll('.ar-qv-size-pill');
        allPills.forEach(function (p) {
          p.classList.remove('is-active');
          p.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-checked', 'true');

        selectedFormat = fmt;
        updatePriceAndWsp();
      });

      formatsList.appendChild(btn);
    });
  }

  /**
   * Actualiza el precio visible y el enlace dinamico de WhatsApp
   */
  function updatePriceAndWsp() {
    if (!selectedFormat) return;

    if (priceElem) {
      priceElem.textContent = selectedFormat.formattedPrice || (window.AR_ECOMMERCE && window.AR_ECOMMERCE.formatCLP ? window.AR_ECOMMERCE.formatCLP(selectedFormat.price) : `$${selectedFormat.price} CLP`);
    }

    if (btnWsp && currentProduct) {
      const prodName = currentProduct.shortName || currentProduct.name;
      const priceText = selectedFormat.formattedPrice || `$${selectedFormat.price} CLP`;
      const sizeText = selectedFormat.size;
      const msg = `Hola Adolfo, deseo consultar por la maqueta de ${prodName} en tamano ${sizeText} por ${priceText}.`;
      btnWsp.href = `https://wa.me/56975412203?text=${encodeURIComponent(msg)}`;
    }
  }

  /**
   * Renderiza la cuadricula de especificaciones tecnicas
   */
  function renderSpecs(specs) {
    if (!specsGrid) return;
    specsGrid.innerHTML = '';

    const defaultSpecs = {
      escala: '1:1000 / 1:2000',
      tolerancia: '±0.20 mm',
      material: 'PLA Biobasado Mate',
      marco: 'Shadowbox Negro Mate',
      origen: 'DEM Satelital Alta Resolucion',
      acabado: 'Microcapas 0.20 mm'
    };

    const finalSpecs = Object.assign({}, defaultSpecs, specs || {});

    const labelMap = {
      escala: 'ESCALA',
      tolerancia: 'TOLERANCIA',
      material: 'MATERIAL',
      marco: 'MARCO',
      origen: 'ORIGEN DEM',
      acabado: 'ACABADO'
    };

    Object.keys(labelMap).forEach(function (key) {
      if (finalSpecs[key]) {
        const item = document.createElement('div');
        item.className = 'ar-quickview-spec-item';

        const k = document.createElement('span');
        k.className = 'ar-quickview-spec-key';
        k.textContent = labelMap[key];

        const v = document.createElement('span');
        v.className = 'ar-quickview-spec-val';
        v.textContent = finalSpecs[key];

        item.appendChild(k);
        item.appendChild(v);
        specsGrid.appendChild(item);
      }
    });
  }

  /**
   * Vincula las tarjetas de producto existentes en la pagina
   * para que al hacer clic en .ecom-thumb-box, .ecom-zoom-hint o .ecom-title
   * abran el Quick View Inmersivo
   */
  function bindCatalogCards() {
    const cards = document.querySelectorAll('.ecom-card');
    cards.forEach(function (card) {
      const sku = card.getAttribute('data-sku') || '';
      if (!sku) return;

      // 1. Caja de miniatura
      const thumbBox = card.querySelector('.ecom-thumb-box');
      if (thumbBox) {
        thumbBox.style.cursor = 'pointer';
        thumbBox.addEventListener('click', function (e) {
          // Prevenir propagacion si hizo clic en un control interno
          e.preventDefault();
          e.stopPropagation();
          openQuickView(sku);
        });

        thumbBox.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openQuickView(sku);
          }
        });
      }

      // 2. Boton o texto AMPLIAR
      const zoomHint = card.querySelector('.ecom-zoom-hint');
      if (zoomHint) {
        zoomHint.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openQuickView(sku);
        });
      }

      // 3. Titulo de la tarjeta
      const titleElemCard = card.querySelector('.ecom-title');
      if (titleElemCard) {
        titleElemCard.style.cursor = 'pointer';
        titleElemCard.setAttribute('tabindex', '0');
        titleElemCard.setAttribute('role', 'button');
        titleElemCard.setAttribute('aria-label', 'Ver detalles de ' + titleElemCard.textContent.trim());
        titleElemCard.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openQuickView(sku);
        });

        titleElemCard.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openQuickView(sku);
          }
        });
      }
    });

    // Delegacion general para cualquier elemento con data-open-quickview
    document.addEventListener('click', function (e) {
      const target = e.target.closest('[data-open-quickview]');
      if (target) {
        e.preventDefault();
        const sku = target.getAttribute('data-open-quickview');
        if (sku) openQuickView(sku);
      }
    });
  }

  // Auto-inicializacion al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initDom();
      bindCatalogCards();
    });
  } else {
    initDom();
    bindCatalogCards();
  }

  return {
    init: initDom,
    openQuickView: openQuickView,
    closeQuickView: closeQuickView,
    bindCatalogCards: bindCatalogCards
  };
});
