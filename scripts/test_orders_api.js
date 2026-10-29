/**
 * Script de Pruebas Unitarias y de Integracion para api/orders.js
 */

const handler = require('../api/orders.js');

function mockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, val) {
      this.headers[key] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('EJECUTANDO SUITE DE PRUEBAS DE api/orders.js');
  console.log('='.repeat(70));

  let createdId = null;

  // 1. Test OPTIONS (CORS)
  console.log('\n[1] Probando CORS Preflight OPTIONS...');
  const resOpt = mockResponse();
  await handler({ method: 'OPTIONS' }, resOpt);
  console.assert(resOpt.statusCode === 200, 'OPTIONS debe retornar 200');
  console.assert(resOpt.headers['Access-Control-Allow-Origin'] === '*', 'Debe permitir CORS');
  console.log('    [PASS] OPTIONS responde 200 con cabeceras CORS');

  // 2. Test GET all
  console.log('\n[2] Probando GET /api/orders (Listado completo)...');
  const resGet = mockResponse();
  await handler({ method: 'GET', query: {} }, resGet);
  console.assert(resGet.statusCode === 200, 'GET debe retornar 200');
  console.assert(resGet.body.ok === true, 'GET debe retornar ok: true');
  console.assert(Array.isArray(resGet.body.orders), 'orders debe ser un array');
  console.log(`    [PASS] ${resGet.body.orders.length} pedidos cargados exitosamente`);

  // 3. Test GET con filtros
  console.log('\n[3] Probando GET /api/orders?estado=En Impresión...');
  const resFilter = mockResponse();
  await handler({ method: 'GET', query: { estado: 'En Impresión' } }, resFilter);
  console.assert(resFilter.body.ok === true, 'Filtro debe responder ok');
  console.assert(resFilter.body.orders.every(o => o.estado === 'En Impresión'), 'Todos deben coincidir con estado');
  console.log(`    [PASS] Filtro por estado retorno ${resFilter.body.orders.length} pedidos correctos`);

  // 4. Test POST validacion de error (campos obligatorios faltantes)
  console.log('\n[4] Probando POST /api/orders con datos invalidos (debe fallar con 400)...');
  const resPostInvalid = mockResponse();
  await handler({
    method: 'POST',
    body: {
      cliente: '',
      monto: -500
    }
  }, resPostInvalid);
  console.assert(resPostInvalid.statusCode === 400, 'Debe rechazar con 400');
  console.assert(resPostInvalid.body.ok === false, 'Debe indicar ok: false');
  console.log(`    [PASS] Rechazado con 400. Errores detectados: ${resPostInvalid.body.details.length}`);

  // 5. Test POST crear nuevo pedido exitoso
  console.log('\n[5] Probando POST /api/orders (Crear nuevo pedido Volcanes)...');
  const resPostValid = mockResponse();
  await handler({
    method: 'POST',
    body: {
      cliente: 'Mariana Gomez',
      empresa: 'Gomez & Silva Arquitectos',
      telefono: '+56987654321',
      email: 'mariana@gomezsilva.cl',
      tipo: 'Volcán Osorno Shadowbox',
      coleccion: 'Volcanes de Chile',
      formato: '20x20 cm',
      escala: '1:1000',
      marco: 'Shadowbox Negro Mate',
      monto: 54990,
      abono: 27500,
      notas: 'Entrega prioritaria para sala de ventas Puerto Varas.'
    }
  }, resPostValid);

  console.assert(resPostValid.statusCode === 201, 'Debe responder 201 Created');
  console.assert(resPostValid.body.ok === true, 'Debe retornar ok: true');
  createdId = resPostValid.body.order.id;
  console.assert(createdId.startsWith('AR-2026-'), `El ID ${createdId} debe coincidir con patron AR-2026-XXX`);
  console.assert(resPostValid.body.order.estadoPago === 'Abonado 50%', 'Debe calcular estadoPago correctamente');
  console.log(`    [PASS] Pedido creado exitosamente: ID=${createdId}, Storage=${resPostValid.body.storage}`);

  // 6. Test PUT actualizar pedido
  console.log(`\n[6] Probando PUT /api/orders (Actualizar pedido ${createdId})...`);
  const resPut = mockResponse();
  await handler({
    method: 'PUT',
    body: {
      id: createdId,
      estado: 'Listo para Despacho',
      abono: 54990,
      notas: 'Pago total recibido. Listo para courier Blue Express.'
    }
  }, resPut);

  console.assert(resPut.statusCode === 200, 'Debe responder 200 OK');
  console.assert(resPut.body.order.estado === 'Listo para Despacho', 'Estado debe estar actualizado');
  console.assert(resPut.body.order.estadoPago === 'Pagado Total', 'EstadoPago debe recalcular a Pagado Total');
  console.log(`    [PASS] Pedido ${createdId} actualizado a estado "${resPut.body.order.estado}" y pago "${resPut.body.order.estadoPago}"`);

  // 7. Test GET por ID especifico
  console.log(`\n[7] Probando GET /api/orders?id=${createdId}...`);
  const resGetOne = mockResponse();
  await handler({ method: 'GET', query: { id: createdId } }, resGetOne);
  console.assert(resGetOne.statusCode === 200, 'Debe responder 200');
  console.assert(resGetOne.body.order.id === createdId, 'Debe ser el pedido creado');
  console.log(`    [PASS] Pedido consultado con exito por ID`);

  // 8. Test DELETE eliminar pedido
  console.log(`\n[8] Probando DELETE /api/orders?id=${createdId}...`);
  const resDel = mockResponse();
  await handler({ method: 'DELETE', query: { id: createdId } }, resDel);
  console.assert(resDel.statusCode === 200, 'Debe responder 200');
  console.assert(resDel.body.ok === true, 'Debe indicar ok: true');
  console.log(`    [PASS] Pedido ${createdId} eliminado exitosamente. Total restante: ${resDel.body.ordersCount}`);

  console.log('\n' + '='.repeat(70));
  console.log('TODAS LAS PRUEBAS UNITARIAS DE LA API PASARON EXITOSAMENTE (8/8)');
  console.log('='.repeat(70));
}

runTests().catch(err => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
