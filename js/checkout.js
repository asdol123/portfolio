/**
 * ALZADO ROJO · AR ARQ SpA
 * Controlador Frontend del Sistema de Checkout y Cotización Formal
 * Archivo: js/checkout.js
 * 
 * Cumple estrictamente:
 * - Cero ampersands en títulos o etiquetas visibles.
 * - Cero emojis en cadenas de texto y botones.
 * - Integración con window.AR_ECOMMERCE.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AR_CHECKOUT = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /**
   * Sanitiza cualquier cadena para prevenir inyección DOM-based XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Estado reactivo de la sesión de checkout
  const state = {
    isOpen: false,
    folio: '',
    sku: 'SKU-SCL-01',
    category: 'ciudades',
    productName: 'Santiago · Costanera Center',
    size: '10 × 10 cm',
    finish: 'Con Marco Shadowbox',
    thumbImg: 'catalog/santiago-costanera-marco.jpg',
    unitPrice: 9990,
    quantity: 1,
    shippingId: 'pickup',
    paymentMethod: 'payku',
    lastProcessedOrder: null
  };

  // Referencias al DOM (se obtienen en init)
  let dom = {};

  function initDomReferences() {
    dom = {
      modal: document.getElementById('ar-checkout-modal'),
      closeBtn: document.getElementById('ar-checkout-close-btn'),
      folioDisplay: document.getElementById('ar-checkout-folio-display'),
      viewMain: document.getElementById('ar-checkout-view-main'),
      viewSuccess: document.getElementById('ar-checkout-view-success'),

      // Resumen del producto
      summaryImg: document.getElementById('ar-summary-img'),
      summarySku: document.getElementById('ar-summary-sku'),
      summaryName: document.getElementById('ar-summary-name'),
      summarySize: document.getElementById('ar-summary-size'),
      summaryFinish: document.getElementById('ar-summary-finish'),
      qtyVal: document.getElementById('ar-qty-val'),
      qtyMinus: document.getElementById('ar-qty-minus'),
      qtyPlus: document.getElementById('ar-qty-plus'),

      // Desglose financiero
      breakdownUnit: document.getElementById('ar-breakdown-unit'),
      breakdownQtyLabel: document.getElementById('ar-breakdown-qty-label'),
      breakdownSubtotal: document.getElementById('ar-breakdown-subtotal'),
      breakdownShipping: document.getElementById('ar-breakdown-shipping'),
      breakdownTotal: document.getElementById('ar-breakdown-total'),

      // Modalidades de entrega
      shippingOptions: document.querySelectorAll('.ar-shipping-option'),
      shippingAddressWrap: document.getElementById('ar-shipping-address-wrap'),

      // Métodos de pago
      paymentOptions: document.querySelectorAll('.ar-payment-option'),
      bankBox: document.getElementById('ar-bank-box-details'),
      btnCopyBank: document.getElementById('btn-copy-bank-data'),
      btnCopyBankLabel: document.getElementById('btn-copy-bank-label'),
      paymentNotice: document.getElementById('checkout-payment-notice'),
      btnNoticeSwitchTransfer: document.getElementById('btn-notice-switch-transfer'),

      // Formulario cliente
      form: document.getElementById('ar-customer-form'),
      inputName: document.getElementById('ar-input-name'),
      inputEmail: document.getElementById('ar-input-email'),
      inputPhone: document.getElementById('ar-input-phone'),
      inputRut: document.getElementById('ar-input-rut'),
      inputAddress: document.getElementById('ar-input-address'),
      inputNotes: document.getElementById('ar-input-notes'),
      btnSubmit: document.getElementById('ar-btn-submit-order') || document.getElementById('btn-ar-submit-order'),
      btnSubmitLabel: document.getElementById('btn-ar-submit-label'),

      // Errores
      errName: document.getElementById('err-name'),
      errEmail: document.getElementById('err-email'),
      errPhone: document.getElementById('err-phone'),
      errAddress: document.getElementById('err-address'),

      // Pantalla de éxito
      successFolio: document.getElementById('ar-success-folio'),
      successTitle: document.getElementById('ar-success-title'),
      successLead: document.getElementById('ar-success-lead'),
      successPaykuBox: document.getElementById('ar-payku-status-box') || document.getElementById('ar-khipu-status-box') || document.getElementById('ar-success-khipu-box'),
      successKhipuBox: document.getElementById('ar-payku-status-box') || document.getElementById('ar-khipu-status-box') || document.getElementById('ar-success-khipu-box'),
      btnPaykuLink: document.getElementById('btn-ar-payku-link') || document.getElementById('btn-ar-khipu-link') || document.getElementById('btn-ar-flow-link'),
      btnKhipuLink: document.getElementById('btn-ar-payku-link') || document.getElementById('btn-ar-khipu-link') || document.getElementById('btn-ar-flow-link'),
      paykuTitle: document.getElementById('ar-payku-action-title') || document.getElementById('ar-flow-action-title') || document.getElementById('ar-khipu-action-title'),
      khipuTitle: document.getElementById('ar-payku-action-title') || document.getElementById('ar-flow-action-title') || document.getElementById('ar-khipu-action-title'),
      paykuDesc: document.getElementById('ar-payku-action-desc') || document.getElementById('ar-flow-action-desc') || document.getElementById('ar-khipu-action-desc'),
      khipuDesc: document.getElementById('ar-payku-action-desc') || document.getElementById('ar-flow-action-desc') || document.getElementById('ar-khipu-action-desc'),
      btnDownloadPdf: document.getElementById('btn-ar-download-pdf'),
      btnCoordWsp: document.getElementById('btn-ar-coord-wsp'),
      btnTogglePreview: document.getElementById('btn-ar-toggle-preview'),
      previewWrap: document.getElementById('ar-email-preview-wrap'),
      previewTable: document.getElementById('ar-email-preview-table'),
      btnCloseSuccess: document.getElementById('btn-ar-close-success')
    };
  }

  /**
   * Recalcula y actualiza la tabla de totales
   */
  /**
   * Recalcula y actualiza la tabla de totales
   */
  function refreshFinancials() {
    if (!window.AR_ECOMMERCE) return;

    const totals = window.AR_ECOMMERCE.calculateTotals({
      unitPrice: state.unitPrice,
      quantity: state.quantity,
      shippingId: state.shippingId,
      size: state.size,
      finish: state.finish,
      category: state.category,
      sku: state.sku
    });

    if (dom.breakdownUnit) dom.breakdownUnit.textContent = totals.formatted.unitPrice;
    if (dom.breakdownQtyLabel) dom.breakdownQtyLabel.textContent = String(totals.quantity);
    if (dom.breakdownSubtotal) dom.breakdownSubtotal.textContent = totals.formatted.subtotal;
    if (dom.breakdownShipping) dom.breakdownShipping.textContent = totals.formatted.shippingCost;
    if (dom.breakdownTotal) dom.breakdownTotal.textContent = totals.formatted.total;
  }

  /**
   * Cambia programáticamente el formato o acabado seleccionado recalculando finanzas
   * @param {string} size
   * @param {string} [finish]
   */
  function setFormat(size, finish) {
    if (size) state.size = size;
    if (finish !== undefined) state.finish = finish;

    const ECOM = window.AR_ECOMMERCE;
    if (ECOM && typeof ECOM.resolveFormatPrice === 'function') {
      state.unitPrice = ECOM.resolveFormatPrice(state.size, state.finish, null, state.category || state.sku);
    }
    if (dom.summarySize) dom.summarySize.textContent = `Formato: ${state.size}`;
    if (dom.summaryFinish) dom.summaryFinish.textContent = `Acabado: ${state.finish}`;
    refreshFinancials();
  }

  /**
   * Actualiza el botón de envío según el método de pago
   */
  function updateSubmitButtonState() {
    if (!dom.btnSubmitLabel) return;

    if (state.paymentMethod === 'payku' || state.paymentMethod === 'tarjeta' || state.paymentMethod === 'flow' || state.paymentMethod === 'khipu') {
      dom.btnSubmitLabel.textContent = 'PAGAR CON TARJETA (WEBPAY PLUS)';
    } else if (state.paymentMethod === 'transferencia' || state.paymentMethod === 'transfer') {
      dom.btnSubmitLabel.textContent = 'CONFIRMAR PEDIDO POR TRANSFERENCIA';
    } else if (state.paymentMethod === 'cotizacion') {
      dom.btnSubmitLabel.textContent = 'DESCARGAR COTIZACIÓN';
    } else {
      dom.btnSubmitLabel.textContent = 'CONFIRMAR ORDEN';
    }
  }

  /**
   * Actualiza el estado visual del aviso según el medio de pago seleccionado
   */
  function updatePaymentNoticeState() {
    if (!dom.paymentNotice) return;
    dom.paymentNotice.style.display = 'flex';
  }

  /**
   * Selecciona programáticamente un método de pago y sincroniza la UI
   */
  function selectPaymentMethod(method) {
    const targetMethod = (method === 'transfer' ? 'transferencia' : method);
    state.paymentMethod = targetMethod;
    if (dom.paymentOptions) {
      dom.paymentOptions.forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]');
        const match = radio && (radio.value === targetMethod || (targetMethod === 'transferencia' && radio.value === 'transfer'));
        if (radio) radio.checked = match;
        opt.classList.toggle('is-selected', match);
      });
    }
    if (dom.bankBox) {
      dom.bankBox.classList.toggle('is-visible', targetMethod === 'transferencia' || targetMethod === 'transfer');
    }
    updatePaymentNoticeState();
    updateSubmitButtonState();
  }

  /**
   * Abre la ventana modal de Checkout con los datos del producto o servicio
   * @param {object} productData
   */
  function openCheckout(productData = {}) {
    if (!dom.modal) initDomReferences();
    if (!dom.modal) return;

    const ECOM = window.AR_ECOMMERCE;

    state.folio = ECOM ? ECOM.generateOrderFolio() : `AR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    state.sku = productData.sku || 'SKU-SCL-01';

    // Preservar y deducir categoría para resolución de precios (Volcanes vs Estándar)
    let cat = productData.category || '';
    if (!cat && state.sku && (state.sku.startsWith('SKU-VOL-') || state.sku.startsWith('SKU-VOL'))) {
      cat = 'volcanes';
    }
    if (!cat && ECOM && typeof ECOM.getProductBySku === 'function') {
      const p = ECOM.getProductBySku(state.sku);
      if (p && p.category) cat = p.category;
    }
    state.category = cat;

    const isVolcano = (state.category === 'volcanes' || (state.sku && state.sku.startsWith('SKU-VOL')) || (ECOM && typeof ECOM.isVolcanoCategory === 'function' && ECOM.isVolcanoCategory(productData)));

    const requestedSize = productData.size || '';
    const isQuoteRequest = Boolean(
      productData.isQuote ||
      String(requestedSize).toLowerCase().includes('otro') ||
      String(requestedSize).toLowerCase().includes('cotiz')
    );

    // Si se solicita 'Otro tamaño', redirigir de inmediato a cotización por WhatsApp oficial
    if (isQuoteRequest) {
      const prodName = productData.productName || (isVolcano ? 'Volcán Topográfico 3D' : 'Maqueta Arquitectónica');
      const wspMsg = `Hola Adolfo, deseo cotizar una medida especial/otro tamaño para la maqueta de ${prodName}.`;
      const wspUrl = `https://wa.me/56962032766?text=${encodeURIComponent(wspMsg)}`;
      if (typeof window !== 'undefined') {
        window.open(wspUrl, '_blank');
      }
      return;
    }

    if (isVolcano) {
      state.productName = productData.productName || 'Volcán Villarrica · Relieve Topográfico 3D';
      state.size = (requestedSize && requestedSize !== '10 × 10 cm') ? requestedSize : '20 × 20 cm';
      state.finish = productData.finish || 'Con Marco Shadowbox';
      state.thumbImg = productData.thumbImg || 'catalog/volcan-villarrica-marco.jpg';
    } else {
      state.productName = productData.productName || 'Santiago · Costanera Center';
      state.size = requestedSize || '10 × 10 cm';
      state.finish = productData.finish || 'Con Marco Shadowbox';
      state.thumbImg = productData.thumbImg || 'catalog/santiago-costanera-marco.jpg';
    }

    state.unitPrice = productData.unitPrice !== undefined
      ? (ECOM && typeof ECOM.parseCLP === 'function' ? ECOM.parseCLP(productData.unitPrice) : (parseInt(String(productData.unitPrice).replace(/[^0-9]/g, ''), 10) || 0))
      : (isVolcano ? 24990 : 9990);

    // Detección de Medida Especial / Cotización a convenir
    const isCustomSpecial = String(state.size).toLowerCase().includes('especial') ||
                            String(state.size).toLowerCase().includes('convenir') ||
                            String(state.size).toLowerCase().includes('personalizado') ||
                            String(state.size).toLowerCase().includes('gran formato') ||
                            String(state.size).toLowerCase().includes('volumen') ||
                            state.unitPrice === 0;

    // Sincronización estricta del precio oficial mediante AR_ECOMMERCE con contexto de categoría/SKU
    let parsedPrice = 0;
    if (ECOM && typeof ECOM.resolveFormatPrice === 'function') {
      parsedPrice = ECOM.resolveFormatPrice(state.size, state.finish, productData.unitPrice, state.category || state.sku);
    } else if (isVolcano) {
      parsedPrice = 24990;
    } else if (ECOM && typeof ECOM.parseCLP === 'function') {
      parsedPrice = ECOM.parseCLP(productData.unitPrice || 0);
    } else {
      parsedPrice = parseInt(String(productData.unitPrice || '').replace(/[^0-9]/g, ''), 10) || 9990;
    }
    
    // Metodo de pago solicitado o por defecto payku
    const requestedMethod = productData.paymentMethod;
    if (isCustomSpecial || requestedMethod === 'cotizacion') {
      state.paymentMethod = 'cotizacion';
    } else if (requestedMethod === 'transfer' || requestedMethod === 'transferencia') {
      state.paymentMethod = 'transferencia';
    } else {
      state.paymentMethod = 'payku';
    }
    state.isCustomSpecial = isCustomSpecial;

    // Si es Medida Especial o precio 0: asegurar modo cotización con unitPrice 0
    if (isCustomSpecial) {
      if (state.paymentMethod === 'cotizacion') {
        parsedPrice = 0;
      } else {
        parsedPrice = 29990; // Abono inicial de manufactura si se selecciona transferencia
      }
    } else if (parsedPrice <= 0 && !isCustomSpecial) {
      parsedPrice = isVolcano ? 24990 : 9990;
    }

    state.unitPrice = parsedPrice;
    state.quantity = Math.max(1, parseInt(productData.quantity, 10) || 1);
    state.shippingId = productData.shippingId || 'pickup';

    // Rellenar cabecera y producto
    if (dom.folioDisplay) dom.folioDisplay.textContent = `FOLIO #${state.folio}`;
    if (dom.summaryImg) {
      dom.summaryImg.src = state.thumbImg;
      dom.summaryImg.alt = state.productName;
    }
    if (dom.summarySku) dom.summarySku.textContent = state.sku;
    if (dom.summaryName) dom.summaryName.textContent = state.productName;
    if (dom.summarySize) dom.summarySize.textContent = `Formato: ${state.size}`;
    if (dom.summaryFinish) dom.summaryFinish.textContent = `Acabado: ${state.finish}`;
    if (dom.qtyVal) dom.qtyVal.textContent = String(state.quantity);

    // Ajustar radio de envío inicial
    if (dom.shippingOptions) {
      dom.shippingOptions.forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]');
        const match = radio && radio.value === state.shippingId;
        if (radio) radio.checked = match;
        opt.classList.toggle('is-selected', match);
      });
    }

    // Mostrar/ocultar dirección según envío
    if (dom.shippingAddressWrap) {
      dom.shippingAddressWrap.style.display = state.shippingId === 'pickup' ? 'none' : 'block';
    }

    // Ajustar radio de pago inicial (Priorizando Transferencia)
    if (dom.paymentOptions) {
      dom.paymentOptions.forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]');
        const match = radio && (radio.value === state.paymentMethod || (radio.value === 'transferencia' && state.paymentMethod === 'transfer'));
        if (radio) radio.checked = match;
        opt.classList.toggle('is-selected', match);
      });
    }

    // Mostrar/ocultar datos bancarios
    if (dom.bankBox) {
      dom.bankBox.classList.toggle('is-visible', state.paymentMethod === 'transferencia' || state.paymentMethod === 'transfer');
    }

    // Actualizar estado del banner informativo de mantenimiento técnico
    updatePaymentNoticeState();

    // Prellenar notas si vienen
    if (dom.inputNotes && productData.notes) {
      dom.inputNotes.value = productData.notes;
    }

    // Restablecer vistas (mostrar formulario, ocultar éxito)
    if (dom.viewMain) dom.viewMain.style.display = '';
    if (dom.viewSuccess) dom.viewSuccess.classList.remove('is-visible');
    if (dom.previewWrap) dom.previewWrap.classList.remove('is-visible');

    // Limpiar errores previos
    clearValidationErrors();

    // Recalcular finanzas
    refreshFinancials();
    updateSubmitButtonState();

    // Abrir modal
    dom.modal.classList.add('is-open');
    dom.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    state.isOpen = true;

    // Foco accesible al primer input o botón de cerrar
    setTimeout(() => {
      if (dom.inputName) dom.inputName.focus();
    }, 100);
  }

  /**
   * Cierra el modal de checkout
   */
  function closeCheckout() {
    if (!dom.modal) return;
    dom.modal.classList.remove('is-open');
    dom.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.isOpen = false;
  }

  /**
   * Limpia mensajes de error visuales
   */
  function clearValidationErrors() {
    [dom.errName, dom.errEmail, dom.errPhone, dom.errAddress].forEach(el => {
      if (el) el.classList.remove('is-active');
    });
  }

  /**
   * Renderiza la vista previa tabular del correo en el acordeón de éxito
   */
  function renderEmailPreview(order) {
    if (!dom.previewTable || !window.AR_ECOMMERCE) return;
    const payload = window.AR_ECOMMERCE.buildFormalEmailPayload(order);
    const tbody = dom.previewTable.querySelector('tbody') || dom.previewTable;
    tbody.innerHTML = '';

    const labelMap = {
      '01_Folio_Orden': 'Folio Oficial',
      '02_Fecha_Emision': 'Fecha de Emisión',
      '03_Estado_Operacion': 'Estado de la Operación',
      '04_Producto_SKU': 'Producto y SKU',
      '05_Especificacion_Formato': 'Formato / Dimensiones',
      '06_Acabado_Materialidad': 'Materialidad y Acabado',
      '07_Cantidad_Unidades': 'Cantidad de Unidades',
      '08_Valor_Unitario': 'Valor Unitario',
      '09_Subtotal_Productos': 'Subtotal Productos',
      '10_Modalidad_Despacho': 'Modalidad de Despacho',
      '11_Costo_Despacho': 'Costo de Despacho',
      '12_TOTAL_ORDEN_CLP': 'TOTAL DE LA ORDEN',
      '13_Metodo_Pago_Seleccionado': 'Método de Pago',
      '14_Cliente_Nombre_Razon_Social': 'Nombre / Razón Social',
      '15_Cliente_RUT': 'RUT Registrado',
      '16_Cliente_Correo': 'Correo Electrónico',
      '17_Cliente_Telefono': 'Teléfono de Contacto',
      '18_Direccion_Comuna_Entrega': 'Dirección de Entrega',
      '19_Notas_Especificaciones': 'Especificaciones'
    };

    Object.keys(payload).forEach(key => {
      if (key.startsWith('_')) return; // Metadatos técnicos
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('td');
      tdLabel.className = 'prop';
      tdLabel.textContent = labelMap[key] || key;
      const tdVal = document.createElement('td');
      tdVal.className = 'val';
      tdVal.textContent = payload[key];
      tr.appendChild(tdLabel);
      tr.appendChild(tdVal);
      tbody.appendChild(tr);
    });
  }

  /**
   * Procesa el envío formal del pedido conectándose con window.AR_ECOMMERCE
   */
  async function handleSubmit(e) {
    if (e) e.preventDefault();
    clearValidationErrors();

    const customer = {
      name: dom.inputName ? dom.inputName.value.trim() : '',
      email: dom.inputEmail ? dom.inputEmail.value.trim() : '',
      phone: dom.inputPhone ? dom.inputPhone.value.trim() : '',
      rut: dom.inputRut ? dom.inputRut.value.trim() : '',
      address: dom.inputAddress ? dom.inputAddress.value.trim() : '',
      commune: dom.inputAddress ? dom.inputAddress.value.trim() : ''
    };

    const requiresShipping = state.shippingId !== 'pickup';

    // Validación previa del lado del cliente
    let hasError = false;
    if (!customer.name || customer.name.length < 3) {
      if (dom.errName) dom.errName.classList.add('is-active');
      hasError = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customer.email || !emailRegex.test(customer.email)) {
      if (dom.errEmail) dom.errEmail.classList.add('is-active');
      hasError = true;
    }
    const cleanPhone = customer.phone.replace(/[\s\-()]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      if (dom.errPhone) dom.errPhone.classList.add('is-active');
      hasError = true;
    }
    if (requiresShipping && (!customer.address || customer.address.length < 5)) {
      if (dom.errAddress) dom.errAddress.classList.add('is-active');
      hasError = true;
    }

    if (hasError) return;

    // Estado cargando
    if (dom.btnSubmit) {
      dom.btnSubmit.disabled = true;
      if (dom.btnSubmitLabel) dom.btnSubmitLabel.textContent = 'PROCESANDO...';
    }

    const orderPayload = {
      folio: state.folio,
      sku: state.sku,
      category: state.category,
      productName: state.productName,
      size: state.size,
      finish: state.finish,
      unitPrice: state.unitPrice,
      quantity: state.quantity,
      shippingId: state.shippingId,
      paymentMethod: state.paymentMethod,
      customer: customer,
      notes: dom.inputNotes ? dom.inputNotes.value.trim() : ''
    };

    try {
      const result = await window.AR_ECOMMERCE.submitOrder(orderPayload);
      if (!result.ok && result.errors) {
        if (result.errors.name && dom.errName) dom.errName.classList.add('is-active');
        if (result.errors.email && dom.errEmail) dom.errEmail.classList.add('is-active');
        if (result.errors.phone && dom.errPhone) dom.errPhone.classList.add('is-active');
        if (result.errors.address && dom.errAddress) dom.errAddress.classList.add('is-active');
        if (dom.btnSubmit) {
          dom.btnSubmit.disabled = false;
          updateSubmitButtonState();
        }
        return;
      }

      state.lastProcessedOrder = result.order;

      // Disparo asincrono de correo transaccional de confirmacion automatica al cliente y taller (para flujos regulares de orden)
      if (!result.emailNotifySent && state.paymentMethod !== 'payku') {
        try {
          const emailNotifyPayload = {
            type: 'order_received',
            orderId: (result.order && result.order.folio) || state.folio,
            customerName: customer.name || 'Cliente ALZADO ROJO',
            customerEmail: customer.email,
            productName: state.productName,
            size: state.size,
            amount: (result.order && result.order.total) || (state.unitPrice * state.quantity),
            address: customer.address || 'Por coordinar',
            city: customer.commune || 'Santiago',
            phone: customer.phone || 'No especificado'
          };

          fetch('/api/email-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailNotifyPayload)
          }).then(r => r.json()).then(resp => {
            console.log('[ALZADO ROJO Checkout] Notificacion transaccional emitida:', resp);
          }).catch(errEmail => {
            console.warn('[ALZADO ROJO Checkout] Aviso en envio asincrono de confirmacion:', errEmail);
          });
        } catch (errNotify) {
          console.warn('[ALZADO ROJO Checkout] Excepcion al invocar endpoint email-notify:', errNotify);
        }
      }

      // Transición a la pantalla de éxito
      if (dom.viewMain) dom.viewMain.style.display = 'none';
      if (dom.viewSuccess) dom.viewSuccess.classList.add('is-visible');

      if (dom.successFolio) dom.successFolio.textContent = `FOLIO #${result.order.folio}`;

      if (state.paymentMethod === 'cotizacion') {
        if (dom.successTitle) dom.successTitle.textContent = '¡COTIZACIÓN FORMAL EMITIDA!';
        if (dom.successLead) {
          const safeEmail = escapeHtml(customer.email);
          dom.successLead.innerHTML = `Hemos enviado la cotización formal desglosada a su correo <strong>${safeEmail}</strong> y a nuestro taller (<strong>adolchilemods@gmail.com</strong>). Sus tarifas quedan reservadas formalmente por 15 días.`;
        }
      } else {
        if (dom.successTitle) dom.successTitle.textContent = '¡ORDEN REGISTRADA CON ÉXITO!';
        if (dom.successLead) {
          const safeFolio = escapeHtml(result.order ? result.order.folio : state.folio);
          const safeEmail = escapeHtml(customer.email);
          dom.successLead.innerHTML = `Hemos registrado su orden oficial <strong>#${safeFolio}</strong> y enviado el comprobante con desglose formal a su correo <strong>${safeEmail}</strong> y a nuestro taller corporativo (<strong>adolchilemods@gmail.com</strong>).`;
        }
      }

      // Pasarela en vivo: Payku Chile (Webpay Plus / Débito / Crédito)
      const isPaykuMethod = (state.paymentMethod === 'payku');
      if (isPaykuMethod && dom.successKhipuBox) {
        dom.successKhipuBox.style.display = 'block';
        let gatewayData = result.paykuResult || null;
        let paymentUrl = result.payment_url || (gatewayData && gatewayData.payment_url);

        // Si aún no tenemos paymentUrl, llamada directa hacia /api/payku-create
        if (!paymentUrl) {
          try {
            const paykuPayload = {
              orderId: (result.order && result.order.folio) || state.folio,
              subject: `Orden ALZADO ROJO ${(result.order && result.order.folio) || state.folio} | ${state.productName} (${state.size})`.slice(0, 200),
              amount: Math.round(Number((result.order && result.order.total) || state.unitPrice * state.quantity || 24990)),
              currency: 'CLP',
              payer_email: customer.email,
              payer_name: customer.name
            };
            const directRes = await fetch('/api/payku-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(paykuPayload)
            });
            if (directRes.ok) {
              const directData = await directRes.json();
              if (directData && directData.ok && directData.payment_url) {
                paymentUrl = directData.payment_url;
                gatewayData = directData;
              } else if (directData && !directData.ok) {
                gatewayData = directData;
              }
            } else {
              try {
                gatewayData = await directRes.json();
              } catch (eJson) {
                gatewayData = { error: 'Error de respuesta del servidor Payku' };
              }
            }
          } catch (directErr) {
            console.warn('[ALZADO ROJO Checkout] Error de conexion con /api/payku-create:', directErr);
            gatewayData = { error: directErr.message };
          }
        }

        if (paymentUrl) {
          const titleEl = dom.paykuTitle || dom.khipuTitle;
          const descEl = dom.paykuDesc || dom.khipuDesc;
          const linkBtn = dom.btnPaykuLink || dom.btnKhipuLink;

          if (titleEl) {
            titleEl.textContent = 'PAYKU · PASARELA WEBPAY PREPARADA';
          }
          if (descEl) {
            descEl.textContent = 'Tu orden ha sido generada en Payku. Redirigiendo a la pasarela segura Webpay Plus... Si no eres redirigido automáticamente, haz clic en el siguiente botón:';
          }
          if (linkBtn) {
            linkBtn.style.display = 'inline-flex';
            linkBtn.href = paymentUrl;
            linkBtn.textContent = 'IR A PAGAR CON WEBPAY PLUS (PAYKU)';
          }
          // Redirección inmediata a pasarela
          try {
            window.location.href = paymentUrl;
          } catch (errRedirect) {
            console.warn('[ALZADO ROJO Checkout] Redirección automática prevenida por el navegador:', errRedirect);
          }
        } else {
          // Si la pasarela reporta error, derivar a WhatsApp oficial 56962032766 o transferencia bancaria como respaldo
          const gatewayError = (gatewayData && gatewayData.error) ? gatewayData.error : 'No fue posible conectar con Payku en este instante.';
          const safeFolio = escapeHtml(result.order ? result.order.folio : state.folio);
          const safeError = escapeHtml(gatewayError);
          const wspUrl = (gatewayData && gatewayData.whatsappFallback)
            ? gatewayData.whatsappFallback
            : `https://wa.me/56962032766?text=${encodeURIComponent(`Hola Adolfo, se presento un aviso al procesar mi orden #${result.order ? result.order.folio : state.folio} en Payku: ${gatewayError}. Deseo pagar por transferencia bancaria o coordinar el pago directamente.`)}`;

          const titleEl = dom.paykuTitle || dom.khipuTitle;
          const descEl = dom.paykuDesc || dom.khipuDesc;
          if (titleEl) titleEl.textContent = 'PAGO EN LÍNEA · RESPALDO POR WHATSAPP O TRANSFERENCIA';
          if (descEl) {
            descEl.innerHTML = `Su orden <strong>#${safeFolio}</strong> ha sido registrada en nuestro taller.<br><br><strong>Aviso de pasarela:</strong> ${safeError}<br><br>Puede completar el pago de inmediato mediante Transferencia Bancaria Directa (Banco Bci) o coordinar el pago vía WhatsApp oficial.`;
          }
          if (dom.btnKhipuLink) {
            dom.btnKhipuLink.style.display = 'inline-flex';
            dom.btnKhipuLink.href = wspUrl;
            dom.btnKhipuLink.textContent = 'COORDINAR PAGO VÍA WHATSAPP';
          }
          if (dom.bankBox) {
            dom.bankBox.classList.add('is-visible');
          }
        }
      } else if (dom.successKhipuBox) {
        dom.successKhipuBox.style.display = 'none';
      }

      // Configurar botones de acción post-orden
      if (dom.btnDownloadPdf) {
        dom.btnDownloadPdf.onclick = () => {
          window.AR_ECOMMERCE.openQuotePrintWindow(result.order);
        };
      }

      if (dom.btnCoordWsp) {
        dom.btnCoordWsp.href = result.whatsappUrl;
      }

      // Renderizar vista previa técnica del correo
      renderEmailPreview(result.order);

      // Scroll al inicio del modal
      if (dom.modal) {
        const scroller = dom.modal.querySelector('.ar-modal-scroll');
        if (scroller) scroller.scrollTop = 0;
      }

    } catch (errSubmit) {
      console.error('[ALZADO ROJO Checkout] Error al procesar orden:', errSubmit);
      alert('Ocurrió un error inesperado al procesar la solicitud. Por favor intenta nuevamente o contáctanos directamente en WhatsApp.');
    } finally {
      if (dom.btnSubmit) {
        dom.btnSubmit.disabled = false;
        updateSubmitButtonState();
      }
    }
  }

  /**
   * Configura listeners de eventos en los controles interactivos
   */
  function bindEvents() {
    // Botón cerrar
    if (dom.closeBtn) {
      dom.closeBtn.addEventListener('click', closeCheckout);
    }
    if (dom.btnCloseSuccess) {
      dom.btnCloseSuccess.addEventListener('click', closeCheckout);
    }

    // Clic en backdrop cierra modal
    if (dom.modal) {
      dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) {
          closeCheckout();
        }
      });
    }

    // Tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeCheckout();
      }
    });

    // Control de Cantidad
    if (dom.qtyMinus) {
      dom.qtyMinus.addEventListener('click', () => {
        if (state.quantity > 1) {
          state.quantity--;
          if (dom.qtyVal) dom.qtyVal.textContent = String(state.quantity);
          refreshFinancials();
        }
      });
    }

    if (dom.qtyPlus) {
      dom.qtyPlus.addEventListener('click', () => {
        if (state.quantity < 99) {
          state.quantity++;
          if (dom.qtyVal) dom.qtyVal.textContent = String(state.quantity);
          refreshFinancials();
        }
      });
    }

    // Selección de Modalidad de Despacho
    if (dom.shippingOptions) {
      dom.shippingOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          const radio = opt.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            state.shippingId = radio.value;

            dom.shippingOptions.forEach(o => o.classList.remove('is-selected'));
            opt.classList.add('is-selected');

            // Mostrar/ocultar dirección
            if (dom.shippingAddressWrap) {
              dom.shippingAddressWrap.style.display = state.shippingId === 'pickup' ? 'none' : 'block';
            }

            refreshFinancials();
          }
        });
      });
    }

    // Selección de Método de Pago
    if (dom.paymentOptions) {
      dom.paymentOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          const radio = opt.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            state.paymentMethod = radio.value;

            dom.paymentOptions.forEach(o => o.classList.remove('is-selected'));
            opt.classList.add('is-selected');

            // Si el producto es Medida Especial / A convenir, ajustar valor según medio de pago
            if (state.isCustomSpecial) {
              if (state.paymentMethod === 'cotizacion') {
                state.unitPrice = 0;
              } else if (state.unitPrice <= 0) {
                state.unitPrice = 29990; // Abono base para Flow o transferencia
              }
              refreshFinancials();
            }

            // Mostrar u ocultar caja de transferencia
            if (dom.bankBox) {
              dom.bankBox.classList.toggle('is-visible', state.paymentMethod === 'transferencia' || state.paymentMethod === 'transfer');
            }

            // Sincronizar aviso técnico y texto de botón dinámico
            updatePaymentNoticeState();
            updateSubmitButtonState();
          }
        });
      });
    }

    // Botón de cambio rápido en el banner hacia Transferencia Bancaria Directa
    if (dom.btnNoticeSwitchTransfer) {
      dom.btnNoticeSwitchTransfer.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectPaymentMethod('transferencia');
      });
    }

    // Copiar datos bancarios con feedback
    if (dom.btnCopyBank) {
      dom.btnCopyBank.addEventListener('click', async () => {
        const bd = (window.AR_ECOMMERCE && window.AR_ECOMMERCE.BANK_DETAILS)
          || (window.AREcommerce && window.AREcommerce.BANK_DETAILS)
          || null;
        const bankText = [
          'DATOS BANCARIOS OFICIALES · AR ARQ SpA',
          `Razón Social: ${bd ? bd.businessName : 'Ar Arq Spa'}`,
          `RUT: ${bd ? bd.rut : '78.516.116-5'}`,
          `Banco: ${bd ? bd.bank : 'Banco Bci'}`,
          `Tipo de Cuenta: ${bd ? bd.accountType : 'Cuenta corriente en pesos'}`,
          `Número de Cuenta: ${bd ? bd.accountNumber : '71897223'}`,
          `Correo: ${bd ? bd.email : 'adolchilemods@gmail.com'}`,
          `Referencia: ${state.folio || 'ORDEN-WEB'}`
        ].join('\n');

        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(bankText);
          } else {
            const tempArea = document.createElement('textarea');
            tempArea.value = bankText;
            document.body.appendChild(tempArea);
            tempArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempArea);
          }

          dom.btnCopyBank.classList.add('is-copied');
          if (dom.btnCopyBankLabel) dom.btnCopyBankLabel.textContent = 'DATOS COPIADOS (LISTO)';

          setTimeout(() => {
            dom.btnCopyBank.classList.remove('is-copied');
            if (dom.btnCopyBankLabel) dom.btnCopyBankLabel.textContent = 'COPIAR DATOS BANCARIOS';
          }, 2500);
        } catch (errCopy) {
          console.warn('[ALZADO ROJO Checkout] Error al copiar datos:', errCopy);
        }
      });
    }

    // Alternar vista previa del correo formal
    if (dom.btnTogglePreview && dom.previewWrap) {
      dom.btnTogglePreview.addEventListener('click', () => {
        const isVisible = dom.previewWrap.classList.contains('is-visible');
        dom.previewWrap.classList.toggle('is-visible', !isVisible);
        dom.btnTogglePreview.innerHTML = isVisible
          ? `<span>VISTA PREVIA DEL CORREO FORMAL</span> <span aria-hidden="true" style="display:inline-flex;vertical-align:middle;margin-left:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg></span>`
          : `<span>OCULTAR VISTA PREVIA</span> <span aria-hidden="true" style="display:inline-flex;vertical-align:middle;margin-left:6px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg></span>`;
      });
    }

    // Envío del formulario
    if (dom.form) {
      dom.form.addEventListener('submit', handleSubmit);
    }

    // Vinculación automática con las tarjetas del catálogo e-commerce y formatos
    bindCatalogCards();
    bindFormatCards();
    bindGlobalCustomButton();
  }

  /**
   * Conecta el botón inerte .btn-global-custom (data-action="checkout-custom-city")
   */
  function bindGlobalCustomButton() {
    const customBtns = document.querySelectorAll('.btn-global-custom, [data-action="checkout-custom-city"]');
    customBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cotizador = document.querySelector('#cotizador-a-medida') || document.querySelector('#cotizador-personalizado');
        if (cotizador) {
          cotizador.scrollIntoView({ behavior: 'smooth' });
        } else {
          openCheckout({
            sku: 'SKU-CUST-08',
            productName: 'Maqueta a Medida · Personalización de Ciudad',
            size: 'Formato Personalizado',
            finish: 'PLA Mate Blanco Arquitectónico · Marco Shadowbox',
            unitPrice: 'A convenir',
            thumbImg: 'catalog/santiago-costanera-marco.jpg',
            quantity: 1,
            paymentMethod: 'cotizacion',
            notes: 'Personalización de ciudad o coordenadas específicas.'
          });
        }
      });
    });
  }

  /**
   * Vincula los botones de formato genérico y comparador de escala para abrir el checkout modal
   */
  function bindFormatCards() {
    // Botones dentro de tarjetas de formato .format-card
    document.querySelectorAll('.btn-format-buy, [data-action="checkout-format"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.format-card');
        const typeActive = document.querySelector('.type-card.selected');
        const currentType = typeActive ? (typeActive.getAttribute('data-type') || 'Maqueta Urbana') : 'Maqueta Urbana';

        const format = btn.getAttribute('data-format') || (card ? card.getAttribute('data-format') : '10 × 10 cm');
        let priceVal = btn.getAttribute('data-price') || (card ? card.getAttribute('data-price') : '$9.990 CLP');

        if (card) {
          document.querySelectorAll('.format-card').forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-pressed', 'false');
          });
          card.classList.add('selected');
          card.setAttribute('aria-pressed', 'true');
        }

        openCheckout({
          sku: 'SKU-CUST-08',
          productName: `${currentType} Personalizada (${format})`,
          size: format,
          finish: 'PLA Mate Blanco Arquitectónico · Marco Shadowbox',
          unitPrice: priceVal,
          thumbImg: 'catalog/santiago-costanera-marco.jpg',
          quantity: 1,
          paymentMethod: 'transferencia',
          notes: (format.toLowerCase().includes('especial') || format.toLowerCase().includes('volumen') || format.toLowerCase().includes('gran formato'))
            ? `Reserva de producción inicial para ${currentType} en ${format}.`
            : `Pedido directo para ${currentType} en formato ${format}.`
        });
      });
    });

    // Botón del comparador de escala
    const scaleBuyBtn = document.getElementById('btn-scale-buy-now');
    if (scaleBuyBtn) {
      scaleBuyBtn.addEventListener('click', () => {
        const typeActive = document.querySelector('.type-card.selected');
        const currentType = typeActive ? (typeActive.getAttribute('data-type') || 'Maqueta Urbana') : 'Maqueta Urbana';
        const activeFmtCard = document.querySelector('.format-card.selected');
        const format = activeFmtCard ? (activeFmtCard.getAttribute('data-format') || '10 × 10 cm') : '10 × 10 cm';
        const activeBuyBtn = activeFmtCard ? activeFmtCard.querySelector('.btn-format-buy') : null;
        const priceVal = (activeBuyBtn && activeBuyBtn.getAttribute('data-price')) || (activeFmtCard ? activeFmtCard.getAttribute('data-price') : '$9.990 CLP') || '$9.990 CLP';
        const isSpecial = format.toLowerCase().includes('especial') || format.toLowerCase().includes('volumen') || format.toLowerCase().includes('gran formato');

        openCheckout({
          sku: 'SKU-CUST-08',
          productName: `${currentType} Personalizada (${format})`,
          size: format,
          finish: 'PLA Mate Blanco Arquitectónico · Marco Shadowbox',
          unitPrice: isSpecial ? 'A convenir' : priceVal,
          thumbImg: 'catalog/santiago-costanera-marco.jpg',
          quantity: 1,
          paymentMethod: isSpecial ? 'cotizacion' : 'transferencia',
          notes: isSpecial
            ? `Reserva de producción inicial para ${currentType} en ${format}.`
            : `Pedido directo para ${currentType} en formato ${format}.`
        });
      });
    }
  }

  /**
   * Vincula los botones de las tarjetas del catálogo para abrir el checkout modal
   */
  function bindCatalogCards() {
    const cards = document.querySelectorAll('.ecom-card');
    cards.forEach(card => {
      if (card.classList.contains('ecom-card-teaser') || card.dataset.category === 'lagos') return;
      const checkoutBtn = card.querySelector('.btn-ecom-checkout');
      if (!checkoutBtn) return;

      checkoutBtn.addEventListener('click', () => {
        const sku = card.getAttribute('data-sku') || 'SKU-SCL-01';
        const category = card.getAttribute('data-category') || '';
        const name = card.getAttribute('data-prod-name') || 'Maqueta Prediseñada';
        const isVolcano = category === 'volcanes' || sku.startsWith('SKU-VOL');
        const activeSizeBtn = card.querySelector('.ecom-size-btn.active');
        const size = activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : (isVolcano ? '20 × 20 cm' : '10 × 10 cm');
        const isQuote = activeSizeBtn ? (activeSizeBtn.getAttribute('data-is-quote') === 'true' || size.toLowerCase().includes('otro')) : false;

        if (isQuote || size.toLowerCase().includes('otro')) {
          const wspMsg = `Hola Adolfo, deseo cotizar una medida especial/otro tamaño para la maqueta de ${name}.`;
          const wspUrl = `https://wa.me/56962032766?text=${encodeURIComponent(wspMsg)}`;
          window.open(wspUrl, '_blank');
          return;
        }

        const activePriceDisplay = card.querySelector('.ecom-price-display');
        const priceStr = activePriceDisplay ? activePriceDisplay.textContent : (isVolcano ? '$24.990 CLP' : '$9.990 CLP');

        const activeViewBtn = card.querySelector('.ecom-view-btn.active');
        const finish = activeViewBtn ? activeViewBtn.textContent.trim() : 'Con Marco Shadowbox';
        const cardImg = card.querySelector('.ecom-img');
        const thumbImg = (activeViewBtn && activeViewBtn.getAttribute('data-img')) || (cardImg ? cardImg.getAttribute('src') : 'catalog/santiago-costanera-marco.jpg');

        openCheckout({
          sku,
          category,
          productName: name,
          size,
          finish,
          unitPrice: priceStr,
          thumbImg,
          quantity: 1
        });
      });
    });

    // Interceptar clics directos en píldoras o botones de 'Otro tamaño' en tarjetas de catálogo
    const sizeBtns = document.querySelectorAll('.ecom-size-btn');
    sizeBtns.forEach(btn => {
      const card = btn.closest('.ecom-card');
      if (card && (card.classList.contains('ecom-card-teaser') || card.dataset.category === 'lagos')) return;
      btn.addEventListener('click', () => {
        const sizeVal = btn.getAttribute('data-size') || '';
        if (sizeVal.toLowerCase().includes('otro') || btn.getAttribute('data-is-quote') === 'true') {
          const prodName = card ? (card.getAttribute('data-prod-name') || 'esta maqueta') : 'Volcán';
          const wspMsg = `Hola Adolfo, deseo cotizar una medida especial/otro tamaño para la maqueta de ${prodName}.`;
          const wspUrl = `https://wa.me/56962032766?text=${encodeURIComponent(wspMsg)}`;
          window.open(wspUrl, '_blank');
        }
      });
    });
  }

  /**
   * Muestra un toast flotante accesible de confirmación o alerta de pago
   * @param {'approved'|'cancelled'} type
   * @param {string} message
   * @param {object} [options]
   */
  function showCheckoutToast(type, message, options = {}) {
    if (typeof document === 'undefined') return;

    // Eliminar toast previo si ya está presente
    const existing = document.getElementById('ar-checkout-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ar-checkout-toast';
    toast.className = `ar-checkout-toast toast-${type}`;
    toast.setAttribute('role', type === 'approved' ? 'status' : 'alert');
    toast.setAttribute('aria-live', 'polite');

    const iconSvg = (type === 'approved')
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    const titleText = (type === 'approved') ? 'Pago Aprobado' : 'Pago Cancelado';

    const safeMessage = escapeHtml(message);
    let actionBtnHtml = '';
    if (options.actionLabel) {
      actionBtnHtml = `<button type="button" class="ar-checkout-toast-action" id="ar-toast-action-btn">${escapeHtml(options.actionLabel)}</button>`;
    }

    toast.innerHTML = `
      <div class="ar-checkout-toast-icon" aria-hidden="true">${iconSvg}</div>
      <div class="ar-checkout-toast-content">
        <strong class="ar-checkout-toast-title">${titleText}</strong>
        <p class="ar-checkout-toast-msg">${safeMessage}</p>
        ${actionBtnHtml}
      </div>
      <button type="button" class="ar-checkout-toast-close" id="ar-toast-close-btn" aria-label="Cerrar notificación">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    const closeBtn = toast.querySelector('#ar-toast-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.remove('is-visible');
        setTimeout(() => toast.remove(), 260);
      });
    }

    if (options.onAction) {
      const actionBtn = toast.querySelector('#ar-toast-action-btn');
      if (actionBtn) {
        actionBtn.addEventListener('click', (e) => {
          e.preventDefault();
          options.onAction();
          toast.classList.remove('is-visible');
          setTimeout(() => toast.remove(), 260);
        });
      }
    }

    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.classList.remove('is-visible');
        setTimeout(() => toast.remove(), 260);
      }
    }, 9000);
  }

  /**
   * Detección y manejo del retorno de pago Payku
   * (?payku_status=approved&order=... o ?payku_status=cancelled&order=...)
   */
  function checkPaykuReturnStatus() {
    if (typeof window === 'undefined' || !window.location) return;
    try {
      const search = window.location.search || '';
      if (!search) return;

      const urlParams = new URLSearchParams(search);
      const rawStatus = urlParams.get('payku_status') ||
        (urlParams.get('flow_status') === 'completed' ? 'approved' : null) ||
        (urlParams.get('khipu_status') === 'completed' ? 'approved' : null);

      if (!rawStatus) return;

      const isApproved = (rawStatus === 'approved' || rawStatus === 'completed' || rawStatus === 'success');
      const isCancelled = (rawStatus === 'cancelled' || rawStatus === 'canceled' || rawStatus === 'rejected' || rawStatus === 'failed');

      if (!isApproved && !isCancelled) return;

      const rawFolio = (urlParams.get('order') || urlParams.get('orderId') || urlParams.get('order_id') || '').trim();
      const orderFolioFromUrl = rawFolio.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
      const tokenFromUrl = (urlParams.get('token') || urlParams.get('trx_id') || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
      const emailFromUrl = (urlParams.get('email') || urlParams.get('payer_email') || '').trim().slice(0, 100);
      const nameFromUrl = (urlParams.get('name') || urlParams.get('payer_name') || '').trim().slice(0, 100);

      if (!dom.modal) initDomReferences();
      if (!dom.modal) return;

      const ECOM = window.AR_ECOMMERCE;
      let order = (ECOM && typeof ECOM.getLastOrder === 'function') ? ECOM.getLastOrder() : null;

      const folioVal = orderFolioFromUrl || (order && order.folio) || `AR-${new Date().getFullYear()}-PAYKU`;

      if (!order) {
        order = {
          folio: folioVal,
          sku: 'SKU-PAYKU-01',
          productName: 'Maqueta Arquitectónica',
          size: 'Formato Estándar',
          finish: 'PLA Mate Arquitectónico',
          quantity: 1,
          unitPrice: 24990,
          subtotal: 24990,
          shippingId: 'pickup',
          shippingLabel: 'Retiro en Taller / Despacho a Coordinar',
          shippingCost: 0,
          total: 24990,
          paymentMethod: 'payku',
          paymentLabel: 'Tarjeta de Débito, Crédito o Redcompra (Payku)',
          customer: {
            name: 'Cliente Payku',
            email: 'adolchilemods@gmail.com',
            phone: '+56 9 6203 2766',
            rut: 'No informado',
            address: ''
          },
          notes: isApproved ? 'Pago validado exitosamente vía Payku (Webpay Plus)' : 'Transacción cancelada en pasarela Payku',
          dateIso: new Date().toISOString(),
          dateFormatted: new Date().toLocaleDateString('es-CL'),
          status: isApproved ? 'PAGADA_PAYKU' : 'CANCELADA_PAYKU'
        };
      } else if (orderFolioFromUrl && order.folio !== orderFolioFromUrl) {
        order.folio = orderFolioFromUrl;
      }

      state.lastProcessedOrder = order;
      state.folio = order.folio;

      if (isCancelled) {
        order.status = 'CANCELADA_PAYKU';
        const cancelMsg = 'El pago fue cancelado. Puedes reintentar o pagar mediante Transferencia Bancaria.';

        // Mostrar Toast flotante con botón de acción directa a Transferencia Bancaria
        showCheckoutToast('cancelled', cancelMsg, {
          actionLabel: 'Pagar por Transferencia',
          onAction: () => {
            selectPaymentMethod('transferencia');
            if (dom.viewSuccess) dom.viewSuccess.classList.remove('is-visible');
            if (dom.viewMain) dom.viewMain.style.display = '';
            if (dom.modal) {
              dom.modal.classList.add('is-open');
              dom.modal.setAttribute('aria-hidden', 'false');
              document.body.style.overflow = 'hidden';
              state.isOpen = true;
            }
          }
        });

        // Mostrar pantalla en el modal
        if (dom.viewMain) dom.viewMain.style.display = 'none';
        if (dom.viewSuccess) dom.viewSuccess.classList.add('is-visible');

        if (dom.successFolio) dom.successFolio.textContent = `FOLIO #${order.folio}`;
        if (dom.successTitle) {
          dom.successTitle.textContent = 'PAGO CANCELADO';
        }
        if (dom.successLead) {
          const safeFolio = escapeHtml(order.folio);
          dom.successLead.innerHTML = `El pago fue cancelado. Puedes reintentar o pagar mediante Transferencia Bancaria.<br><br>Tu orden <strong>#${safeFolio}</strong> permanece reservada en nuestro sistema.`;
        }

        const statusBox = dom.successPaykuBox || dom.successKhipuBox;
        if (statusBox) {
          statusBox.style.display = 'block';
          const titleEl = dom.paykuTitle || dom.khipuTitle;
          const descEl = dom.paykuDesc || dom.khipuDesc;
          const linkBtn = dom.btnPaykuLink || dom.btnKhipuLink;

          if (titleEl) titleEl.textContent = 'TRANSFERENCIA BANCARIA DIRECTA';
          if (descEl) {
            descEl.textContent = 'Puedes completar el pago de inmediato mediante transferencia bancaria a Banco Bci o coordinar la confirmación directa por WhatsApp oficial.';
          }
          if (linkBtn) {
            linkBtn.style.display = 'inline-flex';
            linkBtn.href = `https://wa.me/56962032766?text=${encodeURIComponent(`Hola Adolfo, se canceló mi pago para la orden #${order.folio}. Deseo coordinar el pago por transferencia bancaria.`)}`;
            linkBtn.textContent = 'COORDINAR PAGO VÍA WHATSAPP';
          }
        }
        if (dom.bankBox) {
          dom.bankBox.classList.add('is-visible');
        }

      } else {
        // Pago Aprobado
        order.status = 'PAGADA_PAYKU';
        const approvedMsg = `¡Pago Aprobado! Tu orden #${order.folio} ha sido confirmada exitosamente. Te enviamos los detalles a tu correo.`;

        // Mostrar Toast flotante de aprobación
        showCheckoutToast('approved', approvedMsg);

        // Disparo de confirmacion a /api/email-notify si no se habia emitido para esta orden
        const notifySessionKey = `ar_email_payku_notified_${order.folio}`;
        try {
          const isAlreadyNotified = (typeof sessionStorage !== 'undefined') && sessionStorage.getItem(notifySessionKey);

          const payerEmail = (order.customer && order.customer.email && order.customer.email !== 'adolchilemods@gmail.com')
            ? order.customer.email
            : (emailFromUrl || (order.customer && order.customer.email) || '');

          const payerName = (order.customer && order.customer.name && order.customer.name !== 'Cliente Payku')
            ? order.customer.name
            : (nameFromUrl || 'Cliente ALZADO ROJO');

          if (payerEmail && order.customer) {
            order.customer.email = payerEmail;
            if (payerName) order.customer.name = payerName;
          }

          if (!isAlreadyNotified && payerEmail) {
            const emailPayload = {
              type: 'order_received',
              orderId: order.folio,
              customerName: payerName,
              customerEmail: payerEmail,
              productName: order.productName || 'Relieve Arquitectónico 3D · Maqueta Urbana',
              size: order.size || 'Formato Estándar',
              amount: order.total || order.subtotal || 24990,
              address: (order.customer && order.customer.address) || 'Confirmado vía Pasarela Payku Chile',
              city: (order.customer && (order.customer.commune || order.customer.city)) || 'Santiago',
              phone: (order.customer && order.customer.phone) || '+56 9 6203 2766'
            };

            fetch('/api/email-notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(emailPayload)
            }).then(r => r.json()).then(resp => {
              console.info('[ALZADO ROJO Checkout] Correo de confirmacion Payku enviado exitosamente:', resp);
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem(notifySessionKey, 'true');
              }
            }).catch(err => {
              console.warn('[ALZADO ROJO Checkout] Error no critico al emitir email-notify en retorno Payku:', err);
            });
          }
        } catch (errNotify) {
          console.warn('[ALZADO ROJO Checkout] Excepcion al emitir notificacion de retorno Payku:', errNotify);
        }

        if (dom.viewMain) dom.viewMain.style.display = 'none';
        if (dom.viewSuccess) dom.viewSuccess.classList.add('is-visible');

        if (dom.successFolio) dom.successFolio.textContent = `FOLIO #${order.folio}`;
        if (dom.successTitle) {
          dom.successTitle.textContent = '¡PAGO APROBADO!';
        }
        if (dom.successLead) {
          const custEmail = (order.customer && order.customer.email) ? order.customer.email : 'tu correo';
          const safeFolio = escapeHtml(order.folio);
          const safeEmail = escapeHtml(custEmail);
          dom.successLead.innerHTML = `¡Pago Aprobado! Tu orden <strong>#${safeFolio}</strong> ha sido confirmada exitosamente. Te enviamos los detalles a tu correo <strong>${safeEmail}</strong> y a nuestro taller corporativo (<strong>adolchilemods@gmail.com</strong>).`;
        }

        const statusBox = dom.successPaykuBox || dom.successKhipuBox;
        if (statusBox) {
          statusBox.style.display = 'block';
          const titleEl = dom.paykuTitle || dom.khipuTitle;
          const descEl = dom.paykuDesc || dom.khipuDesc;
          const linkBtn = dom.btnPaykuLink || dom.btnKhipuLink;

          if (titleEl) {
            titleEl.textContent = 'PAYKU · TRANSACCIÓN VALIDADA EXITOSAMENTE';
          }
          if (descEl) {
            descEl.textContent = 'Los fondos han sido acreditados mediante Webpay Plus. Nuestro equipo técnico inicia de inmediato la preparación de manufactura y despacho de su pieza.';
          }
          if (linkBtn) {
            linkBtn.style.display = 'none';
          }
        }
      }

      // Configuración de botones de comprobante PDF y WhatsApp
      if (dom.btnDownloadPdf) {
        dom.btnDownloadPdf.onclick = () => {
          if (ECOM && typeof ECOM.openQuotePrintWindow === 'function') {
            ECOM.openQuotePrintWindow(order);
          }
        };
      }

      if (dom.btnCoordWsp) {
        if (ECOM && typeof ECOM.buildWhatsAppOrderUrl === 'function') {
          dom.btnCoordWsp.href = ECOM.buildWhatsAppOrderUrl(order);
        } else {
          const wspText = isApproved
            ? `Hola Adolfo, confirmo el pago aprobado de mi orden #${order.folio} en Payku (Webpay Plus).`
            : `Hola Adolfo, deseo coordinar por transferencia bancaria mi orden #${order.folio}.`;
          dom.btnCoordWsp.href = `https://wa.me/56962032766?text=${encodeURIComponent(wspText)}`;
        }
      }

      renderEmailPreview(order);

      // Desplegar modal interactivo
      dom.modal.classList.add('is-open');
      dom.modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      state.isOpen = true;

      const scroller = dom.modal.querySelector('.ar-modal-scroll');
      if (scroller) scroller.scrollTop = 0;

    } catch (errCheck) {
      console.warn('[ALZADO ROJO Checkout] Error al verificar retorno de pasarela:', errCheck);
    }
  }

  // Alias retrocompatible
  const checkFlowReturnStatus = checkPaykuReturnStatus;

  // Inicialización cuando el DOM esté listo
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initDomReferences();
        bindEvents();
        checkPaykuReturnStatus();
      });
    } else {
      initDomReferences();
      bindEvents();
      checkPaykuReturnStatus();
    }
  }

  return {
    escapeHtml,
    openCheckout,
    closeCheckout,
    checkPaykuReturnStatus,
    checkFlowReturnStatus,
    showCheckoutToast,
    selectPaymentMethod,
    setFormat,
    refreshFinancials,
    getState: () => ({ ...state })
  };
});
