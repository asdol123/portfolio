# Design System: Alzado Rojo (`ar-arq.cl`)
> **Formato Oficial `awesome-design-md` · 9 Secciones Estandarizadas**  
> **Ámbito:** Single Source of Truth (SSOT) para Frontend Web (`ar-arq.cl`), Motion Graphics (`Remotion` / `HyperFrames`), Carruseles Editoriales y Dashboards.  
> **Fundador:** Adolfo Risopatrón Inzunza (Arquitecto UC / Magíster MASE UC).  
> **Versión:** 2.5 Definitiva (Noviembre 2026).

---

## 1. Visual Theme & Atmosphere
Alzado Rojo encarna el **Brutalismo Arquitectónico Suizo combinado con el Minimalismo Editorial de Alta Precisión**. Inspirado en los planos técnicos ortogonales, la retícula tipográfica de la Escuela de Basilea (Josef Müller-Brockmann) y los principios de diseño industrial de Dieter Rams, cada pantalla, carrusel o encuadre de video se concibe como una verdadera **elevación ortogonal ("alzado")** de una pieza de arte territorial.

La atmósfera es diáfana, serena, amplia y quirúrgica (`#FFFFFF` a `#F4F3EF`), estructurada por tinta negra carbón (`#111111`) y acentuada exclusivamente por un incisivo **Rojo Carmesí Alzado (`#D92525`)** reservado para la tensión visual dominante. Las maquetas 3D urbanas y territoriales se exhiben enmarcadas en cajas de sombra profunda (*Shadowbox frames*), evocando la luz rasante que esculpe las calles, manzanas y desniveles topográficos.

---

## 2. Color Palette & Roles

### 2.1 Superficies y Lienzos (Canvas Tokens)
- **Blanco Editorial Puro (`#FFFFFF`)**: Canvas primario, superficie de tarjetas, paspartú de cuadros y color del filamento PLA mate para el relieve arquitectónico.
- **Blanco Alabastro Suave (`#F4F3EF`)**: Canvas secundario para fondos web cálidos, contraste suave de secciones y sustrato de papel de algodón de 300g para certificados de autenticidad.
- **Negro Carbón Estructural (`#111111`)**: Molduras de marcos shadowbox, sombra axonométrica del isotipo y cabeceras de alto contraste.
- **Negro Ónix Profundo (`#0A0A0B`)**: Fondos inmersivos de video, salas de exposición nocturnas y estuches rígidos de packaging.

### 2.2 Tintas y Jerarquía de Texto (Typography Ink)
- **Negro Carbón Primario (`#111111`)**: Títulos principales H1/H2 y textos con legibilidad 100% accesible (WCAG AAA).
- **Gris Pizarra Técnico (`#4A4A4A`)**: Subtítulos de sección, párrafos descriptivos y especificaciones técnicas.
- **Gris Muted Arquitectónico (`#6B6B73`)**: Coordenadas satelitales, fechas, numeración tabular (`01 / 06`) y pies de página.
- **Gris Guía Blueprint (`#E5E5E0`)**: Retícula milimétrica, dividers de 1px y líneas de cota.

### 2.3 Acentos de Marca e Interacción (Brand & Semantic Tokens)
- **Rojo Carmesí Alzado (`#D92525` / `rgb(217, 37, 37)`)**: Identidad central de la marca. Rombo del logotipo, palabra "ROJO" en titulares, botones de acción primaria (CTA), divisores focales y sellos de lacre.
- **Rojo Vibrante Hover (`#E61919`)**: Estado hover de botones primarios y micro-indicadores luminosos.
- **Rojo Profundo Active (`#C91515`)**: Estado de pulsación/activo en elementos interactivos.
- **Acento Latón / Bronce de Autenticidad (`#C5A880`)**: Placas metálicas grabadas al láser, distintivos de edición limitada y timbres de certificación B2B.

---

## 3. Typography Rules

### 3.1 Familias Tipográficas Oficiales (Google Fonts)
- **Display & Hero (`Syne`)**: Pesos **Bold (700)** y **ExtraBold (800)**. Usada en grandes titulares de apertura, portadas de catálogo, láminas de impacto de carruseles y miniaturas de video. Transmite fuerza escultural y presencia volumétrica.
- **Lectura & UI (`Plus Jakarta Sans` & `Montserrat`)**: Pesos **Light (300)**, **Regular (400)** y **SemiBold (600)**. Usada en navegación, cuerpos de texto, fichas de producto, botones y formularios web. Legibilidad geométrica óptima en dispositivos móviles.
- **Técnico, Cotas & Cartografía (`JetBrains Mono`)**: Pesos **Regular (400)** y **Medium (500)**. Utilizada obligatoriamente para escalas (`1:500`, `1:1000`), coordenadas GPS (`-33.4190° S, -70.6067° O`), cotas (`+642 m`), tolerancias (`< 0.10 mm`) y folios de certificado. **Regla requerida:** `font-variant-numeric: tabular-nums`.

### 3.2 La Regla de Contraste en Titulares (Firma Alzado Rojo)
Todo titular display debe aplicar la dualidad de peso y color:
- **Parte de contexto:** Mayúsculas en peso **Light (300)** o **Regular (400)** en color Negro Carbón (`#111111`).
- **Palabra clave de tensión:** Peso **Bold (700)** en **Rojo Carmesí (`#D92525`)**.
*Ejemplo:* `ARQUITECTURA Y` (300) `MAQUETAS 3D.` (700 en `#D92525`).

### 3.3 Escala Tipográfica Modular
- **Display / Hero**: `clamp(2.5rem, 5vw, 4.5rem)`, line-height `1.08`, tracking `-0.02em`.
- **H1 / Título de Sección**: `clamp(1.85rem, 3.5vw, 2.75rem)`, line-height `1.15`, tracking `-0.01em`.
- **H2 / Sub-titular**: `1.35rem`–`1.5rem`, line-height `1.25`, weight `600`.
- **Body / Lectura Base**: `1rem` (`16px`), line-height `1.65`, weight `400`, max line width `65ch`.
- **Tech Label / Cota**: `0.75rem` (`12px`), `JetBrains Mono`, tracking `+0.12em`, `tabular-nums`.
- **Eyebrow / Badge**: `0.6875rem` (`11px`), weight `700`, uppercase, tracking `+0.20em`.

---

## 4. Component Stylings

- **Botón Primario (Action CTA)**:
  - Fondo: `#D92525`, Texto: `#FFFFFF` (Bold 600, `13px`–`14px`, uppercase, tracking `0.10em`).
  - Hover: Fondo `#E61919`, sombra sutil `0 8px 24px -4px rgba(217, 37, 37, 0.35)`.
  - Radio: `0px` (estilo drafting arquitectónico) o `9999px` (estilo pill contemporáneo para web e-commerce).
  - Transición: `180ms cubic-bezier(0.22, 1, 0.36, 1)`.
- **Botón Secundario / Outline**:
  - Fondo: Transparente, Borde: `1px solid #111111`, Texto: `#111111`.
  - Hover: Fondo `#111111`, Texto: `#FFFFFF`.
- **Tarjetas de Producto y Muestrarios**:
  - Fondo: `#FFFFFF`, Borde: `1px solid #E5E5E0` (o `rgba(17, 17, 17, 0.08)`).
  - Radio: `16px` para interfaz web responsive, o `0px` estricto en fichas de expediente técnico.
  - Sombra reposo: `0 4px 16px -2px rgba(17, 17, 17, 0.04)`.
  - Sombra hover: `0 20px 48px -10px rgba(17, 17, 17, 0.08)`.
- **Insignia Metálica (Placa de Autenticidad)**:
  - Fondo: Degradado metálico sutil latón (`#C5A880` a `#B39266`), Texto: `#111111` (Mono 10px, uppercase, tracking `0.15em`), bordes biselados `1px solid #99784D`.
- **Divisores y Separadores de Grilla**:
  - `1px solid #E5E5E0` continuo, evocando el marco exterior de los planos de dibujo técnico.

---

## 5. Layout Principles

- **Retícula Modular Arquitectónica (12 Columnas)**:
  - Grilla CSS fluida con gutters de `24px` a `48px`.
  - Contenedor de ancho máximo: `min(94vw, 1560px)`.
- **Regla del Espacio Negativo (Whitespace Ratio)**:
  - Al menos el 35% del área visible de cualquier pantalla o frame de video debe ser lienzo limpio (`#FFFFFF` o `#F4F3EF`), permitiendo que el relieve tridimensional respire.
- **Escala Espacial 8pt**:
  - `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`, `128px`.

---

## 6. Depth & Elevation

- **Concepto Shadowbox:** A diferencia de las interfaces planas convencionales, la profundidad se modela inspirándose en el marco físico de las maquetas urbanas (madera profunda de 40 mm con relieve interior blanco).
- **Sombras Físicas Arquitectónicas:**
  - Nivel 1 (Superficie sutil): `0 2px 8px rgba(0, 0, 0, 0.04)`.
  - Nivel 2 (Tarjeta interactiva): `0 12px 32px -8px rgba(17, 17, 17, 0.06)`.
  - Nivel 3 (Shadowbox Framed): `0 28px 70px -15px rgba(0, 0, 0, 0.35), 0 10px 25px -5px rgba(0, 0, 0, 0.15)`.
- **Vidrio Arquitectónico (Glassmorphism sutil)**:
  - Solo en la barra de navegación superior flotante (`--ed-header`): `background: rgba(255, 255, 255, 0.92)`, `backdrop-filter: blur(20px) saturate(180%)`, borde inferior `1px solid rgba(17, 17, 17, 0.06)`.

---

## 7. Do's and Don'ts

### DO's (Obligatorio)
- **SÍ** respetar el isotipo original: Rombo a 45° en `#D92525`, círculo central dividido y sombra proyectada axonométrica negra (`#111111`).
- **SÍ** combinar tipografía `Syne` (Bold) con `Plus Jakarta Sans` y datos tabulares en `JetBrains Mono`.
- **SÍ** usar la regla del titular bicolor: palabra principal en `#D92525` y contexto en `#111111`.
- **SÍ** mantener las tolerancias dimensionales expresadas en cifras exactas (`< 0.10 mm`, escalas `1:500`, `1:1000`, `1:2000`).
- **SÍ** reservar un margen de seguridad perimetral del 20% en avatares circulares para Instagram y LinkedIn.

### DON'Ts (Prohibiciones Estrictas)
- **NO** alterar la sombra proyectada del isotipo ni deformar el rombo a ángulos distintos de 45°.
- **NO** utilizar esquinas redondeadas excesivas o botones gelatinosos (mantener el rigor editorial).
- **NO** saturar la interfaz con múltiples colores secundarios o degradados multicolor arcoíris.
- **NO** superponer texto rojo `#D92525` sobre fondos oscuros sin validar ratio de contraste.
- **NO** utilizar tipografías manuscritas, decorativas o cómicas.

---

## 8. Responsive Behavior & Motion Safe Zones

### 8.1 Breakpoints de Pantalla
- **Desktop Pro (`> 1280px`)**: Grilla modular asimétrica de 12 columnas con etiquetas de cota y coordenadas visibles.
- **Laptop / Tablet (`768px – 1279px`)**: Grilla adaptada a 6 columnas, navegación condensada y espaciados de `24px`.
- **Mobile (`< 768px`)**: Columna única apilada, márgenes laterales de `20px` a `24px`, botones con área táctil mínima de `48px` de altura.

### 8.2 Safe Zones para Video y Motion Graphics (`9:16` — 1080 x 1920 px)
- **Margen Superior Seguro:** `140px` libre de texto o logotipos clave (oculto por la barra de estado de Reels/Shorts).
- **Margen Inferior Seguro:** `240px` libre de información esencial (oculto por el texto de pie, autor y selector de audio).
- **Márgenes Laterales:** Mínimo `64px` de margen libre a izquierda y derecha.

---

## 9. Agent Prompt Guide & Code Tokens

### 9.1 CSS Variables `:root` (Listas para Producción)
```css
:root {
  /* Paleta Cromática Exacta */
  --ar-red-crimson: #D92525;
  --ar-red-hover: #E61919;
  --ar-red-active: #C91515;
  --ar-canvas-pure: #FFFFFF;
  --ar-canvas-alabaster: #F4F3EF;
  --ar-ink-carbon: #111111;
  --ar-ink-slate: #4A4A4A;
  --ar-ink-muted: #6B6B73;
  --ar-guide-blueprint: #E5E5E0;
  --ar-brass-gold: #C5A880;

  /* Tipografías */
  --ar-font-display: 'Syne', sans-serif;
  --ar-font-body: 'Plus Jakarta Sans', 'Montserrat', sans-serif;
  --ar-font-mono: 'JetBrains Mono', monospace;

  /* Curvas Físicas Motion */
  --ar-ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
  --ar-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 9.2 Motion Tokens para Remotion (React + TypeScript)
```typescript
export const ALZADO_SPRING_CONFIG = {
  mass: 0.85,
  damping: 18,
  stiffness: 110,
  overshootClamping: false,
};

export const ALZADO_COLORS = {
  crimson: '#D92525',
  carbon: '#111111',
  pureWhite: '#FFFFFF',
  alabaster: '#F4F3EF',
  slate: '#4A4A4A',
  brass: '#C5A880',
};
```

### 9.3 Enlaces Oficiales Registrados
- **Manual de Marca Oficial 16:9:** `https://canva.link/jhedtd3fnnbdd9k`
- **Logotipo y Variantes Vectoriales en Canva:** `https://www.canva.com/design/DAHS-U-PV98/vZohJT9u0dXnyTtpj33RVA/edit`
- **Sitio Web Oficial:** `https://ar-arq.cl`
- **Instagram:** `@alzadorojo`
