/**
 * ALZADO ROJO | Arquitectura & Fabricación Digital
 * Módulo de Lógica y Cálculo de Cotizaciones
 * 
 * Áreas:
 *  1. Maquetas de Arquitectura (Impresión 3D FDM / SLA)
 *  2. Maquetas Urbanas Topográficas 3D
 *  3. Servicios de Arquitectura Tradicional & Asesoría Legal
 * 
 * Compatible con: Navegador (window.AlzadoQuote), ES Modules y CommonJS (Node.js).
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['../data/servicios-arquitectura.js'], factory);
    } else if (typeof module === 'object' && module.exports) {
        let servicios = null;
        try {
            servicios = require('../data/servicios-arquitectura.js');
        } catch (e) {
            // Fallback si no está en la misma ruta relativa
        }
        module.exports = factory(servicios);
    } else {
        const rootServicios = root.AlzadoServiciosArquitectura || null;
        root.AlzadoQuote = factory(rootServicios);
    }
}(typeof self !== 'undefined' ? self : this, function (serviciosModulo) {

    'use strict';

    // =========================================================================
    // 1. CONSTANTES Y TARIFAS: MAQUETAS DE ARQUITECTURA (IMPRESIÓN 3D)
    // =========================================================================

    /** Tarifa base oficial en CLP por gramo de material */
    const BASE_RATE_PER_GRAM = 90;

    /** Descuento oficial por modelo listo para imprimir ("Ready to Print") */
    const READY_TO_PRINT_DISCOUNT_RATE = 0.20; // 20%

    /**
     * Calidades de capa (Layer Height) y factores multiplicadores de tiempo/acabado.
     */
    const LAYER_QUALITIES = {
        'draft': {
            id: 'draft',
            key: 'draft',
            alias: ['draft', '0.28', 'rapida', 'rápida'],
            label: 'Draft / Rápida (0.28 mm)',
            layerHeightMm: 0.28,
            factor: 0.95,
            description: 'Maquetas volumétricas y estudios preliminares de masa.'
        },
        'standard': {
            id: 'standard',
            key: 'standard',
            alias: ['standard', '0.20', 'estandar', 'estándar'],
            label: 'Standard (0.20 mm)',
            layerHeightMm: 0.20,
            factor: 1.00,
            description: 'Equilibrio óptimo entre velocidad, resistencia y acabado visual.'
        },
        'high': {
            id: 'high',
            key: 'high',
            alias: ['high', '0.12', 'alta', 'alta precision', 'alta precisión'],
            label: 'Alta Precisión (0.12 mm)',
            layerHeightMm: 0.12,
            factor: 1.15,
            description: 'Líneas de capa muy finas, ideal para entregas finales y maquetas de concurso.'
        },
        'ultra': {
            id: 'ultra',
            key: 'ultra',
            alias: ['ultra', '0.08', 'detalle ultra', 'ultra detalle'],
            label: 'Detalle Ultra (0.08 mm)',
            layerHeightMm: 0.08,
            factor: 1.30,
            description: 'Acabado de máxima fidelidad para texturas complejas, celosías y elementos finos.'
        }
    };

    /**
     * Densidades de relleno (Infill) recomendadas para arquitectura.
     */
    const INFILL_OPTIONS = {
        'light': {
            id: 'light',
            key: 'light',
            alias: ['light', '10', '10%', 'ligero'],
            label: 'Ligero (10%)',
            percentage: 10,
            factor: 1.00,
            description: 'Volúmenes cerrados y maquetas conceptuales ligeras.'
        },
        'standard': {
            id: 'standard',
            key: 'standard',
            alias: ['standard', '20', '20%', 'estandar', 'estándar'],
            label: 'Standard (20%)',
            percentage: 20,
            factor: 1.00,
            description: 'Densidad equilibrada recomendada para la mayoría de maquetas.'
        },
        'structural': {
            id: 'structural',
            key: 'structural',
            alias: ['structural', '40', '40%', 'estructural'],
            label: 'Estructural (40%)',
            percentage: 40,
            factor: 1.05,
            description: 'Para piezas con voladizos exigentes, ensambles mecánicos o muros delgados.'
        },
        'solid': {
            id: 'solid',
            key: 'solid',
            alias: ['solid', '100', '100%', 'solido', 'sólido'],
            label: 'Sólido (100%)',
            percentage: 100,
            factor: 1.15,
            description: 'Modelos compactos de máxima resistencia y peso real.'
        }
    };

    /**
     * Materiales de manufactura 3D.
     */
    const MATERIAL_OPTIONS = {
        'pla_matte': {
            id: 'pla_matte',
            key: 'pla_matte',
            alias: ['pla_matte', 'matte', 'mate', 'pla arquitectonico mate', 'pla arquitectónico mate'],
            label: 'PLA Arquitectónico Mate',
            factor: 1.10,
            description: 'Acabado mate sin brillos, textura tipo yeso/cerámica, oculta líneas de capa.'
        },
        'pla_standard': {
            id: 'pla_standard',
            key: 'pla_standard',
            alias: ['pla_standard', 'pla', 'standard', 'pla estandar', 'pla estándar'],
            label: 'PLA Estándar',
            factor: 1.00,
            description: 'Material versátil y confiable en colores neutros (blanco, gris técnico, negro).'
        },
        'resin_uv': {
            id: 'resin_uv',
            key: 'resin_uv',
            alias: ['resin_uv', 'resin', 'resina', 'resina uv', 'resina uv de alto detalle'],
            label: 'Resina UV de Alto Detalle',
            factor: 2.20,
            description: 'Fotopolímero SLA/DLP de ultra precisión micrométrica para microdetalles a escala 1:100 o 1:200.'
        }
    };

    // =========================================================================
    // 2. CONSTANTES: MAQUETAS URBANAS TOPOGRÁFICAS 3D
    // =========================================================================

    /**
     * Catálogo oficial de formatos y precios de referencia para maquetas urbanas.
     */
    const URBAN_SIZES = {
        '10x10': {
            id: '10x10',
            label: '10x10 cm',
            widthCm: 10,
            lengthCm: 10,
            basePriceCLP: 9990,
            description: 'Formato compacto de bolsillo, ideal para manzanas emblemáticas o monumentos.',
            isBestValue: false
        },
        '15x15': {
            id: '15x15',
            label: '15x15 cm',
            widthCm: 15,
            lengthCm: 15,
            basePriceCLP: 19990,
            description: 'Formato de escritorio para sectores específicos y elevaciones topográficas.',
            isBestValue: false
        },
        '20x20': {
            id: '20x20',
            label: '20x20 cm',
            widthCm: 20,
            lengthCm: 20,
            basePriceCLP: 25990,
            description: 'Tamaño intermedio con excelente nivel de detalle barrial y curvas de nivel.',
            isBestValue: false
        },
        '25x25': {
            id: '25x25',
            label: '25x25 cm 🔥',
            widthCm: 25,
            lengthCm: 25,
            basePriceCLP: 29990,
            description: 'Formato amplio para contextos metropolitanos. Máxima relación tamaño-valor (Mejor opción).',
            isBestValue: true
        },
        'gran_formato': {
            id: 'gran_formato',
            label: 'Gran Formato (A Cotizar)',
            widthCm: null,
            lengthCm: null,
            basePriceCLP: 0,
            description: 'Hasta 100x100 cm. Ensambladas por cuadrantes modulares. Cotización personalizada.',
            isBestValue: false,
            isCustomQuote: true
        }
    };

    /** Costo adicional del marco negro perimetral por unidad */
    const URBAN_FRAME_PRICE_CLP = 2500;

    /**
     * Ciudades de referencia y soporte para personalización.
     */
    const URBAN_CITIES = {
        'santiago': {
            id: 'santiago',
            name: 'Santiago',
            label: 'Santiago (Centro / San Cristóbal / Cordillera)',
            country: 'Chile',
            isPreset: true
        },
        'concepcion': {
            id: 'concepcion',
            name: 'Concepción',
            label: 'Concepción (Río Biobío / Centro / Cerros)',
            country: 'Chile',
            isPreset: true
        },
        'valparaiso': {
            id: 'valparaiso',
            name: 'Valparaíso & Viña',
            label: 'Valparaíso & Viña del Mar (Bahía y Quebradas)',
            country: 'Chile',
            isPreset: true
        },
        'ny': {
            id: 'ny',
            name: 'New York',
            label: 'New York (Manhattan / Central Park)',
            country: 'EE.UU.',
            isPreset: true
        },
        'paris': {
            id: 'paris',
            name: 'París',
            label: 'París (Sena / Torre Eiffel / Île de la Cité)',
            country: 'Francia',
            isPreset: true
        },
        'custom': {
            id: 'custom',
            name: 'Ciudad Personalizada',
            label: 'Cualquier ciudad o coordenada del mundo a pedido',
            country: 'Personalizado',
            isPreset: false
        }
    };

    /**
     * Escala de descuentos por volumen para maquetas urbanas.
     */
    const VOLUME_DISCOUNT_TIERS = [
        { minQty: 11, discountPercent: 20, label: '20% Dscto. (+10 unidades)' },
        { minQty: 6,  discountPercent: 15, label: '15% Dscto. (6-10 unidades)' },
        { minQty: 3,  discountPercent: 10, label: '10% Dscto. (3-5 unidades)' },
        { minQty: 1,  discountPercent: 0,  label: 'Precio unitario estándar' }
    ];

    // =========================================================================
    // 3. RESOLUTORES AUXILIARES (NORMALIZACIÓN DE OPCIONES)
    // =========================================================================

    function resolveQuality(input) {
        if (!input) return LAYER_QUALITIES['standard'];
        const normalized = String(input).toLowerCase().trim();
        for (const key of Object.keys(LAYER_QUALITIES)) {
            const opt = LAYER_QUALITIES[key];
            if (opt.id === normalized || opt.alias.includes(normalized)) {
                return opt;
            }
        }
        return LAYER_QUALITIES['standard'];
    }

    function resolveInfill(input) {
        if (input === undefined || input === null) return INFILL_OPTIONS['standard'];
        const normalized = String(input).toLowerCase().trim();
        for (const key of Object.keys(INFILL_OPTIONS)) {
            const opt = INFILL_OPTIONS[key];
            if (opt.id === normalized || opt.alias.includes(normalized)) {
                return opt;
            }
        }
        return INFILL_OPTIONS['standard'];
    }

    function resolveMaterial(input) {
        if (!input) return MATERIAL_OPTIONS['pla_matte'];
        const normalized = String(input).toLowerCase().trim();
        for (const key of Object.keys(MATERIAL_OPTIONS)) {
            const opt = MATERIAL_OPTIONS[key];
            if (opt.id === normalized || opt.alias.includes(normalized)) {
                return opt;
            }
        }
        return MATERIAL_OPTIONS['pla_matte'];
    }

    function resolveUrbanSize(input) {
        if (!input) return URBAN_SIZES['25x25']; // Mejor valor por defecto
        const normalized = String(input).toLowerCase().trim().replace(/\s+/g, '');
        if (URBAN_SIZES[normalized]) return URBAN_SIZES[normalized];
        if (normalized.includes('10')) return URBAN_SIZES['10x10'];
        if (normalized.includes('15')) return URBAN_SIZES['15x15'];
        if (normalized.includes('20')) return URBAN_SIZES['20x20'];
        if (normalized.includes('25')) return URBAN_SIZES['25x25'];
        if (normalized.includes('gran') || normalized.includes('custom') || normalized.includes('formato')) {
            return URBAN_SIZES['gran_formato'];
        }
        return URBAN_SIZES['25x25'];
    }

    function resolveUrbanCity(input) {
        if (!input) return URBAN_CITIES['santiago'];
        const normalized = String(input).toLowerCase().trim();
        if (URBAN_CITIES[normalized]) return URBAN_CITIES[normalized];
        if (normalized.includes('santiago') || normalized.includes('stgo')) return URBAN_CITIES['santiago'];
        if (normalized.includes('concepcion') || normalized.includes('concepción') || normalized.includes('conce')) return URBAN_CITIES['concepcion'];
        if (normalized.includes('valpo') || normalized.includes('valparaiso') || normalized.includes('viña')) return URBAN_CITIES['valparaiso'];
        if (normalized.includes('ny') || normalized.includes('york') || normalized.includes('nueva york')) return URBAN_CITIES['ny'];
        if (normalized.includes('paris') || normalized.includes('parís')) return URBAN_CITIES['paris'];
        return URBAN_CITIES['custom'];
    }

    // =========================================================================
    // 4. FUNCIONES DE CÁLCULO PRINCIPALES
    // =========================================================================

    /**
     * Formatea un monto numérico a formato moneda CLP ($ XX.XXX CLP).
     * @param {number} amount Monto numérico
     * @returns {string} Texto formateado
     */
    function formatCLP(amount) {
        const num = Math.round(Number(amount) || 0);
        const formatted = num.toLocaleString('es-CL');
        return `$${formatted} CLP`;
    }

    /**
     * Calcula la cotización para una maqueta de arquitectura en impresión 3D.
     * 
     * Reglas aplicadas:
     *  - Tarifa base: $90 CLP por gramo.
     *  - Descuento del 20% si isReadyToPrint === true.
     *  - Factor calidad: 0.28mm (0.95), 0.20mm (1.00), 0.12mm (1.15), 0.08mm (1.30).
     *  - Factor relleno: Ligero 10% (1.00), Standard 20% (1.00), Estructural 40% (1.05), Sólido 100% (1.15).
     *  - Factor material: PLA Estándar (1.00), PLA Mate (1.10), Resina UV (2.20).
     * 
     * @param {Object} params Parámetros de cotización
     * @param {number} params.grams Peso estimado en gramos (requerido >= 0)
     * @param {boolean} [params.isReadyToPrint=false] Si el archivo está optimizado y listo para imprimir
     * @param {string|number} [params.quality='standard'] Calidad de capa (draft, standard, high, ultra)
     * @param {string|number} [params.infill='standard'] Relleno (light, standard, structural, solid o 10, 20, 40, 100)
     * @param {string} [params.material='pla_matte'] Material (pla_matte, pla_standard, resin_uv)
     * @returns {Object} Desglose completo del cálculo
     */
    function calculateArchitecturalQuote(params = {}) {
        const rawGrams = parseFloat(params.grams);
        const grams = isNaN(rawGrams) || rawGrams < 0 ? 0 : rawGrams;
        const isReadyToPrint = Boolean(params.isReadyToPrint);

        const quality = resolveQuality(params.quality);
        const infill = resolveInfill(params.infill);
        const material = resolveMaterial(params.material);

        // Factores combinados
        const combinedFactor = quality.factor * material.factor * infill.factor;
        const effectiveRatePerGram = Math.round(BASE_RATE_PER_GRAM * combinedFactor);

        // Subtotal bruto antes de descuentos
        const subtotalBruto = Math.round(grams * BASE_RATE_PER_GRAM * combinedFactor);

        // Descuento por Ready to Print (20%)
        const discountRate = isReadyToPrint ? READY_TO_PRINT_DISCOUNT_RATE : 0;
        const discountAmount = isReadyToPrint ? Math.round(subtotalBruto * READY_TO_PRINT_DISCOUNT_RATE) : 0;

        // Total final
        const total = Math.max(0, subtotalBruto - discountAmount);

        return {
            success: true,
            tipo: 'maqueta_arquitectura_3d',
            grams,
            baseRatePerGram: BASE_RATE_PER_GRAM,
            quality: {
                id: quality.id,
                label: quality.label,
                layerHeightMm: quality.layerHeightMm,
                factor: quality.factor
            },
            infill: {
                id: infill.id,
                label: infill.label,
                percentage: infill.percentage,
                factor: infill.factor
            },
            material: {
                id: material.id,
                label: material.label,
                factor: material.factor
            },
            factors: {
                quality: quality.factor,
                material: material.factor,
                infill: infill.factor,
                combined: parseFloat(combinedFactor.toFixed(4))
            },
            effectiveRatePerGram,
            subtotal: subtotalBruto,
            isReadyToPrint,
            discountRate,
            discountPercent: Math.round(discountRate * 100),
            discountAmount,
            total,
            formatted: {
                baseRatePerGram: formatCLP(BASE_RATE_PER_GRAM),
                effectiveRatePerGram: formatCLP(effectiveRatePerGram),
                subtotal: formatCLP(subtotalBruto),
                discountAmount: formatCLP(discountAmount),
                total: formatCLP(total)
            }
        };
    }

    /**
     * Calcula la cotización para maquetas urbanas topográficas 3D.
     * 
     * Reglas aplicadas:
     *  - Formatos oficiales: 10x10 ($9.990), 15x15 ($19.990), 20x20 ($25.990), 25x25 ($29.990 🔥).
     *  - Marco negro opcional: +$2.500 CLP por unidad.
     *  - Descuentos por volumen: 3-5 unid (10%), 6-10 unid (15%), 11+ unid (20%).
     * 
     * @param {Object} params Parámetros de cotización
     * @param {string} [params.size='25x25'] Tamaño (10x10, 15x15, 20x20, 25x25, gran_formato)
     * @param {boolean} [params.withFrame=false] Incluye marco negro perimetral
     * @param {string} [params.city='santiago'] Ciudad base (santiago, concepcion, ny, paris, custom)
     * @param {string} [params.customCityName=''] Nombre o coordenadas si city es 'custom'
     * @param {number} [params.quantity=1] Cantidad de unidades
     * @returns {Object} Desglose completo de la cotización
     */
    function calculateUrbanQuote(params = {}) {
        const sizeObj = resolveUrbanSize(params.size);
        const cityObj = resolveUrbanCity(params.city);
        const withFrame = Boolean(params.withFrame);
        const quantity = Math.max(1, parseInt(params.quantity, 10) || 1);
        const customCityName = (params.customCityName || '').trim();

        // Caso especial: Gran Formato requiere evaluación manual
        if (sizeObj.isCustomQuote) {
            return {
                success: true,
                tipo: 'maqueta_urbana_topografica',
                isCustomQuote: true,
                size: sizeObj,
                city: {
                    id: cityObj.id,
                    name: cityObj.id === 'custom' && customCityName ? customCityName : cityObj.name,
                    country: cityObj.country
                },
                withFrame,
                quantity,
                message: 'Los proyectos de gran formato (> 25x25 cm) se ensamblan mediante cuadrantes modulares. Se requiere revisión de cartografía digital para cotización formal.',
                unitPrice: null,
                total: 0,
                formatted: {
                    total: 'A Cotizar'
                }
            };
        }

        // Costos unitarios
        const unitBasePrice = sizeObj.basePriceCLP;
        const unitFramePrice = withFrame ? URBAN_FRAME_PRICE_CLP : 0;
        const unitPrice = unitBasePrice + unitFramePrice;

        // Subtotal bruto
        const rawSubtotal = unitPrice * quantity;

        // Descuento por volumen
        let volumeDiscountPercent = 0;
        for (const tier of VOLUME_DISCOUNT_TIERS) {
            if (quantity >= tier.minQty) {
                volumeDiscountPercent = tier.discountPercent;
                break;
            }
        }

        const volumeDiscountRate = volumeDiscountPercent / 100;
        const volumeDiscountAmount = Math.round(rawSubtotal * volumeDiscountRate);
        const total = Math.max(0, rawSubtotal - volumeDiscountAmount);

        const resolvedCityName = (cityObj.id === 'custom' && customCityName) ? customCityName : cityObj.name;

        return {
            success: true,
            tipo: 'maqueta_urbana_topografica',
            isCustomQuote: false,
            size: {
                id: sizeObj.id,
                label: sizeObj.label,
                widthCm: sizeObj.widthCm,
                lengthCm: sizeObj.lengthCm,
                isBestValue: sizeObj.isBestValue
            },
            city: {
                id: cityObj.id,
                name: resolvedCityName,
                country: cityObj.country,
                isPreset: cityObj.isPreset
            },
            withFrame,
            frameUnitPrice: URBAN_FRAME_PRICE_CLP,
            unitBasePrice,
            unitFramePrice,
            unitPrice,
            quantity,
            rawSubtotal,
            volumeDiscountPercent,
            volumeDiscountAmount,
            total,
            formatted: {
                unitBasePrice: formatCLP(unitBasePrice),
                unitFramePrice: formatCLP(unitFramePrice),
                unitPrice: formatCLP(unitPrice),
                rawSubtotal: formatCLP(rawSubtotal),
                volumeDiscountAmount: formatCLP(volumeDiscountAmount),
                total: formatCLP(total)
            }
        };
    }

    // =========================================================================
    // 5. ACCESO Y ESTIMACIÓN DE SERVICIOS DE ARQUITECTURA TRADICIONAL
    // =========================================================================

    /**
     * Retorna el catálogo completo de servicios de arquitectura tradicional.
     */
    function getTraditionalServices() {
        if (serviciosModulo && typeof serviciosModulo.getServiciosArquitectura === 'function') {
            return serviciosModulo.getServiciosArquitectura();
        }
        // Fallback básico si el módulo de datos no estuviera vinculado
        return [
            { id: 'regularizacion', titulo: 'Regularización de Edificaciones (DOM / Ley 20.898)' },
            { id: 'fusion_roles', titulo: 'Fusión de Roles' },
            { id: 'subdivision_predial', titulo: 'Subdivisión Predial (SAG / CBR)' },
            { id: 'diseno_bim', titulo: 'Diseño Arquitectónico y BIM' },
            { id: 'estudio_cabida', titulo: 'Asesoría Normativa y Estudios de Cabida' }
        ];
    }

    /**
     * Retorna el detalle de un servicio de arquitectura por su ID.
     */
    function getTraditionalServiceById(serviceId) {
        if (serviciosModulo && typeof serviciosModulo.getServicioPorId === 'function') {
            return serviciosModulo.getServicioPorId(serviceId);
        }
        const all = getTraditionalServices();
        return all.find(s => s.id === serviceId) || null;
    }

    /**
     * Realiza una estimación paramétrica para un servicio de arquitectura tradicional.
     */
    function estimateTraditionalQuote(serviceId, options = {}) {
        if (serviciosModulo && typeof serviciosModulo.estimarServicioArquitectura === 'function') {
            return serviciosModulo.estimarServicioArquitectura(serviceId, options);
        }
        const s = getTraditionalServiceById(serviceId);
        if (!s) return { success: false, error: 'Servicio no encontrado' };
        return {
            success: true,
            servicioId: s.id,
            titulo: s.titulo,
            estimacionTotalCLP: s.precioBaseReferencialCLP || 350000,
            nota: 'Estimación técnica referencial'
        };
    }

    // =========================================================================
    // 6. EXPORTACIÓN PÚBLICA DEL MÓDULO
    // =========================================================================

    return {
        // Constantes
        BASE_RATE_PER_GRAM,
        READY_TO_PRINT_DISCOUNT_RATE,
        LAYER_QUALITIES,
        INFILL_OPTIONS,
        MATERIAL_OPTIONS,
        URBAN_SIZES,
        URBAN_FRAME_PRICE_CLP,
        URBAN_CITIES,
        VOLUME_DISCOUNT_TIERS,

        // Funciones
        formatCLP,
        calculateArchitecturalQuote,
        calculateUrbanQuote,
        getTraditionalServices,
        getTraditionalServiceById,
        estimateTraditionalQuote
    };
}));
