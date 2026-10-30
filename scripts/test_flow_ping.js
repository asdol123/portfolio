const crypto = require('crypto');

function signFlowParams(params, secretKey) {
  const keys = Object.keys(params).sort();
  let toSign = '';
  for (const k of keys) {
    toSign += k + params[k];
  }
  return crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
}

async function testFlow(endpoint, apiKey, secretKey, label) {
  console.log(`\n--- Probando ${label} ---`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`ApiKey: ${apiKey}`);
  console.log(`SecretKey: ${secretKey}`);

  const orderId = `TEST-${Date.now()}`;
  const params = {
    apiKey: apiKey,
    commerceOrder: orderId,
    subject: 'Prueba diagnostico Flow AR',
    currency: 'CLP',
    amount: 5000,
    email: 'ar.taller.arquitectura@gmail.com',
    paymentMethod: 9,
    urlConfirmation: 'https://ar-arq.cl/api/flow-confirm',
    urlReturn: `https://ar-arq.cl/api/flow-return?order=${orderId}`
  };

  const s = signFlowParams(params, secretKey);
  const payload = { ...params, s };
  const body = new URLSearchParams(payload).toString();

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body
    });

    const status = res.status;
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      json = null;
    }

    console.log(`HTTP Status: ${status}`);
    console.log('Respuesta:', json || text);
    return { status, data: json || text };
  } catch (err) {
    console.error('Error de peticion:', err.message);
    return { error: err.message };
  }
}

async function main() {
  const apiKey = '6ABF2DFB-E963-4181-9B2E-658930LFA874';
  const secretKey1 = 'e91d2e117100d39df37628fc7fa862f7fc3518d3'; // con 00 comprobado

  await testFlow('https://www.flow.cl/api/payment/create', apiKey, secretKey1, 'PRODUCCION (credencial confirmada)');
}

main();
