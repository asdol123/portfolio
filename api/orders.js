/**
 * ALZADO ROJO · AR ARQ SpA
 * API Serverless Vercel: Gestion y Persistencia de Pedidos
 * Archivo: api/orders.js
 * 
 * Soporta:
 * - GET: Listado filtrable (por estado, coleccion, busqueda de texto, fecha, id).
 * - POST: Creacion con autogeneracion de ID (AR-YYYY-XXX), validacion y persistencia.
 * - PUT: Actualizacion de estado, pagos, fechas y notas.
 * - DELETE: Eliminacion por ID.
 * - Fallback de resiliencia: Si Vercel opera en filesystem de solo lectura (EROFS),
 *   persiste en /tmp/orders.json y cache en memoria, permitiendo sync transparente con el cliente.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Rutas de almacenamiento
const LOCAL_DATA_PATH = path.join(process.cwd(), 'data', 'orders.json');
const TMP_DATA_PATH = path.join(os.tmpdir(), 'alzado_rojo_orders.json');

// Cache en memoria para instancias calientes de Serverless
let memoryCache = null;

// Estados de produccion y entrega autorizados
const VALID_ESTADOS = [
  'En Modelado',
  'En Impresión',
  'En Enmarcado',
  'Listo para Despacho',
  'Entregado'
];

// Estados de pago autorizados
const VALID_PAGOS = [
  'Pendiente',
  'Abonado 50%',
  'Pagado Total'
];

/**
 * Sanitiza cadenas de texto para prevenir inyecciones o etiquetas script/html
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Elimina brackets angulares
    .trim();
}

/**
 * Carga los pedidos vigentes priorizando:
 * 1. Cache en memoria
 * 2. Archivo /tmp/alzado_rojo_orders.json (si hubo fallback previo)
 * 3. data/orders.json en el proyecto
 */
function loadOrders() {
  if (memoryCache && Array.isArray(memoryCache)) {
    return memoryCache;
  }

  // Intento 1: /tmp si ya tiene datos
  if (fs.existsSync(TMP_DATA_PATH)) {
    try {
      const tmpContent = fs.readFileSync(TMP_DATA_PATH, 'utf8');
      const parsed = JSON.parse(tmpContent);
      if (Array.isArray(parsed)) {
        memoryCache = parsed;
        return memoryCache;
      }
    } catch (e) {
      // Ignorar y seguir al archivo base
    }
  }

  // Intento 2: Archivo base data/orders.json
  if (fs.existsSync(LOCAL_DATA_PATH)) {
    try {
      const fileContent = fs.readFileSync(LOCAL_DATA_PATH, 'utf8');
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) {
        memoryCache = parsed;
        return memoryCache;
      }
    } catch (err) {
      console.error('[Orders API] Error leyendo data/orders.json:', err.message);
    }
  }

  // Intento 3: Lista vacia de respaldo
  memoryCache = [];
  return memoryCache;
}

/**
 * Guarda los pedidos en disco o fallback
 * @returns {{ success: boolean, storage: 'file' | 'tmp' | 'memory', error?: string }}
 */
function saveOrders(orders) {
  memoryCache = orders;
  const jsonContent = JSON.stringify(orders, null, 2);

  // 1. Intentar escribir en data/orders.json (entorno local o servidor con disco escribible)
  try {
    const parentDir = path.dirname(LOCAL_DATA_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DATA_PATH, jsonContent, 'utf8');
    return { success: true, storage: 'file' };
  } catch (fsErr) {
    // 2. Si falla por EROFS (Read-only file system en Vercel Serverless)
    try {
      fs.writeFileSync(TMP_DATA_PATH, jsonContent, 'utf8');
      return { success: true, storage: 'tmp' };
    } catch (tmpErr) {
      // 3. Respaldo en memoria
      return { success: true, storage: 'memory', error: tmpErr.message };
    }
  }
}

/**
 * Genera el siguiente ID consecutivo con formato AR-YYYY-XXX
 */
function generateNextId(orders) {
  const currentYear = new Date().getFullYear();
  const prefix = `AR-${currentYear}-`;

  let maxNum = 0;
  for (const o of orders) {
    if (o && typeof o.id === 'string' && o.id.startsWith(prefix)) {
      const numPart = parseInt(o.id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(3, '0');
  return `${prefix}${padded}`;
}

/**
 * Valida un payload de creacion de pedido
 */
function validateOrderPayload(data) {
  const errors = [];

  if (!data.cliente || sanitizeString(data.cliente).length < 2) {
    errors.push('El nombre del cliente es obligatorio (minimo 2 caracteres).');
  }

  if (!data.tipo || sanitizeString(data.tipo).length < 2) {
    errors.push('El tipo de modelo o maqueta es obligatorio.');
  }

  if (data.monto === undefined || isNaN(Number(data.monto)) || Number(data.monto) < 0) {
    errors.push('El monto debe ser un numero positivo.');
  }

  if (data.abono !== undefined && (isNaN(Number(data.abono)) || Number(data.abono) < 0)) {
    errors.push('El abono debe ser un numero mayor o igual a cero.');
  }

  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(data.email).trim())) {
      errors.push('El formato del correo electronico no es valido.');
    }
  }

  if (data.estado && !VALID_ESTADOS.includes(data.estado)) {
    errors.push(`Estado invalido. Debe ser uno de: ${VALID_ESTADOS.join(', ')}.`);
  }

  if (data.estadoPago && !VALID_PAGOS.includes(data.estadoPago)) {
    errors.push(`Estado de pago invalido. Debe ser uno de: ${VALID_PAGOS.join(', ')}.`);
  }

  return errors;
}

module.exports = async function handler(req, res) {
  // Cabeceras CORS universales
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Helper para parsear body
  let body = req.body;
  if (typeof body === 'string' && body.trim().length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ ok: false, error: 'JSON malformado en cuerpo de solicitud.' });
    }
  }
  body = body || {};

  const query = req.query || {};

  try {
    const orders = loadOrders();

    // =========================================================================
    // 1. GET /api/orders: Lectura con filtros
    // =========================================================================
    if (req.method === 'GET') {
      let filtered = [...orders];

      // Filtro por ID unico
      if (query.id) {
        const found = filtered.find(o => o.id === String(query.id).trim());
        if (!found) {
          return res.status(404).json({ ok: false, error: `Pedido ${query.id} no encontrado.` });
        }
        return res.status(200).json({ ok: true, order: found });
      }

      // Filtro por Estado
      if (query.estado) {
        const estadoNorm = String(query.estado).trim().toLowerCase();
        filtered = filtered.filter(o => (o.estado || '').toLowerCase() === estadoNorm);
      }

      // Filtro por Coleccion
      if (query.coleccion) {
        const colNorm = String(query.coleccion).trim().toLowerCase();
        filtered = filtered.filter(o => (o.coleccion || '').toLowerCase().includes(colNorm));
      }

      // Filtro por Estado de Pago
      if (query.estadoPago) {
        const pagoNorm = String(query.estadoPago).trim().toLowerCase();
        filtered = filtered.filter(o => (o.estadoPago || '').toLowerCase() === pagoNorm);
      }

      // Filtro por Rango de Fechas (fechaPedido)
      if (query.fechaDesde) {
        filtered = filtered.filter(o => (o.fechaPedido || o.createdAt || '') >= query.fechaDesde);
      }
      if (query.fechaHasta) {
        filtered = filtered.filter(o => (o.fechaPedido || o.createdAt || '') <= query.fechaHasta);
      }

      // Busqueda de texto libre (q)
      if (query.q) {
        const term = String(query.q).trim().toLowerCase();
        filtered = filtered.filter(o => 
          (o.id || '').toLowerCase().includes(term) ||
          (o.cliente || '').toLowerCase().includes(term) ||
          (o.empresa || '').toLowerCase().includes(term) ||
          (o.tipo || '').toLowerCase().includes(term) ||
          (o.email || '').toLowerCase().includes(term) ||
          (o.telefono || '').toLowerCase().includes(term) ||
          (o.notas || '').toLowerCase().includes(term)
        );
      }

      // Orden cronologico por defecto (mas reciente primero)
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.fechaPedido || 0).getTime();
        const dateB = new Date(b.createdAt || b.fechaPedido || 0).getTime();
        return query.sort === 'asc' ? dateA - dateB : dateB - dateA;
      });

      return res.status(200).json({
        ok: true,
        count: filtered.length,
        total: orders.length,
        orders: filtered
      });
    }

    // =========================================================================
    // 2. POST /api/orders: Crear nuevo pedido
    // =========================================================================
    if (req.method === 'POST') {
      const validationErrors = validateOrderPayload(body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          ok: false,
          error: 'Datos invalidos para registrar el pedido.',
          details: validationErrors
        });
      }

      const now = new Date();
      const nowIso = now.toISOString();
      const todayStr = nowIso.slice(0, 10);

      // Fecha estimada de entrega (10 dias posteriores por defecto si no se especifica)
      const defaultDelivery = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const montoNum = Math.round(Number(body.monto));
      const abonoNum = body.abono !== undefined ? Math.round(Number(body.abono)) : 0;

      // Calculo automatico del estado de pago
      let estadoPago = body.estadoPago;
      if (!estadoPago) {
        if (abonoNum >= montoNum && montoNum > 0) {
          estadoPago = 'Pagado Total';
        } else if (abonoNum > 0) {
          estadoPago = 'Abonado 50%';
        } else {
          estadoPago = 'Pendiente';
        }
      }

      // Inferencia de coleccion
      let coleccion = sanitizeString(body.coleccion);
      if (!coleccion) {
        const tipoLow = (body.tipo || '').toLowerCase();
        if (tipoLow.includes('volcán') || tipoLow.includes('volcan') || tipoLow.includes('villarrica') || tipoLow.includes('osorno')) {
          coleccion = 'Volcanes de Chile';
        } else if (tipoLow.includes('santiago') || tipoLow.includes('costanera') || tipoLow.includes('chicago') || tipoLow.includes('new york')) {
          coleccion = 'Maquetas Urbanas';
        } else {
          coleccion = 'Colección General';
        }
      }

      const newId = body.id && /^AR-\d{4}-\d{3,}$/.test(body.id) ? body.id : generateNextId(orders);

      const newOrder = {
        id: newId,
        cliente: sanitizeString(body.cliente),
        empresa: sanitizeString(body.empresa || 'Particular'),
        telefono: sanitizeString(body.telefono || ''),
        email: sanitizeString(body.email || ''),
        tipo: sanitizeString(body.tipo),
        coleccion: coleccion,
        formato: sanitizeString(body.formato || '20x20 cm'),
        escala: sanitizeString(body.escala || '1:1000'),
        marco: sanitizeString(body.marco || 'Shadowbox Negro Mate'),
        fechaPedido: body.fechaPedido || todayStr,
        fechaEntrega: body.fechaEntrega || defaultDelivery,
        estado: body.estado || 'En Modelado',
        monto: montoNum,
        abono: abonoNum,
        estadoPago: estadoPago,
        notas: sanitizeString(body.notas || ''),
        createdAt: nowIso,
        updatedAt: nowIso
      };

      orders.unshift(newOrder); // Agrega al inicio para visibilidad inmediata
      const saveResult = saveOrders(orders);

      return res.status(201).json({
        ok: true,
        message: `Pedido ${newOrder.id} creado con exito.`,
        order: newOrder,
        storage: saveResult.storage,
        ordersCount: orders.length
      });
    }

    // =========================================================================
    // 3. PUT /api/orders: Actualizar pedido existente
    // =========================================================================
    if (req.method === 'PUT') {
      const orderId = sanitizeString(body.id || query.id);
      if (!orderId) {
        return res.status(400).json({ ok: false, error: 'El parametro "id" es obligatorio para actualizar.' });
      }

      const index = orders.findIndex(o => o.id === orderId);
      if (index === -1) {
        return res.status(404).json({ ok: false, error: `Pedido ${orderId} no encontrado.` });
      }

      const existing = orders[index];
      const nowIso = new Date().toISOString();

      // Validacion de estado si viene en body
      if (body.estado && !VALID_ESTADOS.includes(body.estado)) {
        return res.status(400).json({
          ok: false,
          error: `Estado invalido. Debe ser uno de: ${VALID_ESTADOS.join(', ')}.`
        });
      }

      // Validacion de estado de pago si viene en body
      if (body.estadoPago && !VALID_PAGOS.includes(body.estadoPago)) {
        return res.status(400).json({
          ok: false,
          error: `Estado de pago invalido. Debe ser uno de: ${VALID_PAGOS.join(', ')}.`
        });
      }

      const updatedMonto = body.monto !== undefined ? Math.round(Number(body.monto)) : existing.monto;
      const updatedAbono = body.abono !== undefined ? Math.round(Number(body.abono)) : existing.abono;

      // Recalcular estadoPago si se modificaron valores y no viene forzado
      let updatedEstadoPago = body.estadoPago || existing.estadoPago;
      if (!body.estadoPago && (body.monto !== undefined || body.abono !== undefined)) {
        if (updatedAbono >= updatedMonto && updatedMonto > 0) {
          updatedEstadoPago = 'Pagado Total';
        } else if (updatedAbono > 0) {
          updatedEstadoPago = 'Abonado 50%';
        } else {
          updatedEstadoPago = 'Pendiente';
        }
      }

      const updatedOrder = {
        ...existing,
        cliente: body.cliente !== undefined ? sanitizeString(body.cliente) : existing.cliente,
        empresa: body.empresa !== undefined ? sanitizeString(body.empresa) : existing.empresa,
        telefono: body.telefono !== undefined ? sanitizeString(body.telefono) : existing.telefono,
        email: body.email !== undefined ? sanitizeString(body.email) : existing.email,
        tipo: body.tipo !== undefined ? sanitizeString(body.tipo) : existing.tipo,
        coleccion: body.coleccion !== undefined ? sanitizeString(body.coleccion) : existing.coleccion,
        formato: body.formato !== undefined ? sanitizeString(body.formato) : existing.formato,
        escala: body.escala !== undefined ? sanitizeString(body.escala) : existing.escala,
        marco: body.marco !== undefined ? sanitizeString(body.marco) : existing.marco,
        fechaPedido: body.fechaPedido !== undefined ? body.fechaPedido : existing.fechaPedido,
        fechaEntrega: body.fechaEntrega !== undefined ? body.fechaEntrega : existing.fechaEntrega,
        estado: body.estado || existing.estado,
        monto: updatedMonto,
        abono: updatedAbono,
        estadoPago: updatedEstadoPago,
        notas: body.notas !== undefined ? sanitizeString(body.notas) : existing.notas,
        updatedAt: nowIso
      };

      orders[index] = updatedOrder;
      const saveResult = saveOrders(orders);

      return res.status(200).json({
        ok: true,
        message: `Pedido ${orderId} actualizado correctamente.`,
        order: updatedOrder,
        storage: saveResult.storage
      });
    }

    // =========================================================================
    // 4. DELETE /api/orders: Eliminar pedido
    // =========================================================================
    if (req.method === 'DELETE') {
      const orderId = sanitizeString(query.id || body.id);
      if (!orderId) {
        return res.status(400).json({ ok: false, error: 'El parametro "id" es requerido para eliminar.' });
      }

      const index = orders.findIndex(o => o.id === orderId);
      if (index === -1) {
        return res.status(404).json({ ok: false, error: `Pedido ${orderId} no encontrado.` });
      }

      const [removed] = orders.splice(index, 1);
      const saveResult = saveOrders(orders);

      return res.status(200).json({
        ok: true,
        message: `Pedido ${orderId} eliminado correctamente.`,
        deleted: removed,
        storage: saveResult.storage,
        ordersCount: orders.length
      });
    }

    // Metodo no permitido
    return res.status(405).json({
      ok: false,
      error: `Metodo ${req.method} no permitido. Utilice GET, POST, PUT, DELETE u OPTIONS.`
    });

  } catch (err) {
    console.error('[Orders API Error]', err);
    return res.status(500).json({
      ok: false,
      error: 'Error interno en el servidor de pedidos.',
      detail: err.message
    });
  }
};
