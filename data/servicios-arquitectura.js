/**
 * ALZADO ROJO | Arquitectura & Fabricación Digital
 * Catálogo de Servicios de Arquitectura Tradicional & Asesoría Legal-Normativa
 * 
 * Marco normativo chileno: LGUC, OGUC, Ley 20.898, DFL 458, DL 3.516 (SAG), Conservadores de Bienes Raíces (CBR)
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.AlzadoServiciosArquitectura = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    'use strict';

    /**
     * Catálogo maestro de servicios profesionales de arquitectura tradicional.
     */
    const SERVICIOS_ARQUITECTURA = [
        {
            id: 'regularizacion',
            codigo: 'ARQ-REG',
            categoria: 'Normativa & Legal',
            titulo: 'Regularización de Edificaciones',
            subtitulo: 'DOM / Ley del Mono (Ley 20.898 y prórrogas)',
            marcoLegal: 'LGUC (DFL 458), OGUC, Ley 20.898 (Título I y II)',
            descripcion: 'Tramitación y expediente técnico ante la Dirección de Obras Municipales (DOM) para regularizar viviendas o ampliaciones sin recepción final previa.',
            alcance: [
                'Viviendas sociales o autoconstruidas hasta 90 m² o 140 m²',
                'Ampliaciones residenciales sin permiso previo',
                'Edificaciones comerciales menores con destino compatible'
            ],
            entregables: [
                'Levantamiento arquitectónico planimétrico in situ',
                'Plano de ubicación, emplazamiento y plantas acotadas (1:50 / 1:100)',
                'Cortes reglamentarios y elevaciones',
                'Memoria explicativa y Especificaciones Técnicas Resumidas (EETT)',
                'Informe técnico de habitabilidad, estabilidad y seguridad contra incendios',
                'Gestión de formularios oficiales DOM hasta obtención del Certificado de Recepción Final'
            ],
            tiempoEstimadoSemanas: '4 a 8 semanas (sujeto a tiempos de revisión municipal DOM)',
            precioBaseReferencialCLP: 350000,
            precioPorM2ReferencialCLP: 4500,
            superficieMinimaM2: 30
        },
        {
            id: 'fusion_roles',
            codigo: 'ARQ-FUS',
            categoria: 'Predial & Jurídico',
            titulo: 'Fusión de Roles',
            subtitulo: 'Unificación de predios colindantes ante DOM, CBR y SII',
            marcoLegal: 'LGUC Artículo 63, OGUC Artículo 3.1.3',
            descripcion: 'Procedimiento técnico y legal para unir dos o más propiedades o lotes contiguos bajo una sola unidad territorial y un único rol de avalúo.',
            alcance: [
                'Lotes urbanos o suburbanos con título de dominio vigente',
                'Proyectos inmobiliarios que requieren consolidación de paño',
                'Propiedades colindantes de un mismo titular o consorcio'
            ],
            entregables: [
                'Estudio de títulos y Certificado de Informaciones Previas (CIP) de cada predio',
                'Plano de situación actual con deslindes, cotas y cabidas de cada rol',
                'Plano de fusión con la nueva geometría unificada y cuadro de superficies',
                'Expediente municipal y solicitud de Resolución de Fusión DOM',
                'Minuta de deslindes para inscripción en el Conservador de Bienes Raíces (CBR)'
            ],
            tiempoEstimadoSemanas: '4 a 6 semanas',
            precioBaseReferencialCLP: 420000,
            precioPorM2ReferencialCLP: 0
        },
        {
            id: 'subdivision_predial',
            codigo: 'ARQ-SUB',
            categoria: 'Predial & Jurídico',
            titulo: 'Subdivisión Predial',
            subtitulo: 'Loteos rústicos agrícolas (SAG) y subdivisiones urbanas (DOM / CBR)',
            marcoLegal: 'Decreto Ley 3.516 (Predios Rústicos de 5.000 m²), LGUC Art. 65, OGUC',
            descripcion: 'Fraccionamiento de un terreno matriz en dos o más lotes independientes. En suelo rural aplica la certificación SAG (superficie mínima 0,5 ha); en suelo urbano aplica resolución DOM.',
            alcance: [
                'Subdivisión de parcelas de agrado rurales (mínimo 5.000 m²)',
                'Particiones hereditarias o comerciales',
                'Subdivisiones urbanas sin apertura de nuevas vías públicas'
            ],
            entregables: [
                'Levantamiento topográfico georreferenciado (GNSS / coordenadas WGS84)',
                'Plano de subdivisión predial con accesos, servidumbres de paso y cuadro de áreas',
                'Memoria explicativa técnica de la subdivisión',
                'Ingreso de expediente digital/presencial SAG o DOM',
                'Tramitación de plano archivado e inscripción de nuevos roles en CBR'
            ],
            tiempoEstimadoSemanas: '6 a 12 semanas (según plazos de respuesta SAG/DOM)',
            precioBaseReferencialCLP: 650000,
            precioPorLoteAdicionalCLP: 85000,
            lotesBase: 2
        },
        {
            id: 'diseno_bim',
            codigo: 'ARQ-BIM',
            categoria: 'Diseño & Construcción',
            titulo: 'Diseño Arquitectónico y BIM',
            subtitulo: 'Anteproyectos, Modelado BIM (LOD 200 - LOD 350) y Coordinación',
            marcoLegal: 'Estándar BIM para Proyectos Públicos (PlanBIM Corfo), OGUC',
            descripcion: 'Desarrollo integral de proyectos arquitectónicos residenciales, comerciales o corporativos utilizando flujos de trabajo BIM paramétricos para máxima coordinación espacial y constructiva.',
            alcance: [
                'Viviendas unifamiliares de alta gama y proyectos multifamily',
                'Edificios comerciales, locales y remodelaciones de alto estándar',
                'Coordinación multidisciplinaria (Arquitectura, Estructuras, MEP)'
            ],
            entregables: [
                'Modelo tridimensional paramétrico federado BIM (Revit / ArchiCAD / formato IFC abierto)',
                'Planimetría ejecutiva completa: plantas, cortes, elevaciones y detalles constructivos 1:20 / 1:10',
                'Renders fotorrealistas de alta resolución (4K) y recorridos virtuales',
                'Especificaciones Técnicas completas (EETT)',
                'Cubicaciones automáticas de partidas y optimización de materiales'
            ],
            tiempoEstimadoSemanas: '4 a 10 semanas (según escala y programa)',
            precioBaseReferencialCLP: 850000,
            precioPorM2ReferencialCLP: 12000,
            superficieMinimaM2: 50
        },
        {
            id: 'estudio_cabida',
            codigo: 'ARQ-CAB',
            categoria: 'Normativa & Legal',
            titulo: 'Asesoría Normativa y Estudios de Cabida',
            subtitulo: 'Maximización del potencial edificable y factibilidad urbana',
            marcoLegal: 'Planes Reguladores Comunales (PRC), PRMS, OGUC Títulos 2 y 4',
            descripcion: 'Análisis urbanístico exhaustivo del Certificado de Informaciones Previas (CIP) para determinar la volumetría máxima construible, rentabilidad espacial y restricciones legales de un predio.',
            alcance: [
                'Evaluación de terrenos para compra e inversión inmobiliaria',
                'Determinación de usos de suelo permitidos y prohibidos',
                'Optimización de coeficientes de constructibilidad y ocupación'
            ],
            entregables: [
                'Cuadro normativo comparativo (altura máxima, rasantes, distanciamientos, estacionamientos)',
                'Modelo volumétrico 3D de envolvente máxima según rasantes oficiales',
                'Alternativas de zonificación y esquemas de distribución programática',
                'Informe técnico de factibilidad inmobiliaria con recomendaciones estratégicas'
            ],
            tiempoEstimadoSemanas: '1 a 2 semanas',
            precioBaseReferencialCLP: 290000,
            precioPorM2ReferencialCLP: 0
        }
    ];

    /**
     * Obtiene el listado completo de servicios de arquitectura tradicional.
     * @returns {Array} Lista inmutable de servicios
     */
    function getServiciosArquitectura() {
        return SERVICIOS_ARQUITECTURA.map(s => Object.assign({}, s));
    }

    /**
     * Busca un servicio de arquitectura por su identificador.
     * @param {string} serviceId Identificador único (ej: 'regularizacion', 'fusion_roles')
     * @returns {Object|null}
     */
    function getServicioPorId(serviceId) {
        if (!serviceId) return null;
        const normalized = String(serviceId).toLowerCase().trim();
        const found = SERVICIOS_ARQUITECTURA.find(s => s.id === normalized || s.codigo.toLowerCase() === normalized);
        return found ? Object.assign({}, found) : null;
    }

    /**
     * Estima el presupuesto referencial para un servicio de arquitectura tradicional.
     * @param {string} serviceId Identificador del servicio
     * @param {Object} options Opciones de cálculo { m2, lotes, complejidad }
     * @returns {Object} Estimación detallada con desglose y plazos
     */
    function estimarServicioArquitectura(serviceId, options = {}) {
        const servicio = getServicioPorId(serviceId);
        if (!servicio) {
            return {
                success: false,
                error: `Servicio no encontrado: "${serviceId}". Opciones válidas: regularizacion, fusion_roles, subdivision_predial, diseno_bim, estudio_cabida`
            };
        }

        const m2 = Math.max(0, parseFloat(options.m2) || 0);
        const lotes = Math.max(1, parseInt(options.lotes, 10) || servicio.lotesBase || 1);
        const factorComplejidad = Math.max(0.8, Math.min(2.0, parseFloat(options.complejidad) || 1.0));

        let subtotalCalculado = servicio.precioBaseReferencialCLP;

        // Adicional por m2
        if (servicio.precioPorM2ReferencialCLP > 0 && m2 > 0) {
            const m2Tarificables = Math.max(0, m2 - (servicio.superficieMinimaM2 || 0));
            subtotalCalculado += (m2Tarificables * servicio.precioPorM2ReferencialCLP);
        }

        // Adicional por lotes en subdivisión
        if (servicio.precioPorLoteAdicionalCLP > 0 && lotes > (servicio.lotesBase || 2)) {
            const lotesExtra = lotes - (servicio.lotesBase || 2);
            subtotalCalculado += (lotesExtra * servicio.precioPorLoteAdicionalCLP);
        }

        const subtotalConComplejidad = Math.round(subtotalCalculado * factorComplejidad);

        return {
            success: true,
            servicioId: servicio.id,
            codigo: servicio.codigo,
            titulo: servicio.titulo,
            subtitulo: servicio.subtitulo,
            marcoLegal: servicio.marcoLegal,
            parametros: {
                m2,
                lotes,
                factorComplejidad
            },
            precioBaseReferencialCLP: servicio.precioBaseReferencialCLP,
            estimacionTotalCLP: subtotalConComplejidad,
            tiempoEstimadoSemanas: servicio.tiempoEstimadoSemanas,
            entregables: servicio.entregables,
            nota: 'Estimación técnica referencial. El valor final se formaliza tras revisión de títulos de dominio o visita técnica a terreno.'
        };
    }

    return {
        SERVICIOS_ARQUITECTURA,
        getServiciosArquitectura,
        getServicioPorId,
        estimarServicioArquitectura
    };
}));
