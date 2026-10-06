/**
 * COMPILADOR AUTOMÁTICO DE PORTAFOLIO PDF (A4 APAISADO / LANDSCAPE)
 * Portafolio de Arquitectura: Adolfo Risopatrón Inzunza (Alzado Rojo)
 * 
 * Este script localiza Google Chrome o Microsoft Edge en el sistema,
 * invoca el motor headless con renderizado completo de gráficos y fondos,
 * y compila 'portfolio-pdf.html' en 'Adolfo_Risopatron_Portafolio_Arquitectura.pdf'.
 * 
 * Requisitos:
 * - Formato A4 apaisado (297mm x 210mm) controlado por @page en CSS.
 * - Impresión de fondos (--print-background activo por defecto en headless print-to-pdf).
 * - Control de peso final (Rango ideal: 5 MB - 25 MB).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_INPUT_HTML = path.join(PROJECT_ROOT, 'portfolio-pdf.html');
const DEFAULT_OUTPUT_PDF = path.join(PROJECT_ROOT, 'Adolfo_Risopatron_Portafolio_Arquitectura.pdf');

// Rutas habituales de navegadores en Windows
function findBrowserExecutable() {
    const candidatePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe')
    ];

    for (const p of candidatePaths) {
        if (p && fs.existsSync(p)) {
            return p;
        }
    }

    // Intento con comando 'where'
    for (const cmd of ['chrome.exe', 'msedge.exe']) {
        const res = spawnSync('where', [cmd], { encoding: 'utf8' });
        if (res.status === 0 && res.stdout) {
            const firstLine = res.stdout.split(/\r?\n/)[0].trim();
            if (firstLine && fs.existsSync(firstLine)) {
                return firstLine;
            }
        }
    }

    return null;
}

/**
 * Compila un archivo HTML a PDF usando Chrome/Edge Headless
 */
function compileHtmlToPdf(options = {}) {
    const inputHtml = options.inputHtml || DEFAULT_INPUT_HTML;
    const outputPdf = options.outputPdf || DEFAULT_OUTPUT_PDF;
    const browserPath = options.browserPath || findBrowserExecutable();

    console.log('='.repeat(65));
    console.log('🚀 COMPILADOR AUTOMÁTICO DE PORTAFOLIO PDF');
    console.log('   Alzado Rojo — Adolfo Risopatrón Inzunza');
    console.log('='.repeat(65));

    if (!browserPath) {
        console.error('❌ Error: No se encontró Google Chrome ni Microsoft Edge en las rutas estándar.');
        console.error('   Por favor instale Chrome o especifique la ruta del ejecutable.');
        return { success: false, error: 'Browser not found' };
    }

    console.log(`🔍 Motor de renderizado: ${browserPath}`);

    if (!fs.existsSync(inputHtml)) {
        console.error(`❌ Error: El archivo HTML de entrada no existe:`);
        console.error(`   ${inputHtml}`);
        console.error(`   Asegúrese de que el especialista frontend haya creado 'portfolio-pdf.html'.`);
        return { success: false, error: 'Input HTML not found' };
    }

    console.log(`📄 Archivo origen:  ${inputHtml}`);
    console.log(`🎯 Archivo destino: ${outputPdf}`);

    // Formatear ruta local a URL de archivo para Chrome
    const fileUrl = 'file:///' + inputHtml.replace(/\\/g, '/');

    // Argumentos de Chromium para máxima fidelidad y dimensiones A4 apaisadas
    const chromeArgs = [
        '--headless',
        '--disable-gpu',
        '--no-pdf-header-footer',
        '--run-all-compositor-stages-before-draw',
        '--virtual-time-budget=12000', // Tiempo para cargar webfonts y recursos pesados
        '--allow-file-access-from-files',
        `--print-to-pdf=${outputPdf}`,
        fileUrl
    ];

    console.log('⏳ Renderizando y compilando documento A4 landscape...');
    const startTime = Date.now();

    const result = spawnSync(browserPath, chromeArgs, {
        stdio: 'inherit',
        timeout: 60000 // 60 segundos timeout
    });

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!fs.existsSync(outputPdf)) {
        console.error(`❌ Error durante la compilación. El archivo PDF no fue generado.`);
        return { success: false, error: 'PDF generation failed' };
    }

    const stats = fs.statSync(outputPdf);
    const sizeInBytes = stats.size;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

    console.log('\n' + '-'.repeat(65));
    console.log(`✅ ¡PDF generado con éxito en ${elapsedSec}s!`);
    console.log(`📁 Ubicación: ${outputPdf}`);
    console.log(`⚖️ Peso del archivo: ${sizeInMB} MB (${sizeInBytes.toLocaleString()} bytes)`);

    // Validación de peso según requerimientos para postulaciones laborales/académicas
    if (sizeInBytes < 2 * 1024 * 1024) {
        console.log('ℹ️ Nota de peso: El archivo es ligero (< 2 MB). Verifique que todas las imágenes hayan cargado correctamente.');
    } else if (sizeInBytes <= 25 * 1024 * 1024) {
        console.log('🎯 Rango óptimo: Cumple con el estándar internacional de postulación (5 MB - 25 MB).');
    } else {
        console.warn(`⚠️ Advertencia de peso: El PDF supera los 25 MB (${sizeInMB} MB).`);
        console.warn('   Muchos formularios de postulación tienen un límite estricto de 20-25 MB.');
        console.warn('   Sugerencia: Considere optimizar las imágenes de mayor resolución.');
    }
    console.log('-'.repeat(65));

    return {
        success: true,
        outputPdf,
        sizeInBytes,
        sizeInMB,
        elapsedSec
    };
}

// Ejecución directa desde CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const customInput = args[0] ? path.resolve(args[0]) : undefined;
    const customOutput = args[1] ? path.resolve(args[1]) : undefined;

    const res = compileHtmlToPdf({
        inputHtml: customInput,
        outputPdf: customOutput
    });

    process.exit(res.success ? 0 : 1);
}

module.exports = {
    compileHtmlToPdf,
    findBrowserExecutable,
    DEFAULT_INPUT_HTML,
    DEFAULT_OUTPUT_PDF
};
