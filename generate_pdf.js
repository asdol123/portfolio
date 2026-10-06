/**
 * ALZADO ROJO — Generador Automatizado de Dossier Monográfico PDF (A4 Landscape)
 * Utiliza Chrome Headless a través de Chrome DevTools Protocol (CDP) nativo en Node.js 24+
 * 
 * Garantiza:
 * 1. Carga íntegra de tipografías web (Montserrat) vía document.fonts.ready
 * 2. Carga y decodificación completa de todas las imágenes de alta resolución
 * 3. Renderizado exacto con printBackground: true y preferCSSPageSize: true (297x210 mm)
 * 4. Generación de tagged PDF y esquema de documento para navegación profesional
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8889;
const OUTPUT_FILE = path.join(__dirname, 'Adolfo_Risopatron_Portafolio_Arquitectura.pdf');
const POSTULACION_FILE = path.join(__dirname, 'Adolfo_Risopatron_Portafolio_Arquitectura_Postulacion.pdf');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/portfolio-pdf.html';
  const filePath = path.join(__dirname, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Archivo no encontrado');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

async function findChromeExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No se encontró ejecutable de Google Chrome o Microsoft Edge.');
}

async function generatePDF() {
  console.log('===> Iniciando servidor local HTTP en puerto', PORT);
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));

  const chromePath = await findChromeExecutable();
  console.log('===> Navegador detectado:', chromePath);

  const cdpPort = 9334;
  const tempProfileDir = path.join(__dirname, '.temp_chrome_print_profile');

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-first-run',
    '--safebrowsing-disable-auto-update',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tempProfileDir}`
  ]);

  chromeProc.stderr.on('data', data => {
    const str = data.toString().trim();
    if (str) console.error('[Chrome STDERR]', str);
  });
  chromeProc.stdout.on('data', data => {
    const str = data.toString().trim();
    if (str) console.log('[Chrome STDOUT]', str);
  });

  const targetUrl = `http://127.0.0.1:${PORT}/portfolio-pdf.html`;

  let ws = null;
  try {
    let wsUrl = null;
    console.log('===> Conectando con CDP...');
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(targetUrl)}`, { method: 'PUT' });
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        if (wsUrl) break;
      } catch (e) {}
    }

    if (!wsUrl) {
      throw new Error('No se pudo establecer conexión WebSocket con Chrome DevTools Protocol.');
    }

    ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let idCounter = 1;
    const callbacks = new Map();
    let loadResolve;
    const loadPromise = new Promise(r => { loadResolve = r; });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Page.loadEventFired') {
        if (loadResolve) loadResolve();
      }
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) cb.reject(msg.error);
        else cb.resolve(msg.result);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS Error]', err);
      for (const [id, cb] of callbacks.entries()) {
        cb.reject(new Error(`WebSocket error: ${err.message || err}`));
      }
      callbacks.clear();
    };

    ws.onclose = (event) => {
      console.warn(`[WS Closed] code=${event.code}, reason=${event.reason}`);
      for (const [id, cb] of callbacks.entries()) {
        cb.reject(new Error(`WebSocket closed unexpectedly (code: ${event.code})`));
      }
      callbacks.clear();
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('===> Esperando carga completa de página y recursos...');
    await send('Page.navigate', { url: targetUrl });
    await loadPromise;

    console.log('===> Sincronizando tipografías web (Montserrat) y assets fotográficos...');
    const readyStats = await send('Runtime.evaluate', {
      expression: `(async () => {
        await document.fonts.ready;
        const imgs = Array.from(document.images);
        await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })));
        return {
          pages: document.querySelectorAll('.page').length,
          fontsLoaded: Array.from(document.fonts).filter(f => f.status === 'loaded').length
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('===> Estadísticas previas al render:', readyStats.result.value);

    // Margen de estabilización para el pipeline de composición
    await new Promise(r => setTimeout(r, 800));

    console.log('===> Exportando PDF físico (A4 apaisado con fondos gráficos)...');
    const pdfResult = await send('Page.printToPDF', {
      printBackground: true,
      preferCSSPageSize: true,
      generateDocumentOutline: true,
      generateTaggedPDF: true,
      transferMode: 'ReturnAsStream'
    });

    const streamHandle = pdfResult.stream;
    if (!streamHandle) {
      throw new Error('Chrome no devolvió un stream para el PDF.');
    }

    console.log('===> Transfiriendo stream binario del PDF...');
    const fileStream = fs.createWriteStream(OUTPUT_FILE);
    let totalBytes = 0;
    let eof = false;

    while (!eof) {
      const chunk = await send('IO.read', { handle: streamHandle });
      if (chunk.data) {
        const buf = chunk.base64Encoded
          ? Buffer.from(chunk.data, 'base64')
          : Buffer.from(chunk.data, 'binary');
        fileStream.write(buf);
        totalBytes += buf.length;
      }
      eof = chunk.eof;
    }

    await new Promise((resolve, reject) => {
      fileStream.end(err => err ? reject(err) : resolve());
    });

    await send('IO.close', { handle: streamHandle });

    const fileSizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
    console.log(`===> ¡PDF maestro generado exitosamente en: ${OUTPUT_FILE}`);
    console.log(`===> Peso exacto: ${fileSizeMB} MB (${totalBytes} bytes)`);

    let postRes = null;
    try {
      postRes = await optimizeForPostulacion(OUTPUT_FILE, POSTULACION_FILE);
    } catch (optErr) {
      console.warn('===> [PyMuPDF] No se pudo generar la versión postulación automáticamente:', optErr.message);
    }

    return {
      master: { path: OUTPUT_FILE, sizeMB: fileSizeMB, sizeBytes: totalBytes },
      postulacion: postRes
    };
  } finally {
    try { if (ws && ws.readyState === WebSocket.OPEN) ws.close(); } catch (e) {}
    try { chromeProc.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
    try { fs.rmSync(tempProfileDir, { recursive: true, force: true }); } catch (e) {}
  }
}

/**
 * Optimiza un PDF maestro para postulaciones web y envío por correo (< 10-15 MB)
 * utilizando el pipeline verificado con PyMuPDF (150 DPI, quality=85, deflate).
 */
function optimizeForPostulacion(inputPdf = OUTPUT_FILE, outputPdf = POSTULACION_FILE) {
  console.log('===> Optimizando versión para formularios y postulaciones (< 10-15 MB)...');
  const pythonScript = `import pymupdf
doc = pymupdf.open(r"""${inputPdf}""")
doc.rewrite_images(dpi_threshold=160, dpi_target=150, quality=85)
doc.save(r"""${outputPdf}""", garbage=4, deflate=True)
doc.close()
`;
  return new Promise((resolve, reject) => {
    const py = spawn('python', ['-c', pythonScript]);
    let stderr = '';
    py.stderr.on('data', d => { stderr += d.toString(); });
    py.on('close', code => {
      if (fs.existsSync(outputPdf)) {
        const stats = fs.statSync(outputPdf);
        const mb = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`===> ¡PDF Postulación generado exitosamente en: ${outputPdf}`);
        console.log(`===> Peso postulación: ${mb} MB (${stats.size} bytes)`);
        resolve({ path: outputPdf, sizeMB: mb, sizeBytes: stats.size });
      } else {
        reject(new Error(`PyMuPDF falló (código ${code}): ${stderr}`));
      }
    });
    py.on('error', err => reject(err));
  });
}

if (require.main === module) {
  if (process.argv.includes('--optimize-only')) {
    optimizeForPostulacion()
      .then(() => process.exit(0))
      .catch(err => {
        console.error('Error optimizando PDF:', err);
        process.exit(1);
      });
  } else {
    generatePDF()
      .then(() => process.exit(0))
      .catch(err => {
        console.error('Error generando PDF:', err);
        process.exit(1);
      });
  }
}

module.exports = { generatePDF, optimizeForPostulacion, OUTPUT_FILE, POSTULACION_FILE };
