/**
 * Test Suite para el Sistema de Cotizaciones y Lógica de Datos de ALZADO ROJO
 * Ejecutable mediante: node scripts/test-quote-system.js
 */

const assert = require('assert');
const path = require('path');

console.log('========================================================');
console.log('🧪 INICIANDO TEST SUITE: ALZADO ROJO - LÓGICA DE COTIZACIÓN');
console.log('========================================================\n');

// 1. Cargar Módulos
const serviciosData = require('../data/servicios-arquitectura.js');
const quoteCalc = require('../js/quote-calculator.js');
const formalQuote = require('../js/formal-quote.js');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Detalle: ${err.message}\n`);
    }
}

// -----------------------------------------------------------------------------
// TESTS: SERVICIOS DE ARQUITECTURA TRADICIONAL (DATA)
// -----------------------------------------------------------------------------
console.log('--- 1. Pruebas de Catálogo de Arquitectura Tradicional ---');

runTest('Catálogo cuenta con los 5 servicios requeridos', () => {
    const list = serviciosData.getServiciosArquitectura();
    assert.strictEqual(list.length, 5);
    const ids = list.map(s => s.id);
    assert.ok(ids.includes('regularizacion'));
    assert.ok(ids.includes('fusion_roles'));
    assert.ok(ids.includes('subdivision_predial'));
    assert.ok(ids.includes('diseno_bim'));
    assert.ok(ids.includes('estudio_cabida'));
});

runTest('Búsqueda de servicio por ID y código', () => {
    const reg = serviciosData.getServicioPorId('regularizacion');
    assert.ok(reg);
    assert.strictEqual(reg.codigo, 'ARQ-REG');
    assert.ok(reg.marcoLegal.includes('Ley 20.898'));

    const bim = serviciosData.getServicioPorId('arq-bim');
    assert.ok(bim);
    assert.strictEqual(bim.id, 'diseno_bim');
});

runTest('Estimación paramétrica de Regularización DOM', () => {
    // Base 350.000 (hasta 30m2). Con 80 m2 (50m2 adicionales a 4.500 c/u = +225.000) -> 575.000
    const est = serviciosData.estimarServicioArquitectura('regularizacion', { m2: 80 });
    assert.strictEqual(est.success, true);
    assert.strictEqual(est.estimacionTotalCLP, 575000);
});

// -----------------------------------------------------------------------------
// TESTS: MAQUETAS DE ARQUITECTURA 3D (QUOTE-CALCULATOR)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Pruebas de Cotizador de Maquetas 3D Arquitectura ---');

runTest('Tarifa base es $90 CLP por gramo (Standard, 100g, sin descuento)', () => {
    // 100g * 90 CLP * 1.00 (standard 0.20mm) * 1.10 (pla_matte) * 1.00 (standard 20%)
    // = 100 * 90 * 1.10 = 9.900 CLP
    const quote = quoteCalc.calculateArchitecturalQuote({
        grams: 100,
        quality: 'standard',
        infill: 'standard',
        material: 'pla_matte',
        isReadyToPrint: false
    });
    assert.strictEqual(quote.baseRatePerGram, 90);
    assert.strictEqual(quote.subtotal, 9900);
    assert.strictEqual(quote.discountAmount, 0);
    assert.strictEqual(quote.total, 9900);
});

runTest('Descuento del 20% si el modelo está Ready to Print', () => {
    // 100g * 90 CLP * 1.00 (PLA standard) = 9.000 CLP. Con -20% -> 7.200 CLP
    const quote = quoteCalc.calculateArchitecturalQuote({
        grams: 100,
        quality: 'standard',
        material: 'pla_standard',
        isReadyToPrint: true
    });
    assert.strictEqual(quote.subtotal, 9000);
    assert.strictEqual(quote.discountRate, 0.20);
    assert.strictEqual(quote.discountAmount, 1800);
    assert.strictEqual(quote.total, 7200);
});

runTest('Factores de calidad de capa se aplican correctamente', () => {
    // Draft (0.28 mm) factor 0.95
    const qDraft = quoteCalc.calculateArchitecturalQuote({ grams: 100, quality: '0.28', material: 'pla_standard' });
    assert.strictEqual(qDraft.quality.factor, 0.95);
    assert.strictEqual(qDraft.subtotal, Math.round(100 * 90 * 0.95)); // 8550

    // Standard (0.20 mm) factor 1.00
    const qStd = quoteCalc.calculateArchitecturalQuote({ grams: 100, quality: '0.20', material: 'pla_standard' });
    assert.strictEqual(qStd.quality.factor, 1.00);
    assert.strictEqual(qStd.subtotal, 9000);

    // Alta Precisión (0.12 mm) factor 1.15
    const qHigh = quoteCalc.calculateArchitecturalQuote({ grams: 100, quality: '0.12', material: 'pla_standard' });
    assert.strictEqual(qHigh.quality.factor, 1.15);
    assert.strictEqual(qHigh.subtotal, Math.round(100 * 90 * 1.15)); // 10350

    // Detalle Ultra (0.08 mm) factor 1.30
    const qUltra = quoteCalc.calculateArchitecturalQuote({ grams: 100, quality: '0.08', material: 'pla_standard' });
    assert.strictEqual(qUltra.quality.factor, 1.30);
    assert.strictEqual(qUltra.subtotal, Math.round(100 * 90 * 1.30)); // 11700
});

runTest('Material Resina UV de Alto Detalle aplica factor 2.20', () => {
    const qResin = quoteCalc.calculateArchitecturalQuote({ grams: 50, quality: 'ultra', material: 'resin_uv' });
    // 50 * 90 * 1.30 * 2.20 = 12.870
    assert.strictEqual(qResin.material.factor, 2.20);
    assert.strictEqual(qResin.subtotal, 12870);
});

// -----------------------------------------------------------------------------
// TESTS: MAQUETAS URBANAS TOPOGRÁFICAS 3D (QUOTE-CALCULATOR)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Pruebas de Maquetas Urbanas Topográficas 3D ---');

runTest('Precios de referencia oficiales por tamaño', () => {
    const q10 = quoteCalc.calculateUrbanQuote({ size: '10x10' });
    assert.strictEqual(q10.total, 9990);

    const q15 = quoteCalc.calculateUrbanQuote({ size: '15x15' });
    assert.strictEqual(q15.total, 19990);

    const q20 = quoteCalc.calculateUrbanQuote({ size: '20x20' });
    assert.strictEqual(q20.total, 25990);

    const q25 = quoteCalc.calculateUrbanQuote({ size: '25x25' });
    assert.strictEqual(q25.total, 29990);
    assert.strictEqual(q25.size.isBestValue, true);
});

runTest('Marco negro opcional suma $2.500 CLP por unidad', () => {
    const qWithout = quoteCalc.calculateUrbanQuote({ size: '20x20', withFrame: false });
    const qWith = quoteCalc.calculateUrbanQuote({ size: '20x20', withFrame: true });
    assert.strictEqual(qWith.total - qWithout.total, 2500);
    assert.strictEqual(qWith.unitPrice, 28490);
});

runTest('Descuento por volumen en maquetas urbanas', () => {
    // 4 unidades de 15x15 ($19.990 c/u) = $79.960. Tier 3-5 unidades: 10% dscto -> $7.996 dscto -> Total $71.964
    const qVol = quoteCalc.calculateUrbanQuote({ size: '15x15', quantity: 4 });
    assert.strictEqual(qVol.volumeDiscountPercent, 10);
    assert.strictEqual(qVol.volumeDiscountAmount, 7996);
    assert.strictEqual(qVol.total, 71964);
});

runTest('Personalización de ciudad (Santiago, Concepción, París, Personalizada)', () => {
    const qConce = quoteCalc.calculateUrbanQuote({ size: '25x25', city: 'concepcion' });
    assert.strictEqual(qConce.city.name, 'Concepción');

    const qCustom = quoteCalc.calculateUrbanQuote({ size: '20x20', city: 'custom', customCityName: 'Valdivia (Río Calle-Calle)' });
    assert.strictEqual(qCustom.city.name, 'Valdivia (Río Calle-Calle)');
});

// -----------------------------------------------------------------------------
// TESTS: COTIZACIÓN FORMAL, FOLIOS, WHATSAPP Y PERSISTENCIA (FORMAL-QUOTE)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Pruebas de Cotización Formal y WhatsApp ---');

runTest('Generación de folio único con formato AR-2026-XXXX', () => {
    const folio1 = formalQuote.generateQuoteFolio();
    const folio2 = formalQuote.generateQuoteFolio();
    assert.match(folio1, /^AR-2026-[2-9A-Z]{4}$/);
    assert.match(folio2, /^AR-2026-[2-9A-Z]{4}$/);
    assert.notStrictEqual(folio1, folio2);
});

runTest('Validación de datos de cliente', () => {
    const valBad = formalQuote.validateClient({ name: '' });
    assert.strictEqual(valBad.isValid, false);

    const valGood = formalQuote.validateClient({
        name: 'Adolfo Risopatrón',
        email: 'adolfo@alzado-rojo.cl',
        phone: '+56993188597',
        rut: '12.345.678-9'
    });
    assert.strictEqual(valGood.isValid, true);
    assert.strictEqual(valGood.sanitized.name, 'Adolfo Risopatrón');
});

runTest('Objeto de Cotización Formal y Resumen Financiero con IVA opcional', () => {
    const archItem = formalQuote.createArchitecturalItem({
        grams: 150,
        quality: 'standard',
        material: 'pla_matte',
        isReadyToPrint: true
    });

    const urbanItem = formalQuote.createUrbanItem({
        size: '25x25',
        withFrame: true,
        city: 'santiago',
        quantity: 1
    });

    // Sin IVA
    const quoteNoIVA = formalQuote.createFormalQuote(
        { name: 'Estudio de Arquitectura AR', email: 'contacto@estudio.cl' },
        [archItem, urbanItem],
        { includeIVA: false }
    );

    assert.match(quoteNoIVA.folio, /^AR-2026-/);
    assert.strictEqual(quoteNoIVA.items.length, 2);
    assert.strictEqual(quoteNoIVA.validityDays, 15);
    assert.strictEqual(quoteNoIVA.financials.includeIVA, false);
    assert.strictEqual(quoteNoIVA.financials.ivaAmount, 0);

    // Con IVA 19%
    const quoteWithIVA = formalQuote.createFormalQuote(
        { name: 'Estudio de Arquitectura AR' },
        [archItem, urbanItem],
        { includeIVA: true }
    );
    assert.strictEqual(quoteWithIVA.financials.includeIVA, true);
    const expectedIVA = Math.round(quoteWithIVA.financials.netoAjustado * 0.19);
    assert.strictEqual(quoteWithIVA.financials.ivaAmount, expectedIVA);
    assert.strictEqual(quoteWithIVA.financials.total, quoteWithIVA.financials.netoAjustado + expectedIVA);
});

runTest('Generación de Enlace y Mensaje estructurado de WhatsApp (+56993188597)', () => {
    const item = formalQuote.createUrbanItem({ size: '20x20', city: 'santiago', withFrame: true });
    const quote = formalQuote.createFormalQuote({ name: 'Cliente Test', phone: '+56911223344' }, [item]);

    const msg = formalQuote.generateWhatsAppMessageText(quote);
    assert.ok(msg.includes('ALZADO ROJO | COTIZACIÓN FORMAL'));
    assert.ok(msg.includes(quote.folio));
    assert.ok(msg.includes('50% anticipo'));
    assert.ok(msg.includes('3 a 7 días hábiles'));
    assert.ok(msg.includes('Cobertura a todo Chile'));

    const waUrl = formalQuote.generateWhatsAppQuoteUrl(quote);
    assert.ok(waUrl.startsWith('https://wa.me/56993188597?text='));
    assert.ok(waUrl.includes(encodeURIComponent(quote.folio)));
    assert.ok(waUrl.includes(encodeURIComponent('Cliente Test')));
});

runTest('Manejo seguro de localStorage cuando window no está presente', () => {
    assert.strictEqual(formalQuote.isStorageAvailable(), false);
    assert.strictEqual(formalQuote.saveQuoteToStorage({ folio: 'AR-TEST' }), false);
    assert.strictEqual(formalQuote.loadQuoteFromStorage(), null);
    // getActiveQuote debe retornar un borrador válido
    const fresh = formalQuote.getActiveQuote();
    assert.ok(fresh.folio);
    assert.strictEqual(fresh.items.length, 0);
});

console.log('========================================================');
console.log(`📊 RESULTADOS: ${passedTests} de ${totalTests} pruebas superadas.`);
console.log('========================================================\n');

if (passedTests !== totalTests) {
    process.exit(1);
} else {
    process.exit(0);
}
