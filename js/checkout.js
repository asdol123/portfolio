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
    unitPrice: 12990,
    quantity: 1,
    shippingId: 'pickup',
    paymentMethod: 'transferencia',
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
      successKhipuBox: document.getElementById('ar-khipu-status-box') || document.getElementById('ar-success-khipu-box'),
      btnKhipuLink: document.getElementById('btn-ar-khipu-link') || document.getElementById('btn-ar-flow-link'),
      khipuTitle: document.getElementById('ar-flow-action-title') || document.getElementById('ar-khipu-action-title'),
      khipuDesc: document.getElementById('ar-flow-action-desc') || document.getElementById('ar-khipu-action-desc'),
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

    if (state.paymentMethod === 'khipu') {
      dom.btnSubmitLabel.textContent = 'PAGAR CON KHIPU';
    } else if (state.paymentMethod === 'flow') {
      dom.btnSubmitLabel.textContent = 'INTENTAR PAGO CON TARJETA';
    } else if (state.paymentMethod === 'transferencia' || state.paymentMethod === 'transfer') {
      dom.btnSubmitLabel.textContent = 'CONFIRMAR PEDIDO POR TRANSFERENCIA';
    } else if (state.paymentMethod === 'cotizacion') {
      dom.btnSubmitLabel.textContent = 'DESCARGAR COTIZACIÓN';
    }
  }

  /**
   * Actualiza el estado visual del aviso técnico según el medio de pago seleccionado
   */
  function updatePaymentNoticeState() {
    if (!dom.paymentNotice) return;
    const isFlow = (state.paymentMethod === 'flow');
    dom.paymentNotice.classList.toggle('is-flow-active', isFlow);
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
        const match = radio && radio.value === targetMethod;
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

    // Preservar y deducir categoria para resolucion de precios (Volcanes vs Estandar)
    let cat = productData.category || '';
    if (!cat && state.sku && (state.sku.startsWith('SKU-VOL-') || state.sku.startsWith('SKU-VOL'))) {
      cat = 'volcanes';
    }
    if (!cat && ECOM && typeof ECOM.getProductBySku === 'function') {
      const p = ECOM.getProductBySku(state.sku);
      if (p && p.category) cat = p.category;
    }
    state.category = cat;

    state.productName = productData.productName || 'Santiago · Costanera Center';
    state.size = productData.size || '10 × 10 cm';
    state.finish = productData.finish || 'Con Marco Shadowbox';
    state.thumbImg = productData.thumbImg || 'catalog/santiago-costanera-marco.jpg';
    state.unitPrice = productData.unitPrice !== undefined
      ? (ECOM && typeof ECOM.parseCLP === 'function' ? ECOM.parseCLP(productData.unitPrice) : (parseInt(String(productData.unitPrice).replace(/[^0-9]/g, ''), 10) || 0))
      : 12990;

    // Detección de Medida Especial / Cotización a convenir
    const isCustomSpecial = String(state.size).toLowerCase().includes('especial') ||
                            String(state.size).toLowerCase().includes('convenir') ||
                            String(state.size).toLowerCase().includes('personalizado') ||
                            String(state.size).toLowerCase().includes('gran formato') ||
                            String(state.size).toLowerCase().includes('volumen') ||
                            state.unitPrice === 0;

    // Sincronización estricta del precio oficial mediante AR_ECOMMERCE con contexto de categoria/SKU
    let parsedPrice = 0;
    if (ECOM && typeof ECOM.resolveFormatPrice === 'function') {
      parsedPrice = ECOM.resolveFormatPrice(state.size, state.finish, productData.unitPrice, state.category || state.sku);
    } else if (ECOM && typeof ECOM.parseCLP === 'function') {
      parsedPrice = ECOM.parseCLP(productData.unitPrice || 0);
    } else {
      parsedPrice = parseInt(String(productData.unitPrice || '').replace(/[^0-9]/g, ''), 10) || 0;
    }
    
    // Priorizar Transferencia Bancaria Directa o activar modo Cotización si es cotización o formato especial
    const requestedMethod = productData.paymentMethod;
    if (isCustomSpecial || requestedMethod === 'cotizacion') {
      state.paymentMethod = 'cotizacion';
    } else if (requestedMethod === 'khipu') {
      state.paymentMethod = 'khipu';
    } else {
      state.paymentMethod = 'transferencia';
    }
    state.isCustomSpecial = isCustomSpecial;

    // Si es Medida Especial, Gran Formato / Volumen o precio 0: asegurar modo cotización con unitPrice 0 sin cobrar $12.990
    if (isCustomSpecial) {
      if (state.paymentMethod === 'cotizacion') {
        parsedPrice = 0;
      } else {
        parsedPrice = 29990; // Abono inicial de manufactura si se selecciona transferencia
      }
    } else if (parsedPrice <= 0 && !isCustomSpecial) {
      const isVolcano = (state.category === 'volcanes' || (state.sku && state.sku.startsWith('SKU-VOL')));
      const isFrameless = String(state.finish).toLowerCase().includes('sin marco');
      parsedPrice = isVolcano ? (isFrameless ? 11990 : 14990) : (isFrameless ? 9990 : 12990);
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

      // Transición a la pantalla de éxito
      if (dom.viewMain) dom.viewMain.style.display = 'none';
      if (dom.viewSuccess) dom.viewSuccess.classList.add('is-visible');

      if (dom.successFolio) dom.successFolio.textContent = `FOLIO #${result.order.folio}`;

      if (state.paymentMethod === 'cotizacion') {
        if (dom.successTitle) dom.successTitle.textContent = '¡COTIZACIÓN FORMAL EMITIDA!';
        if (dom.successLead) {
          dom.successLead.innerHTML = `Hemos enviado la cotización formal desglosada a su correo <strong>${customer.email}</strong> y a nuestro taller (<strong>adolchilemods@gmail.com</strong>). Sus tarifas quedan reservadas formalmente por 15 días.`;
        }
      } else {
        if (dom.successTitle) dom.successTitle.textContent = '¡ORDEN REGISTRADA CON ÉXITO!';
        if (dom.successLead) {
          dom.successLead.innerHTML = `Hemos registrado su orden oficial <strong>#${result.order.folio}</strong> y enviado el comprobante con desglose formal a su correo <strong>${customer.email}</strong> y a nuestro taller corporativo (<strong>adolchilemods@gmail.com</strong>).`;
        }
      }

      // Pasarela en vivo (Khipu o Flow.cl)
      const isOnlineGateway = (state.paymentMethod === 'flow' || state.paymentMethod === 'khipu');
      if (isOnlineGateway && dom.successKhipuBox) {
        dom.successKhipuBox.style.display = 'block';
        const isKhipuMethod = (state.paymentMethod === 'khipu');
        let gatewayData = isKhipuMethod ? (result.khipuResult || result.flowResult) : (result.flowResult || result.khipuResult);
        let paymentUrl = result.payment_url || (gatewayData && gatewayData.payment_url);

        // Si es Khipu y aún no tenemos paymentUrl, llamada de contingencia directa a /api/khipu-create
        if (isKhipuMethod && !paymentUrl) {
          try {
            const khipuPayload = {
              orderId: (result.order && result.order.folio) || state.folio,
              subject: `Orden ALZADO ROJO ${(result.order && result.order.folio) || state.folio} | ${state.productName} (${state.size})`.slice(0, 200),
              amount: Math.round(Number((result.order && result.order.total) || state.unitPrice * state.quantity || 29990)),
              currency: 'CLP',
              payer_email: customer.email,
              payer_name: customer.name,
              body: `${state.productName} · Formato: ${state.size} · Despacho: ${state.shippingId}`
            };
            const directRes = await fetch('/api/khipu-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(khipuPayload)
            });
            if (directRes.ok) {
              const directData = await directRes.json();
              if (directData && directData.payment_url) {
                paymentUrl = directData.payment_url;
                gatewayData = directData;
              }
            }
          } catch (directErr) {
            console.warn('[ALZADO ROJO Checkout] Error en contingencia /api/khipu-create:', directErr);
          }
        }
        
        if (paymentUrl) {
          if (dom.khipuTitle) {
            dom.khipuTitle.textContent = isKhipuMethod ? 'KHIPU · PASARELA DE PAGO PREPARADA' : 'FLOW.CL · PASARELA DE PAGO PREPARADA';
          }
          if (dom.khipuDesc) {
            dom.khipuDesc.textContent = isKhipuMethod
              ? 'Tu orden ha sido generada en Khipu. Redirigiendo a la pasarela segura de transferencia bancaria... Si no eres redirigido automáticamente, haz clic en el siguiente botón:'
              : 'Tu orden ha sido generada en Flow.cl. Redirigiendo a la pasarela segura Webpay... Si no eres redirigido automáticamente, haz clic en el siguiente botón:';
          }
          if (dom.btnKhipuLink) {
            dom.btnKhipuLink.style.display = 'inline-flex';
            dom.btnKhipuLink.href = paymentUrl;
            dom.btnKhipuLink.textContent = isKhipuMethod ? 'IR A PAGAR EN KHIPU' : 'IR A PAGAR EN FLOW.CL (WEBPAY)';
          }
          // Redirección inmediata a pasarela
          try {
            window.location.href = paymentUrl;
          } catch (errRedirect) {
            console.warn('[ALZADO ROJO Checkout] Redirección automática prevenida por el navegador:', errRedirect);
          }
        } else {
          // Si la pasarela reporta error, mostrar aviso explicativo elegante con opción de transferir o WhatsApp
          const gatewayError = (gatewayData && gatewayData.error) ? gatewayData.error : 'No fue posible conectar con la pasarela en este instante.';
          const wspUrl = (gatewayData && gatewayData.whatsappFallback) ? gatewayData.whatsappFallback : result.whatsappUrl;

          if (dom.khipuTitle) dom.khipuTitle.textContent = 'PAGO EN LÍNEA · GESTIÓN DIRECTA DISPONIBLE';
          if (dom.khipuDesc) {
            dom.khipuDesc.innerHTML = `Su orden <strong>#${result.order.folio}</strong> ha sido registrada exitosamente en nuestro sistema.<br><br><strong>Detalle de pasarela:</strong> ${gatewayError}<br><br>Puede completar el pago de inmediato mediante Transferencia Electrónica Directa (datos bancarios abajo) o coordinar el link de pago por WhatsApp.`;
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
        let priceVal = btn.getAttribute('data-price') || (card ? card.getAttribute('data-price') : '$12.990 CLP');

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
        const priceVal = (activeBuyBtn && activeBuyBtn.getAttribute('data-price')) || (activeFmtCard ? activeFmtCard.getAttribute('data-price') : '$12.990 CLP') || '$12.990 CLP';
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
      const checkoutBtn = card.querySelector('.btn-ecom-checkout');
      if (!checkoutBtn) return;

      checkoutBtn.addEventListener('click', () => {
        const sku = card.getAttribute('data-sku') || 'SKU-SCL-01';
        const category = card.getAttribute('data-category') || '';
        const name = card.getAttribute('data-prod-name') || 'Maqueta Prediseñada';
        const activeSizeBtn = card.querySelector('.ecom-size-btn.active');
        const size = activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : '10 × 10 cm';
        const activePriceDisplay = card.querySelector('.ecom-price-display');
        const priceStr = activePriceDisplay ? activePriceDisplay.textContent : '$9.990 CLP';

        const activeViewBtn = card.querySelector('.ecom-view-btn.active');
        const finish = activeViewBtn ? activeViewBtn.textContent.trim() : 'Estándar';
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
  }

  /**
   * Detección de Retorno Exitoso desde Khipu o Flow.cl
   * (?khipu_status=completed&order=... o ?flow_status=completed&order=...)
   * Al cargar la página, verifica los parámetros de la URL y si está completado,
   * abre automáticamente el modal en la pantalla de éxito con la orden confirmada.
   */
  function checkFlowReturnStatus() {
    if (typeof window === 'undefined' || !window.location) return;
    try {
      const search = window.location.search || '';
      const isKhipuReturn = search.includes('khipu_status=completed');
      const isFlowReturn = search.includes('flow_status=completed');
      if (!isKhipuReturn && !isFlowReturn) return;

      const urlParams = new URLSearchParams(search);
      const isKhipu = isKhipuReturn;
      const orderFolioFromUrl = urlParams.get('order') || urlParams.get('orderId') || '';

      if (!dom.modal) initDomReferences();
      if (!dom.modal) return;

      const ECOM = window.AR_ECOMMERCE;
      let order = (ECOM && typeof ECOM.getLastOrder === 'function') ? ECOM.getLastOrder() : null;

      // Si no existe orden previa o el folio de la URL es distinto, construir orden base con el folio recibido
      if (!order) {
        order = {
          folio: orderFolioFromUrl || (isKhipu ? `AR-${new Date().getFullYear()}-KHIPU` : `AR-${new Date().getFullYear()}-FLOW`),
          sku: isKhipu ? 'SKU-KHIPU-01' : 'SKU-FLOW-01',
          productName: 'Maqueta Arquitectónica',
          size: 'Formato Estándar',
          finish: 'PLA Mate Arquitectónico',
          quantity: 1,
          unitPrice: 0,
          subtotal: 0,
          shippingId: 'pickup',
          shippingLabel: 'Retiro en Taller / Despacho a Coordinar',
          shippingCost: 0,
          total: 0,
          paymentMethod: isKhipu ? 'khipu' : 'flow',
          paymentLabel: isKhipu ? 'Khipu · Transferencia Bancaria Simplificada' : 'Flow.cl · Webpay, Débito y Crédito',
          customer: {
            name: isKhipu ? 'Cliente Khipu' : 'Cliente Flow.cl',
            email: 'adolchilemods@gmail.com',
            phone: '+56 9 7541 2203',
            rut: 'No informado',
            address: ''
          },
          notes: isKhipu ? 'Pago procesado exitosamente vía pasarela Khipu' : 'Pago procesado exitosamente vía pasarela Flow.cl',
          dateIso: new Date().toISOString(),
          dateFormatted: new Date().toLocaleDateString('es-CL'),
          status: isKhipu ? 'PAGADA_KHIPU' : 'PAGADA_FLOW'
        };
      } else if (orderFolioFromUrl && order.folio !== orderFolioFromUrl) {
        order.folio = orderFolioFromUrl;
      }

      order.status = isKhipu ? 'PAGADA_KHIPU' : 'PAGADA_FLOW';
      state.lastProcessedOrder = order;
      state.folio = order.folio;

      // Cambiar a la vista de éxito del modal
      if (dom.viewMain) dom.viewMain.style.display = 'none';
      if (dom.viewSuccess) dom.viewSuccess.classList.add('is-visible');

      if (dom.successFolio) dom.successFolio.textContent = `FOLIO #${order.folio}`;
      if (dom.successTitle) {
        dom.successTitle.textContent = isKhipu ? 'PAGO PROCESADO EN KHIPU · ORDEN CONFIRMADA' : 'PAGO PROCESADO EN FLOW.CL · ORDEN CONFIRMADA';
      }
      if (dom.successLead) {
        const custEmail = (order.customer && order.customer.email) ? order.customer.email : 'su correo electrónico';
        const gatewayName = isKhipu ? 'Khipu' : 'Flow.cl';
        dom.successLead.innerHTML = `Su pago ha sido validado y procesado exitosamente mediante ${gatewayName}. Hemos emitido el comprobante oficial de su orden <strong>#${order.folio}</strong> a <strong>${custEmail}</strong> y a nuestro taller corporativo (<strong>adolchilemods@gmail.com</strong>).`;
      }

      // Bloque informativo de estado de pasarela
      if (dom.successKhipuBox) {
        dom.successKhipuBox.style.display = 'block';
        if (dom.khipuTitle) {
          dom.khipuTitle.textContent = isKhipu ? 'KHIPU · TRANSACCIÓN VALIDADA EXITOSAMENTE' : 'FLOW.CL · TRANSACCIÓN VALIDADA EXITOSAMENTE';
        }
        if (dom.khipuDesc) {
          dom.khipuDesc.textContent = isKhipu
            ? 'Los fondos han sido acreditados mediante transferencia bancaria simplificada Khipu. Nuestro equipo técnico inicia de inmediato la preparación de manufactura y despacho de su pieza.'
            : 'Los fondos han sido acreditados. Nuestro equipo técnico inicia de inmediato la preparación de manufactura y despacho de su pieza.';
        }
        if (dom.btnKhipuLink) {
          dom.btnKhipuLink.style.display = 'none';
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
          const wspText = isKhipu
            ? `Hola Adolfo, confirmo el pago exitoso de mi orden #${order.folio} en Khipu.`
            : `Hola Adolfo, confirmo el pago exitoso de mi orden #${order.folio} en Flow.cl.`;
          dom.btnCoordWsp.href = `https://wa.me/56975412203?text=${encodeURIComponent(wspText)}`;
        }
      }

      // Renderizar vista previa técnica del correo
      renderEmailPreview(order);

      // Desplegar modal interactivo
      dom.modal.classList.add('is-open');
      dom.modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      state.isOpen = true;

      // Posicionar scroll en la parte superior
      const scroller = dom.modal.querySelector('.ar-modal-scroll');
      if (scroller) scroller.scrollTop = 0;

    } catch (errCheck) {
      console.warn('[ALZADO ROJO Checkout] Error al verificar retorno de Flow.cl:', errCheck);
    }
  }

  // Inicialización cuando el DOM esté listo
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initDomReferences();
        bindEvents();
        checkFlowReturnStatus();
      });
    } else {
      initDomReferences();
      bindEvents();
      checkFlowReturnStatus();
    }
  }

  return {
    openCheckout,
    closeCheckout,
    checkFlowReturnStatus,
    setFormat,
    refreshFinancials,
    getState: () => ({ ...state })
  };
});
