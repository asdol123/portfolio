/**
 * ALZADO ROJO | Arquitectura & Fabricación Digital
 * Módulo de Cotización Formal, Folios, Condiciones Comerciales y WhatsApp
 * 
 * Responsabilidades:
 *  - Generación de Folios Únicos (AR-2026-XXXX)
 *  - Estructuración de Objetos de Cotización Formal (Partidas, Descuentos, IVA 19% opcional)
 *  - Condiciones comerciales oficiales (50% anticipo, 3 a 7 días hábiles, despachos a todo Chile, revisión STL/OBJ)
 *  - Generador de Enlace y Mensaje estructurado de WhatsApp a +56993188597
 *  - Persistencia segura en localStorage ('ar_portfolio_quote_v1') para cotización activa y carrito
 * 
 * Compatible con: Navegador (window.AlzadoFormalQuote) y Node.js (CommonJS / ES Modules).
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./quote-calculator.js'], factory);
    } else if (typeof module === 'object' && module.exports) {
        let calculator = null;
        try {
            calculator = require('./quote-calculator.js');
        } catch (e) {
            // Fallback si no está disponible en la ruta
        }
        module.exports = factory(calculator);
    } else {
        const rootCalc = root.AlzadoQuote || null;
        root.AlzadoFormalQuote = factory(rootCalc);
    }
}(typeof self !== 'undefined' ? self : this, function (calculatorModule) {

    'use strict';

    // =========================================================================
    // 1. CONSTANTES DEL SISTEMA FORMAL DE COTIZACIONES
    // =========================================================================

    /** Clave oficial de almacenamiento local */
    const STORAGE_KEY = 'ar_portfolio_quote_v1';

    /** Teléfono oficial de contacto y WhatsApp Alzado Rojo */
    const OFFICIAL_PHONE_DISPLAY = '+56 9 9318 8597';
    const OFFICIAL_WHATSAPP_NUMBER = '56993188597'; // Formato internacional sin '+'
    const OFFICIAL_EMAIL = 'contacto@alzado-rojo.cl';
    const OFFICIAL_WEBSITE = 'https://alzado-rojo.cl';

    /** Tasa de IVA oficial en Chile */
    const IVA_RATE = 0.19;

    /** Validez estándar de las cotizaciones en días corridos */
    const DEFAULT_VALIDITY_DAYS = 15;

    /**
     * Condiciones comerciales oficiales de Alzado Rojo.
     */
    const OFFICIAL_COMMERCIAL_TERMS = {
        payment: {
            title: 'Modalidad de Pago',
            detail: '50% de anticipo al confirmar la orden para inicio de producción o tramitación, y 50% saldo contra entrega conforme o previo al despacho.',
            short: '50% anticipo / 50% contra entrega'
        },
        leadTime: {
            title: 'Plazos de Entrega',
            detail: '3 a 7 días hábiles para piezas de manufactura 3D estándar. Proyectos de gran escala, cuadrantes urbanos o tramitaciones arquitectónicas según cronograma acordado.',
            short: '3 a 7 días hábiles de producción'
        },
        shipping: {
            title: 'Despachos y Entregas',
            detail: 'Despachos a todo Chile mediante Starken, Chilexpress o Correos de Chile (costo de flete por pagar o coordinado previamente). Retiro presencial disponible en taller sin costo.',
            short: 'Despachos a todo Chile y retiro en taller'
        },
        technicalReview: {
            title: 'Revisión Técnica de Archivos',
            detail: 'Toda manufactura 3D queda condicionada a la validación geométrica previa de los archivos STL/OBJ (estanqueidad manifold, espesores mínimos de pared y viabilidad de soportes).',
            short: 'Sujeto a validación técnica de mallas STL/OBJ'
        },
        validity: {
            title: 'Validez de la Propuesta',
            detail: `Esta cotización mantiene sus valores vigentes durante ${DEFAULT_VALIDITY_DAYS} días corridos desde su emisión.`,
            days: DEFAULT_VALIDITY_DAYS
        }
    };

    // =========================================================================
    // 2. GENERADOR DE FOLIOS ÚNICOS
    // =========================================================================

    /**
     * Genera un identificador de folio formal con formato AR-2026-XXXX.
     * Utiliza caracteres alfanuméricos legibles en mayúsculas.
     * 
     * @param {string} [prefix='AR-2026'] Prefijo del folio
     * @returns {string} Folio único generado (ej: AR-2026-8942, AR-2026-K482)
     */
    function generateQuoteFolio(prefix = 'AR-2026') {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluye 0, 1, O, I para evitar ambigüedades
        let code = '';
        for (let i = 0; i < 4; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            code += chars.charAt(randomIndex);
        }
        return `${prefix}-${code}`;
    }

    // =========================================================================
    // 3. FORMATEO DE MONEDA Y FECHAS
    // =========================================================================

    function formatCLP(amount) {
        if (calculatorModule && typeof calculatorModule.formatCLP === 'function') {
            return calculatorModule.formatCLP(amount);
        }
        const num = Math.round(Number(amount) || 0);
        return `$${num.toLocaleString('es-CL')} CLP`;
    }

    function formatDateDisplay(dateInput) {
        const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // =========================================================================
    // 4. VALIDACIÓN DE ENTRADAS
    // =========================================================================

    function sanitizeText(text) {
        if (!text) return '';
        return String(text).replace(/[<>]/g, '').trim();
    }

    function validateClient(clientData = {}) {
        const errors = [];
        const name = sanitizeText(clientData.name || clientData.nombre);
        const email = sanitizeText(clientData.email || clientData.correo);
        const phone = sanitizeText(clientData.phone || clientData.telefono || clientData.whatsapp);
        const rut = sanitizeText(clientData.rut);
        const company = sanitizeText(clientData.company || clientData.empresa);
        const address = sanitizeText(clientData.address || clientData.direccion);
        const city = sanitizeText(clientData.city || clientData.ciudad);

        if (!name || name.length < 2) {
            errors.push('El nombre del cliente debe tener al menos 2 caracteres.');
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push('El formato de correo electrónico no es válido.');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            sanitized: {
                name: name || 'Cliente Particular',
                email: email || '',
                phone: phone || '',
                rut: rut || '',
                company: company || '',
                address: address || '',
                city: city || ''
            }
        };
    }

    // =========================================================================
    // 5. CONSTRUCCIÓN DE PARTIDAS (ITEMS)
    // =========================================================================

    /**
     * Crea una partida de cotización para Maqueta de Arquitectura 3D.
     */
    function createArchitecturalItem(params = {}) {
        let calc = null;
        if (params.total !== undefined && params.subtotal !== undefined && params.quality) {
            calc = params; // Ya es un resultado de cálculo
        } else if (calculatorModule && typeof calculatorModule.calculateArchitecturalQuote === 'function') {
            calc = calculatorModule.calculateArchitecturalQuote(params);
        } else {
            // Fallback directo de cálculo si no está el módulo vinculado
            const grams = parseFloat(params.grams) || 0;
            const sub = Math.round(grams * 90);
            const disc = params.isReadyToPrint ? Math.round(sub * 0.20) : 0;
            calc = {
                grams,
                subtotal: sub,
                discountAmount: disc,
                total: sub - disc,
                isReadyToPrint: Boolean(params.isReadyToPrint),
                quality: { label: params.quality || 'Standard (0.20 mm)' },
                material: { label: params.material || 'PLA Arquitectónico Mate' },
                infill: { label: params.infill || 'Standard (20%)' }
            };
        }

        const quantity = Math.max(1, parseInt(params.quantity, 10) || 1);
        const unitPrice = calc.total;
        const subtotal = unitPrice * quantity;

        return {
            id: `item_arch_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'architectural_3d',
            category: 'Manufactura 3D',
            title: `Maqueta de Arquitectura (${calc.material ? calc.material.label : 'PLA'})`,
            description: `Peso estimado: ${calc.grams}g | Capa: ${calc.quality ? calc.quality.label : '0.20 mm'} | Relleno: ${calc.infill ? calc.infill.label : '20%'} ${calc.isReadyToPrint ? '• Ready to Print (-20%)' : ''}`,
            metadata: {
                grams: calc.grams,
                isReadyToPrint: calc.isReadyToPrint,
                quality: calc.quality,
                infill: calc.infill,
                material: calc.material,
                discountAmountUnit: calc.discountAmount
            },
            unitPrice,
            quantity,
            discountAmount: (calc.discountAmount || 0) * quantity,
            subtotal,
            formatted: {
                unitPrice: formatCLP(unitPrice),
                subtotal: formatCLP(subtotal)
            }
        };
    }

    /**
     * Crea una partida de cotización para Maqueta Urbana Topográfica.
     */
    function createUrbanItem(params = {}) {
        let calc = null;
        if (params.total !== undefined && params.size && params.city) {
            calc = params;
        } else if (calculatorModule && typeof calculatorModule.calculateUrbanQuote === 'function') {
            calc = calculatorModule.calculateUrbanQuote(params);
        } else {
            calc = {
                size: { label: params.size || '25x25 cm' },
                city: { name: params.city || 'Santiago' },
                withFrame: Boolean(params.withFrame),
                unitPrice: 29990 + (params.withFrame ? 2500 : 0),
                rawSubtotal: 29990,
                volumeDiscountAmount: 0,
                total: 29990,
                quantity: params.quantity || 1
            };
        }

        const quantity = calc.quantity || Math.max(1, parseInt(params.quantity, 10) || 1);
        const withFrameText = calc.withFrame ? 'con marco negro perimetral' : 'sin marco';

        return {
            id: `item_urb_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'urban_3d',
            category: 'Maquetas Territoriales',
            title: `Maqueta Urbana Topográfica ${calc.city ? calc.city.name : 'Personalizada'} (${calc.size ? calc.size.label : ''})`,
            description: `Formato ${calc.size ? calc.size.label : ''} | Ciudad: ${calc.city ? calc.city.name : ''} | Terminación: ${withFrameText}`,
            metadata: {
                size: calc.size,
                city: calc.city,
                withFrame: calc.withFrame,
                volumeDiscountPercent: calc.volumeDiscountPercent || 0
            },
            unitPrice: calc.unitPrice || 0,
            quantity,
            discountAmount: calc.volumeDiscountAmount || 0,
            subtotal: calc.total,
            formatted: {
                unitPrice: formatCLP(calc.unitPrice || 0),
                subtotal: formatCLP(calc.total)
            }
        };
    }

    /**
     * Crea una partida para Servicios de Arquitectura Tradicional.
     */
    function createTraditionalItem(params = {}) {
        let calc = null;
        if (params.estimacionTotalCLP !== undefined && params.titulo) {
            calc = params;
        } else if (calculatorModule && typeof calculatorModule.estimateTraditionalQuote === 'function') {
            calc = calculatorModule.estimateTraditionalQuote(params.serviceId || params.id, params);
        } else {
            calc = {
                titulo: params.title || 'Servicio de Arquitectura',
                subtitulo: params.subtitle || 'Asesoría Técnica',
                estimacionTotalCLP: params.price || 350000,
                tiempoEstimadoSemanas: '4 a 8 semanas',
                marcoLegal: 'LGUC / OGUC'
            };
        }

        const total = calc.estimacionTotalCLP || 0;

        return {
            id: `item_trad_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'traditional_arch',
            category: 'Arquitectura & Normativa',
            title: calc.titulo || 'Servicio de Arquitectura Tradicional',
            description: `${calc.subtitulo || ''} | Plazo estimado: ${calc.tiempoEstimadoSemanas || 'A convenir'} | Marco: ${calc.marcoLegal || 'LGUC/OGUC'}`,
            metadata: {
                servicioId: calc.servicioId,
                codigo: calc.codigo,
                marcoLegal: calc.marcoLegal,
                tiempoEstimadoSemanas: calc.tiempoEstimadoSemanas,
                parametros: calc.parametros
            },
            unitPrice: total,
            quantity: 1,
            discountAmount: 0,
            subtotal: total,
            formatted: {
                unitPrice: formatCLP(total),
                subtotal: formatCLP(total)
            }
        };
    }

    /**
     * Crea una partida genérica personalizada.
     */
    function createCustomItem(params = {}) {
        const title = sanitizeText(params.title || params.titulo || 'Partida Personalizada');
        const description = sanitizeText(params.description || params.descripcion || '');
        const unitPrice = Math.max(0, parseFloat(params.unitPrice || params.precioUnitario) || 0);
        const quantity = Math.max(1, parseInt(params.quantity || params.cantidad, 10) || 1);
        const discountAmount = Math.max(0, parseFloat(params.discountAmount || params.descuento) || 0);
        const rawSubtotal = unitPrice * quantity;
        const subtotal = Math.max(0, rawSubtotal - discountAmount);

        return {
            id: `item_custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'custom',
            category: 'Personalizado',
            title,
            description,
            metadata: params.metadata || {},
            unitPrice,
            quantity,
            discountAmount,
            subtotal,
            formatted: {
                unitPrice: formatCLP(unitPrice),
                subtotal: formatCLP(subtotal)
            }
        };
    }

    // =========================================================================
    // 6. GENERACIÓN DEL OBJETO DE COTIZACIÓN FORMAL
    // =========================================================================

    /**
     * Construye un objeto de cotización formal completo, auditado y estructurado.
     * 
     * @param {Object} clientData Datos del cliente (name, email, phone, rut, etc.)
     * @param {Array<Object>} items Lista de partidas de la cotización
     * @param {Object} [options={}] Opciones financieras y comerciales
     * @param {boolean} [options.includeIVA=false] Si se incluye IVA del 19%
     * @param {string} [options.customFolio] Folio predefinido opcional
     * @param {number} [options.validityDays=15] Días de vigencia
     * @param {string} [options.notes=''] Notas adicionales o especificaciones especiales
     * @returns {Object} Cotización formal lista para emitir o persistir
     */
    function createFormalQuote(clientData = {}, items = [], options = {}) {
        const clientValidation = validateClient(clientData);
        const client = clientValidation.sanitized;

        const folio = (options.customFolio || generateQuoteFolio()).trim().toUpperCase();
        const createdAt = new Date();
        const validityDays = parseInt(options.validityDays, 10) || DEFAULT_VALIDITY_DAYS;
        const validUntil = new Date(createdAt.getTime() + (validityDays * 24 * 60 * 60 * 1000));

        // Normalizar items
        const normalizedItems = (Array.isArray(items) ? items : []).map(item => {
            if (!item.id) item.id = `item_${Date.now()}_${Math.random()}`;
            if (typeof item.unitPrice !== 'number') item.unitPrice = parseFloat(item.unitPrice) || 0;
            if (typeof item.quantity !== 'number') item.quantity = parseInt(item.quantity, 10) || 1;
            if (typeof item.discountAmount !== 'number') item.discountAmount = parseFloat(item.discountAmount) || 0;
            if (typeof item.subtotal !== 'number') {
                item.subtotal = Math.max(0, (item.unitPrice * item.quantity) - item.discountAmount);
            }
            if (!item.formatted) {
                item.formatted = {
                    unitPrice: formatCLP(item.unitPrice),
                    subtotal: formatCLP(item.subtotal)
                };
            }
            return item;
        });

        // Totales financieros
        const subtotalNeto = normalizedItems.reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
        const totalDiscounts = normalizedItems.reduce((acc, curr) => acc + (curr.discountAmount || 0), 0);
        const netoAjustado = Math.max(0, subtotalNeto - totalDiscounts);

        const includeIVA = Boolean(options.includeIVA);
        const ivaAmount = includeIVA ? Math.round(netoAjustado * IVA_RATE) : 0;
        const totalFinal = netoAjustado + ivaAmount;

        const notes = sanitizeText(options.notes || '');

        const quote = {
            folio,
            createdAt: createdAt.toISOString(),
            createdAtFormatted: formatDateDisplay(createdAt),
            validUntil: validUntil.toISOString(),
            validUntilFormatted: formatDateDisplay(validUntil),
            validityDays,
            client,
            clientValidation: {
                isValid: clientValidation.isValid,
                errors: clientValidation.errors
            },
            items: normalizedItems,
            itemCount: normalizedItems.length,
            financials: {
                subtotalNeto,
                totalDiscounts,
                netoAjustado,
                includeIVA,
                ivaRate: IVA_RATE,
                ivaAmount,
                total: totalFinal,
                formatted: {
                    subtotalNeto: formatCLP(subtotalNeto),
                    totalDiscounts: formatCLP(totalDiscounts),
                    netoAjustado: formatCLP(netoAjustado),
                    ivaAmount: formatCLP(ivaAmount),
                    total: formatCLP(totalFinal)
                }
            },
            commercialTerms: Object.assign({}, OFFICIAL_COMMERCIAL_TERMS),
            company: {
                name: 'ALZADO ROJO',
                tagline: 'Arquitectura & Fabricación Digital',
                phone: OFFICIAL_PHONE_DISPLAY,
                whatsappNumber: OFFICIAL_WHATSAPP_NUMBER,
                email: OFFICIAL_EMAIL,
                website: OFFICIAL_WEBSITE
            },
            notes
        };

        return quote;
    }

    // =========================================================================
    // 7. GENERADOR DE MENSAJE Y ENLACE DE WHATSAPP (+56993188597)
    // =========================================================================

    /**
     * Construye el texto en formato WhatsApp Markdown para la cotización formal.
     * 
     * @param {Object} quote Objeto de cotización formal
     * @returns {string} Mensaje estructurado para WhatsApp
     */
    function generateWhatsAppMessageText(quote) {
        if (!quote) return '';

        const clientName = (quote.client && quote.client.name) ? quote.client.name : 'Cliente';
        const clientCompany = (quote.client && quote.client.company) ? ` (${quote.client.company})` : '';
        const folio = quote.folio || 'AR-2026';
        const dateStr = quote.createdAtFormatted || formatDateDisplay(quote.createdAt || new Date());
        const validDateStr = quote.validUntilFormatted || '';

        let msg = `🏛️ *ALZADO ROJO | COTIZACIÓN FORMAL*\n`;
        msg += `📋 *Folio:* \`${folio}\`\n`;
        msg += `📅 *Fecha:* ${dateStr}${validDateStr ? ` (Vigencia hasta ${validDateStr})` : ''}\n\n`;

        msg += `👤 *Cliente:* ${clientName}${clientCompany}\n`;
        if (quote.client && quote.client.phone) {
            msg += `📱 *Teléfono:* ${quote.client.phone}\n`;
        }
        if (quote.client && quote.client.email) {
            msg += `✉️ *Email:* ${quote.client.email}\n`;
        }
        msg += `\n`;

        msg += `📦 *DETALLE DE PARTIDAS:*\n`;
        if (!quote.items || quote.items.length === 0) {
            msg += `• Sin partidas especificadas.\n`;
        } else {
            quote.items.forEach((item, index) => {
                const num = index + 1;
                msg += `*${num}. ${item.title}*\n`;
                if (item.description) {
                    msg += `   • Detalle: ${item.description}\n`;
                }
                msg += `   • Cantidad: ${item.quantity} ${item.quantity > 1 ? `x ${formatCLP(item.unitPrice)}` : ''}\n`;
                if (item.discountAmount > 0) {
                    msg += `   • Descuento: -${formatCLP(item.discountAmount)}\n`;
                }
                msg += `   • Subtotal: *${formatCLP(item.subtotal)}*\n\n`;
            });
        }

        const fin = quote.financials || {};
        msg += `💰 *RESUMEN FINANCIERO:*\n`;
        msg += `• Subtotal Neto: ${formatCLP(fin.subtotalNeto || 0)}\n`;
        if ((fin.totalDiscounts || 0) > 0) {
            msg += `• Descuentos aplicados: -${formatCLP(fin.totalDiscounts)}\n`;
            msg += `• Neto Ajustado: ${formatCLP(fin.netoAjustado || 0)}\n`;
        }
        if (fin.includeIVA) {
            msg += `• IVA (19%): ${formatCLP(fin.ivaAmount || 0)}\n`;
        }
        msg += `👉 *TOTAL FINAL: ${formatCLP(fin.total || 0)}*\n\n`;

        msg += `📌 *CONDICIONES COMERCIALES OFICIALES:*\n`;
        msg += `• *Pago:* 50% anticipo al iniciar / 50% contra entrega o pre-despacho.\n`;
        msg += `• *Plazo:* 3 a 7 días hábiles según complejidad y cola de taller.\n`;
        msg += `• *Despacho:* Cobertura a todo Chile (Starken/Chilexpress) o retiro en taller.\n`;
        msg += `• *Revisión:* Sujeto a validación técnica previa de geometrías STL/OBJ.\n`;
        msg += `• *Validez:* 15 días corridos.\n\n`;

        if (quote.notes) {
            msg += `📝 *Observaciones:* ${quote.notes}\n\n`;
        }

        msg += `_Cotización emitida por Alzado Rojo (alzado-rojo.cl)_`;

        return msg;
    }

    /**
     * Genera el enlace oficial a la API de WhatsApp (wa.me) con el mensaje codificado.
     * 
     * @param {Object} quote Objeto de cotización formal
     * @param {string} [phone=OFFICIAL_WHATSAPP_NUMBER] Número de WhatsApp de destino
     * @returns {string} Enlace completo codificado para WhatsApp
     */
    function generateWhatsAppQuoteUrl(quote, phone = OFFICIAL_WHATSAPP_NUMBER) {
        const text = generateWhatsAppMessageText(quote);
        const encodedText = encodeURIComponent(text);
        const targetPhone = String(phone).replace(/\D/g, '') || OFFICIAL_WHATSAPP_NUMBER;
        return `https://wa.me/${targetPhone}?text=${encodedText}`;
    }

    // =========================================================================
    // 8. PERSISTENCIA EN LOCALSTORAGE ('ar_portfolio_quote_v1')
    // =========================================================================

    /**
     * Verifica si localStorage está disponible en el entorno de ejecución actual.
     * @returns {boolean}
     */
    function isStorageAvailable() {
        if (typeof window === 'undefined' || !window.localStorage) {
            return false;
        }
        try {
            const testKey = '__ar_storage_test__';
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Guarda la cotización actual en localStorage.
     * @param {Object} quote Objeto de cotización formal
     * @returns {boolean} true si se guardó exitosamente
     */
    function saveQuoteToStorage(quote) {
        if (!isStorageAvailable()) return false;
        try {
            const dataToSave = JSON.stringify(quote);
            window.localStorage.setItem(STORAGE_KEY, dataToSave);
            return true;
        } catch (e) {
            console.warn('[Alzado Rojo] Error al persistir cotización en localStorage:', e);
            return false;
        }
    }

    /**
     * Recupera la cotización persistida en localStorage.
     * @returns {Object|null} Cotización recuperada o null si no existe o está corrupta
     */
    function loadQuoteFromStorage() {
        if (!isStorageAvailable()) return null;
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;
            const parsed = JSON.parse(stored);
            if (!parsed || !parsed.folio || !Array.isArray(parsed.items)) {
                return null;
            }
            return parsed;
        } catch (e) {
            console.warn('[Alzado Rojo] Error al deserializar cotización desde localStorage:', e);
            return null;
        }
    }

    /**
     * Limpia la cotización persistida en localStorage.
     * @returns {boolean}
     */
    function clearQuoteStorage() {
        if (!isStorageAvailable()) return false;
        try {
            window.localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.warn('[Alzado Rojo] Error al limpiar localStorage:', e);
            return false;
        }
    }

    /**
     * Agrega una partida al carrito/cotización persistida en localStorage.
     * Si no existe cotización activa, crea una nueva con folio propio.
     * 
     * @param {Object} item Partida a incorporar
     * @param {Object} [clientData={}] Datos del cliente opcionales
     * @returns {Object} Cotización actualizada
     */
    function addQuoteItem(item, clientData = {}) {
        let activeQuote = loadQuoteFromStorage();
        if (!activeQuote) {
            activeQuote = createFormalQuote(clientData, [item]);
        } else {
            activeQuote.items.push(item);
            // Recalcular
            activeQuote = createFormalQuote(
                activeQuote.client,
                activeQuote.items,
                {
                    customFolio: activeQuote.folio,
                    includeIVA: activeQuote.financials.includeIVA,
                    validityDays: activeQuote.validityDays,
                    notes: activeQuote.notes
                }
            );
        }
        saveQuoteToStorage(activeQuote);
        return activeQuote;
    }

    /**
     * Elimina una partida por su ID de la cotización persistida.
     * 
     * @param {string} itemId ID de la partida a eliminar
     * @returns {Object|null} Cotización actualizada
     */
    function removeQuoteItem(itemId) {
        const activeQuote = loadQuoteFromStorage();
        if (!activeQuote) return null;

        const updatedItems = activeQuote.items.filter(item => item.id !== itemId);
        const recalculated = createFormalQuote(
            activeQuote.client,
            updatedItems,
            {
                customFolio: activeQuote.folio,
                includeIVA: activeQuote.financials.includeIVA,
                validityDays: activeQuote.validityDays,
                notes: activeQuote.notes
            }
        );
        saveQuoteToStorage(recalculated);
        return recalculated;
    }

    /**
     * Obtiene la cotización activa persistida o crea un borrador vacío si no existe.
     * 
     * @returns {Object}
     */
    function getActiveQuote() {
        const stored = loadQuoteFromStorage();
        if (stored) return stored;
        const fresh = createFormalQuote({}, []);
        return fresh;
    }

    // =========================================================================
    // 9. EXPORTACIÓN PÚBLICA DEL MÓDULO
    // =========================================================================

    return {
        // Constantes
        STORAGE_KEY,
        OFFICIAL_PHONE_DISPLAY,
        OFFICIAL_WHATSAPP_NUMBER,
        OFFICIAL_EMAIL,
        OFFICIAL_WEBSITE,
        IVA_RATE,
        DEFAULT_VALIDITY_DAYS,
        OFFICIAL_COMMERCIAL_TERMS,

        // Generadores y creadores
        generateQuoteFolio,
        validateClient,
        createArchitecturalItem,
        createUrbanItem,
        createTraditionalItem,
        createCustomItem,
        createFormalQuote,

        // WhatsApp
        generateWhatsAppMessageText,
        generateWhatsAppQuoteUrl,

        // Persistencia
        isStorageAvailable,
        saveQuoteToStorage,
        loadQuoteFromStorage,
        clearQuoteStorage,
        addQuoteItem,
        removeQuoteItem,
        getActiveQuote,

        // Formateadores
        formatCLP,
        formatDateDisplay
    };
}));
