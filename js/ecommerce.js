/**
 * ALZADO ROJO · AR ARQ SpA
 * Motor E-Commerce, Gestion de Pedidos y Cotizaciones Formales
 * Archivo: js/ecommerce.js
 * 
 * Reglas de diseno y contenido:
 * - Cero emojis en cadenas de texto visibles y plantillas.
 * - Cero ampersands en titulos y etiquetas (uso estricto de 'y', 'e' o separadores '·').
 * - Lote de recepcion oficial: adolchilemods@gmail.com
 * - Canal de atencion WhatsApp: +56 9 7541 2203
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const api = factory();
    root.AR_ECOMMERCE = api;
    root.AR_CATALOG = api.CATALOG_PRODUCTS;
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  // --- CONFIGURACION GENERAL Y CONTACTO OFICIAL ---
  const CONFIG = {
    businessName: 'AR ARQ SpA',
    tradeName: 'ALZADO ROJO',
    subTitle: 'ARQUITECTURA Y FABRICACION DIGITAL',
    officialEmail: 'adolchilemods@gmail.com',
    officialPhone: '+56 9 7541 2203',
    whatsappPhoneRaw: '56975412203',
    cityCountry: 'Santiago, Chile',
    quoteValidityDays: 15,
    formSubmitEndpoint: 'https://formsubmit.co/ajax/adolchilemods@gmail.com',
    flowEndpoint: '/api/flow-create',
    khipuEndpoint: '/api/flow-create',
    storageKeyHistory: 'ar_orders_history',
    storageKeyLast: 'ar_last_order'
  };

  // --- DATOS BANCARIOS OFICIALES PARA TRANSFERENCIA DIRECTA ---
  const BANK_DETAILS = {
    accountHolder: 'Ar Arq Spa',
    businessName: 'Ar Arq Spa',
    rut: '78.516.116-5',
    bank: 'Banco Bci',
    accountType: 'Cuenta corriente en pesos',
    accountNumber: '71897223',
    email: 'adolchilemods@gmail.com',
    notes: 'Por favor indique el Folio de su orden como referencia en la transferencia.'
  };

  // --- CATÁLOGO OFICIAL DE PRODUCTOS Y SKUs ---
  const CATALOG_PRODUCTS = [
    {
      sku: 'SKU-VOL-01',
      id: 'volcan-villarrica',
      name: 'Volcán Villarrica · Relieve Topográfico 3D',
      shortName: 'Volcán Villarrica',
      category: 'volcanes',
      collection: 'Volcanes de Chile',
      tag: 'CRÁTER ACTIVO · GLACIAR 3D',
      badge: 'NUEVA COLECCIÓN · CRÁTER 3D',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      main: 'catalog/volcan-villarrica-marco.jpg',
      image: 'catalog/volcan-villarrica-marco.jpg',
      defaultImage: 'catalog/volcan-villarrica-marco.jpg',
      video: 'videos/reel-volcanes.mp4',
      description: 'Relieve del cono volcánico, glaciar y cráter activo con curvas de nivel extruidas a 0.20 mm de precisión en marco shadowbox negro mate.',
      specs: {
        escala: '1:1000 / 1:2000',
        tolerancia: '±0.20 mm',
        material: 'PLA Arquitectónico Biobasado Mate',
        marco: 'Shadowbox Negro Mate o Madera Natural',
        origen: 'DEM Satelital Alos Palsar 12.5 m',
        acabado: 'Blanco Tiza Mate Antirreflejo'
      },
      images: {
        marco: 'catalog/volcan-villarrica-marco.jpg',
        detalle: 'catalog/volcan-villarrica-detalle.jpg'
      },
      gallery: [
        { url: 'catalog/volcan-villarrica-marco.jpg', label: 'Marco Shadowbox Negro' },
        { url: 'catalog/volcan-villarrica-detalle.jpg', label: 'Detalle Cráter y Curvas de Nivel' },
        { url: 'catalog/volcan-osorno-shadowbox.jpg', label: 'Relieve Blanco Tiza' }
      ],
      formats: [
        { size: '10 × 10 cm', price: 19990, label: '10 × 10 cm' },
        { size: '15 × 15 cm', price: 34990, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 49990, label: '20 × 20 cm' },
        { size: '30 × 30 cm', price: 79990, label: '30 × 30 cm' }
      ]
    },
    {
      sku: 'SKU-VOL-02',
      id: 'volcan-osorno',
      name: 'Volcán Osorno y Lago Llanquihue · Cota Real 3D',
      shortName: 'Volcán Osorno',
      category: 'volcanes',
      collection: 'Volcanes de Chile',
      tag: 'CONO PERFECTO · BLANCO TIZA',
      badge: 'NUEVA COLECCIÓN · CONO PERFECTO',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      main: 'catalog/volcan-osorno-shadowbox.jpg',
      image: 'catalog/volcan-osorno-shadowbox.jpg',
      defaultImage: 'catalog/volcan-osorno-shadowbox.jpg',
      video: 'videos/reel-volcanes.mp4',
      description: 'Geometría cónica perfecta y relieve topográfico del lago en acabado blanco tiza de alta pureza arquitectónica.',
      specs: {
        escala: '1:1000 / 1:2000',
        tolerancia: '±0.20 mm',
        material: 'PLA Arquitectónico Blanco Tiza',
        marco: 'Shadowbox Negro Mate',
        origen: 'Cota Real DEM Satelital SRTM',
        acabado: 'Microestratificación 0.20 mm'
      },
      images: {
        shadowbox: 'catalog/volcan-osorno-shadowbox.jpg'
      },
      gallery: [
        { url: 'catalog/volcan-osorno-shadowbox.jpg', label: 'Marco Shadowbox' },
        { url: 'catalog/volcan-villarrica-detalle.jpg', label: 'Textura Cónica y Cota Real' },
        { url: 'catalog/volcan-villarrica-marco.jpg', label: 'Perspectiva de Exhibición' }
      ],
      formats: [
        { size: '10 × 10 cm', price: 19990, label: '10 × 10 cm' },
        { size: '15 × 15 cm', price: 34990, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 49990, label: '20 × 20 cm' },
        { size: 'Mural 4 Paneles', price: 149990, label: 'Mural 4 Paneles' }
      ]
    },
    {
      sku: 'SKU-SCL-01',
      id: 'santiago-costanera',
      name: 'Santiago · Costanera Center',
      shortName: 'Santiago Costanera',
      category: 'EDICION URBANA CHILE // CAPITAL',
      tag: 'TOP VENTAS · STOCK INMEDIATO',
      badge: 'MÁS VENDIDO · STOCK DISPONIBLE',
      leadTime: 'Despacho prioritario en 24 a 48 horas en Santiago',
      description: 'Malla morfológica tridimensional de alta precisión del centro financiero de Santiago y Gran Torre Costanera. Manufactura en PLA arquitectónico mate con marco perimetral de exhibición.',
      main: 'catalog/santiago-costanera-marco.jpg',
      image: 'catalog/santiago-costanera-marco.jpg',
      defaultImage: 'catalog/santiago-costanera-marco.jpg',
      specs: {
        escala: '1:2000',
        tolerancia: '±0.10 mm',
        material: 'PLA Arquitectónico Mate',
        marco: 'Aluminio Negro Anodizado o Madera',
        origen: 'Catastro Morfológico Urbano Santiago 3D',
        acabado: 'Mate Antirreflejo'
      },
      images: {
        marco: 'catalog/santiago-costanera-marco.jpg',
        sinMarco: 'catalog/santiago-costanera-sin-marco.jpg'
      },
      gallery: [
        { url: 'catalog/santiago-costanera-marco.jpg', label: 'Enmarcado Shadowbox' },
        { url: 'catalog/santiago-costanera-sin-marco.jpg', label: 'Relieve Puro Sin Marco' },
        { url: 'catalog/topografia-valle-detalle.jpg', label: 'Detalle Microarquitectónico' }
      ],
      formats: [
        { size: '10 × 10 cm', price: 9990, label: '10 × 10 cm' },
        { size: '15 × 15 cm', price: 19990, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 34990, label: '20 × 20 cm' },
        { size: 'Enmarcado 25 × 25 cm', price: 49990, label: 'Enmarcado 25 × 25 cm' }
      ]
    },
    {
      sku: 'SKU-CHI-02',
      id: 'chicago-cuadro',
      name: 'Chicago · Damero y Lago Michigan',
      shortName: 'Chicago',
      category: 'CIUDADES DEL MUNDO // USA',
      tag: 'CUADRO ENMARCADO · TEXTO 3D',
      badge: 'EDICIÓN INTERNACIONAL · LOOP 3D',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      description: 'Trama de rascacielos del Loop de Chicago con el río Chicago y ribera del Lago Michigan. Cuadro rígido con tipografía volumétrica integrada en relieve arquitectónico 3D.',
      main: 'catalog/chicago-cuadro.jpg',
      image: 'catalog/chicago-cuadro.jpg',
      defaultImage: 'catalog/chicago-cuadro.jpg',
      specs: {
        escala: '1:3500',
        tolerancia: '±0.15 mm',
        material: 'PLA Arquitectónico Gris Niebla y Blanco Mate',
        marco: 'Madera Esmaltada Negra con Montaje Integrado',
        origen: 'Levantamiento LIDAR Cuadrícula Urbana Loop Chicago',
        acabado: 'Volumetría con Tipografía 3D en Bajo Relieve'
      },
      images: {
        principal: 'catalog/chicago-cuadro.jpg'
      },
      gallery: [
        { url: 'catalog/chicago-cuadro.jpg', label: 'Cuadro Topográfico con Tipografía 3D' },
        { url: 'catalog/new-york-cuadro.jpg', label: 'Perspectiva Serie Ciudades' },
        { url: 'catalog/santiago-costanera-marco.jpg', label: 'Perfil de Enmarcado' }
      ],
      formats: [
        { size: '15 × 15 cm', price: 24990, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 39990, label: '20 × 20 cm' },
        { size: 'Enmarcado 30 × 30 cm', price: 59990, label: 'Enmarcado 30 × 30 cm' }
      ]
    },
    {
      sku: 'SKU-NYC-03',
      id: 'new-york-cuadro',
      name: 'New York · Manhattan y Río Hudson',
      shortName: 'New York',
      category: 'CIUDADES DEL MUNDO // USA',
      tag: 'CUADRO ENMARCADO · TEXTO 3D',
      badge: 'EDICIÓN INTERNACIONAL · MANHATTAN 3D',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      description: 'Topografía urbana densa de Manhattan entre el Río Hudson y East River. Rascacielos históricos y modernos en manufactura aditiva monocromática de máxima fidelidad.',
      main: 'catalog/new-york-cuadro.jpg',
      image: 'catalog/new-york-cuadro.jpg',
      defaultImage: 'catalog/new-york-cuadro.jpg',
      specs: {
        escala: '1:4000',
        tolerancia: '±0.15 mm',
        material: 'PLA Arquitectónico Blanco Tiza y Base Grafito',
        marco: 'Enmarcado Negro Shadowbox con Cristal de Protección',
        origen: 'Catastro Morfológico Isla de Manhattan y Central Park',
        acabado: 'Tipografía Volumétrica 3D Integrada'
      },
      images: {
        principal: 'catalog/new-york-cuadro.jpg'
      },
      gallery: [
        { url: 'catalog/new-york-cuadro.jpg', label: 'Manhattan en Relieve Blanco Tiza' },
        { url: 'catalog/chicago-cuadro.jpg', label: 'Perspectiva Serie Ciudades' },
        { url: 'catalog/santiago-costanera-marco.jpg', label: 'Perfil de Enmarcado' }
      ],
      formats: [
        { size: '15 × 15 cm', price: 24990, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 39990, label: '20 × 20 cm' },
        { size: 'Enmarcado 30 × 30 cm', price: 59990, label: 'Enmarcado 30 × 30 cm' }
      ]
    },
    {
      sku: 'SKU-GUI-04',
      id: 'piramides-guiza',
      name: 'Guiza · Pirámides de Egipto',
      shortName: 'Pirámides de Guiza',
      category: 'PATRIMONIO DE LA HUMANIDAD // EGIPTO',
      tag: 'TOPOGRAFIA ARQUEOLOGICA',
      badge: 'PATRIMONIO DE LA HUMANIDAD · GIS 3D',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      description: 'Topografía geoespacial de la meseta de Guiza con las pirámides de Keops, Kefrén y Micerino. Detalle de pendientes y textura desértica en microcapas FDM de alta resolución.',
      main: 'catalog/piramides-guiza.jpg',
      image: 'catalog/piramides-guiza.jpg',
      defaultImage: 'catalog/piramides-guiza.jpg',
      specs: {
        escala: '1:2500',
        tolerancia: '±0.15 mm',
        material: 'PLA Arquitectónico Tono Arena Tiza',
        marco: 'Shadowbox Negro Mate de Alto Impacto',
        origen: 'Fotogrametría Satelital Meseta Arqueológica',
        acabado: 'Curvas de Nivel FDM Microcapas 0.15 mm'
      },
      images: {
        principal: 'catalog/piramides-guiza.jpg'
      },
      gallery: [
        { url: 'catalog/piramides-guiza.jpg', label: 'Meseta Arqueológica de Guiza' },
        { url: 'catalog/volcan-villarrica-detalle.jpg', label: 'Detalle de Estratos y Curvas' },
        { url: 'catalog/topografia-valle-marco.jpg', label: 'Vista de Enmarcado' }
      ],
      formats: [
        { size: '15 × 15 cm', price: 22990, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 36990, label: '20 × 20 cm' },
        { size: 'Enmarcado 25 × 25 cm', price: 52990, label: 'Enmarcado 25 × 25 cm' }
      ]
    },
    {
      sku: 'SKU-MUR-05',
      id: 'relieve-modular-4paneles',
      name: 'Mural Cordillerano Modular (4 Paneles)',
      shortName: 'Mural Cordillerano Modular',
      category: 'ARTE TERRITORIAL // GRAN FORMATO',
      tag: 'MURAL 4 BALDOSAS · GRAN FORMATO',
      badge: 'ARTE TERRITORIAL · GRAN FORMATO',
      leadTime: 'Fabricación y calibración en taller · Despacho en 5 a 7 días hábiles',
      description: 'Instalación mural de gran formato compuesta por cuatro baldosas topográficas interconectadas. Ideal para salas de reuniones, recepciones corporativas y vestíbulos de despachos.',
      main: 'catalog/relieve-modular-4paneles.jpg',
      image: 'catalog/relieve-modular-4paneles.jpg',
      defaultImage: 'catalog/relieve-modular-4paneles.jpg',
      specs: {
        escala: '1:5000 Territorial',
        tolerancia: '±0.20 mm',
        material: 'PLA Arquitectónico Biobasado Ultra Blanco',
        marco: 'Sistema Modular Ensamble Oculto o Flotante',
        origen: 'Malla Batimétrica y Altimétrica SRTM 30 m',
        acabado: 'Continuidad Tridimensional entre Baldosas'
      },
      images: {
        principal: 'catalog/relieve-modular-4paneles.jpg'
      },
      gallery: [
        { url: 'catalog/relieve-modular-4paneles.jpg', label: 'Mural 4 Baldosas Modulares' },
        { url: 'catalog/topografia-valle-marco.jpg', label: 'Encuadre de Transición Territorial' },
        { url: 'catalog/topografia-valle-detalle.jpg', label: 'Detalle de Acople y Textura' }
      ],
      formats: [
        { size: '30 × 30 cm (Modular)', price: 79990, label: '30 × 30 cm (Modular)' },
        { size: '40 × 40 cm (Modular)', price: 119990, label: '40 × 40 cm (Modular)' }
      ]
    },
    {
      sku: 'SKU-TOP-06',
      id: 'topografia-valle-marco',
      name: 'Topografía Territorial · Valle y Cordillera',
      shortName: 'Topografía Territorial',
      category: 'MODELADO TERRITORIAL // CHILE',
      tag: 'MODELO TERRITORIAL GIS',
      badge: 'MODELO TERRITORIAL GIS · COTA REAL',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      description: 'Curvas de nivel GIS satelitales en relieve blanco mate puro. Captura la transición entre el valle central y los cordones montañosos con precisión micrométrica.',
      main: 'catalog/topografia-valle-marco.jpg',
      image: 'catalog/topografia-valle-marco.jpg',
      defaultImage: 'catalog/topografia-valle-marco.jpg',
      specs: {
        escala: '1:2500 / 1:5000',
        tolerancia: '±0.15 mm',
        material: 'PLA Arquitectónico Mate Blanco Tiza',
        marco: 'Shadowbox Negro Mate con Cristal Protector',
        origen: 'Levantamiento Altimétrico Digital de Elevación',
        acabado: 'Curvas Extruidas Capa a Capa'
      },
      images: {
        general: 'catalog/topografia-valle-marco.jpg',
        detalle: 'catalog/topografia-valle-detalle.jpg'
      },
      gallery: [
        { url: 'catalog/topografia-valle-marco.jpg', label: 'Cuadro Topográfico Valle Central' },
        { url: 'catalog/topografia-valle-detalle.jpg', label: 'Detalle de Curvas y Pendientes' },
        { url: 'catalog/volcan-osorno-shadowbox.jpg', label: 'Vista Lateral Shadowbox' }
      ],
      formats: [
        { size: '15 × 15 cm', price: 19990, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 34990, label: '20 × 20 cm' },
        { size: 'Enmarcado 25 × 25 cm', price: 49990, label: 'Enmarcado 25 × 25 cm' }
      ]
    },
    {
      sku: 'SKU-INS-07',
      id: 'insercion-arquitectura-contraste',
      name: 'Inserción Arquitectónica de Alto Contraste',
      shortName: 'Inserción Arquitectónica',
      category: 'DISENO CONCEPTUAL // BICOLOR',
      tag: 'ALTO CONTRASTE · NEGRO / BLANCO',
      badge: 'CONCEPTO BICOLOR · VOLUMETRÍA PURA',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      description: 'Enfoque volumétrico diferencial: topografía en sustrato negro azabache y propuesta arquitectónica en blanco puro para evidenciar la huella e inserción en el relieve.',
      main: 'catalog/insercion-arquitectura-contraste.jpg',
      image: 'catalog/insercion-arquitectura-contraste.jpg',
      defaultImage: 'catalog/insercion-arquitectura-contraste.jpg',
      specs: {
        escala: '1:500 / 1:1000',
        tolerancia: '±0.15 mm',
        material: 'PLA Dual: Base Negro Carbón y Volumetría Blanco Puro',
        marco: 'Montaje al Ras o Shadowbox Minimalista',
        origen: 'Diseño Paramétrico BIM y Geometría Topográfica',
        acabado: 'Contraste Óptico Mate de Alta Definición'
      },
      images: {
        principal: 'catalog/insercion-arquitectura-contraste.jpg'
      },
      gallery: [
        { url: 'catalog/insercion-arquitectura-contraste.jpg', label: 'Alto Contraste Arquitectónico' },
        { url: 'catalog/topografia-valle-detalle.jpg', label: 'Detalle de Encuentro y Relieve' },
        { url: 'catalog/santiago-costanera-sin-marco.jpg', label: 'Base de Sustrato Topográfico' }
      ],
      formats: [
        { size: '15 × 15 cm', price: 22990, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 38990, label: '20 × 20 cm' }
      ]
    },
    {
      sku: 'SKU-CUST-08',
      id: 'maqueta-a-medida',
      name: 'Maqueta a Medida · Proyecto Especial',
      shortName: 'Maqueta a Medida',
      category: 'PROYECTOS ARQUITECTONICOS A MEDIDA',
      tag: 'A MEDIDA · LEVANTAMIENTO GIS',
      badge: 'PROYECTO ESPECIAL · COTIZACIÓN A MEDIDA',
      leadTime: 'Tiempo estimado según escala y complejidad del modelo (5 a 12 días)',
      description: 'Manufactura a medida según levantamiento topográfico, plano CAD, modelo BIM o coordenadas satelitales específicas de su proyecto.',
      main: 'catalog/santiago-costanera-marco.jpg',
      image: 'catalog/santiago-costanera-marco.jpg',
      defaultImage: 'catalog/santiago-costanera-marco.jpg',
      specs: {
        escala: 'A definir según encargo (1:100 a 1:10000)',
        tolerancia: '±0.10 mm',
        material: 'PLA Arquitectónico, PETG o Resina Técnica',
        marco: 'Shadowbox, Base Flotante o Ensamble Modular',
        origen: 'Modelos CAD, BIM (Revit/Archicad), OBJ, STL o Coordenadas GIS',
        acabado: 'Monocromático Blanco Tiza, Gris o Bicolor'
      },
      images: {
        principal: 'catalog/santiago-costanera-marco.jpg'
      },
      gallery: [
        { url: 'catalog/santiago-costanera-marco.jpg', label: 'Ejemplo Modelo Urbano Enmarcado' },
        { url: 'catalog/topografia-valle-marco.jpg', label: 'Ejemplo Modelo Topográfico de Valle' },
        { url: 'catalog/relieve-modular-4paneles.jpg', label: 'Ejemplo Mural Modular a Medida' }
      ],
      formats: [
        { size: 'Formato Personalizado', price: 0, label: 'Presupuesto según escala' }
      ]
    },
    {
      sku: 'SKU-3D-09',
      id: 'servicio-impresion-3d',
      name: 'Servicio de Impresión 3D y Prototipado Arquitectónico',
      shortName: 'Impresión 3D Técnica',
      category: 'FABRICACION ADITIVA TECNICA',
      tag: 'PROTOTIPADO RAPIDO ±0.1 MM',
      badge: 'FABRICACIÓN ADITIVA · ALTA PRECISIÓN',
      leadTime: 'Cotización inmediata y despacho en 24 a 72 horas según volumen',
      description: 'Servicio de fabricación aditiva de precisión para oficinas de arquitectura, constructoras y estudiantes. PLA mate, filamentos técnicos y optimización de mallas.',
      main: 'catalog/topografia-valle-detalle.jpg',
      image: 'catalog/topografia-valle-detalle.jpg',
      defaultImage: 'catalog/topografia-valle-detalle.jpg',
      specs: {
        escala: 'Escala libre según dimensiones de cama de impresión',
        tolerancia: '±0.10 mm',
        material: 'PLA Mate, Tough PLA, PETG Arquitectónico',
        marco: 'Sin marco (Prototipo directo de manufactura)',
        origen: 'Archivos STL, STEP, 3MF o OBJ',
        acabado: 'Calidad de presentación sin rebabas ni hilos'
      },
      images: {
        principal: 'catalog/topografia-valle-detalle.jpg'
      },
      gallery: [
        { url: 'catalog/topografia-valle-detalle.jpg', label: 'Detalle de Acabado de Microcapa' },
        { url: 'catalog/volcan-villarrica-detalle.jpg', label: 'Definición de Curvas Complejas' },
        { url: 'catalog/santiago-costanera-sin-marco.jpg', label: 'Precisión Geométrica en Aristas' }
      ],
      formats: [
        { size: 'Servicio por Hora / Gramo', price: 0, label: 'Cotización según archivo 3D' }
      ]
    }
  ];

  // --- TARIFAS DE DESPACHO ---
  const SHIPPING_OPTIONS = {
    pickup: {
      id: 'pickup',
      label: 'Retiro en Taller (Santiago)',
      cost: 0,
      eta: 'Coordinacion directa al finalizar manufactura'
    },
    santiago: {
      id: 'santiago',
      label: 'Despacho Urbano Region Metropolitana',
      cost: 4990,
      eta: '24 a 48 hrs habiles post-manufactura'
    },
    regiones: {
      id: 'regiones',
      label: 'Envio Protegido a Regiones (Starken / Chilexpress)',
      cost: 7990,
      eta: '2 a 4 dias habiles post-manufactura'
    }
  };

  // --- METODOS DE PAGO DISPONIBLES ---
  const PAYMENT_METHODS = {
    flow: {
      id: 'flow',
      label: 'Flow.cl · Webpay, Tarjetas Débito / Crédito y Prepago',
      badge: 'PASARELA OFICIAL · WEBPAY PLUS',
      fee: 0,
      description: 'Pago en línea seguro mediante Flow.cl con tarjetas bancarias chilenas, Webpay, Redcompra, Mach y transferencia.'
    },
    transferencia: {
      id: 'transferencia',
      label: 'Transferencia Electronica Directa',
      badge: 'PROCESAMIENTO INMEDIATO',
      fee: 0,
      description: 'Transferencia directa a cuenta corporativa AR ARQ SpA con confirmacion inmediata.'
    },
    cotizacion: {
      id: 'cotizacion',
      label: 'Orden de Cotizacion Formal (Empresa / Oficina)',
      badge: 'DOCUMENTO OFICIAL PDF + CORREO',
      fee: 0,
      description: 'Recibe la cotizacion formal desglosada en tu correo para aprobacion o pago con Orden de Compra.'
    }
  };

  // Alias retrocompatible para solicitudes con identificador 'khipu' o 'transfer'
  PAYMENT_METHODS.khipu = PAYMENT_METHODS.flow;
  PAYMENT_METHODS.transfer = PAYMENT_METHODS.transferencia;

  // --- FUNCIONES DE CONVERSION MONETARIA CLP ---

  /**
   * Convierte cualquier representacion de precio en CLP a un entero numerico limpio.
   * Ejemplos: '$24.990 CLP' -> 24990, '$9.990' -> 9990, '34990' -> 34990
   * @param {string|number} priceInput
   * @returns {number}
   */
  function parseCLP(priceInput) {
    if (typeof priceInput === 'number') {
      return isNaN(priceInput) ? 0 : Math.round(priceInput);
    }
    if (!priceInput || typeof priceInput !== 'string') {
      return 0;
    }
    // Elimina signos de moneda, puntos de miles, letras y espacios
    const cleaned = priceInput.replace(/[^0-9]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Formatea un numero entero en formato formal chileno: '$24.990 CLP'
   * @param {number} amount
   * @returns {string}
   */
  function formatCLP(amount) {
    const numeric = Math.round(Number(amount) || 0);
    // Formateador con punto como separador de miles
    const parts = numeric.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${parts} CLP`;
  }

  // --- GENERADOR DE FOLIOS FORMALES ---

  /**
   * Genera un identificador formal de orden: AR-2026-XXXX
   * @returns {string}
   */
  function generateOrderFolio() {
    const year = new Date().getFullYear();
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      code += chars.charAt(idx);
    }
    return `AR-${year}-${code}`;
  }

  // --- BUSCADOR EN EL CATÁLOGO ---

  /**
   * Obtiene un producto por su SKU
   * @param {string} sku
   * @returns {object|null}
   */
  function getProductBySku(sku) {
    if (!sku) return null;
    const target = String(sku).trim().toUpperCase();
    return CATALOG_PRODUCTS.find(p => p.sku && p.sku.toUpperCase() === target) || null;
  }

  /**
   * Obtiene un producto por su ID único
   * @param {string} id
   * @returns {object|null}
   */
  function getProductById(id) {
    if (!id) return null;
    const target = String(id).trim().toLowerCase();
    return CATALOG_PRODUCTS.find(p => p.id && p.id.toLowerCase() === target) || null;
  }

  /**
   * Obtiene un producto por su nombre o nombre corto
   * @param {string} name
   * @returns {object|null}
   */
  function getProductByName(name) {
    if (!name) return null;
    const clean = String(name).trim().toLowerCase();
    return CATALOG_PRODUCTS.find(p =>
      (p.name && p.name.toLowerCase().includes(clean)) ||
      (p.shortName && p.shortName.toLowerCase().includes(clean))
    ) || null;
  }

  /**
   * Obtiene los detalles completos de un producto por SKU, ID o coincidencia de nombre.
   * Devuelve el producto enriquecido con galeria normalizada, formatos con precios formateados,
   * especificaciones y tiempos de entrega para alimentar la vista ampliada de producto con zoom.
   * @param {string} skuOrId
   * @returns {object|null}
   */
  function getProductDetails(skuOrId) {
    if (!skuOrId) return null;
    const raw = String(skuOrId).trim();
    const target = raw.toLowerCase();
    const targetUpper = raw.toUpperCase();

    // 1. Busqueda prioritaria por ID exacto
    let product = CATALOG_PRODUCTS.find(p => p.id && p.id.toLowerCase() === target);

    // 2. Busqueda por SKU exacto
    if (!product) {
      product = CATALOG_PRODUCTS.find(p => p.sku && p.sku.toUpperCase() === targetUpper);
    }

    // 3. Busqueda secundaria por coincidencia parcial en ID, SKU o nombre
    if (!product) {
      product = CATALOG_PRODUCTS.find(p =>
        (p.id && p.id.toLowerCase().includes(target)) ||
        (p.sku && p.sku.toUpperCase().includes(targetUpper)) ||
        (p.name && p.name.toLowerCase().includes(target)) ||
        (p.shortName && p.shortName.toLowerCase().includes(target))
      );
    }

    if (!product) return null;

    // Normalizar imagen principal
    const mainImg = product.main || product.image || product.defaultImage || 'catalog/santiago-costanera-marco.jpg';

    // Normalizar galeria asegurando al menos una imagen
    let gallery = Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery.slice()
      : [{ url: mainImg, label: product.shortName || product.name }];

    // Si gallery no incluye la imagen principal al inicio, asegurarla
    if (!gallery.some(item => item.url === mainImg)) {
      gallery.unshift({ url: mainImg, label: product.shortName || 'Vista Principal' });
    }

    // Formatear opciones de precios
    const formats = (product.formats || []).map(f => ({
      ...f,
      formattedPrice: f.price > 0 ? formatCLP(f.price) : 'A convenir / Cotización'
    }));

    const basePrice = formats.length > 0 ? formats[0].price : 0;
    const formattedBasePrice = basePrice > 0 ? formatCLP(basePrice) : 'A cotizar';

    return {
      ...product,
      main: mainImg,
      gallery,
      formats,
      basePrice,
      formattedBasePrice,
      specs: product.specs || {},
      badge: product.badge || product.tag || 'ALZADO ROJO',
      leadTime: product.leadTime || 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile'
    };
  }

  /**
   * Retorna todo el catalogo oficial
   * @returns {Array}
   */
  function getAllProducts() {
    return CATALOG_PRODUCTS.slice();
  }

  // --- CALCULO DE TOTALES ---

  /**
   * Calcula el desglose financiero de la orden
   * @param {object} params
   * @param {number|string} params.unitPrice
   * @param {number} [params.quantity=1]
   * @param {string} [params.shippingId='pickup']
   * @param {number} [params.customShippingCost=null]
   * @returns {object}
   */
  function calculateTotals({ unitPrice, quantity = 1, shippingId = 'pickup', customShippingCost = null }) {
    const cleanUnitPrice = parseCLP(unitPrice);
    const cleanQty = Math.max(1, parseInt(quantity, 10) || 1);

    let cleanShippingCost = 0;
    if (customShippingCost !== null && !isNaN(customShippingCost)) {
      cleanShippingCost = Math.max(0, Math.round(Number(customShippingCost)));
    } else if (SHIPPING_OPTIONS[shippingId]) {
      cleanShippingCost = SHIPPING_OPTIONS[shippingId].cost;
    }

    const subtotal = cleanUnitPrice * cleanQty;
    const total = subtotal + cleanShippingCost;

    return {
      unitPrice: cleanUnitPrice,
      quantity: cleanQty,
      subtotal,
      shippingId,
      shippingCost: cleanShippingCost,
      total,
      formatted: {
        unitPrice: formatCLP(cleanUnitPrice),
        subtotal: formatCLP(subtotal),
        shippingCost: cleanShippingCost === 0 ? 'Sin Costo ($0 CLP)' : formatCLP(cleanShippingCost),
        total: formatCLP(total)
      }
    };
  }

  // --- VALIDACION DE DATOS DE CLIENTE ---

  /**
   * Valida la estructura de los datos del cliente
   * @param {object} customer
   * @param {boolean} [requiresShipping=false]
   * @returns {{ valid: boolean, errors: object }}
   */
  function validateCustomerData(customer, requiresShipping = false) {
    const errors = {};
    customer = customer || {};

    // Nombre completo o Razon Social
    const name = (customer.name || customer.fullName || '').trim();
    if (!name || name.length < 3) {
      errors.name = 'Ingrese un nombre o razon social valido (minimo 3 caracteres).';
    }

    // Correo electronico
    const email = (customer.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = 'Ingrese una direccion de correo electronico valida.';
    }

    // Telefono de contacto
    const phone = (customer.phone || '').trim().replace(/[\s\-()]/g, '');
    if (!phone || phone.length < 8) {
      errors.phone = 'Ingrese un telefono de contacto valido (minimo 8 digitos).';
    }

    // Direccion y comuna (si requiere despacho)
    if (requiresShipping) {
      const address = (customer.address || '').trim();
      if (!address || address.length < 5) {
        errors.address = 'Ingrese la calle y numero para el despacho.';
      }
      const commune = (customer.commune || customer.city || '').trim();
      if (!commune || commune.length < 2) {
        errors.commune = 'Indique la comuna y ciudad de destino.';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  // --- PERSISTENCIA EN STORAGE LOCAL ---

  /**
   * Guarda una orden en el historial local del navegador
   * @param {object} order
   * @returns {boolean}
   */
  function saveOrderToStorage(order) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      window.localStorage.setItem(CONFIG.storageKeyLast, JSON.stringify(order));

      const rawHistory = window.localStorage.getItem(CONFIG.storageKeyHistory);
      let history = [];
      if (rawHistory) {
        try {
          history = JSON.parse(rawHistory);
        } catch (e) {
          history = [];
        }
      }
      if (!Array.isArray(history)) history = [];

      // Evita duplicados por folio y anade al inicio
      history = history.filter(item => item.folio !== order.folio);
      history.unshift(order);

      // Limita a las ultimas 30 ordenes
      if (history.length > 30) {
        history = history.slice(0, 30);
      }

      window.localStorage.setItem(CONFIG.storageKeyHistory, JSON.stringify(history));
      return true;
    } catch (errStorage) {
      console.warn('[ALZADO ROJO Backend] Error al persistir orden en localStorage:', errStorage);
      return false;
    }
  }

  /**
   * Obtiene la ultima orden procesada desde localStorage
   * @returns {object|null}
   */
  function getLastOrder() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(CONFIG.storageKeyLast);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Obtiene el historial completo de ordenes
   * @returns {Array}
   */
  function getOrdersHistory() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const raw = window.localStorage.getItem(CONFIG.storageKeyHistory);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // --- CONSTRUCCION DE PAYLOAD FORMAL PARA CORREO ---

  /**
   * Prepara el payload con formato de tabla y auto-respuesta para FormSubmit
   * @param {object} order
   * @returns {object}
   */
  function buildFormalEmailPayload(order) {
    const customer = order.customer || {};
    const shipping = SHIPPING_OPTIONS[order.shippingId] || {
      label: order.shippingLabel || 'Retiro en Taller (Santiago)',
      cost: order.shippingCost || 0
    };
    const payment = PAYMENT_METHODS[order.paymentMethod] || {
      label: order.paymentLabel || 'Flow.cl · Webpay, Tarjetas Débito / Crédito y Prepago'
    };

    let statusText = 'PAGO ONLINE FLOW.CL (WEBPAY / TARJETAS) INICIADO';
    if (order.paymentMethod === 'transferencia' || order.paymentMethod === 'transfer') {
      statusText = 'ORDEN EMITIDA · TRANSFERENCIA DIRECTA PENDIENTE';
    } else if (order.paymentMethod === 'cotizacion') {
      statusText = 'COTIZACION FORMAL SOLICITADA';
    }

    const autoresponseMessage = [
      'ALZADO ROJO · AR ARQ SpA',
      'Arquitectura y Fabricacion Digital',
      `Santiago, Chile | ${CONFIG.officialEmail} | ${CONFIG.officialPhone}`,
      '',
      'ESTIMADO/A CLIENTE:',
      'Hemos registrado con exito su orden formal. A continuacion encuentra el resumen oficial del pedido emitido:',
      '',
      `FOLIO OFICIAL: ${order.folio}`,
      `FECHA DE EMISION: ${order.dateIso || new Date().toLocaleString('es-CL')}`,
      `ESTADO: ${statusText}`,
      '',
      `PRODUCTO: ${order.productName}`,
      `SKU: ${order.sku}`,
      `FORMATO / TAMANO: ${order.size}`,
      `ACABADO / VARIANTE: ${order.finish || 'Estandar'}`,
      `CANTIDAD: ${order.quantity} unidad(es)`,
      `VALOR UNITARIO: ${formatCLP(order.unitPrice)}`,
      `SUBTOTAL: ${formatCLP(order.subtotal)}`,
      `MODALIDAD DE ENTREGA: ${shipping.label} (${shipping.cost === 0 ? 'Sin Costo' : formatCLP(shipping.cost)})`,
      `TOTAL DE LA ORDEN: ${formatCLP(order.total)}`,
      `METODO DE PAGO: ${payment.label}`,
      '',
      'DATOS REGISTRADOS:',
      `Nombre / Razon Social: ${customer.name || 'No informado'}`,
      `RUT: ${customer.rut || 'No informado'}`,
      `Correo: ${customer.email || 'No informado'}`,
      `Telefono: ${customer.phone || 'No informado'}`,
      `Direccion / Comuna: ${customer.address ? `${customer.address}, ${customer.commune || ''}` : 'Retiro en Taller'}`,
      '',
      'INSTRUCCIONES DE CONTINUIDAD:',
      '- Si su orden es con Pago en Linea Flow.cl (Webpay / Tarjetas), su transaccion es procesada y validada de forma automatica e integrada.',
      `- Si su orden es con Transferencia Directa, transfiera a ${BANK_DETAILS.accountType} ${BANK_DETAILS.accountHolder} (${BANK_DETAILS.bank}, N° ${BANK_DETAILS.accountNumber}, RUT ${BANK_DETAILS.rut}) e indique su Folio en la referencia.`,
      '- Si solicito Cotizacion Formal, este respaldo certifica la reserva de tarifas por 15 dias corridos para la gestion de su Orden de Compra.',
      '- Nuestro equipo tecnico revisara el modelo y coordinara el avance de manufactura aditiva.',
      '',
      'Atentamente,',
      'Equipo ALZADO ROJO · AR ARQ SpA'
    ].join('\n');

    return {
      _subject: `ORDEN DE PEDIDO #${order.folio} | ${order.productName} (${order.size}) - ALZADO ROJO`,
      _template: 'table',
      _captcha: 'false',
      _replyto: customer.email || CONFIG.officialEmail,
      _cc: customer.email || undefined,
      _autoresponse: autoresponseMessage,

      // Campos tabulares ordenados
      '01_Folio_Orden': order.folio,
      '02_Fecha_Emision': order.dateIso || new Date().toLocaleString('es-CL'),
      '03_Estado_Operacion': statusText,
      '04_Producto_SKU': `${order.productName} [${order.sku}]`,
      '05_Especificacion_Formato': order.size,
      '06_Acabado_Materialidad': order.finish || 'Manufactura PLA Mate Arquitectonico',
      '07_Cantidad_Unidades': String(order.quantity),
      '08_Valor_Unitario': formatCLP(order.unitPrice),
      '09_Subtotal_Productos': formatCLP(order.subtotal),
      '10_Modalidad_Despacho': shipping.label,
      '11_Costo_Despacho': shipping.cost === 0 ? 'Sin Costo ($0 CLP)' : formatCLP(shipping.cost),
      '12_TOTAL_ORDEN_CLP': formatCLP(order.total),
      '13_Metodo_Pago_Seleccionado': payment.label,
      '14_Cliente_Nombre_Razon_Social': customer.name || '',
      '15_Cliente_RUT': customer.rut || 'No aplica / Persona Natural',
      '16_Cliente_Correo': customer.email || '',
      '17_Cliente_Telefono': customer.phone || '',
      '18_Direccion_Comuna_Entrega': customer.address ? `${customer.address}, ${customer.commune || ''}` : 'Retiro presencial en taller',
      '19_Notas_Especificaciones': order.notes || 'Sin especificaciones complementarias'
    };
  }

  // --- CONSTRUCCION DE URL DE WHATSAPP OFICIAL ---

  /**
   * Genera el enlace directo a WhatsApp con el mensaje estructurado de la orden
   * @param {object} order
   * @returns {string}
   */
  function buildWhatsAppOrderUrl(order) {
    const customer = order.customer || {};
    const shipping = SHIPPING_OPTIONS[order.shippingId] || {
      label: order.shippingLabel || 'Retiro en Taller (Santiago)',
      cost: order.shippingCost || 0
    };
    const payment = PAYMENT_METHODS[order.paymentMethod] || {
      label: order.paymentLabel || 'Flow.cl · Webpay, Tarjetas Débito / Crédito y Prepago'
    };

    const lines = [
      'ORDEN DE PEDIDO ALZADO ROJO',
      `Folio: ${order.folio}`,
      `Fecha: ${order.dateFormatted || new Date().toLocaleDateString('es-CL')}`,
      '',
      'DETALLE DEL PRODUCTO:',
      `- Modelo: ${order.productName}`,
      `- SKU: ${order.sku}`,
      `- Formato: ${order.size}`,
      `- Acabado: ${order.finish || 'Estandar'}`,
      `- Cantidad: ${order.quantity} unidad(es)`,
      `- Subtotal: ${formatCLP(order.subtotal)}`,
      '',
      'MODALIDAD DE ENTREGA:',
      `- Modalidad: ${shipping.label}`,
      `- Costo Despacho: ${shipping.cost === 0 ? 'Sin Costo ($0 CLP)' : formatCLP(shipping.cost)}`,
      '',
      'TOTALIZACION COMERCIAL:',
      `- TOTAL A PAGAR: ${formatCLP(order.total)}`,
      `- Metodo de Pago: ${payment.label}`,
      '',
      'DATOS DEL CLIENTE:',
      `- Nombre: ${customer.name || 'No informado'}`,
      `- RUT: ${customer.rut || 'No informado'}`,
      `- Correo: ${customer.email || 'No informado'}`,
      `- Telefono: ${customer.phone || 'No informado'}`,
      `- Direccion: ${customer.address ? `${customer.address}, ${customer.commune || ''}` : 'Retiro en Taller'}`
    ];

    if (order.notes && order.notes.trim()) {
      lines.push('');
      lines.push(`NOTAS: ${order.notes.trim()}`);
    }

    const messageText = lines.join('\n');
    return `https://wa.me/${CONFIG.whatsappPhoneRaw}?text=${encodeURIComponent(messageText)}`;
  }

  // --- GENERADOR DE COTIZACIÓN FORMAL EDITORIAL / COMPROBANTE IMPRIMIBLE ---

  /**
   * Construye un documento HTML autocontenido con diseno Editorial Suizo
   * para impresion o guardado como PDF formal.
   * Cero emojis, cero ampersands, membrete formal AR ARQ SpA.
   * @param {object} order
   * @returns {string}
   */
  function generatePrintableQuoteHTML(order) {
    const customer = order.customer || {};
    const shipping = SHIPPING_OPTIONS[order.shippingId] || {
      label: order.shippingLabel || 'Retiro en Taller (Santiago)',
      cost: order.shippingCost || 0
    };
    const payment = PAYMENT_METHODS[order.paymentMethod] || {
      label: order.paymentLabel || 'Flow.cl · Webpay, Tarjetas Débito / Crédito y Prepago'
    };

    const isQuote = order.paymentMethod === 'cotizacion';
    const docTitle = isQuote ? 'COTIZACION FORMAL' : 'ORDEN DE COMPRA Y COMPROBANTE';
    const dateStr = order.dateFormatted || new Date().toLocaleDateString('es-CL');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docTitle} ${order.folio} | ALZADO ROJO</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 15mm 20mm 15mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #111111;
            background: #FFFFFF;
            font-size: 11pt;
            line-height: 1.45;
            padding: 30px;
            max-width: 820px;
            margin: 0 auto;
        }
        .no-print-bar {
            background: #0D0D0D;
            color: #FFFFFF;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            border-left: 3px solid #C82333;
        }
        .no-print-bar span {
            font-size: 9pt;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
        .btn-action {
            background: #C82333;
            color: #FFFFFF;
            border: none;
            padding: 8px 16px;
            font-size: 9pt;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            cursor: pointer;
            margin-left: 8px;
            text-decoration: none;
            display: inline-block;
        }
        .btn-action.secondary {
            background: #2B2B2B;
        }
        .btn-action:hover {
            opacity: 0.9;
        }
        header.doc-header {
            border-bottom: 2px solid #111111;
            padding-bottom: 16px;
            margin-bottom: 22px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .brand-block h1 {
            font-size: 18pt;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: #111111;
        }
        .brand-block h1 span {
            color: #C82333;
        }
        .brand-block p {
            font-size: 8pt;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #555555;
            margin-top: 2px;
        }
        .brand-meta {
            font-size: 8.5pt;
            color: #444444;
            margin-top: 6px;
            line-height: 1.35;
        }
        .folio-block {
            text-align: right;
        }
        .doc-type-badge {
            display: inline-block;
            background: #111111;
            color: #FFFFFF;
            font-size: 8pt;
            font-weight: 700;
            letter-spacing: 0.12em;
            padding: 4px 10px;
            text-transform: uppercase;
            margin-bottom: 6px;
        }
        .folio-number {
            font-size: 15pt;
            font-weight: 700;
            letter-spacing: 0.06em;
            color: #C82333;
        }
        .folio-date {
            font-size: 8.5pt;
            color: #555555;
            margin-top: 2px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 22px;
            padding-bottom: 16px;
            border-bottom: 1px solid #E5E5E5;
        }
        .info-box h3 {
            font-size: 8pt;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #C82333;
            margin-bottom: 8px;
            border-bottom: 1px solid #C82333;
            padding-bottom: 3px;
        }
        .info-box table {
            width: 100%;
            font-size: 9pt;
            border-collapse: collapse;
        }
        .info-box table td {
            padding: 2px 0;
            vertical-align: top;
        }
        .info-box table td.label {
            color: #666666;
            width: 38%;
            font-weight: 500;
        }
        .info-box table td.val {
            color: #111111;
            font-weight: 600;
        }
        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }
        table.items-table th {
            background: #F4F4F4;
            color: #111111;
            font-size: 8pt;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 8px 10px;
            border-top: 1px solid #111111;
            border-bottom: 1px solid #111111;
            text-align: left;
        }
        table.items-table th.tar,
        table.items-table td.tar {
            text-align: right;
        }
        table.items-table td {
            padding: 10px 10px;
            font-size: 9pt;
            border-bottom: 1px solid #EAEAEA;
            vertical-align: top;
        }
        .item-main-title {
            font-weight: 700;
            color: #111111;
            font-size: 9.5pt;
        }
        .item-sub-desc {
            font-size: 8pt;
            color: #555555;
            margin-top: 3px;
        }
        .summary-wrap {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 22px;
        }
        table.summary-table {
            width: 45%;
            border-collapse: collapse;
            font-size: 9pt;
        }
        table.summary-table td {
            padding: 4px 8px;
        }
        table.summary-table td.label {
            color: #555555;
            text-align: left;
        }
        table.summary-table td.val {
            text-align: right;
            font-weight: 600;
            color: #111111;
        }
        table.summary-table tr.total-row td {
            border-top: 2px solid #111111;
            border-bottom: 2px solid #111111;
            padding: 8px 8px;
            font-size: 11pt;
            font-weight: 700;
        }
        table.summary-table tr.total-row td.val {
            color: #C82333;
        }
        .notes-section {
            background: #F9F9F9;
            border-left: 3px solid #111111;
            padding: 12px 16px;
            margin-bottom: 20px;
            font-size: 8.5pt;
            color: #333333;
            line-height: 1.45;
        }
        .notes-section h4 {
            font-size: 8pt;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #111111;
            margin-bottom: 5px;
        }
        .bank-box {
            border: 1px solid #DEDEDE;
            padding: 12px 16px;
            margin-bottom: 20px;
            font-size: 8.5pt;
        }
        .bank-box h4 {
            font-size: 8pt;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #C82333;
            margin-bottom: 6px;
        }
        .bank-box-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            font-size: 8.5pt;
            color: #333333;
        }
        footer.doc-footer {
            border-top: 1px solid #DEDEDE;
            padding-top: 12px;
            font-size: 7.5pt;
            color: #777777;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        @media print {
            body {
                padding: 0;
            }
            .no-print-bar {
                display: none !important;
            }
        }
    </style>
</head>
<body>

    <div class="no-print-bar">
        <span>DOCUMENTO FORMAL OFICIAL // ALZADO ROJO</span>
        <div>
            <button type="button" class="btn-action" onclick="window.print()">IMPRIMIR / GUARDAR PDF</button>
            <button type="button" class="btn-action secondary" onclick="window.close()">CERRAR</button>
        </div>
    </div>

    <header class="doc-header">
        <div class="brand-block">
            <h1>ALZADO <span>ROJO</span></h1>
            <p>${CONFIG.subTitle}</p>
            <div class="brand-meta">
                ${CONFIG.businessName} · RUT ${BANK_DETAILS.rut}<br>
                ${CONFIG.cityCountry} · ${CONFIG.officialEmail} · ${CONFIG.officialPhone}
            </div>
        </div>
        <div class="folio-block">
            <div class="doc-type-badge">${docTitle}</div>
            <div class="folio-number">${order.folio}</div>
            <div class="folio-date">Emision: ${dateStr}</div>
            <div class="folio-date">Validez: ${CONFIG.quoteValidityDays} dias corridos</div>
        </div>
    </header>

    <section class="info-grid">
        <div class="info-box">
            <h3>DATOS DEL CLIENTE / RECEPTOR</h3>
            <table>
                <tr>
                    <td class="label">Razon Social / Nombre:</td>
                    <td class="val">${customer.name || 'Cliente Particular'}</td>
                </tr>
                <tr>
                    <td class="label">RUT / Identificacion:</td>
                    <td class="val">${customer.rut || 'No informado'}</td>
                </tr>
                <tr>
                    <td class="label">Correo Electronico:</td>
                    <td class="val">${customer.email || 'No informado'}</td>
                </tr>
                <tr>
                    <td class="label">Telefono de Contacto:</td>
                    <td class="val">${customer.phone || 'No informado'}</td>
                </tr>
            </table>
        </div>
        <div class="info-box">
            <h3>MODALIDAD Y PAGO</h3>
            <table>
                <tr>
                    <td class="label">Entrega:</td>
                    <td class="val">${shipping.label}</td>
                </tr>
                <tr>
                    <td class="label">Destino:</td>
                    <td class="val">${customer.address ? `${customer.address}, ${customer.commune || ''}` : 'Retiro en Taller (Santiago)'}</td>
                </tr>
                <tr>
                    <td class="label">Metodo de Pago:</td>
                    <td class="val">${payment.label}</td>
                </tr>
                <tr>
                    <td class="label">Plazo Manufactura:</td>
                    <td class="val">2 a 4 dias habiles post-confirmacion</td>
                </tr>
            </table>
        </div>
    </section>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 8%;">ITEM</th>
                <th style="width: 46%;">DESCRIPCION TECNICA Y MATERIALIDAD</th>
                <th style="width: 16%;">SKU / FORMATO</th>
                <th style="width: 8%;" class="tar">CANT.</th>
                <th style="width: 11%;" class="tar">VALOR UNIT.</th>
                <th style="width: 11%;" class="tar">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>01</td>
                <td>
                    <div class="item-main-title">${order.productName}</div>
                    <div class="item-sub-desc">
                        Manufactura aditiva de alta precision (±0.1 mm) en PLA Mate biobasado arquitectonico.
                        Acabado superficial continuo libre de brillos sinteticos. Variante: ${order.finish || 'Estandar'}.
                    </div>
                </td>
                <td>
                    <strong>${order.sku}</strong><br>
                    <span>${order.size}</span>
                </td>
                <td class="tar">${order.quantity}</td>
                <td class="tar">${formatCLP(order.unitPrice)}</td>
                <td class="tar"><strong>${formatCLP(order.subtotal)}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="summary-wrap">
        <table class="summary-table">
            <tr>
                <td class="label">Subtotal Productos:</td>
                <td class="val">${formatCLP(order.subtotal)}</td>
            </tr>
            <tr>
                <td class="label">Despacho / Entrega:</td>
                <td class="val">${shipping.cost === 0 ? 'Sin Costo ($0 CLP)' : formatCLP(shipping.cost)}</td>
            </tr>
            <tr class="total-row">
                <td class="label">TOTAL FINAL:</td>
                <td class="val">${formatCLP(order.total)}</td>
            </tr>
        </table>
    </div>

    <section class="bank-box">
        <h4>DATOS BANCARIOS OFICIALES PARA TRANSFERENCIA</h4>
        <div class="bank-box-grid">
            <div><strong>Razon Social:</strong> ${BANK_DETAILS.accountHolder}</div>
            <div><strong>RUT:</strong> ${BANK_DETAILS.rut}</div>
            <div><strong>Banco:</strong> ${BANK_DETAILS.bank}</div>
            <div><strong>Tipo de Cuenta:</strong> ${BANK_DETAILS.accountType}</div>
            <div><strong>Numero Cuenta:</strong> ${BANK_DETAILS.accountNumber}</div>
            <div><strong>Correo de Envio:</strong> ${BANK_DETAILS.email}</div>
        </div>
    </section>

    <section class="notes-section">
        <h4>CONDICIONES COMERCIALES Y DE FABRICACION</h4>
        <p>
            1. Manufactura y Garantia: Toda pieza es fabricada a pedido con controles de tolerancia milimetrica. Incluye garantia tecnica por defectos de manufactura.<br>
            2. Despacho: Embalaje reforzado con perfiles esquineros y camara de amortiguacion para resguardo integral del relieve topografico.<br>
            3. Validez de Precios: Presupuesto garantizado por 15 dias corridos desde la fecha de emision para facturacion u orden de compra.
        </p>
    </section>

    <footer class="doc-footer">
        <div>ALZADO ROJO · AR ARQ SpA · Santiago, Chile · Documento Generado Electronicamente</div>
        <div>Folio ${order.folio} · Pagina 1 de 1</div>
    </footer>

</body>
</html>`;
  }

  /**
   * Abre la cotizacion formal en una nueva ventana y lanza el dialogo de impresion
   * @param {object} order
   * @returns {Window|null}
   */
  function openQuotePrintWindow(order) {
    if (typeof window === 'undefined') return null;
    const html = generatePrintableQuoteHTML(order);
    const printWin = window.open('', '_blank', 'width=900,height=800,menubar=no,toolbar=no,status=no');
    if (!printWin) {
      alert('Por favor permita las ventanas emergentes para generar el documento oficial imprimible.');
      return null;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    return printWin;
  }

  // --- ORQUESTADOR PRINCIPAL DE PROCESAMIENTO DE ORDENES ---

  /**
   * Procesa, valida, persiste y despacha una orden formal
   * @param {object} orderData
   * @returns {Promise<{ ok: boolean, order: object, flowResult?: object, khipuResult?: object, whatsappUrl: string, errors?: object }>}
   */
  async function submitOrder(orderData) {
    orderData = orderData || {};

    const shippingId = orderData.shippingId || 'pickup';
    const requiresShipping = shippingId !== 'pickup';

    // 1. Validacion de datos de contacto
    const customerValidation = validateCustomerData(orderData.customer, requiresShipping);
    if (!customerValidation.valid) {
      return {
        ok: false,
        errors: customerValidation.errors,
        message: 'Por favor complete todos los datos requeridos.'
      };
    }

    // 2. Busqueda de SKU o defaults
    let product = getProductBySku(orderData.sku);
    if (!product && orderData.productName) {
      product = getProductByName(orderData.productName);
    }

    const sku = orderData.sku || (product ? product.sku : 'SKU-CUSTOM');
    const productName = orderData.productName || (product ? product.name : 'Maqueta Arquitectonica Especial');
    const size = orderData.size || 'Formato Estandar';
    const finish = orderData.finish || (orderData.viewCaption || 'Acabado Estandar');

    // 3. Calculo estricto de valores
    const totals = calculateTotals({
      unitPrice: orderData.unitPrice,
      quantity: orderData.quantity || 1,
      shippingId: shippingId,
      customShippingCost: orderData.shippingCost
    });

    const now = new Date();
    const folio = orderData.folio || generateOrderFolio();

    // Normalizacion de metodo de pago con alias retrocompatible
    let selectedMethod = orderData.paymentMethod || 'transferencia';
    if (selectedMethod === 'khipu') {
      selectedMethod = 'flow';
    } else if (selectedMethod === 'transfer') {
      selectedMethod = 'transferencia';
    }

    const normalizedOrder = {
      folio,
      sku,
      productName,
      size,
      finish,
      quantity: totals.quantity,
      unitPrice: totals.unitPrice,
      subtotal: totals.subtotal,
      shippingId: totals.shippingId,
      shippingCost: totals.shippingCost,
      shippingLabel: SHIPPING_OPTIONS[totals.shippingId]?.label || 'Retiro en Taller',
      total: totals.total,
      paymentMethod: selectedMethod,
      paymentLabel: PAYMENT_METHODS[selectedMethod]?.label || 'Transferencia Electronica Directa',
      customer: {
        name: (orderData.customer?.name || '').trim(),
        rut: (orderData.customer?.rut || '').trim(),
        email: (orderData.customer?.email || '').trim(),
        phone: (orderData.customer?.phone || '').trim(),
        address: (orderData.customer?.address || '').trim(),
        commune: (orderData.customer?.commune || orderData.customer?.city || '').trim()
      },
      notes: (orderData.notes || '').trim(),
      dateIso: now.toISOString(),
      dateFormatted: now.toLocaleDateString('es-CL'),
      status: 'REGISTRADA'
    };

    // 4. Persistencia local
    saveOrderToStorage(normalizedOrder);

    // 5. Envio a FormSubmit (receptor corporativo oficial)
    let formSubmitSuccess = false;
    try {
      const emailPayload = buildFormalEmailPayload(normalizedOrder);
      const emailRes = await fetch(CONFIG.formSubmitEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });
      formSubmitSuccess = emailRes.ok;
    } catch (errEmail) {
      console.warn('[ALZADO ROJO Backend] Error al emitir correo via FormSubmit:', errEmail);
    }

    // 6. Gestion Flow.cl si corresponde (incluye retrocompatibilidad para alias 'khipu')
    let flowResult = null;
    if (normalizedOrder.paymentMethod === 'flow' || normalizedOrder.paymentMethod === 'khipu') {
      try {
        // Blindaje anti-error para Flow: Si el monto es <= 0 (ej. Medida Especial), asignar abono base de $29.990 CLP
        if (!normalizedOrder.total || normalizedOrder.total <= 0) {
          normalizedOrder.unitPrice = 29990;
          normalizedOrder.subtotal = 29990;
          normalizedOrder.total = 29990;
          normalizedOrder.notes = (normalizedOrder.notes ? normalizedOrder.notes + ' · ' : '') + 'Abono base inicial de manufactura ($29.990 CLP) para procesamiento en Flow.cl';
        }

        const flowPayload = {
          orderId: normalizedOrder.folio,
          subject: `Orden ALZADO ROJO ${normalizedOrder.folio} | ${normalizedOrder.productName} (${normalizedOrder.size})`.slice(0, 250),
          amount: Math.round(Number(normalizedOrder.total)),
          currency: 'CLP',
          payer_email: normalizedOrder.customer.email,
          payer_name: normalizedOrder.customer.name,
          body: `${normalizedOrder.productName} · Formato: ${normalizedOrder.size} · Entrega: ${normalizedOrder.shippingLabel}`
        };

        const flowEndpoint = CONFIG.flowEndpoint || '/api/flow-create';
        const flowRes = await fetch(flowEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(flowPayload)
        });

        if (flowRes.ok) {
          flowResult = await flowRes.json();
        } else {
          let errData = null;
          try {
            errData = await flowRes.json();
          } catch (e) {
            errData = { error: 'Error de comunicacion con el servidor' };
          }
          flowResult = {
            ok: false,
            gateway: 'flow',
            error: errData.error || 'Respuesta no exitosa de Flow.cl',
            code: errData.code,
            orderId: normalizedOrder.folio,
            whatsappFallback: errData.whatsappFallback || buildWhatsAppOrderUrl(normalizedOrder)
          };
        }
      } catch (errFlow) {
        console.warn('[ALZADO ROJO Backend] Error de red en invocacion Flow.cl:', errFlow);
        flowResult = {
          ok: false,
          gateway: 'flow',
          error: 'Error de red al conectar con pasarela Flow: ' + errFlow.message,
          orderId: normalizedOrder.folio,
          whatsappFallback: buildWhatsAppOrderUrl(normalizedOrder)
        };
      }
    }

    // 7. Enlace directo WhatsApp con resumen completo
    const whatsappUrl = buildWhatsAppOrderUrl(normalizedOrder);

    return {
      ok: true,
      order: normalizedOrder,
      flowResult,
      khipuResult: flowResult, // Alias retrocompatible para checkout
      whatsappUrl,
      emailSent: formSubmitSuccess
    };
  }

  // --- API PUBLICA EXPUESTA ---
  return {
    CONFIG,
    BANK_DETAILS,
    CATALOG_PRODUCTS,
    AR_CATALOG: CATALOG_PRODUCTS,
    SHIPPING_OPTIONS,
    PAYMENT_METHODS,
    parseCLP,
    formatCLP,
    generateOrderFolio,
    getProductBySku,
    getProductById,
    getProductByName,
    getProductDetails,
    getAllProducts,
    calculateTotals,
    validateCustomerData,
    saveOrderToStorage,
    getLastOrder,
    getOrdersHistory,
    buildFormalEmailPayload,
    buildWhatsAppOrderUrl,
    generatePrintableQuoteHTML,
    openQuotePrintWindow,
    submitOrder
  };
});
