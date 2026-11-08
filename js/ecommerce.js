/**
 * ALZADO ROJO · AR ARQ SpA
 * Motor E-Commerce, Gestion de Pedidos y Cotizaciones Formales
 * Archivo: js/ecommerce.js
 * 
 * Reglas de diseno y contenido:
 * - Cero emojis en cadenas de texto visibles y plantillas.
 * - Cero ampersands en titulos y etiquetas (uso estricto de 'y', 'e' o separadores '·').
 * - Lote de recepcion oficial: adolchilemods@gmail.com
 * - Canal de atencion WhatsApp: +56 9 6203 2766
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
    officialPhone: '+56 9 6203 2766',
    whatsappPhoneRaw: '56962032766',
    cityCountry: 'Santiago, Chile',
    quoteValidityDays: 15,
    formSubmitEndpoint: 'https://formsubmit.co/ajax/adolchilemods@gmail.com',
    paykuEndpoint: '/api/payku-create',
    flowEndpoint: '/api/payku-create',
    khipuEndpoint: '/api/payku-create',
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

  // --- ESCALAS OFICIALES DE PRECIOS Y FORMATOS UNIFICADOS ---
  const PROMO_DISCOUNT_PERCENT = 25; // 25% OFF apertura noviembre

  // Escala Unificada Promocional con Marco Shadowbox Incluido
  const UNIFIED_PRICES = {
    '10x10': { base: 9990, frame: 9990, original: 13290, label: 'Edición Bolsillo' },
    '15x15': { base: 19990, frame: 19990, original: 26490 },
    '20x20': { base: 24990, frame: 24990, original: 33290 },
    '25x25': { base: 29990, frame: 29990, original: 39990, highlight: 'MEJOR VALOR' },
    '30x30': { base: 79990, frame: 79990, original: 106990 },
    '40x40': { base: 119990, frame: 119990, original: 159990 },
    'mural': { base: 149990, frame: 149990, original: 199990 }
  };

  // Escala Estandar (Ciudades / Edicion Urbana / Territorios)
  const STANDARD_PRICES = {
    '10x10': { base: 9990, frame: 9990, original: 13290, label: 'Edición Bolsillo' },
    '15x15': { base: 19990, frame: 19990, original: 26490 },
    '20x20': { base: 24990, frame: 24990, original: 33290 },
    '25x25': { base: 29990, frame: 29990, original: 39990, highlight: 'MEJOR VALOR' },
    '30x30': { base: 79990, frame: 79990, original: 106990 },
    '40x40': { base: 119990, frame: 119990, original: 159990 },
    'mural': { base: 149990, frame: 149990, original: 199990 }
  };

  // Escala Exclusiva Volcanes de Chile (Formato unico de compra directa: 20 × 20 cm a $24.990 CLP con marco shadowbox incluido)
  const VOLCANO_PRICES = {
    '20x20': { base: 24990, frame: 24990, original: 33290, label: '20 × 20 cm (Estándar)' },
    'custom': { base: 0, frame: 0, label: 'Otro tamaño (Cotizar)', isQuote: true }
  };

  // Objeto unificado para compatibilidad directa y retrocompatible:
  const OFFICIAL_PRICES = {
    ...STANDARD_PRICES,
    standard: STANDARD_PRICES,
    volcanes: VOLCANO_PRICES,
    unified: UNIFIED_PRICES
  };

  const VALUE_PROPOSITION = 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida.';

  /**
   * Determina si la categoria, SKU u objeto de producto pertenece a la Coleccion Volcanes
   * @param {string|object} [categoryOrProduct]
   * @returns {boolean}
   */
  function isVolcanoCategory(categoryOrProduct) {
    if (!categoryOrProduct) return false;
    if (typeof categoryOrProduct === 'string') {
      const cat = categoryOrProduct.trim().toLowerCase();
      return cat === 'volcanes' || cat.includes('volcan') || cat.startsWith('sku-vol-') || cat.startsWith('sku-vol');
    }
    if (typeof categoryOrProduct === 'object') {
      const cat = String(categoryOrProduct.category || '').trim().toLowerCase();
      const sku = String(categoryOrProduct.sku || '').trim().toLowerCase();
      const col = String(categoryOrProduct.collection || '').trim().toLowerCase();
      const name = String(categoryOrProduct.name || categoryOrProduct.productName || '').trim().toLowerCase();
      return cat === 'volcanes' || cat.includes('volcan') || sku.startsWith('sku-vol') || col.includes('volcan') || name.includes('volcán') || name.includes('volcan');
    }
    return false;
  }

  /**
   * Resuelve el precio oficial segun el formato, el acabado y la categoria o producto
   * @param {string} sizeInput
   * @param {string} [finishInput='Con Marco']
   * @param {number|string} [overridePrice=null]
   * @param {string|object} [categoryOrProduct=null]
   * @returns {number}
   */
  function resolveFormatPrice(sizeInput, finishInput = 'Con Marco', overridePrice = null, categoryOrProduct = null) {
    const s = String(sizeInput || '').trim().toLowerCase();

    // Detección de formato especial / cotización / a medida
    if (s.includes('otro') || s.includes('cotiz') || s.includes('especial') || s.includes('convenir') || s.includes('personalizado') || s.includes('archivo 3d') || s.includes('hora') || s.includes('gran formato') || s.includes('volumen')) {
      const parsedOverride = (overridePrice !== null && overridePrice !== undefined && overridePrice !== '')
        ? parseCLP(overridePrice)
        : 0;
      return parsedOverride > 0 ? parsedOverride : 0;
    }

    // Detección de escala de precios (Volcanes vs Estándar)
    const isVolcano = isVolcanoCategory(categoryOrProduct);

    if (isVolcano) {
      // Formato exclusivo de compra directa para Volcanes: 20 × 20 cm a $24.990 CLP con marco incluido
      if (s.includes('20 × 20') || s.includes('20x20') || s.includes('200 × 200') || s.includes('200x200')) {
        return VOLCANO_PRICES['20x20'].frame; // 24990
      }
      // Cualquier otro tamaño en volcanes es cotización (precio 0)
      if (s.includes('otro') || s.includes('medida')) {
        return 0;
      }
      // Fallback estándar en volcanes: 20 × 20 cm ($24.990)
      return VOLCANO_PRICES['20x20'].frame;
    }

    const parsedOverride = (overridePrice !== null && overridePrice !== undefined && overridePrice !== '')
      ? parseCLP(overridePrice)
      : 0;

    // Escala Ciudades / Estándar (precios unificados promocionales con marco incluido)
    if (s.includes('10 × 10') || s.includes('10x10') || s.includes('100 × 100') || s.includes('100x100')) {
      return UNIFIED_PRICES['10x10'].frame; // 9990
    }
    if (s.includes('15 × 15') || s.includes('15x15') || s.includes('150 × 150') || s.includes('150x150')) {
      return UNIFIED_PRICES['15x15'].frame; // 19990
    }
    if (s.includes('20 × 20') || s.includes('20x20') || s.includes('200 × 200') || s.includes('200x200')) {
      return UNIFIED_PRICES['20x20'].frame; // 24990
    }
    if (s.includes('25 × 25') || s.includes('25x25') || s.includes('250 × 250') || s.includes('250x250')) {
      return UNIFIED_PRICES['25x25'].frame; // 29990
    }
    if (s.includes('30 × 30') || s.includes('30x30') || s.includes('300 × 300')) {
      return UNIFIED_PRICES['30x30'].frame; // 79990
    }
    if (s.includes('40 × 40') || s.includes('40x40') || s.includes('400 × 400')) {
      return UNIFIED_PRICES['40x40'].frame; // 119990
    }
    if (s.includes('mural') || s.includes('4 paneles')) {
      return UNIFIED_PRICES['mural'].frame; // 149990
    }

    if (parsedOverride > 0) {
      return parsedOverride;
    }

    // Fallback general ciudades: 10x10 ($9.990)
    return UNIFIED_PRICES['10x10'].frame;
  }

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
      video: 'videos/workshop-collection-loop.mp4',
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Relieve del cono volcánico, glaciar y cráter activo con curvas de nivel extruidas a 0.20 mm de precisión en marco shadowbox negro mate.',
      specs: {
        escala: '1:1000 / 1:2000',
        tolerancia: '±0.20 mm',
        material: 'PLA Arquitectónico Biobasado Mate',
        marco: 'Shadowbox Negro Mate o Madera Natural',
        origen: 'DEM Satelital Alos Palsar 12.5 m',
        acabado: 'Blanco Tiza Mate Antirreflejo'
      },
      images: {
        'Con Marco': 'catalog/volcan-villarrica-marco.jpg',
        'Estudio': 'catalog/Volcan Villarica.jpg'
      },
      gallery: [
        { url: 'catalog/volcan-villarrica-marco.jpg', label: 'Volcán Villarrica · Mesa de Arquitecto' },
        { url: 'catalog/Volcan Villarica.jpg', label: 'Volcán Villarrica · Marco Shadowbox Estudio' }
      ],
      formats: [
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm (Estándar)', active: true },
        { size: 'Otro tamaño', price: 0, label: 'Otro tamaño (Cotizar)', isQuote: true }
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
      video: 'videos/Light_sweeping_across_model_relief_c97943d5_1080p.mp4',
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Geometría cónica perfecta y relieve topográfico del lago Llanquihue en acabado blanco tiza de alta pureza arquitectónica.',
      specs: {
        escala: '1:1000 / 1:2000',
        tolerancia: '±0.20 mm',
        material: 'PLA Arquitectónico Blanco Tiza',
        marco: 'Shadowbox Negro Mate',
        origen: 'Cota Real DEM Satelital SRTM',
        acabado: 'Microestratificación 0.20 mm'
      },
      images: {
        'Con Marco': 'catalog/volcan-osorno-shadowbox.jpg'
      },
      gallery: [
        { url: 'catalog/volcan-osorno-shadowbox.jpg', label: 'Volcán Osorno · Marco Shadowbox Negro' }
      ],
      formats: [
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm (Estándar)', active: true },
        { size: 'Otro tamaño', price: 0, label: 'Otro tamaño (Cotizar)', isQuote: true }
      ]
    },
    {
      sku: 'SKU-VOL-03',
      id: 'volcan-llaima',
      name: 'Volcán Llaima · Geometría Eruptiva y Parque Conguillío',
      shortName: 'Volcán Llaima',
      category: 'volcanes',
      collection: 'Volcanes de Chile',
      tag: 'GEOMETRÍA ERUPTIVA · CONGUILLÍO',
      badge: 'NUEVA COLECCIÓN · PARQUE CONGUILLÍO',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      main: 'catalog/volcan llaima.jpg',
      image: 'catalog/volcan llaima.jpg',
      defaultImage: 'catalog/volcan llaima.jpg',
      video: 'videos/Light_sweeping_across_scale_model_75205996_1080p.mp4',
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Morfología eruptiva, fisuras históricas y relieve del Parque Nacional Conguillío modelado tridimensionalmente.',
      specs: {
        escala: '1:1500 / 1:2500',
        tolerancia: '±0.20 mm',
        material: 'PLA Arquitectónico Biobasado Mate',
        marco: 'Shadowbox Negro Mate',
        origen: 'DEM Satelital Alos Palsar 12.5 m',
        acabado: 'Microcapas de Alta Definición'
      },
      images: {
        'Con Marco': 'catalog/volcan llaima.jpg',
        'Estudio': 'catalog/Volcan Llaima v1.jpg'
      },
      gallery: [
        { url: 'catalog/volcan llaima.jpg', label: 'Volcán Llaima · Mesa de Estudio' },
        { url: 'catalog/Volcan Llaima v1.jpg', label: 'Volcán Llaima · Marco Shadowbox Estudio' }
      ],
      formats: [
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm (Estándar)', active: true },
        { size: 'Otro tamaño', price: 0, label: 'Otro tamaño (Cotizar)', isQuote: true }
      ]
    },
    {
      sku: 'SKU-VOL-04',
      id: 'volcan-lonquimay',
      name: 'Volcán Lonquimay · Cráter Navidad y Falla Geológica',
      shortName: 'Volcán Lonquimay',
      category: 'volcanes',
      collection: 'Volcanes de Chile',
      tag: 'CRÁTER NAVIDAD · FALLA GEOLÓGICA',
      badge: 'NUEVA COLECCIÓN · CRÁTER NAVIDAD',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      main: 'catalog/Volcan Lonquimay.jpg',
      image: 'catalog/Volcan Lonquimay.jpg',
      defaultImage: 'catalog/Volcan Lonquimay.jpg',
      video: 'videos/showcase-relief.mp4',
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Registro topográfico del cono principal y el histórico Cráter Navidad formado en la erupción de 1988 con su escorial volcánico.',
      specs: {
        escala: '1:1200 / 1:2000',
        tolerancia: '±0.20 mm',
        material: 'PLA Arquitectónico Biobasado Blanco Tiza',
        marco: 'Shadowbox Negro Mate',
        origen: 'DEM Satelital SRTM 30 m y Catastro Geológico',
        acabado: 'Blanco Mate Texturizado'
      },
      images: {
        'Con Marco': 'catalog/Volcan Lonquimay.jpg'
      },
      gallery: [
        { url: 'catalog/Volcan Lonquimay.jpg', label: 'Volcán Lonquimay · Cráter Navidad y Falla' }
      ],
      formats: [
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm (Estándar)', active: true },
        { size: 'Otro tamaño', price: 0, label: 'Otro tamaño (Cotizar)', isQuote: true }
      ]
    },
    {
      sku: 'SKU-VOL-05',
      id: 'volcan-lanin',
      name: 'Volcán Lanín · Glaciar Binacional y Cono Estratovolcánico',
      shortName: 'Volcán Lanín',
      category: 'volcanes',
      collection: 'Volcanes de Chile',
      tag: 'GLACIAR BINACIONAL · ESTRATOVOLCÁN',
      badge: 'NUEVA COLECCIÓN · GLACIAR BINACIONAL',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      main: 'catalog/Volcan Lanin.jpg',
      image: 'catalog/Volcan Lanin.jpg',
      defaultImage: 'catalog/Volcan Lanin.jpg',
      video: 'videos/Woman_rotating_white_model_frame_e89d915e_1080p.mp4',
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Monumental silueta del estratovolcán de 3.776 msnm en la frontera andina, con su casquete glaciar y vertientes abruptas en relieve 3D.',
      specs: {
        escala: '1:2000 / 1:3000',
        tolerancia: '±0.20 mm',
        material: 'PLA Arquitectónico Biobasado Blanco Tiza',
        marco: 'Shadowbox Negro Mate',
        origen: 'DEM Satelital Alos Palsar 12.5 m',
        acabado: 'Microcapas de Precisión 0.20 mm'
      },
      images: {
        'Con Marco': 'catalog/Volcan Lanin.jpg'
      },
      gallery: [
        { url: 'catalog/Volcan Lanin.jpg', label: 'Volcán Lanín · Glaciar Binacional 3D' }
      ],
      formats: [
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm (Estándar)', active: true },
        { size: 'Otro tamaño', price: 0, label: 'Otro tamaño (Cotizar)', isQuote: true }
      ]
    },
    {
      sku: 'SKU-VOL-06',
      id: 'volcan-quetrupillan',
      name: 'Volcán Quetrupillán · Caldera Extinta y Cordón Andino',
      shortName: 'Volcán Quetrupillán',
      category: 'volcanes',
      collection: 'Volcanes de Chile',
      tag: 'CALDERA EXTINTA · CORDÓN ANDINO',
      badge: 'NUEVA COLECCIÓN · CALDERA EXTINTA',
      leadTime: 'Fabricación en taller propio · Despacho en 3 a 5 días hábiles a todo Chile',
      main: 'catalog/Volcan quetrupilan.jpg',
      image: 'catalog/Volcan quetrupilan.jpg',
      defaultImage: 'catalog/Volcan quetrupilan.jpg',
      video: 'videos/Three_framed_topographic_models_…_059fd68f_1080p.mp4',
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Gran caldera colapsada y glaciar interior del volcán Quetrupillán, situado en el cordón volcánico entre el Villarrica y el Lanín.',
      specs: {
        escala: '1:1500 / 1:2500',
        tolerancia: '±0.20 mm',
        material: 'PLA Arquitectónico Biobasado Blanco Tiza',
        marco: 'Shadowbox Negro Mate',
        origen: 'DEM Satelital Alos Palsar 12.5 m',
        acabado: 'Microestratificación 0.20 mm'
      },
      images: {
        'Con Marco': 'catalog/Volcan quetrupilan.jpg'
      },
      gallery: [
        { url: 'catalog/Volcan quetrupilan.jpg', label: 'Volcán Quetrupillán · Caldera Extinta 3D' }
      ],
      formats: [
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm (Estándar)', active: true },
        { size: 'Otro tamaño', price: 0, label: 'Otro tamaño (Cotizar)', isQuote: true }
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
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Malla morfológica tridimensional de alta precisión del centro financiero de Santiago y Gran Torre Costanera. Manufactura en PLA arquitectónico mate con marco perimetral shadowbox.',
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
        'Con Marco': 'catalog/santiago-costanera-marco.jpg',
        'Sin Marco': 'catalog/santiago-costanera-sin-marco.jpg'
      },
      gallery: [
        { url: 'catalog/santiago-costanera-marco.jpg', label: 'Santiago Costanera · Con Marco Shadowbox' },
        { url: 'catalog/santiago-costanera-sin-marco.jpg', label: 'Santiago Costanera · Relieve Sin Marco' }
      ],
      formats: [
        { size: '10 × 10 cm', price: 9990, framePrice: 9990, originalPrice: 13290, label: '10 × 10 cm (Edición Bolsillo)' },
        { size: '15 × 15 cm', price: 19990, framePrice: 19990, originalPrice: 26490, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm' },
        { size: '25 × 25 cm', price: 29990, framePrice: 29990, originalPrice: 39990, label: '25 × 25 cm', highlight: 'MEJOR VALOR' }
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
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Trama de rascacielos del Loop de Chicago con el río Chicago y ribera del Lago Michigan. Cuadro rígido con tipografía volumétrica integrada en relieve arquitectónico 3D.',
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
        'Con Marco': 'catalog/chicago-cuadro.jpg'
      },
      gallery: [
        { url: 'catalog/chicago-cuadro.jpg', label: 'Chicago · Cuadro Topográfico con Tipografía 3D' }
      ],
      formats: [
        { size: '10 × 10 cm', price: 9990, framePrice: 9990, originalPrice: 13290, label: '10 × 10 cm (Edición Bolsillo)' },
        { size: '15 × 15 cm', price: 19990, framePrice: 19990, originalPrice: 26490, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm' },
        { size: '25 × 25 cm', price: 29990, framePrice: 29990, originalPrice: 39990, label: '25 × 25 cm', highlight: 'MEJOR VALOR' },
        { size: '30 × 30 cm', price: 79990, framePrice: 79990, originalPrice: 106990, label: '30 × 30 cm (Gran Formato Modular)' }
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
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Topografía urbana densa de Manhattan entre el Río Hudson y East River. Rascacielos históricos y modernos en manufactura aditiva monocromática de máxima fidelidad.',
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
        'Con Marco': 'catalog/new-york-cuadro.jpg'
      },
      gallery: [
        { url: 'catalog/new-york-cuadro.jpg', label: 'New York · Manhattan en Relieve Blanco Tiza' }
      ],
      formats: [
        { size: '10 × 10 cm', price: 9990, framePrice: 9990, originalPrice: 13290, label: '10 × 10 cm (Edición Bolsillo)' },
        { size: '15 × 15 cm', price: 19990, framePrice: 19990, originalPrice: 26490, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm' },
        { size: '25 × 25 cm', price: 29990, framePrice: 29990, originalPrice: 39990, label: '25 × 25 cm', highlight: 'MEJOR VALOR' },
        { size: '30 × 30 cm', price: 79990, framePrice: 79990, originalPrice: 106990, label: '30 × 30 cm (Gran Formato Modular)' }
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
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Topografía geoespacial de la meseta de Guiza con las pirámides de Keops, Kefrén y Micerino. Detalle de pendientes y textura desértica en microcapas FDM de alta resolución.',
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
        'Con Marco': 'catalog/piramides-guiza.jpg'
      },
      gallery: [
        { url: 'catalog/piramides-guiza.jpg', label: 'Guiza · Meseta Arqueológica Pirámides de Egipto' }
      ],
      formats: [
        { size: '10 × 10 cm', price: 9990, framePrice: 9990, originalPrice: 13290, label: '10 × 10 cm (Edición Bolsillo)' },
        { size: '15 × 15 cm', price: 19990, framePrice: 19990, originalPrice: 26490, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm' },
        { size: '25 × 25 cm', price: 29990, framePrice: 29990, originalPrice: 39990, label: '25 × 25 cm', highlight: 'MEJOR VALOR' }
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
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Instalación mural de gran formato compuesta por cuatro baldosas topográficas interconectadas. Ideal para salas de reuniones, recepciones corporativas y vestíbulos de despachos.',
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
        '4 Paneles': 'catalog/relieve-modular-4paneles.jpg'
      },
      gallery: [
        { url: 'catalog/relieve-modular-4paneles.jpg', label: 'Relieve Modular 4 Paneles · Mural Cordillerano' }
      ],
      formats: [
        { size: '10 × 10 cm', price: 9990, framePrice: 9990, originalPrice: 13290, label: '10 × 10 cm (Bolsillo)' },
        { size: '15 × 15 cm', price: 19990, framePrice: 19990, originalPrice: 26490, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm' },
        { size: '25 × 25 cm', price: 29990, framePrice: 29990, originalPrice: 39990, label: '25 × 25 cm', highlight: 'MEJOR VALOR' },
        { size: '30 × 30 cm', price: 79990, framePrice: 79990, originalPrice: 106990, label: '30 × 30 cm' },
        { size: 'Mural 4 Paneles', price: 149990, framePrice: 149990, originalPrice: 199990, label: 'Mural 4 Paneles' }
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
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Curvas de nivel GIS satelitales en relieve blanco mate puro. Captura la transición entre el valle central y los cordones montañosos con precisión micrométrica.',
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
        'Con Marco': 'catalog/topografia-valle-marco.jpg',
        'Mesa de Estudio': 'catalog/volcan-villarrica-detalle.jpg',
        'Detalle Macro': 'catalog/topografia-valle-detalle.jpg'
      },
      gallery: [
        { url: 'catalog/topografia-valle-marco.jpg', label: 'Topografía Territorial · Marco Shadowbox Estudio' },
        { url: 'catalog/volcan-villarrica-detalle.jpg', label: 'Topografía Territorial · Mesa de Estudio' },
        { url: 'catalog/topografia-valle-detalle.jpg', label: 'Topografía Territorial · Macro Curvas de Nivel' }
      ],
      formats: [
        { size: '10 × 10 cm', price: 9990, framePrice: 9990, originalPrice: 13290, label: '10 × 10 cm (Edición Bolsillo)' },
        { size: '15 × 15 cm', price: 19990, framePrice: 19990, originalPrice: 26490, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm' },
        { size: '25 × 25 cm', price: 29990, framePrice: 29990, originalPrice: 39990, label: '25 × 25 cm', highlight: 'MEJOR VALOR' }
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
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Enfoque volumétrico diferencial: topografía en sustrato negro azabache y propuesta arquitectónica en blanco puro para evidenciar la huella e inserción en el relieve.',
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
        'Con Marco': 'catalog/insercion-arquitectura-contraste.jpg'
      },
      gallery: [
        { url: 'catalog/insercion-arquitectura-contraste.jpg', label: 'Inserción Arquitectónica de Alto Contraste' }
      ],
      formats: [
        { size: '10 × 10 cm', price: 9990, framePrice: 9990, originalPrice: 13290, label: '10 × 10 cm (Edición Bolsillo)' },
        { size: '15 × 15 cm', price: 19990, framePrice: 19990, originalPrice: 26490, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm' },
        { size: '25 × 25 cm', price: 29990, framePrice: 29990, originalPrice: 39990, label: '25 × 25 cm', highlight: 'MEJOR VALOR' }
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
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Manufactura a medida según levantamiento topográfico, plano CAD, modelo BIM o coordenadas satelitales específicas de su proyecto.',
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
        { size: '10 × 10 cm', price: 9990, framePrice: 9990, originalPrice: 13290, label: '10 × 10 cm (Edición Bolsillo)' },
        { size: '15 × 15 cm', price: 19990, framePrice: 19990, originalPrice: 26490, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm' },
        { size: '25 × 25 cm', price: 29990, framePrice: 29990, originalPrice: 39990, label: '25 × 25 cm', highlight: 'MEJOR VALOR' },
        { size: 'Gran Formato (30 × 30 cm)', price: 79990, framePrice: 79990, originalPrice: 106990, label: '30 × 30 cm Modular' },
        { size: 'Mural 4 Paneles', price: 149990, framePrice: 149990, originalPrice: 199990, label: 'Mural 4 Paneles' },
        { size: 'Formato Personalizado', price: 0, label: 'Presupuesto según escala y volumen', isQuote: true }
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
      description: 'Transforma la topografía y el trazado urbano de cualquier lugar del mundo en una pieza de diseño única. Capturamos el relieve y trazado urbano mediante datos geoespaciales. Diseño técnico, limpio y a medida. Servicio de fabricación aditiva de precisión para oficinas de arquitectura, constructoras y estudiantes. PLA mate, filamentos técnicos y optimización de mallas.',
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
        { size: '10 × 10 cm', price: 9990, framePrice: 9990, originalPrice: 13290, label: '10 × 10 cm (Edición Bolsillo)' },
        { size: '15 × 15 cm', price: 19990, framePrice: 19990, originalPrice: 26490, label: '15 × 15 cm' },
        { size: '20 × 20 cm', price: 24990, framePrice: 24990, originalPrice: 33290, label: '20 × 20 cm' },
        { size: '25 × 25 cm', price: 29990, framePrice: 29990, originalPrice: 39990, label: '25 × 25 cm', highlight: 'MEJOR VALOR' },
        { size: 'Servicio por Hora / Gramo', price: 0, label: 'Cotización según archivo 3D', isQuote: true }
      ]
    }
  ];

  // --- TARIFAS DE DESPACHO OFICIALES ---
  const SHIPPING_OPTIONS = {
    blue_pickup: {
      id: 'blue_pickup',
      label: 'Retiro en Punto Blue Express (Pikup / Sucursal)',
      cost: 4490,
      eta: '2 a 3 dias habiles post-manufactura'
    },
    santiago: {
      id: 'santiago',
      label: 'Despacho a Domicilio · Santiago (RM)',
      cost: 4990,
      eta: '24 a 48 hrs habiles post-manufactura'
    },
    regiones: {
      id: 'regiones',
      label: 'Despacho a Domicilio · Regiones (Blue Express)',
      cost: 7990,
      eta: '2 a 4 dias habiles post-manufactura'
    }
  };
  // Alias retrocompatibles
  SHIPPING_OPTIONS.pickup = SHIPPING_OPTIONS.blue_pickup;

  // --- METODOS DE PAGO DISPONIBLES ---
  const PAYMENT_METHODS = {
    payku: {
      id: 'payku',
      label: 'Tarjeta de Débito, Crédito o Redcompra',
      badge: 'WEBPAY PLUS · VISA · MASTERCARD · REDCOMPRA',
      fee: 0,
      description: 'Webpay Plus, Visa, Mastercard y prepago. Procesado por Payku.'
    },
    transferencia: {
      id: 'transferencia',
      label: 'Transferencia Bancaria Directa (Banco Bci)',
      badge: 'BANCO BCI',
      fee: 0,
      description: 'Sin intermediarios. Coordinación y confirmación inmediata por WhatsApp.'
    },
    cotizacion: {
      id: 'cotizacion',
      label: 'Orden de Cotizacion Formal (Empresa / Oficina)',
      badge: 'DOCUMENTO OFICIAL PDF · CORREO',
      fee: 0,
      description: 'Recibe la cotizacion formal desglosada en tu correo para aprobacion o pago con Orden de Compra.'
    }
  };

  // Alias retrocompatibles
  PAYMENT_METHODS.transfer = PAYMENT_METHODS.transferencia;
  PAYMENT_METHODS.flow = PAYMENT_METHODS.payku;
  PAYMENT_METHODS.khipu = PAYMENT_METHODS.payku;

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
    const formats = (product.formats || []).map(f => {
      const isQuote = !!f.isQuote || f.price === 0 || String(f.size).toLowerCase().includes('otro');
      const effectivePrice = isQuote ? 0 : (f.framePrice || f.price || 0);
      let formattedPrice = '';
      if (isQuote) {
        formattedPrice = 'Cotizar por WhatsApp';
      } else if (effectivePrice > 0) {
        formattedPrice = formatCLP(effectivePrice);
      } else {
        formattedPrice = 'A convenir / Cotización';
      }
      const formattedBasePrice = f.price > 0 ? formatCLP(f.price) : undefined;
      const formattedFramePrice = f.framePrice > 0 ? formatCLP(f.framePrice) : undefined;
      return {
        ...f,
        price: effectivePrice,
        basePrice: f.price,
        formattedPrice,
        formattedFramePrice,
        isQuote,
        highlight: f.highlight || null
      };
    });

    const activeFmt = formats.find(f => f.active && !f.isQuote) || formats.find(f => !f.isQuote) || formats[0];
    const basePrice = activeFmt ? activeFmt.price : 0;
    const formattedBasePrice = activeFmt ? activeFmt.formattedPrice : 'A cotizar';

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
   * @param {object} [params={}]
   * @param {number|string} [params.unitPrice]
   * @param {number} [params.quantity=1]
   * @param {string} [params.shippingId='santiago']
   * @param {number} [params.customShippingCost=null]
   * @param {string} [params.size=null]
   * @param {string} [params.finish='Con Marco']
   * @param {string} [params.category=null]
   * @param {string} [params.sku=null]
   * @returns {object}
   */
  function calculateTotals({ unitPrice, quantity = 1, shippingId = 'santiago', customShippingCost = null, size = null, finish = 'Con Marco', category = null, sku = null } = {}) {
    let cleanUnitPrice = parseCLP(unitPrice);

    // Si no se proporciono unitPrice o vino en 0, y se paso size, resolver segun escala oficial
    if (cleanUnitPrice <= 0 && size) {
      cleanUnitPrice = resolveFormatPrice(size, finish, null, category || sku);
    }

    const cleanQty = Math.max(1, parseInt(quantity, 10) || 1);

    const resolvedShippingId = shippingId || 'santiago';
    const shippingConfig = SHIPPING_OPTIONS[resolvedShippingId] || SHIPPING_OPTIONS.santiago;

    let cleanShippingCost = shippingConfig ? shippingConfig.cost : 4990;
    if (customShippingCost !== null && !isNaN(customShippingCost)) {
      cleanShippingCost = Math.max(0, Math.round(Number(customShippingCost)));
    } else if (SHIPPING_OPTIONS[resolvedShippingId]) {
      cleanShippingCost = SHIPPING_OPTIONS[resolvedShippingId].cost;
    }

    const subtotal = cleanUnitPrice * cleanQty;
    const total = subtotal + cleanShippingCost;

    return {
      unitPrice: cleanUnitPrice,
      quantity: cleanQty,
      subtotal,
      shippingId: resolvedShippingId,
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
   * Todo pedido requiere modalidad de entrega y direccion o Punto Blue Express
   * @param {object} customer
   * @param {boolean} [requiresShipping=true]
   * @returns {{ valid: boolean, errors: object }}
   */
  function validateCustomerData(customer, requiresShipping = true) {
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

    // Direccion y comuna (todo pedido requiere datos de entrega: domicilio o Punto Blue Express)
    if (requiresShipping) {
      const address = (customer.address || '').trim();
      if (!address || address.length < 5) {
        errors.address = 'Ingrese la direccion de entrega o Punto Blue Express deseado (minimo 5 caracteres).';
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
      label: order.shippingLabel || 'Despacho a Domicilio · Santiago (RM)',
      cost: order.shippingCost || 4990
    };
    const payment = PAYMENT_METHODS[order.paymentMethod] || {
      label: order.paymentLabel || 'Payku Chile · Webpay Plus, Tarjetas de Débito y Crédito'
    };

    let subjectPrefix = '[ORDEN REGISTRADA]';
    let statusText = 'PAGO ONLINE PAYKU (WEBPAY PLUS / TARJETAS) INICIADO · PENDIENTE';
    if (order.paymentMethod === 'payku') {
      subjectPrefix = '[PENDIENTE DE PAGO WEBPAY]';
      statusText = 'ORDEN INICIADA · PENDIENTE DE PAGO EN WEBPAY PLUS (PAYKU)';
    } else if (order.paymentMethod === 'transferencia' || order.paymentMethod === 'transfer') {
      subjectPrefix = '[TRANSFERENCIA PENDIENTE]';
      statusText = 'ORDEN REGISTRADA · TRANSFERENCIA DIRECTA PENDIENTE';
    } else if (order.paymentMethod === 'cotizacion') {
      subjectPrefix = '[COTIZACIÓN FORMAL]';
      statusText = 'COTIZACION FORMAL SOLICITADA';
    }

    const isPayku = (order.paymentMethod === 'payku');
    const autoresponseMessage = [
      'ALZADO ROJO · AR ARQ SpA',
      'Arquitectura y Fabricacion Digital',
      `Santiago, Chile | ${CONFIG.officialEmail} | ${CONFIG.officialPhone}`,
      '',
      'ESTIMADO/A CLIENTE:',
      isPayku
        ? 'Hemos registrado su solicitud de orden en nuestro taller. Para que la manufactura inicie, la transaccion debe ser completada y acreditada via Webpay Plus (Payku) o por transferencia bancaria directa de respaldo.'
        : 'Hemos registrado con exito su orden formal. A continuacion encuentra el resumen oficial del pedido emitido:',
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
      `Direccion / Comuna: ${customer.address ? `${customer.address}, ${customer.commune || ''}` : 'Direccion o Punto Blue Express por coordinar'}`,
      '',
      'INSTRUCCIONES DE CONTINUIDAD:',
      '- Si su orden es con Pago en Linea Payku Chile (Webpay Plus / Tarjetas), recuerde que la confirmacion de fabricacion requiere completar la autorizacion en Webpay. Si cerro la pasarela o la transaccion quedo pendiente, puede transferir directamente a Banco Bci o coordinar por WhatsApp.',
      `- Si su orden es con Transferencia Directa, transfiera a ${BANK_DETAILS.accountType} ${BANK_DETAILS.accountHolder} (${BANK_DETAILS.bank}, N° ${BANK_DETAILS.accountNumber}, RUT ${BANK_DETAILS.rut}) e indique su Folio en la referencia.`,
      '- Si solicito Cotizacion Formal, este respaldo certifica la reserva de tarifas por 15 dias corridos para la gestion de su Orden de Compra.',
      '- Nuestro equipo tecnico revisara el modelo y coordinara el avance de manufactura aditiva.',
      '',
      'Atentamente,',
      'Equipo ALZADO ROJO · AR ARQ SpA'
    ].join('\n');

    return {
      _subject: `${subjectPrefix} ORDEN #${order.folio} | ${order.productName} (${order.size}) - ALZADO ROJO`,
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
      '18_Direccion_Comuna_Entrega': customer.address ? `${customer.address}, ${customer.commune || ''}` : 'Despacho a domicilio o Punto Blue Express',
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
      label: order.shippingLabel || 'Despacho a Domicilio · Santiago (RM)',
      cost: order.shippingCost || 4990
    };
    const payment = PAYMENT_METHODS[order.paymentMethod] || {
      label: order.paymentLabel || 'Payku Chile · Webpay Plus, Tarjetas de Débito y Crédito'
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
      `- Direccion: ${customer.address ? `${customer.address}, ${customer.commune || ''}` : 'Direccion o Punto Blue Express'}`
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
      label: order.shippingLabel || 'Despacho a Domicilio · Santiago (RM)',
      cost: order.shippingCost || 4990
    };
    const payment = PAYMENT_METHODS[order.paymentMethod] || {
      label: order.paymentLabel || 'Payku Chile · Webpay Plus, Tarjetas de Débito y Crédito'
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
                    <td class="val">${customer.address ? `${customer.address}, ${customer.commune || ''}` : 'Despacho a Domicilio / Punto Blue Express'}</td>
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
   * @returns {Promise<{ ok: boolean, order: object, paykuResult?: object, whatsappUrl: string, errors?: object }>}
   */
  async function submitOrder(orderData) {
    orderData = orderData || {};

    const shippingId = orderData.shippingId || 'santiago';
    const requiresShipping = true; // Todo pedido requiere datos de entrega (despacho o Punto Blue Express)

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
    const orderCat = orderData.category || (product ? product.category : null);
    const totals = calculateTotals({
      unitPrice: orderData.unitPrice,
      quantity: orderData.quantity || 1,
      shippingId: shippingId,
      customShippingCost: orderData.shippingCost,
      size: size,
      finish: finish,
      category: orderCat,
      sku: sku
    });

    const now = new Date();
    const folio = orderData.folio || generateOrderFolio();

    // Normalizacion de metodo de pago con alias retrocompatible
    let selectedMethod = orderData.paymentMethod || 'transferencia';
    if (selectedMethod === 'transfer') {
      selectedMethod = 'transferencia';
    }

    const normalizedOrder = {
      folio,
      sku,
      category: orderCat,
      productName,
      size,
      finish,
      quantity: totals.quantity,
      unitPrice: totals.unitPrice,
      subtotal: totals.subtotal,
      shippingId: totals.shippingId,
      shippingCost: totals.shippingCost,
      shippingLabel: SHIPPING_OPTIONS[totals.shippingId]?.label || 'Despacho a Domicilio · Santiago (RM)',
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

    // 5.1 Envio asincrono al motor serverless de correos transaccionales (para ordenes regulares: transferencia o cotizacion)
    let emailNotifySent = false;
    if (normalizedOrder.paymentMethod !== 'payku') {
      try {
        if (normalizedOrder.customer && normalizedOrder.customer.email) {
          fetch('/api/email-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order_received',
              orderId: normalizedOrder.folio,
              customerName: normalizedOrder.customer.name || 'Cliente ALZADO ROJO',
              customerEmail: normalizedOrder.customer.email,
              productName: normalizedOrder.productName || 'Relieve Arquitectonico 3D',
              size: normalizedOrder.size || 'Estandar',
              amount: normalizedOrder.total || normalizedOrder.subtotal || 24990,
              address: normalizedOrder.customer.address || 'Por coordinar',
              city: normalizedOrder.customer.commune || 'Santiago',
              phone: normalizedOrder.customer.phone || 'No especificado'
            })
          }).then(r => r.json()).then(resp => {
            console.info('[ALZADO ROJO Ecommerce] Email transaccional despachado:', resp);
          }).catch(err => {
            console.warn('[ALZADO ROJO Ecommerce] Aviso en envio asincrono de email:', err);
          });
          emailNotifySent = true;
        }
      } catch (eEmailNotify) {
        console.warn('[ALZADO ROJO Ecommerce] Error al invocar email-notify:', eEmailNotify);
      }
    }

    // 6. Gestion de pasarela de pago oficial: Payku Chile
    let paykuResult = null;

    if (normalizedOrder.paymentMethod === 'payku') {
      try {
        if (!normalizedOrder.total || normalizedOrder.total <= 0) {
          normalizedOrder.unitPrice = 24990;
          normalizedOrder.subtotal = 24990;
          normalizedOrder.total = 24990;
          normalizedOrder.notes = (normalizedOrder.notes ? normalizedOrder.notes + ' · ' : '') + 'Abono base inicial de manufactura ($24.990 CLP) para procesamiento en Payku';
        }

        const paykuPayload = {
          orderId: normalizedOrder.folio,
          subject: `Orden ALZADO ROJO ${normalizedOrder.folio} | ${normalizedOrder.productName} (${normalizedOrder.size})`.slice(0, 250),
          amount: Math.round(Number(normalizedOrder.total)),
          currency: 'CLP',
          payer_email: normalizedOrder.customer.email,
          payer_name: normalizedOrder.customer.name,
          body: `${normalizedOrder.productName} · Formato: ${normalizedOrder.size} · Entrega: ${normalizedOrder.shippingLabel}`
        };

        const paykuEndpoint = CONFIG.paykuEndpoint || '/api/payku-create';
        const paykuRes = await fetch(paykuEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paykuPayload)
        });

        if (paykuRes.ok) {
          paykuResult = await paykuRes.json();
        } else {
          let errData = null;
          try {
            errData = await paykuRes.json();
          } catch (e) {
            errData = { error: 'Error de comunicacion con el servidor' };
          }
          paykuResult = {
            ok: false,
            gateway: 'payku',
            error: errData.error || 'Respuesta no exitosa de Payku Chile',
            orderId: normalizedOrder.folio,
            whatsappFallback: errData.whatsappFallback || buildWhatsAppOrderUrl(normalizedOrder)
          };
        }
      } catch (errPayku) {
        console.warn('[ALZADO ROJO Backend] Error de red en invocacion Payku:', errPayku);
        paykuResult = {
          ok: false,
          gateway: 'payku',
          error: 'Error de red al conectar con pasarela Payku: ' + errPayku.message,
          orderId: normalizedOrder.folio,
          whatsappFallback: buildWhatsAppOrderUrl(normalizedOrder)
        };
      }
    }

    // 7. Enlace directo WhatsApp con resumen completo
    const whatsappUrl = buildWhatsAppOrderUrl(normalizedOrder);

    const resolvedPaymentUrl = (paykuResult && paykuResult.payment_url) || null;

    return {
      ok: true,
      order: normalizedOrder,
      paykuResult,
      payment_url: resolvedPaymentUrl,
      whatsappUrl,
      emailSent: formSubmitSuccess,
      emailNotifySent: emailNotifySent
    };
  }

  /**
   * Sincroniza datos, atributos de precio y descripciones en el DOM si estan presentes
   * sin alterar clases CSS ni maquetacion visual.
   */
  function syncCatalogDom() {
    if (typeof document === 'undefined') return;

    // 1. Sincronizar tarjetas de catalogo .ecom-card
    const cards = document.querySelectorAll('.ecom-card');
    cards.forEach(card => {
      const sku = card.getAttribute('data-sku');
      const prod = getProductBySku(sku);
      if (!prod) return;

      // Actualizar botones de tamano .ecom-size-btn
      const activeViewBtn = card.querySelector('.ecom-view-btn.active');
      const viewText = activeViewBtn ? activeViewBtn.textContent.trim().toLowerCase() : 'marco';
      const isFrameless = viewText.includes('sin marco');

      const sizeBtns = card.querySelectorAll('.ecom-size-btn');
      sizeBtns.forEach(btn => {
        const sizeVal = btn.getAttribute('data-size');
        const fmt = (prod.formats || []).find(f => f.size === sizeVal) || null;
        let officialPrice = 0;
        if (fmt) {
          officialPrice = (fmt.framePrice && !isFrameless) ? fmt.framePrice : fmt.price;
        } else {
          officialPrice = resolveFormatPrice(sizeVal, isFrameless ? 'Sin Marco' : 'Con Marco', null, prod);
        }

        if (officialPrice > 0) {
          const formatted = formatCLP(officialPrice);
          btn.setAttribute('data-price', formatted);
          if (btn.classList.contains('active')) {
            const priceDisplay = card.querySelector('.ecom-price-display');
            if (priceDisplay) {
              priceDisplay.textContent = formatted;
            }
          }
        }
      });
    });

    // 2. Sincronizar tarjetas de formato .format-card
    const formatCards = document.querySelectorAll('.format-card');
    formatCards.forEach(card => {
      const formatVal = card.getAttribute('data-format');
      if (!formatVal) return;

      const officialPrice = resolveFormatPrice(formatVal, 'Con Marco');
      if (officialPrice > 0) {
        const formatted = formatCLP(officialPrice);
        card.setAttribute('data-price', formatted);
        const priceEl = card.querySelector('.format-price');
        if (priceEl) {
          priceEl.textContent = formatted;
        }
        const buyBtn = card.querySelector('.btn-format-buy');
        if (buyBtn) {
          buyBtn.setAttribute('data-price', String(officialPrice));
        }
      }
    });
  }

  // Auto-sincronizacion de datos en el cliente
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', syncCatalogDom);
    } else {
      syncCatalogDom();
    }
  }

  // --- API PUBLICA EXPUESTA ---
  return {
    CONFIG,
    BANK_DETAILS,
    CATALOG_PRODUCTS,
    AR_CATALOG: CATALOG_PRODUCTS,
    PROMO_DISCOUNT_PERCENT,
    UNIFIED_PRICES,
    OFFICIAL_PRICES,
    STANDARD_PRICES,
    VOLCANO_PRICES,
    VALUE_PROPOSITION,
    SHIPPING_OPTIONS,
    PAYMENT_METHODS,
    isVolcanoCategory,
    parseCLP,
    formatCLP,
    generateOrderFolio,
    getProductBySku,
    getProductById,
    getProductByName,
    getProductDetails,
    getAllProducts,
    resolveFormatPrice,
    calculateTotals,
    validateCustomerData,
    saveOrderToStorage,
    getLastOrder,
    getOrdersHistory,
    buildFormalEmailPayload,
    buildWhatsAppOrderUrl,
    generatePrintableQuoteHTML,
    openQuotePrintWindow,
    submitOrder,
    syncCatalogDom
  };
});
