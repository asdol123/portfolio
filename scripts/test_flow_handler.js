const handler = require('../api/flow-create.js');

function mockReqRes(body) {
  const req = {
    method: 'POST',
    body,
    headers: {
      host: 'ar-arq.cl',
      'x-forwarded-proto': 'https'
    }
  };

  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, val) {
      this.headers[name] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
    end() {
      return this;
    }
  };

  return { req, res };
}

async function runTests() {
  console.log('--- TEST 1: Caso exitoso con email válido y credenciales verificadas ---');
  const t1 = mockReqRes({
    orderId: 'AR-TEST-OK',
    subject: 'Maqueta Test Unitario',
    amount: 19990,
    payer_email: 'ar.taller.arquitectura@gmail.com',
    payer_name: 'Adolfo Risopatron'
  });
  await handler(t1.req, t1.res);
  console.log('Status:', t1.res.statusCode);
  console.log('Respuesta:', t1.res.data);

  console.log('\n--- TEST 2: Caso de error de validación de email por Flow ---');
  const t2 = mockReqRes({
    orderId: 'AR-TEST-BAD-EMAIL',
    subject: 'Maqueta Test Invalido',
    amount: 19990,
    payer_email: 'correo_invalido@dominio-inexistente-12345.com',
    payer_name: 'Cliente Test'
  });
  await handler(t2.req, t2.res);
  console.log('Status:', t2.res.statusCode);
  console.log('Respuesta:', t2.res.data);
}

runTests();
