/**
 * ALZADO ROJO · Arquitectura & Fabricación Digital
 * Módulo de Analítica, Google Tag Manager y Consent Mode v2
 * Archivo: js/analytics.js
 *
 * Características:
 * - Soporte nativo y simultáneo para Google Analytics 4 (G-RJWXF5FVQ6) y Google Tag Manager (GTM-WT9GRLRL).
 * - Detección automática del tipo de ID (Contenedor GTM `GTM-XXXXXXX` vs Medición GA4 `G-XXXXXXXXXX`).
 * - Integración con Consent Mode v2 de Google (denegado por defecto, actualización dinámica al aceptar cookies).
 * - Prevención de duplicación: verifica scripts estáticos preexistentes en <head> (gtm.js o gtag/js).
 * - API de E-commerce para seguimiento estándar (view_item, add_to_cart, begin_checkout, purchase)
 *   asociando de forma segura ambos identificadores (GA4 y GTM).
 * - Sincronización con el gestor de consentimiento de cookies (js/cookies.js / window.AR_COOKIES).
 */

(function (window, document) {
    'use strict';

    // Identificadores oficiales de Google Analytics 4 y Google Tag Manager
    const GA4_MEASUREMENT_ID = 'G-RJWXF5FVQ6';
    const GTM_CONTAINER_ID = 'GTM-WT9GRLRL';
    const DEFAULT_MEASUREMENT_ID = GA4_MEASUREMENT_ID;
    const GTAG_SCRIPT_ID = 'ar-ga-gtag-script';

    // Inicializar dataLayer y función stub gtag de forma segura
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = window.gtag || gtag;

    /**
     * Determina si un identificador corresponde a un contenedor de Google Tag Manager
     * @param {string} id
     * @returns {boolean}
     */
    function isGtmContainer(id) {
        return /^GTM-[A-Z0-9]+$/i.test(String(id || '').trim());
    }

    /**
     * Determina si un identificador corresponde a una propiedad de Google Analytics 4
     * @param {string} id
     * @returns {boolean}
     */
    function isGa4MeasurementId(id) {
        return /^G-[A-Z0-9]+$/i.test(String(id || '').trim());
    }

    /**
     * Resuelve el ID de medición o contenedor desde window, meta tags en el DOM o fallback por defecto oficial (GA4)
     * @returns {string}
     */
    function resolveMeasurementId() {
        if (typeof window.GA_MEASUREMENT_ID === 'string' && window.GA_MEASUREMENT_ID.trim()) {
            return window.GA_MEASUREMENT_ID.trim();
        }

        if (typeof window.GTM_CONTAINER_ID === 'string' && window.GTM_CONTAINER_ID.trim()) {
            return window.GTM_CONTAINER_ID.trim();
        }

        const metaTag = document.querySelector('meta[name="google-analytics-id"]') ||
                        document.querySelector('meta[name="ga-measurement-id"]') ||
                        document.querySelector('meta[name="google-tag-id"]') ||
                        document.querySelector('meta[name="gtm-id"]') ||
                        document.querySelector('meta[name="gtm-container-id"]');

        if (metaTag && metaTag.getAttribute('content')) {
            const content = metaTag.getAttribute('content').trim();
            if (content) return content;
        }

        return GA4_MEASUREMENT_ID;
    }

    /**
     * Comprueba si el usuario ha otorgado consentimiento de cookies analíticas
     * @returns {boolean}
     */
    function hasAnalyticsConsent() {
        if (window.AR_COOKIES && typeof window.AR_COOKIES.getConsentStatus === 'function') {
            return window.AR_COOKIES.getConsentStatus() === 'accepted';
        }

        // Si AR_COOKIES aún no se carga, verificar localStorage directamente
        try {
            if (window.localStorage) {
                return window.localStorage.getItem('ar_cookie_consent') === 'accepted';
            }
        } catch (e) {
            // Ignorar restricciones en entornos privados
        }

        return false;
    }

    /**
     * Inyecta el script oficial de Google (GTM o GA4) de manera asíncrona y segura
     * evitando duplicados en el DOM.
     * @param {string} measurementId
     */
    function injectGtagScript(measurementId) {
        if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
            return;
        }

        const scriptId = GTAG_SCRIPT_ID + '-' + String(measurementId).toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (document.getElementById(scriptId)) {
            return;
        }

        // Evitar duplicados: verificar si ya existe en el DOM algún script con este ID específico
        const existingScripts = document.getElementsByTagName('script');
        for (let i = 0; i < existingScripts.length; i++) {
            const src = existingScripts[i].src || existingScripts[i].getAttribute('src') || '';
            if (src.indexOf(measurementId) !== -1) {
                return;
            }
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;

        if (measurementId.startsWith('GTM-')) {
            script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(measurementId);
        } else {
            script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
        }

        script.onerror = function () {
            console.warn('[ALZADO ROJO Analytics] No se pudo cargar el script de Google (' + measurementId + ').');
        };

        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
        } else {
            (document.head || document.documentElement).appendChild(script);
        }
    }

    /**
     * Configuración del Consent Mode v2 por defecto
     * @param {boolean} granted
     */
    function setConsentMode(granted) {
        const state = granted ? 'granted' : 'denied';
        window.gtag('consent', 'default', {
            'analytics_storage': state,
            'ad_storage': state,
            'ad_user_data': state,
            'ad_personalization': state,
            'wait_for_update': 500
        });
    }

    /**
     * Actualiza el Consent Mode v2 cuando el usuario cambia su preferencia de cookies
     * @param {boolean} granted
     */
    function updateConsentMode(granted) {
        if (granted) {
            window.gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
            });
        } else {
            window.gtag('consent', 'update', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
            });
        }
    }

    /**
     * Inicialización del entorno de Analytics / Google Tag
     */
    let isInitialized = false;

    function initGA() {
        if (isInitialized) return;

        const measurementId = resolveMeasurementId();
        const consentGranted = hasAnalyticsConsent();

        // 1. Establecer Consent Mode inicial (denied por defecto si no hay aceptación previa)
        setConsentMode(consentGranted);

        // 2. Registro de inicialización gtag
        window.gtag('js', new Date());

        // 3. Configuración de Google Analytics 4 (GA4) y Google Tag Manager (GTM)
        const configuredIds = [];

        // Registrar ID oficial GA4
        if (GA4_MEASUREMENT_ID && GA4_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
            window.gtag('config', GA4_MEASUREMENT_ID, {
                anonymize_ip: true,
                send_page_view: true,
                transport_type: 'beacon'
            });
            configuredIds.push(GA4_MEASUREMENT_ID);
        }

        // Registrar ID oficial GTM si no está ya registrado
        if (GTM_CONTAINER_ID && !configuredIds.includes(GTM_CONTAINER_ID)) {
            window.gtag('config', GTM_CONTAINER_ID);
            configuredIds.push(GTM_CONTAINER_ID);
        }

        // Si se resolvió un measurementId personalizado adicional (ej. via meta tag o override en window)
        if (measurementId && !configuredIds.includes(measurementId) && measurementId !== 'G-XXXXXXXXXX') {
            window.gtag('config', measurementId, {
                anonymize_ip: true,
                send_page_view: true,
                transport_type: 'beacon'
            });
            configuredIds.push(measurementId);
        }

        // Si hay consentimiento otorgado previamente, cargar script GA4 si aún no está presente
        if (consentGranted) {
            injectGtagScript(GA4_MEASUREMENT_ID);
        }

        isInitialized = true;
    }

    /**
     * Manejador del cambio de consentimiento emitido por js/cookies.js
     * @param {CustomEvent} event
     */
    function handleConsentChange(event) {
        const consentType = event && event.detail ? event.detail.consent : null;
        const granted = (consentType === 'accepted');

        updateConsentMode(granted);

        if (granted) {
            const measurementId = resolveMeasurementId();
            if (measurementId && measurementId !== 'G-XXXXXXXXXX') {
                injectGtagScript(measurementId);
            }
            if (GA4_MEASUREMENT_ID && GA4_MEASUREMENT_ID !== measurementId) {
                injectGtagScript(GA4_MEASUREMENT_ID);
            }
        }
    }

    // Escuchar eventos de cambio de consentimiento
    if (typeof window.addEventListener === 'function') {
        window.addEventListener('cookieConsentChanged', handleConsentChange);
    }
    if (typeof document.addEventListener === 'function') {
        document.addEventListener('cookieConsentChanged', handleConsentChange);
    }

    // Inicializar al cargar el DOM o inmediatamente si ya está listo
    if (document.readyState === 'loading' && typeof document.addEventListener === 'function') {
        document.addEventListener('DOMContentLoaded', initGA);
    } else {
        initGA();
    }

    // ==========================================
    // HELPERS Y FUNCIONES DE E-COMMERCE TRACKING
    // ==========================================

    /**
     * Normaliza un ítem para eventos estándar de Google Analytics 4 / Tag Manager
     * @param {Object} it
     * @returns {Object|null}
     */
    function normalizeItem(it) {
        if (!it || typeof it !== 'object') return null;
        return {
            item_id: String(it.id || it.sku || it.item_id || ''),
            item_name: String(it.name || it.title || it.shortName || it.item_name || ''),
            price: Number(it.price) || 0,
            item_category: String(it.category || it.collection || it.item_category || 'Maquetas de Arquitectura'),
            item_variant: String(it.variant || it.format || it.size || it.item_variant || ''),
            quantity: Number(it.quantity) || 1
        };
    }

    /**
     * Despacha un evento genérico al dataLayer y a gtag asociando ambos IDs de manera segura
     * @param {string} eventName
     * @param {Object} [eventParams]
     */
    function trackEvent(eventName, eventParams) {
        if (!eventName || typeof eventName !== 'string') return;
        const params = Object.assign({
            send_to: [GA4_MEASUREMENT_ID, GTM_CONTAINER_ID].filter(Boolean),
            ga4_measurement_id: GA4_MEASUREMENT_ID,
            gtm_container_id: GTM_CONTAINER_ID
        }, eventParams || {});

        // Respetar send_to explícito si viene especificado por el invocador
        if (eventParams && eventParams.send_to) {
            params.send_to = eventParams.send_to;
        }

        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        } else {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: eventName,
                ...params
            });
        }
    }

    /**
     * Evento de visualización de producto (view_item)
     * Envía a gtag('event', 'view_item', ...) asociando GA4 y GTM
     * @param {Object|Array} item
     */
    function viewItem(item) {
        if (!item) return;
        const rawItems = Array.isArray(item) ? item : [item];
        const items = rawItems.map(normalizeItem).filter(Boolean);
        const value = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

        trackEvent('view_item', {
            currency: 'CLP',
            value: value,
            items: items
        });
    }

    /**
     * Evento de añadir al carrito (add_to_cart)
     * Envía a gtag('event', 'add_to_cart', ...) asociando GA4 y GTM
     * @param {Object|Array} item
     */
    function addToCart(item) {
        if (!item) return;
        const rawItems = Array.isArray(item) ? item : [item];
        const items = rawItems.map(normalizeItem).filter(Boolean);
        const value = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

        trackEvent('add_to_cart', {
            currency: 'CLP',
            value: value,
            items: items
        });
    }

    /**
     * Evento de inicio de proceso de compra (begin_checkout)
     * Envía a gtag('event', 'begin_checkout', ...) asociando GA4 y GTM
     * @param {Object} cart
     */
    function beginCheckout(cart) {
        if (!cart) return;
        const rawItems = Array.isArray(cart.items) ? cart.items : (Array.isArray(cart) ? cart : [cart]);
        const items = rawItems.map(normalizeItem).filter(Boolean);
        const value = Number(cart.value) || items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

        trackEvent('begin_checkout', {
            currency: (cart && cart.currency) || 'CLP',
            value: value,
            coupon: (cart && cart.coupon) || '',
            items: items
        });
    }

    /**
     * Evento de compra completada (purchase)
     * Envía a gtag('event', 'purchase', ...) asociando GA4 y GTM
     * @param {Object} order
     */
    function purchase(order) {
        if (!order) return;
        const rawItems = Array.isArray(order.items) ? order.items : [];
        const items = rawItems.map(normalizeItem).filter(Boolean);
        const value = Number(order.value) || items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

        trackEvent('purchase', {
            transaction_id: String(order.id || order.transaction_id || `AR_${Date.now()}`),
            value: value,
            currency: order.currency || 'CLP',
            tax: Number(order.tax) || 0,
            shipping: Number(order.shipping) || 0,
            coupon: order.coupon || '',
            items: items
        });
    }

    /**
     * API Pública expuesta en window.AR_ANALYTICS
     */
    window.AR_ANALYTICS = {
        GA4_ID: GA4_MEASUREMENT_ID,
        GTM_ID: GTM_CONTAINER_ID,
        DEFAULT_ID: DEFAULT_MEASUREMENT_ID,
        getMeasurementId: resolveMeasurementId,
        setMeasurementId: function (id) {
            if (typeof id === 'string' && id.trim()) {
                const cleanId = id.trim();
                if (isGa4MeasurementId(cleanId)) {
                    window.GA_MEASUREMENT_ID = cleanId;
                } else if (isGtmContainer(cleanId)) {
                    window.GTM_CONTAINER_ID = cleanId;
                } else {
                    window.GA_MEASUREMENT_ID = cleanId;
                }

                if (hasAnalyticsConsent()) {
                    injectGtagScript(cleanId);
                    window.gtag('config', cleanId, {
                        anonymize_ip: true,
                        send_page_view: true
                    });
                }
            }
        },
        hasConsent: hasAnalyticsConsent,
        isGtm: isGtmContainer,
        isGa4: isGa4MeasurementId,
        trackEvent: trackEvent,
        view_item: viewItem,
        add_to_cart: addToCart,
        begin_checkout: beginCheckout,
        purchase: purchase,
        // Métodos semánticos complementarios
        trackViewItem: viewItem,
        trackAddToCart: addToCart,
        trackBeginCheckout: beginCheckout,
        trackPurchase: purchase
    };

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});
