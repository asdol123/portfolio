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
    productName: 'Santiago · Costanera Center',
    size: '10 × 10 cm',
    finish: 'Con Marco',
    thumbImg: 'catalog/santiago-costanera-marco.jpg',
    unitPrice: 9990,
    quantity: 1,
    shippingId: 'pickup',
    paymentMethod: 'flow',
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
  function refreshFinancials() {
    if (!window.AR_ECOMMERCE) return;

    const totals = window.AR_ECOMMERCE.calculateTotals({
      unitPrice: state.unitPrice,
      quantity: state.quantity,
      shippingId: state.shippingId
    });

    if (dom.breakdownUnit) dom.breakdownUnit.textContent = totals.formatted.unitPrice;
    if (dom.breakdownQtyLabel) dom.breakdownQtyLabel.textContent = String(totals.quantity);
    if (dom.breakdownSubtotal) dom.breakdownSubtotal.textContent = totals.formatted.subtotal;
    if (dom.breakdownShipping) dom.breakdownShipping.textContent = totals.formatted.shippingCost;
    if (dom.breakdownTotal) dom.breakdownTotal.textContent = totals.formatted.total;
  }

  /**
   * Actualiza el botón de envío según el método de pago
   */
  function updateSubmitButtonState() {
    if (!dom.btnSubmitLabel) return;

    if (state.paymentMethod === 'flow' || state.paymentMethod === 'khipu') {
      dom.btnSubmitLabel.textContent = 'PAGAR AHORA';
    } else if (state.paymentMethod === 'transferencia') {
      dom.btnSubmitLabel.textContent = 'CONFIRMAR PEDIDO';
    } else if (state.paymentMethod === 'cotizacion') {
      dom.btnSubmitLabel.textContent = 'DESCARGAR COTIZACIÓN';
    }
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
    state.sku = productData.sku || 'SKU-CUSTOM';
    state.productName = productData.productName || 'Maqueta Arquitectónica';
    state.size = productData.size || '10 × 10 cm';
    state.finish = productData.finish || 'Con Marco';
    state.thumbImg = productData.thumbImg || 'catalog/santiago-costanera-marco.jpg';

    // Detección de Medida Especial / Cotización a convenir
    const isCustomSpecial = String(state.size || '').toLowerCase().includes('especial') ||
                            String(state.productName || '').toLowerCase().includes('especial') ||
                            String(productData.unitPrice || '').toLowerCase().includes('convenir');

    let parsedPrice = ECOM ? ECOM.parseCLP(productData.unitPrice || 0) : 0;
    state.paymentMethod = productData.paymentMethod || 'flow';
    state.isCustomSpecial = isCustomSpecial;

    // Si es Medida Especial o precio 0: si el método es Flow o Transferencia se asigna abono base de $29.990 CLP
    if (parsedPrice <= 0 && isCustomSpecial) {
      if (state.paymentMethod === 'cotizacion') {
        parsedPrice = 0;
      } else {
        parsedPrice = 29990; // Abono inicial de manufactura
      }
    } else if (parsedPrice <= 0 && !isCustomSpecial) {
      parsedPrice = 9990;
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

    // Ajustar radio de pago inicial
    if (dom.paymentOptions) {
      dom.paymentOptions.forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]');
        const match = radio && radio.value === state.paymentMethod;
        if (radio) radio.checked = match;
        opt.classList.toggle('is-selected', match);
      });
    }

    // Mostrar/ocultar datos bancarios
    if (dom.bankBox) {
      dom.bankBox.classList.toggle('is-visible', state.paymentMethod === 'transferencia');
    }

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

      // Flow.cl en vivo o soporte asistido
      const isOnlineGateway = (state.paymentMethod === 'flow' || state.paymentMethod === 'khipu');
      if (isOnlineGateway && dom.successKhipuBox) {
        dom.successKhipuBox.style.display = 'block';
        const flowData = result.flowResult || result.khipuResult;
        if (flowData && flowData.payment_url) {
          if (dom.khipuTitle) dom.khipuTitle.textContent = 'FLOW.CL · PASARELA DE PAGO PREPARADA';
          if (dom.khipuDesc) {
            dom.khipuDesc.textContent = 'Tu orden ha sido generada en Flow.cl. Redirigiendo a la pasarela segura Webpay... Si no eres redirigido automáticamente, haz clic en el siguiente botón:';
          }
          if (dom.btnKhipuLink) {
            dom.btnKhipuLink.style.display = 'inline-flex';
            dom.btnKhipuLink.href = flowData.payment_url;
            dom.btnKhipuLink.textContent = 'IR A PAGAR EN FLOW.CL (WEBPAY)';
          }
          // Redirección inmediata a Flow.cl
          try {
            window.location.href = flowData.payment_url;
          } catch (errRedirect) {
            console.warn('[ALZADO ROJO Checkout] Redirección automática a Flow prevenida por el navegador:', errRedirect);
          }
        } else {
          // Si Flow reporta error, mostrar aviso explicativo elegante con opción de transferir o WhatsApp
          const flowError = (flowData && flowData.error) ? flowData.error : 'No fue posible conectar con la pasarela en este instante.';
          const wspUrl = (flowData && flowData.whatsappFallback) ? flowData.whatsappFallback : result.whatsappUrl;

          if (dom.khipuTitle) dom.khipuTitle.textContent = 'PAGO EN LÍNEA · GESTIÓN DIRECTA DISPONIBLE';
          if (dom.khipuDesc) {
            dom.khipuDesc.innerHTML = `Su orden <strong>#${result.order.folio}</strong> ha sido registrada exitosamente en nuestro sistema.<br><br><strong>Detalle de pasarela:</strong> ${flowError}<br><br>Puede completar el pago de inmediato mediante Transferencia Electrónica Directa (datos bancarios abajo) o coordinar el link de pago por WhatsApp.`;
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
              dom.bankBox.classList.toggle('is-visible', state.paymentMethod === 'transferencia');
            }

            updateSubmitButtonState();
          }
        });
      });
    }

    // Copiar datos bancarios con feedback
    if (dom.btnCopyBank) {
      dom.btnCopyBank.addEventListener('click', async () => {
        const bankText = [
          'DATOS BANCARIOS OFICIALES · AR ARQ SpA',
          'Razón Social: AR ARQ SpA',
          'RUT: 77.892.341-K',
          'Banco: Banco Santander Chile',
          'Tipo de Cuenta: Cuenta Corriente',
          'Número de Cuenta: 89-23410-0',
          'Correo: adolchilemods@gmail.com',
          `Referencia: ${state.folio}`
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
        let priceVal = btn.getAttribute('data-price') || (card ? card.getAttribute('data-price') : '$9.990 CLP');

        openCheckout({
          sku: 'SKU-CUST-08',
          productName: `${currentType} Personalizada (${format})`,
          size: format,
          finish: 'PLA Mate Blanco Arquitectónico · Base Calibrada',
          unitPrice: priceVal,
          thumbImg: 'catalog/santiago-costanera-marco.jpg',
          quantity: 1,
          paymentMethod: 'flow',
          notes: format.toLowerCase().includes('especial')
            ? `Reserva de producción inicial para ${currentType} en Medida Especial personalizada.`
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
        const priceVal = activeFmtCard ? (activeFmtCard.getAttribute('data-price') || '$9.990 CLP') : '$9.990 CLP';

        openCheckout({
          sku: 'SKU-CUST-08',
          productName: `${currentType} Personalizada (${format})`,
          size: format,
          finish: 'PLA Mate Blanco Arquitectónico · Base Calibrada',
          unitPrice: priceVal,
          thumbImg: 'catalog/santiago-costanera-marco.jpg',
          quantity: 1,
          paymentMethod: 'flow'
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
   * Detección de Retorno Exitoso desde Flow.cl (?flow_status=completed&order=...)
   * Al cargar la página, verifica los parámetros de la URL y si está completado,
   * abre automáticamente el modal en la pantalla de éxito con la orden confirmada.
   */
  function checkFlowReturnStatus() {
    if (typeof window === 'undefined') return;
    try {
      const search = window.location.search || '';
      if (!search.includes('flow_status=completed')) return;

      const urlParams = new URLSearchParams(search);
      const statusParam = urlParams.get('flow_status');
      if (statusParam !== 'completed') return;

      const orderFolioFromUrl = urlParams.get('order') || urlParams.get('orderId') || '';

      if (!dom.modal) initDomReferences();
      if (!dom.modal) return;

      const ECOM = window.AR_ECOMMERCE;
      let order = (ECOM && typeof ECOM.getLastOrder === 'function') ? ECOM.getLastOrder() : null;

      // Si no existe orden previa o el folio de la URL es distinto, construir orden base con el folio recibido
      if (!order) {
        order = {
          folio: orderFolioFromUrl || `AR-${new Date().getFullYear()}-FLOW`,
          sku: 'SKU-FLOW-01',
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
          paymentMethod: 'flow',
          paymentLabel: 'Flow.cl · Webpay, Débito y Crédito',
          customer: {
            name: 'Cliente Flow.cl',
            email: 'adolchilemods@gmail.com',
            phone: '+56 9 7541 2203',
            rut: 'No informado',
            address: ''
          },
          notes: 'Pago procesado exitosamente vía pasarela Flow.cl',
          dateIso: new Date().toISOString(),
          dateFormatted: new Date().toLocaleDateString('es-CL'),
          status: 'PAGADA_FLOW'
        };
      } else if (orderFolioFromUrl && order.folio !== orderFolioFromUrl) {
        order.folio = orderFolioFromUrl;
      }

      order.status = 'PAGADA_FLOW';
      state.lastProcessedOrder = order;
      state.folio = order.folio;

      // Cambiar a la vista de éxito del modal
      if (dom.viewMain) dom.viewMain.style.display = 'none';
      if (dom.viewSuccess) dom.viewSuccess.classList.add('is-visible');

      if (dom.successFolio) dom.successFolio.textContent = `FOLIO #${order.folio}`;
      if (dom.successTitle) dom.successTitle.textContent = 'PAGO PROCESADO EN FLOW.CL · ORDEN CONFIRMADA';
      if (dom.successLead) {
        const custEmail = (order.customer && order.customer.email) ? order.customer.email : 'su correo electrónico';
        dom.successLead.innerHTML = `Su pago ha sido validado y procesado exitosamente mediante Flow.cl. Hemos emitido el comprobante oficial de su orden <strong>#${order.folio}</strong> a <strong>${custEmail}</strong> y a nuestro taller corporativo (<strong>adolchilemods@gmail.com</strong>).`;
      }

      // Bloque informativo de estado Flow.cl
      if (dom.successKhipuBox) {
        dom.successKhipuBox.style.display = 'block';
        if (dom.khipuTitle) dom.khipuTitle.textContent = 'FLOW.CL · TRANSACCIÓN VALIDADA EXITOSAMENTE';
        if (dom.khipuDesc) {
          dom.khipuDesc.textContent = 'Los fondos han sido acreditados. Nuestro equipo técnico inicia de inmediato la preparación de manufactura y despacho de su pieza.';
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
          dom.btnCoordWsp.href = `https://wa.me/56975412203?text=${encodeURIComponent(`Hola Adolfo, confirmo el pago exitoso de mi orden #${order.folio} en Flow.cl.`)}`;
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
    getState: () => ({ ...state })
  };
});
