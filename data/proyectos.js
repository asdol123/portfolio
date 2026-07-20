const misProyectos = [
    {
        id: "proyecto-titulo",
        tipo: "academicos",
        titulo: "Construccion Modular Industrializada Aplicada a Edificios Multifamily en Santiago de Chile",
        year: "2026",
        descripcion: "DescripciÃ³n en desarrollo...",
        imagen_principal: "assets/img/academicos/proyecto-titulo/proyecto-titulo_01.png",
        galeria: ["assets/img/academicos/proyecto-titulo/proyecto-titulo_01.png", "assets/img/academicos/proyecto-titulo/proyecto-titulo_02.png", "assets/img/academicos/proyecto-titulo/proyecto-titulo_03.png", "assets/img/academicos/proyecto-titulo/proyecto-titulo_04.png", "assets/img/academicos/proyecto-titulo/proyecto-titulo_05.png", "assets/img/academicos/proyecto-titulo/proyecto-titulo_06.png", "assets/img/academicos/proyecto-titulo/proyecto-titulo_07.png", "assets/img/academicos/proyecto-titulo/proyecto-titulo_08.png"],
        clase_css: ""
    },
    {
        id: "taller-01-magister",
        tipo: "academicos",
        titulo: "TES",
        year: "2025",
        descripcion: "Reconversión de Edificios de Oficina",
        imagen_principal: "assets/img/academicos/taller-01-magister/taller-01-magister_01.png",
        galeria: ["assets/img/academicos/taller-01-magister/taller-01-magister_01.png", "assets/img/academicos/taller-01-magister/taller-01-magister_02.png", "assets/img/academicos/taller-01-magister/taller-01-magister_03.png", "assets/img/academicos/taller-01-magister/taller-01-magister_04.png", "assets/img/academicos/taller-01-magister/taller-01-magister_05.png", "assets/img/academicos/taller-01-magister/taller-01-magister_06.png", "assets/img/academicos/taller-01-magister/taller-01-magister_07.png"],
        clase_css: ""
    },
    {
        id: "taller-02-magister",
        tipo: "academicos",
        titulo: "TIP",
        year: "2025",
        descripcion: "Ante Proyecto Vivienda Industrializada en Edificios Multifaily",
        imagen_principal: "assets/img/academicos/taller-02-magister/taller-02-magister_01.png",
        galeria: ["assets/img/academicos/taller-02-magister/taller-02-magister_01.png", "assets/img/academicos/taller-02-magister/taller-02-magister_02.png", "assets/img/academicos/taller-02-magister/taller-02-magister_03.png", "assets/img/academicos/taller-02-magister/taller-02-magister_04.png"],
        clase_css: ""
    },
    {
        id: "taller-06",
        tipo: "academicos",
        titulo: "EDIFICIO FACADE",
        year: "2022",
        descripcion: "Al elegir nuestro edificio, comenzamos a reunir información del sectory en qué condiciones se encontraba este, la problemática que másnos interesó debido al impacto que provoca en la población tomarmedidas con esto, mejorar este punto considerando todo el alcanceque tiene el problema de acceso y desperdicio de alimentos, al observar una falta de supermercados por la zona partimos por incluir uno, siendo este la base de nuestro proyecto, creamos una doble altura en el primer nivel y quitamos muros con la idea de ampliar la vía pública y aprovechar el gran paso peatonal de calle huérfanos, incluimos un sistema de producción, recolección y clasificación de alimentos que funcionan en conjunto desde el piso -1 al 6, junto a esto agregamos viviendas y áreas comunes del piso 7 al 13, para agregarle carácter a nuestro edificio creamos una fachada cultivable que funciona como celosía y materia prima para el comercio, logrando así una reformación completa al edificio, tanto espacial como en programas. La propuesta consiste en un Centro de Redistribución y Producción de Alimentos, tomamos 3 ideas principales para desarrollar el proyecto. ",
        imagen_principal: "assets/img/academicos/taller-06/taller-06_01.png",
        galeria: ["assets/img/academicos/taller-06/taller-06_01.png", "assets/img/academicos/taller-06/taller-06_02.png", "assets/img/academicos/taller-06/taller-06_03.png", "assets/img/academicos/taller-06/taller-06_04.png", "assets/img/academicos/taller-06/taller-06_05.png", "assets/img/academicos/taller-06/taller-06_06.png"],
        clase_css: ""
    },
    {
        id: "taller-07",
        tipo: "academicos",
        titulo: "TALLER 07",
        year: "2026",
        descripcion: "El Proyecto busca crear un espacio que sea a la vez un refugio para el arte y un lugar de encuentro para la comunidad. Al aprovechar las características naturales delterreno, al mismo tiempo se potencia el sistema estructural de vigas perpendiculares a las entradas del terreno,que se sostienen por muros que modulan, jerarquizan ydan lugar al recorrido de la muestra interior del museo, en cada uno de estos muros está rodeado de una lucarna que resalta aún más la muestra interior y al mismotiempo permite generar espacios de integración en sucubierta transitable. El museo se convierte en una parteintegral del paisaje y de la vida cultural de la ciudad.",
        imagen_principal: "assets/img/academicos/taller-07/taller-07_01.png",
        galeria: ["assets/img/academicos/taller-07/taller-07_01.png", "assets/img/academicos/taller-07/taller-07_02.png", "assets/img/academicos/taller-07/taller-07_03.png", "assets/img/academicos/taller-07/taller-07_04.png", "assets/img/academicos/taller-07/taller-07_05.png", "assets/img/academicos/taller-07/taller-07_06.png", "assets/img/academicos/taller-07/taller-07_07.png", "assets/img/academicos/taller-07/taller-07_08.png", "assets/img/academicos/taller-07/taller-07_09.png", "assets/img/academicos/taller-07/taller-07_10.png", "assets/img/academicos/taller-07/taller-07_11.png", "assets/img/academicos/taller-07/taller-07_12.png", "assets/img/academicos/taller-07/taller-07_13.png"],
        clase_css: ""
    },
    {
        id: "taller-08",
        tipo: "academicos",
        titulo: "Vivienda Bioclimatica",
        year: "2022",
        descripcion: "La vivienda emplazada en Calama está diseñada con énfasis en su doble cubierta, la cual permite una disminución del asoleamiento directo hacia la cubierta y permite una circulación extra de aire entre ambas. Por otro lado, otra de las estrategias que aprovechamos al tener una doble cubierta es la entrada de luz indirecta a los espacios más importantes, como el dormitorio y la sala de estar, aprovechando una ventilación por convección dada por el patio interior que se ubica en el centro de la vivienda. La cubierta consta de cubiertas en altura en forma de piramides truncadas en los espacios de mayor relevancia",
        imagen_principal: "assets/img/academicos/taller-08/taller-08_01.png",
        galeria: ["assets/img/academicos/taller-08/taller-08_01.png", "assets/img/academicos/taller-08/taller-08_02.png", "assets/img/academicos/taller-08/taller-08_03.png", "assets/img/academicos/taller-08/taller-08_04.png", "assets/img/academicos/taller-08/taller-08_05.png", "assets/img/academicos/taller-08/taller-08_06.png", "assets/img/academicos/taller-08/taller-08_07.png", "assets/img/academicos/taller-08/taller-08_08.png", "assets/img/academicos/taller-08/taller-08_09.png", "assets/img/academicos/taller-08/taller-08_10.png", "assets/img/academicos/taller-08/taller-08_11.png"],
        clase_css: ""
    },
    {
        id: "diseno-interior",
        tipo: "profesionales",
        titulo: "DISENO INTERIOR",
        year: "2026",
        descripcion: "Colección de Renders de Arquitectura Interior, que muestran la aplicación de conceptos de diseño y estética en espacios interiores. Este proyecto busca explorar la interacción entre la luz, los materiales y la disposición del mobiliario para crear ambientes funcionales y visualmente atractivos. Cada render destaca diferentes estilos y enfoques de diseño, desde lo minimalista hasta lo contemporáneo, ofreciendo una visión integral de cómo el diseño interior puede transformar un espacio.",
        imagen_principal: "assets/img/profesionales/diseno-interior/diseno-interior_01.png",
        galeria: ["assets/img/profesionales/diseno-interior/diseno-interior_01.png", "assets/img/profesionales/diseno-interior/diseno-interior_02.png", "assets/img/profesionales/diseno-interior/diseno-interior_03.png", "assets/img/profesionales/diseno-interior/diseno-interior_04.png", "assets/img/profesionales/diseno-interior/diseno-interior_05.png", "assets/img/profesionales/diseno-interior/diseno-interior_06.png", "assets/img/profesionales/diseno-interior/diseno-interior_07.png", "assets/img/profesionales/diseno-interior/diseno-interior_08.png", "assets/img/profesionales/diseno-interior/diseno-interior_09.png", "assets/img/profesionales/diseno-interior/diseno-interior_10.png", "assets/img/profesionales/diseno-interior/diseno-interior_11.png", "assets/img/profesionales/diseno-interior/diseno-interior_12.png", "assets/img/profesionales/diseno-interior/diseno-interior_13.png", "assets/img/profesionales/diseno-interior/diseno-interior_14.png"],
        clase_css: ""
    },
    {
        id: "planimetria-tecnica",
        tipo: "profesionales",
        titulo: "Post Producción de Planimetría",
        year: "2024",
        descripcion: "Post Producción de Planimetría Técnica, es un proyecto que busca mejorar la presentación de planos arquitectónicos y técnicos mediante el uso de técnicas de postproducción digital. El objetivo es lograr una representación más clara y profesional de los planos, facilitando su comprensión y análisis por parte de arquitectos, ingenieros y clientes. Este proyecto incluye la aplicación de filtros, ajustes de color, incorporación de texturas y elementos gráficos adicionales para resaltar detalles importantes y mejorar la legibilidad de los planos.",
        imagen_principal: "assets/img/profesionales/planimetria-tecnica/planimetria-tecnica_01.png",
        galeria: ["assets/img/profesionales/planimetria-tecnica/planimetria-tecnica_01.png", "assets/img/profesionales/planimetria-tecnica/planimetria-tecnica_02.png", "assets/img/profesionales/planimetria-tecnica/planimetria-tecnica_03.png", "assets/img/profesionales/planimetria-tecnica/planimetria-tecnica_04.png", "assets/img/profesionales/planimetria-tecnica/planimetria-tecnica_05.png", "assets/img/profesionales/planimetria-tecnica/planimetria-tecnica_06.png", "assets/img/profesionales/planimetria-tecnica/planimetria-tecnica_07.png", "assets/img/profesionales/planimetria-tecnica/planimetria-tecnica_08.png", "assets/img/profesionales/planimetria-tecnica/planimetria-tecnica_09.jpg"],
        clase_css: ""
    },
    {
        id: "renders",
        tipo: "profesionales",
        titulo: "Renders",
        year: "2026",
        descripcion: "Renders de Proyectos Arquitectónicos para EFE",
        imagen_principal: "assets/img/profesionales/renders/renders_01.png",
        galeria: ["assets/img/profesionales/renders/renders_01.png", "assets/img/profesionales/renders/renders_02.png", "assets/img/profesionales/renders/renders_03.png", "assets/img/profesionales/renders/renders_04.png", "assets/img/profesionales/renders/renders_05.png", "assets/img/profesionales/renders/renders_06.png", "assets/img/profesionales/renders/renders_07.png", "assets/img/profesionales/renders/renders_08.png", "assets/img/profesionales/renders/renders_09.png"],
        clase_css: ""
    }
];