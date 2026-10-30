/**
 * ALZADO ROJO · AR ARQ SpA
 * Controlador Frontend para Agenda y Gestion de Pedidos
 * Archivo: js/orders.js
 * 
 * Reglas de diseno y contenido:
 * - 100% Borderless (border: none !important).
 * - Cero emojis en codigo y plantillas.
 * - Cero ampersands en textos visibles (uso estricto de 'y').
 * - Numeros y montos tabulares en JetBrains Mono.
 * - Consumo de OrdersClient (js/orders-client.js).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AR_ORDERS_APP = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  // Estado reactivo local
  const state = {
    orders: [],
    currentFilter: 'TODOS',
    searchQuery: '',
    editingOrderId: null
  };

  // Formateador monetario CLP
  function formatCLP(val) {
    const num = Number(val) || 0;
    return '$' + num.toLocaleString('es-CL') + ' CLP';
  }

  // Sanitizador de ampersands en textos visibles
  function cleanVisibleText(str) {
    if (!str) return '';
    return String(str)
      .replace(/&amp;/gi, 'y')
      .replace(/&/g, 'y');
  }

  // Formato legible de fecha YYYY-MM-DD a DD/MM/YYYY
  function formatDate(dateStr) {
    if (!dateStr) return 'Sin fecha';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  // Determina si una fecha de entrega es proxima (dentro de 4 dias o vencida)
  function isDeliveryUrgent(fechaEntregaStr, estado) {
    if (!fechaEntregaStr || estado === 'Entregado') return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const delivery = new Date(fechaEntregaStr + 'T00:00:00');
      const diffDays = Math.ceil((delivery - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 4;
    } catch (e) {
      return false;
    }
  }

  // Determina si una fecha de entrega cae dentro de la semana en curso (proximos 7 dias)
  function isDeliveryThisWeek(fechaEntregaStr, estado) {
    if (!fechaEntregaStr || estado === 'Entregado') return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const delivery = new Date(fechaEntregaStr + 'T00:00:00');
      const diffDays = Math.ceil((delivery - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    } catch (e) {
      return false;
    }
  }

  // Obtiene clase CSS semantica segun estado de manufactura
  function getStatusClass(estado) {
    switch ((estado || '').toLowerCase()) {
      case 'en modelado': return 'status-modelado';
      case 'en impresión':
      case 'en impresion': return 'status-impresion';
      case 'en enmarcado': return 'status-enmarcado';
      case 'listo para despacho': return 'status-despacho';
      case 'entregado': return 'status-entregado';
      default: return 'status-modelado';
    }
  }

  // Obtiene clase CSS semantica segun estado de pago
  function getPaymentClass(estadoPago) {
    switch ((estadoPago || '').toLowerCase()) {
      case 'pagado total': return 'pago-pagado';
      case 'abonado 50%':
      case 'abonado': return 'pago-abonado';
      case 'pendiente':
      default: return 'pago-pendiente';
    }
  }

  // Calcula y actualiza las tarjetas de KPIs
  function updateKPIs(orders) {
    const kpiTotalPedidos = document.getElementById('kpi-total-pedidos');
    const kpiEnProduccion = document.getElementById('kpi-en-produccion');
    const kpiEntregasSemana = document.getElementById('kpi-entregas-semana');
    const kpiTotalMonto = document.getElementById('kpi-total-monto');

    const totalPedidos = orders.length;
    const enProduccion = orders.filter(o => 
      o.estado === 'En Modelado' || o.estado === 'En Impresión' || o.estado === 'En Enmarcado'
    ).length;

    const entregasSemana = orders.filter(o => isDeliveryThisWeek(o.fechaEntrega, o.estado)).length;
    const totalMonto = orders.reduce((sum, o) => sum + (Number(o.monto) || 0), 0);

    if (kpiTotalPedidos) kpiTotalPedidos.textContent = totalPedidos;
    if (kpiEnProduccion) kpiEnProduccion.textContent = enProduccion;
    if (kpiEntregasSemana) kpiEntregasSemana.textContent = entregasSemana;
    if (kpiTotalMonto) kpiTotalMonto.textContent = formatCLP(totalMonto);

    // Actualizar contadores de las pestanas
    updateTabCounts(orders);
  }

  // Actualiza los badges numericos de las pestanas
  function updateTabCounts(orders) {
    const tabs = document.querySelectorAll('.orders-tab-btn');
    tabs.forEach(tab => {
      const filter = tab.getAttribute('data-status');
      const countEl = tab.querySelector('.orders-tab-count');
      if (!countEl) return;

      if (filter === 'TODOS') {
        countEl.textContent = orders.length;
      } else {
        const matching = orders.filter(o => (o.estado || '').toUpperCase() === filter.toUpperCase());
        countEl.textContent = matching.length;
      }
    });
  }

  // Filtra los pedidos segun la pestana activa y el buscador
  function getFilteredOrders() {
    let list = [...state.orders];

    if (state.currentFilter !== 'TODOS') {
      list = list.filter(o => (o.estado || '').toUpperCase() === state.currentFilter.toUpperCase());
    }

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      list = list.filter(o => 
        (o.id || '').toLowerCase().includes(q) ||
        (o.cliente || '').toLowerCase().includes(q) ||
        (o.empresa || '').toLowerCase().includes(q) ||
        (o.tipo || '').toLowerCase().includes(q) ||
        (o.coleccion || '').toLowerCase().includes(q)
      );
    }

    return list;
  }

  // Renderiza la lista completa de pedidos
  function renderOrdersList() {
    const container = document.getElementById('orders-list-container');
    if (!container) return;

    const filtered = getFilteredOrders();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="orders-empty-state">
          <div class="orders-empty-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h4 class="orders-empty-title">No hay pedidos para este filtro</h4>
          <p class="orders-empty-desc">No se encontraron ordenes que coincidan con los criterios seleccionados. Prueba con otro filtro o agenda un nuevo pedido.</p>
        </div>
      `;
      return;
    }

    const html = filtered.map(order => {
      const urgent = isDeliveryUrgent(order.fechaEntrega, order.estado);
      const cleanCliente = cleanVisibleText(order.cliente || 'Cliente General');
      const cleanEmpresa = cleanVisibleText(order.empresa || 'Particular');
      const cleanTipo = cleanVisibleText(order.tipo || 'Maqueta');
      const cleanColeccion = cleanVisibleText(order.coleccion || 'General');
      const cleanMarco = cleanVisibleText(order.marco || 'Sin Marco');
      const cleanNotas = cleanVisibleText(order.notas || '');

      const phoneRaw = (order.telefono || '').replace(/\D/g, '');
      const wspLink = phoneRaw ? `https://wa.me/${phoneRaw}?text=Hola%20${encodeURIComponent(cleanCliente)},%20te%20contacto%20desde%20ALZADO%20ROJO%20respecto%20al%20pedido%20${encodeURIComponent(order.id)}.` : '#';
      const mailLink = order.email ? `mailto:${order.email}?subject=ALZADO%20ROJO%20·%20Estado%20del%20Pedido%20${encodeURIComponent(order.id)}` : '#';

      return `
        <article class="order-item-card" data-order-id="${order.id}">
          <!-- Columna 1: ID y Coleccion -->
          <div class="order-col-id">
            <span class="order-id-badge">${order.id}</span>
            <span class="order-collection-tag">${cleanColeccion}</span>
          </div>

          <!-- Columna 2: Cliente y Contacto -->
          <div class="order-col-client">
            <div class="order-client-name" title="${cleanCliente}">${cleanCliente}</div>
            <div class="order-client-company" title="${cleanEmpresa}">${cleanEmpresa}</div>
            <div class="order-client-contact-links">
              ${phoneRaw ? `
                <a href="${wspLink}" target="_blank" rel="noopener noreferrer" class="order-contact-btn" title="Contactar por WhatsApp">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  <span>WSP</span>
                </a>
              ` : ''}
              ${order.email ? `
                <a href="${mailLink}" class="order-contact-btn" title="Enviar correo">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                  <span>CORREO</span>
                </a>
              ` : ''}
            </div>
          </div>

          <!-- Columna 3: Maqueta, Formato y Escala -->
          <div class="order-col-specs">
            <div class="order-model-name">${cleanTipo}</div>
            <div class="order-format-pill">
              <span>${order.formato || 'Formato'}</span>
              <span>·</span>
              <span>${order.escala || '1:1000'}</span>
            </div>
            <div class="order-frame-tag">${cleanMarco}</div>
          </div>

          <!-- Columna 4: Fechas y Estado -->
          <div class="order-col-status">
            <div class="order-dates-row">
              <div class="order-date-item">
                <span>Ingreso:</span>
                <strong>${formatDate(order.fechaPedido)}</strong>
              </div>
              <div class="order-date-item">
                <span>Entrega:</span>
                <strong>${formatDate(order.fechaEntrega)}</strong>
                ${urgent ? '<span class="order-urgent-badge">PRÓXIMA</span>' : ''}
              </div>
            </div>
            <div class="order-status-select-wrap">
              <select class="order-status-select ${getStatusClass(order.estado)}" data-order-id="${order.id}" aria-label="Cambiar estado del pedido ${order.id}">
                ${window.OrdersClient.ESTADOS.map(st => `
                  <option value="${st}" ${st === order.estado ? 'selected' : ''}>${st}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Columna 5: Monto, Pago y Acciones -->
          <div class="order-col-actions">
            <div class="order-price-row">
              <span class="order-price-val">${formatCLP(order.monto)}</span>
              <span class="order-payment-pill ${getPaymentClass(order.estadoPago)}">${order.estadoPago || 'Pendiente'}</span>
            </div>
            <div class="order-action-btns-row">
              <button type="button" class="btn-order-taller" data-order-id="${order.id}" title="Ver Ficha Tecnica de Taller">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>FICHA TALLER</span>
              </button>
              <button type="button" class="btn-order-action action-edit" data-order-id="${order.id}" title="Editar Pedido" aria-label="Editar Pedido ${order.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button type="button" class="btn-order-action action-danger" data-order-id="${order.id}" title="Eliminar Pedido" aria-label="Eliminar Pedido ${order.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = html;
    bindOrderRowEvents();
  }

  // Vincula eventos a los controles interactivos de cada fila
  function bindOrderRowEvents() {
    // Cambio reactivo de estado en tiempo real
    document.querySelectorAll('.order-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = select.getAttribute('data-order-id');
        const newStatus = select.value;

        // Actualizar clase de color inmediatamente
        select.className = `order-status-select ${getStatusClass(newStatus)}`;

        try {
          await window.OrdersClient.updateOrder(id, { estado: newStatus });
          // Actualizar estado local
          const found = state.orders.find(o => o.id === id);
          if (found) found.estado = newStatus;
          updateKPIs(state.orders);
        } catch (err) {
          console.error('[OrdersApp] Error actualizando estado:', err);
        }
      });
    });

    // Boton Ficha de Taller
    document.querySelectorAll('.btn-order-taller').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-order-id');
        openTallerSheet(id);
      });
    });

    // Boton Editar
    document.querySelectorAll('.action-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-order-id');
        openEditOrderModal(id);
      });
    });

    // Boton Eliminar
    document.querySelectorAll('.action-danger').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-order-id');
        if (confirm(`¿Confirma eliminar el pedido ${id}? Esta acción no se puede deshacer.`)) {
          try {
            await window.OrdersClient.deleteOrder(id);
            state.orders = state.orders.filter(o => o.id !== id);
            updateKPIs(state.orders);
            renderOrdersList();
          } catch (err) {
            alert('Error al eliminar pedido: ' + err.message);
          }
        }
      });
    });
  }

  // Abre la Ficha Tecnica de Taller Imprimible
  function openTallerSheet(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('modal-taller-sheet');
    if (!modal) return;

    const cleanCliente = cleanVisibleText(order.cliente);
    const cleanEmpresa = cleanVisibleText(order.empresa);
    const cleanTipo = cleanVisibleText(order.tipo);
    const cleanColeccion = cleanVisibleText(order.coleccion);
    const cleanMarco = cleanVisibleText(order.marco);
    const cleanNotas = cleanVisibleText(order.notas || 'Sin especificaciones adicionales.');

    document.getElementById('taller-sheet-folio').textContent = order.id;
    document.getElementById('taller-sheet-cliente').textContent = cleanCliente;
    document.getElementById('taller-sheet-empresa').textContent = cleanEmpresa;
    document.getElementById('taller-sheet-telefono').textContent = order.telefono || 'Sin telefono';
    document.getElementById('taller-sheet-email').textContent = order.email || 'Sin correo';
    document.getElementById('taller-sheet-maqueta').textContent = cleanTipo;
    document.getElementById('taller-sheet-coleccion').textContent = cleanColeccion;
    document.getElementById('taller-sheet-formato').textContent = order.formato || 'Especial';
    document.getElementById('taller-sheet-escala').textContent = order.escala || '1:1000';
    document.getElementById('taller-sheet-marco').textContent = cleanMarco;
    document.getElementById('taller-sheet-fecha-ingreso').textContent = formatDate(order.fechaPedido);
    document.getElementById('taller-sheet-fecha-entrega').textContent = formatDate(order.fechaEntrega);
    document.getElementById('taller-sheet-estado').textContent = order.estado;
    document.getElementById('taller-sheet-monto').textContent = formatCLP(order.monto);
    document.getElementById('taller-sheet-abono').textContent = formatCLP(order.abono || 0);
    document.getElementById('taller-sheet-saldo').textContent = formatCLP((Number(order.monto) || 0) - (Number(order.abono) || 0));
    document.getElementById('taller-sheet-notas').textContent = cleanNotas;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeTallerSheet() {
    const modal = document.getElementById('modal-taller-sheet');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Abre el Modal de Creacion o Edicion de Pedido
  function openCreateOrderModal() {
    state.editingOrderId = null;
    const form = document.getElementById('form-order-upsert');
    if (form) form.reset();

    const titleEl = document.getElementById('modal-order-title');
    if (titleEl) titleEl.textContent = 'AGENDAR NUEVO PEDIDO';

    // Fecha de pedido hoy
    const fechaPedidoInput = document.getElementById('input-order-fecha-pedido');
    if (fechaPedidoInput) {
      fechaPedidoInput.value = new Date().toISOString().split('T')[0];
    }

    // Fecha de entrega en 10 dias por defecto
    const fechaEntregaInput = document.getElementById('input-order-fecha-entrega');
    if (fechaEntregaInput) {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      fechaEntregaInput.value = future.toISOString().split('T')[0];
    }

    const modal = document.getElementById('modal-order-form');
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function openEditOrderModal(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    state.editingOrderId = orderId;
    const titleEl = document.getElementById('modal-order-title');
    if (titleEl) titleEl.textContent = `EDITAR PEDIDO ${order.id}`;

    // Cargar campos
    document.getElementById('input-order-cliente').value = order.cliente || '';
    document.getElementById('input-order-empresa').value = order.empresa || '';
    document.getElementById('input-order-telefono').value = order.telefono || '';
    document.getElementById('input-order-email').value = order.email || '';
    document.getElementById('input-order-tipo').value = order.tipo || 'Volcán Villarrica';
    document.getElementById('input-order-coleccion').value = order.coleccion || 'Volcanes de Chile';
    document.getElementById('input-order-formato').value = order.formato || '20x20 cm';
    document.getElementById('input-order-escala').value = order.escala || '1:1000';
    document.getElementById('input-order-marco').value = order.marco || 'Shadowbox Negro Mate';
    document.getElementById('input-order-fecha-pedido').value = order.fechaPedido || '';
    document.getElementById('input-order-fecha-entrega').value = order.fechaEntrega || '';
    document.getElementById('input-order-estado').value = order.estado || 'En Modelado';
    document.getElementById('input-order-monto').value = order.monto || '';
    document.getElementById('input-order-abono').value = order.abono || '';
    document.getElementById('input-order-notas').value = order.notas || '';

    const modal = document.getElementById('modal-order-form');
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeOrderModal() {
    const modal = document.getElementById('modal-order-form');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Exportar pedidos a Excel / CSV
  function exportOrdersToCSV() {
    if (state.orders.length === 0) {
      alert('No hay pedidos para exportar.');
      return;
    }

    const headers = [
      'Folio',
      'Cliente',
      'Empresa / Estudio',
      'Telefono',
      'Email',
      'Maqueta',
      'Coleccion',
      'Formato',
      'Escala',
      'Marco',
      'Fecha Pedido',
      'Fecha Entrega',
      'Estado Produccion',
      'Monto CLP',
      'Abono CLP',
      'Estado Pago',
      'Notas'
    ];

    const rows = state.orders.map(o => [
      `"${o.id || ''}"`,
      `"${cleanVisibleText(o.cliente || '')}"`,
      `"${cleanVisibleText(o.empresa || '')}"`,
      `"${o.telefono || ''}"`,
      `"${o.email || ''}"`,
      `"${cleanVisibleText(o.tipo || '')}"`,
      `"${cleanVisibleText(o.coleccion || '')}"`,
      `"${o.formato || ''}"`,
      `"${o.escala || ''}"`,
      `"${cleanVisibleText(o.marco || '')}"`,
      `"${o.fechaPedido || ''}"`,
      `"${o.fechaEntrega || ''}"`,
      `"${o.estado || ''}"`,
      `"${o.monto || 0}"`,
      `"${o.abono || 0}"`,
      `"${o.estadoPago || ''}"`,
      `"${cleanVisibleText(o.notas || '')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alzado_rojo_pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Exportar respaldo JSON
  function exportOrdersToJSON() {
    if (state.orders.length === 0) {
      alert('No hay pedidos para exportar.');
      return;
    }

    const jsonStr = JSON.stringify(state.orders, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alzado_rojo_orders_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Carga pedidos del cliente y actualiza KPIs y tabla
  async function loadAndRenderOrders() {
    if (typeof window === 'undefined' || !window.OrdersClient) return;
    try {
      const res = await window.OrdersClient.getOrders();
      state.orders = res.orders || [];
      updateKPIs(state.orders);
      renderOrdersList();
    } catch (err) {
      console.warn('[OrdersApp] Error cargando ordenes:', err);
    }
  }

  // Limpia el estado privado en memoria y la vista al bloquear sesion
  function clearPrivateOrders() {
    state.orders = [];
    state.editingOrderId = null;
    updateKPIs([]);
    const container = document.getElementById('orders-table-body');
    if (container) {
      container.innerHTML = '';
    }

    // Higiene de estado: cerrar modales y resetear formularios
    closeOrderModal();
    const form = document.getElementById('form-order-upsert');
    if (form) form.reset();
    const modalTaller = document.getElementById('modal-taller-sheet');
    if (modalTaller) {
      modalTaller.classList.remove('active');
      modalTaller.classList.remove('is-open');
      modalTaller.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';

    // Purgado de cache local offline
    try {
      localStorage.removeItem('alzado_rojo_orders_cache');
    } catch (e) {}
    if (window.OrdersClient && typeof window.OrdersClient.clearCache === 'function') {
      try {
        window.OrdersClient.clearCache();
      } catch (e) {}
    }
  }

  // Carga inicial y listeners globales
  async function init() {
    // Escuchar eventos de autenticacion emitidos por OrdersAuth
    if (typeof window !== 'undefined' && !window.__arOrdersAuthEventsAttached) {
      window.__arOrdersAuthEventsAttached = true;
      window.addEventListener('auth:success', () => {
        loadAndRenderOrders();
      });
      window.addEventListener('auth:locked', () => {
        clearPrivateOrders();
      });
    }

    // Condicion estricta de privacidad (Fail-Closed):
    // Solo carga pedidos si OrdersAuth confirma sesion valida.
    // Si no esta autenticado o OrdersAuth no esta presente, jamas se cargan datos por defecto.
    const hasAccess = typeof window !== 'undefined' && Boolean(window.OrdersAuth && window.OrdersAuth.isAuthenticated());

    if (hasAccess) {
      await loadAndRenderOrders();
    } else {
      clearPrivateOrders();
    }

    // Buscador reactivo
    const searchInput = document.getElementById('order-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderOrdersList();
      });
    }

    // Pestanas de filtro de estado
    document.querySelectorAll('.orders-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.orders-tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        state.currentFilter = btn.getAttribute('data-status') || 'TODOS';
        renderOrdersList();
      });
    });

    // Botones de impacto
    const btnOpenCreate = document.getElementById('btn-open-create-order');
    if (btnOpenCreate) {
      btnOpenCreate.addEventListener('click', openCreateOrderModal);
    }

    const btnExportCSV = document.getElementById('btn-export-csv');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', exportOrdersToCSV);
    }

    const btnExportJSON = document.getElementById('btn-export-json');
    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', exportOrdersToJSON);
    }

    // Cierre de modales
    const closeFormBtn = document.getElementById('modal-order-close-btn');
    if (closeFormBtn) closeFormBtn.addEventListener('click', closeOrderModal);

    const btnCancelForm = document.getElementById('btn-cancel-order-form');
    if (btnCancelForm) btnCancelForm.addEventListener('click', closeOrderModal);

    const closeTallerBtn = document.getElementById('modal-taller-close-btn');
    if (closeTallerBtn) closeTallerBtn.addEventListener('click', closeTallerSheet);

    const btnPrintTaller = document.getElementById('btn-print-taller-sheet');
    if (btnPrintTaller) {
      btnPrintTaller.addEventListener('click', () => {
        window.print();
      });
    }

    // Cerrar al hacer click en el backdrop
    const modalOrderForm = document.getElementById('modal-order-form');
    if (modalOrderForm) {
      modalOrderForm.addEventListener('click', (e) => {
        if (e.target === modalOrderForm) closeOrderModal();
      });
    }

    const modalTallerSheet = document.getElementById('modal-taller-sheet');
    if (modalTallerSheet) {
      modalTallerSheet.addEventListener('click', (e) => {
        if (e.target === modalTallerSheet) closeTallerSheet();
      });
    }

    // Tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeOrderModal();
        closeTallerSheet();
      }
    });

    // Manejo de envio del formulario de creacion / edicion
    const formUpsert = document.getElementById('form-order-upsert');
    if (formUpsert) {
      formUpsert.addEventListener('submit', async (e) => {
        e.preventDefault();

        const montoVal = Number(document.getElementById('input-order-monto').value) || 0;
        const abonoVal = Number(document.getElementById('input-order-abono').value) || 0;

        let estadoPago = 'Pendiente';
        if (abonoVal >= montoVal && montoVal > 0) {
          estadoPago = 'Pagado Total';
        } else if (abonoVal > 0) {
          estadoPago = 'Abonado 50%';
        }

        const orderData = {
          cliente: document.getElementById('input-order-cliente').value.trim(),
          empresa: document.getElementById('input-order-empresa').value.trim(),
          telefono: document.getElementById('input-order-telefono').value.trim(),
          email: document.getElementById('input-order-email').value.trim(),
          tipo: document.getElementById('input-order-tipo').value.trim(),
          coleccion: document.getElementById('input-order-coleccion').value.trim(),
          formato: document.getElementById('input-order-formato').value.trim(),
          escala: document.getElementById('input-order-escala').value.trim(),
          marco: document.getElementById('input-order-marco').value.trim(),
          fechaPedido: document.getElementById('input-order-fecha-pedido').value,
          fechaEntrega: document.getElementById('input-order-fecha-entrega').value,
          estado: document.getElementById('input-order-estado').value,
          monto: montoVal,
          abono: abonoVal,
          estadoPago: estadoPago,
          notas: document.getElementById('input-order-notas').value.trim()
        };

        const submitBtn = document.getElementById('btn-submit-order-form');
        if (submitBtn) submitBtn.disabled = true;

        try {
          if (state.editingOrderId) {
            const res = await window.OrdersClient.updateOrder(state.editingOrderId, orderData);
            if (res.ok) {
              const idx = state.orders.findIndex(o => o.id === state.editingOrderId);
              if (idx !== -1) state.orders[idx] = res.order;
            }
          } else {
            const res = await window.OrdersClient.createOrder(orderData);
            if (res.ok && res.order) {
              state.orders.unshift(res.order);
            }
          }

          updateKPIs(state.orders);
          renderOrdersList();
          closeOrderModal();
        } catch (err) {
          alert('Error procesando pedido: ' + err.message);
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    // Auto-completar coleccion segun tipo de maqueta
    const selectTipo = document.getElementById('input-order-tipo');
    const inputColeccion = document.getElementById('input-order-coleccion');
    if (selectTipo && inputColeccion) {
      selectTipo.addEventListener('change', () => {
        const val = selectTipo.value;
        if (val.includes('Volcán') || val.includes('Volcan')) {
          inputColeccion.value = 'Volcanes de Chile';
        } else if (val.includes('Costanera') || val.includes('Santiago')) {
          inputColeccion.value = 'Maquetas Urbanas';
        } else if (val.includes('Chicago') || val.includes('York')) {
          inputColeccion.value = 'Ciudades del Mundo';
        } else if (val.includes('Guiza') || val.includes('Pirámides')) {
          inputColeccion.value = 'Patrimonio de la Humanidad';
        } else if (val.includes('Mural') || val.includes('Topografía')) {
          inputColeccion.value = 'Arte Territorial';
        } else {
          inputColeccion.value = 'Proyectos Especiales';
        }
      });
    }
  }

  // Inicializacion automatica en carga del DOM
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    init,
    updateKPIs,
    renderOrdersList,
    openCreateOrderModal,
    openEditOrderModal,
    openTallerSheet,
    exportOrdersToCSV,
    exportOrdersToJSON
  };
});
