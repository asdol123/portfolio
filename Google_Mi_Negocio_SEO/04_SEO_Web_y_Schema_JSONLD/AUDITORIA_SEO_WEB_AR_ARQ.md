# INFORME DE AUDITORÍA INTEGRAL: SEO LOCAL, GBP E INDEXACIÓN WEB
## Dominio: ar-arq.cl | Empresa: ALZADO ROJO · AR ARQ SpA
**Fecha:** 13 de Noviembre de 2026  
**Auditor:** seo-gbp-director (Director de Posicionamiento Orgánico, GEO y Google Business Profile)

---

## 1. RESUMEN EJECUTIVO & SCORECARD

| Área Evaluada | Estado Actual | Calificación | Veredicto & Prioridad |
|---|---|:---:|---|
| **Indexación & Rastreo (Robots/Sitemap)** | 38 URLs limpias, robots permisivo con IA | **98 / 100** | ✅ Excelente. Sin bloqueos accidentales. |
| **Canonicals & Enrutamiento Vercel** | Clean URLs activas, 308 redirects correctos | **95 / 100** | ✅ Óptimo. Conviven estáticos y dinámicos. |
| **Directivas Noindex** | Cero etiquetas noindex accidentales | **100 / 100** | ✅ Impecable. |
| **Schema.org LocalBusiness / NAP** | Faltan PostalAddress, Geo, Hours, Catalog | **60 / 100** | ⚠️ Urgente. Frena presencia en Local Pack y AEO. |
| **Google Business Profile (GBP Readiness)** | Ficha en fase de configuración / alineación | **65 / 100** | ⚠️ Alta prioridad. Falta sincronización de UTM y categorías. |

---

## 2. AUDITORÍA DE RASTREO, ACCESO Y SALUD TÉCNICA

### 2.1 Archivo `robots.txt`
* **Evaluación:** ✅ Aprobado con honores.
* **Aspectos destacados:**
  * Permite el rastreo total (`Allow: /`) a Googlebot y Bingbot.
  * Permite expresamente a los rastreadores de IA generativa (GEO / AEO): `ChatGPT-User`, `GPTBot`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`. Esto garantiza que los motores de respuesta generativa puedan citar a Alzado Rojo en consultas como *"dónde hacer una maqueta de arquitectura en Santiago"*.
  * Protege con `Disallow` las rutas internas y de taller: `/api/`, `/taller-privado/`, `/scratch/`, `/agenda-pedidos`.
  * Declara explícitamente la ubicación canónica del sitemap: `Sitemap: https://ar-arq.cl/sitemap.xml`.

### 2.2 Archivo `sitemap.xml`
* **Evaluación:** ✅ Aprobado al 100%.
* **Detalle de URLs:**
  * Total de URLs listadas: **38 URLs canónicas limpias** (sin sufijo `.html`).
  * 1 Home (`https://ar-arq.cl/`) - Prioridad 1.0
  * 7 Páginas de Servicios e Institucionales (`/maquetas-urbanas`, `/maquetas-3d`, `/proyectos`, `/sobre-mi`, `/manuales`, `/diseno-interiores`, `/eficiencia-energetica`) - Prioridades 0.80 a 0.95
  * 27 Fichas de Producto Canónicas en `/productos/[slug]` - Prioridad 0.90
  * 3 Páginas Legales (`/politica-privacidad`, `/terminos-condiciones`, `/politica-cookies`) - Prioridad 0.30
* **Fechas:** `lastmod` sincronizado al 2026-11-12.

### 2.3 Configuración de Hosting (`vercel.json`)
* **Clean URLs:** Activado (`"cleanUrls": true`). Los archivos estáticos `.html` son servidos sin extensión y cualquier petición con `.html` es redirigida mediante código de estado HTTP 308 (Permanent Redirect) a la versión limpia, previniendo duplicidad de contenido ante Google.
* **Separación de Rutas:**
  * Las páginas físicas de producto residen en la carpeta física `/productos/` (plural) con sus archivos HTML estáticos.
  * Los rewrites de fallback apuntan a `/producto/:slug` (singular), evitando colisiones de enrutamiento.
* **Cabeceras de Seguridad:** Implementadas correctamente (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).

---

## 3. AUDITORÍA DE DATOS ESTRUCTURADOS (SCHEMA.ORG)

### 3.1 Diagnóstico en `index.html` y `maquetas-urbanas.html`
Actualmente ambas páginas poseen un script `application/ld+json` con `@type: "ProfessionalService"`. Sin embargo, para dominar el **Local 3-Pack de Google Maps** y los snippets locales de Google Search, presenta carencias que deben subsanarse:

1. **Falta de Dirección Física (`PostalAddress`):**  
   Google exige al menos una localidad, región y código postal para anclar la entidad geográficamente a Santiago / Región Metropolitana.
2. **Falta de Coordenadas Geográficas (`GeoCoordinates`):**  
   Sin `latitude` y `longitude`, los algoritmos de proximidad de Google Maps y las IAs de búsqueda local no pueden calcular la distancia al usuario cuando busca desde Las Condes, Vitacura o Providencia.
3. **Ausencia de Horarios de Atención (`openingHoursSpecification`):**  
   Factor de ranking decisivo para búsquedas transaccionales filtradas por *"abierto ahora"* (*open now*).
4. **Desglose de Área de Servicio (`areaServed`):**  
   Actualmente solo declara RM y Chile. Debe desglosarse con las comunas de alto valor comercial: Las Condes, Vitacura, Providencia, Lo Barnechea, Ñuñoa, Santiago Centro.
5. **Catálogo de Servicios Estructurado (`hasOfferCatalog`):**  
   Google reconoce la oferta comercial mediante `OfferCatalog` y `OfferService` con descripciones de los servicios principales.
6. **Falta de Schema en `maquetas-3d.html`:**  
   Esta landing de cotización y servicio de impresión 3D no cuenta actualmente con bloque JSON-LD en su `<head>`.

### 3.2 Diagnóstico en Fichas de Producto (`productos/*.html` y `producto.html`)
* Poseen Schema `@type: "Product"` con `offers`, `sku`, `brand`, `manufacturer` y `BreadcrumbList`.
* **Mejora recomendada:** Unificar el nodo `manufacturer` y `seller` referenciando directamente `@id: "https://ar-arq.cl/#organization"`, consolidando el Knowledge Graph de Alzado Rojo como fabricante directo y vendedor oficial.

---

## 4. CÓDIGO SCHEMA PROPUESTO PARA APLICACIÓN DIRECTA

El archivo [SCHEMA_ORGANIZATION_LOCALBUSINESS.json](file:///d:/Aplicaciones/Portfolio%20AR/Google_Mi_Negocio_SEO/04_SEO_Web_y_Schema_JSONLD/SCHEMA_ORGANIZATION_LOCALBUSINESS.json) contiene la especificación exacta lista para producción que resuelve el 100% de las observaciones.

### Beneficios Inmediatos al Implementar:
1. **Indexación Local Inmediata:** Google valida la entidad `ALZADO ROJO · AR ARQ SpA` como taller físico y profesional de maquetas en Santiago.
2. **Filtro 'Abierto Ahora':** Activa elegibilidad para búsquedas durante la jornada laboral (Lunes a Viernes 09:00 a 19:00, Sábados 10:00 a 14:00).
3. **Grounding en Modelos de IA (GEO):** ChatGPT, Gemini y Perplexity asocian el teléfono `+56962032766`, el correo `adolchilemods@gmail.com` y las comunas de Santiago Oriente a la entidad Alzado Rojo.
