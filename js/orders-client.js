/**
 * ALZADO ROJO · AR ARQ SpA
 * Cliente de Datos para Pedidos (Frontend SDK)
 * Archivo: js/orders-client.js
 * 
 * Expone metodos de alto nivel para consumo en UI sin acoplamiento a la persistencia interna.
 * Implementa estrategia Offline-First con fallback a localStorage y emision de eventos.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OrdersClient = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const API_ENDPOINT = '/api/orders';
  const CACHE_KEY = 'alzado_rojo_orders_cache';
  const LAST_SYNC_KEY = 'alzado_rojo_orders_last_sync';

  // Estados autorizados
  const ESTADOS = [
    'En Modelado',
    'En Impresión',
    'En Enmarcado',
    'Listo para Despacho',
    'Entregado'
  ];

  // Estados de pago autorizados
  const ESTADOS_PAGO = [
    'Pendiente',
    'Abonado 50%',
    'Pagado Total'
  ];

  /**
   * Helper para disparar eventos custom en el navegador
   */
  function emitEvent(eventName, detail) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        const ev = new CustomEvent(eventName, { detail });
        window.dispatchEvent(ev);
        window.dispatchEvent(new CustomEvent('orders:changed', { detail }));
      } catch (e) {
        // Ignorar entornos sin CustomEvent
      }
    }
  }

  /**
   * Lee cache local en caso de falla de red o entornos estaticos
   */
  function getLocalCache() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('[OrdersClient] Error leyendo localStorage cache:', e);
      return [];
    }
  }

  /**
   * Actualiza el cache local
   */
  function setLocalCache(orders) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(orders));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('[OrdersClient] Error guardando localStorage cache:', e);
    }
  }

  const OrdersClient = {
    ESTADOS,
    ESTADOS_PAGO,

    /**
     * Valida los datos de un pedido antes de enviarlo
     * @param {object} data
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(data) {
      const errors = [];
      if (!data) {
        return { valid: false, errors: ['No se proporcionaron datos de pedido.'] };
      }

      if (!data.cliente || String(data.cliente).trim().length < 2) {
        errors.push('El nombre del cliente debe tener al menos 2 caracteres.');
      }

      if (!data.tipo || String(data.tipo).trim().length < 2) {
        errors.push('Debe especificar el modelo o proyecto de maqueta.');
      }

      if (data.monto === undefined || isNaN(Number(data.monto)) || Number(data.monto) < 0) {
        errors.push('El monto debe ser un numero positivo en pesos chilenos.');
      }

      if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(data.email).trim())) {
          errors.push('El formato del correo electronico no es valido.');
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    },

    /**
     * Obtiene el listado de pedidos con filtros opcionales
     * @param {object} [filters={}] { estado, coleccion, q, sort, fechaDesde, fechaHasta }
     * @returns {Promise<{ ok: boolean, orders: Array, count: number, fromCache?: boolean }>}
     */
    async getOrders(filters = {}) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(k => {
        if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
          params.append(k, filters[k]);
        }
      });

      const url = `${API_ENDPOINT}${params.toString() ? '?' + params.toString() : ''}`;

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        if (data.ok && Array.isArray(data.orders)) {
          // Si fue peticion completa sin filtros, actualizamos cache
          if (Object.keys(filters).length === 0) {
            setLocalCache(data.orders);
          }
          return data;
        }
        throw new Error(data.error || 'Respuesta inesperada del servidor');

      } catch (netErr) {
        console.warn('[OrdersClient] Red no disponible, usando respaldo local:', netErr.message);
        let cached = getLocalCache();

        // Aplicar filtros basicos en local
        if (filters.estado) {
          cached = cached.filter(o => (o.estado || '').toLowerCase() === filters.estado.toLowerCase());
        }
        if (filters.q) {
          const q = filters.q.toLowerCase();
          cached = cached.filter(o =>
            (o.cliente || '').toLowerCase().includes(q) ||
            (o.tipo || '').toLowerCase().includes(q) ||
            (o.id || '').toLowerCase().includes(q)
          );
        }

        return {
          ok: true,
          orders: cached,
          count: cached.length,
          fromCache: true,
          offlineWarning: 'Visualizando datos locales por indisponibilidad temporal de conexion.'
        };
      }
    },

    /**
     * Consulta un pedido unico por su ID
     * @param {string} id
     */
    async getOrderById(id) {
      if (!id) throw new Error('Se requiere un ID de pedido.');
      try {
        const res = await fetch(`${API_ENDPOINT}?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        return data;
      } catch (err) {
        const cached = getLocalCache();
        const found = cached.find(o => o.id === id);
        if (found) {
          return { ok: true, order: found, fromCache: true };
        }
        throw err;
      }
    },

    /**
     * Crea un nuevo pedido
     * @param {object} orderData
     * @returns {Promise<{ ok: boolean, order: object, message: string }>}
     */
    async createOrder(orderData) {
      const val = this.validate(orderData);
      if (!val.valid) {
        return {
          ok: false,
          error: val.errors.join(' '),
          details: val.errors
        };
      }

      try {
        const res = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(orderData)
        });

        const data = await res.json();
        if (data.ok && data.order) {
          // Sincronizar cache
          const cached = getLocalCache();
          cached.unshift(data.order);
          setLocalCache(cached);

          emitEvent('orders:created', data.order);
          return data;
        }
        return data;

      } catch (err) {
        // Fallback local ante desconexion
        const currentYear = new Date().getFullYear();
        const localId = `AR-${currentYear}-${Date.now().toString().slice(-3)}`;
        const fallbackOrder = {
          ...orderData,
          id: localId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _offlinePending: true
        };

        const cached = getLocalCache();
        cached.unshift(fallbackOrder);
        setLocalCache(cached);

        emitEvent('orders:created', fallbackOrder);

        return {
          ok: true,
          order: fallbackOrder,
          message: 'Pedido guardado en modo local diferido.',
          fromCache: true
        };
      }
    },

    /**
     * Actualiza un pedido existente
     * @param {string} id
     * @param {object} updates
     */
    async updateOrder(id, updates) {
      if (!id) throw new Error('Se requiere el ID del pedido para actualizar.');

      try {
        const res = await fetch(API_ENDPOINT, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ id, ...updates })
        });

        const data = await res.json();
        if (data.ok && data.order) {
          const cached = getLocalCache();
          const idx = cached.findIndex(o => o.id === id);
          if (idx !== -1) {
            cached[idx] = data.order;
            setLocalCache(cached);
          }
          emitEvent('orders:updated', data.order);
        }
        return data;

      } catch (err) {
        const cached = getLocalCache();
        const idx = cached.findIndex(o => o.id === id);
        if (idx !== -1) {
          cached[idx] = { ...cached[idx], ...updates, updatedAt: new Date().toISOString() };
          setLocalCache(cached);
          emitEvent('orders:updated', cached[idx]);
          return { ok: true, order: cached[idx], fromCache: true };
        }
        throw err;
      }
    },

    /**
     * Elimina un pedido por ID
     * @param {string} id
     */
    async deleteOrder(id) {
      if (!id) throw new Error('Se requiere el ID del pedido para eliminar.');

      try {
        const res = await fetch(`${API_ENDPOINT}?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });

        const data = await res.json();
        if (data.ok) {
          const cached = getLocalCache().filter(o => o.id !== id);
          setLocalCache(cached);
          emitEvent('orders:deleted', { id });
        }
        return data;

      } catch (err) {
        const cached = getLocalCache().filter(o => o.id !== id);
        setLocalCache(cached);
        emitEvent('orders:deleted', { id });
        return { ok: true, deletedId: id, fromCache: true };
      }
    },

    /**
     * Calcula metricas clave y estadisticas de la produccion
     * @param {Array} [ordersList] Si no se entrega, consulta getOrders()
     */
    async getStats(ordersList) {
      let orders = ordersList;
      if (!orders) {
        const res = await this.getOrders();
        orders = res.orders || [];
      }

      const totalMonto = orders.reduce((sum, o) => sum + (Number(o.monto) || 0), 0);
      const totalAbonado = orders.reduce((sum, o) => sum + (Number(o.abono) || 0), 0);
      const totalPendiente = totalMonto - totalAbonado;

      const porEstado = {
        'En Modelado': 0,
        'En Impresión': 0,
        'En Enmarcado': 0,
        'Listo para Despacho': 0,
        'Entregado': 0
      };

      const porColeccion = {};

      orders.forEach(o => {
        if (porEstado[o.estado] !== undefined) {
          porEstado[o.estado]++;
        }
        const col = o.coleccion || 'General';
        porColeccion[col] = (porColeccion[col] || 0) + 1;
      });

      return {
        totalPedidos: orders.length,
        totalMonto,
        totalAbonado,
        totalPendiente,
        porEstado,
        porColeccion
      };
    }
  };

  return OrdersClient;
}));
