/**
 * ALZADO ROJO · Arquitectura & Fabricación Digital
 * Módulo Frontend de Google Analytics 4 (GA4) y Medición Accesible
 * Archivo: js/analytics.js
 *
 * Características:
 * - Carga modular y asíncrona de Google Tag Manager (gtag.js) para GA4.
 * - Soporte para Measurement ID vía variable global (window.GA_MEASUREMENT_ID)
 *   o etiqueta meta (<meta name="google-analytics-id" content="G-XXXXXXXXXX">).
 * - Integración nativa y estricto respeto del consentimiento de cookies (js/cookies.js / window.AR_COOKIES).
 * - Consent Mode v2 por defecto ('denied') hasta aprobación explícita del usuario.
 * - Cola segura de eventos (data layer) que evita errores si GA aún no carga o si está deshabilitado.
 */

(function (window, document) {
    'use strict';

    // Configuración por defecto / Fallback
    const DEFAULT_MEASUREMENT_ID = 'G-XXXXXXXXXX';
    const GTAG_SCRIPT_ID = 'ar-ga-gtag-script';

    // Inicializar dataLayer y función stub gtag de forma segura
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = window.gtag || gtag;

    /**
     * Resuelve el Measurement ID desde window o meta tag en el DOM
     * @returns {string}
     */
    function resolveMeasurementId() {
        if (typeof window.GA_MEASUREMENT_ID === 'string' && window.GA_MEASUREMENT_ID.trim()) {
            return window.GA_MEASUREMENT_ID.trim();
        }

        const metaTag = document.querySelector('meta[name="google-analytics-id"]') ||
                        document.querySelector('meta[name="ga-measurement-id"]');
        if (metaTag && metaTag.getAttribute('content')) {
            const content = metaTag.getAttribute('content').trim();
            if (content) return content;
        }

        return DEFAULT_MEASUREMENT_ID;
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
     * Inyecta el script oficial de Google Tag Manager de manera asíncrona y segura
     * @param {string} measurementId
     */
    function injectGtagScript(measurementId) {
        if (!measurementId || measurementId === DEFAULT_MEASUREMENT_ID) {
            // Modo placeholder: no inyectar script externo hasta contar con un ID real
            return;
        }

        if (document.getElementById(GTAG_SCRIPT_ID)) {
            return; // Ya inyectado previamente
        }

        const script = document.createElement('script');
        script.id = GTAG_SCRIPT_ID;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;

        script.onerror = function () {
            console.warn('[ALZADO ROJO Analytics] No se pudo cargar el script de Google Tag Manager.');
        };

        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
        } else {
            document.head.appendChild(script);
        }
    }

    /**
     * Configuración del Consent Mode v2 de Google
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
     * Actualiza el Consent Mode cuando el usuario cambia su preferencia
     * @param {boolean} granted
     */
    function updateConsentMode(granted) {
        const state = granted ? 'granted' : 'denied';
        window.gtag('consent', 'update', {
            'analytics_storage': state,
            'ad_storage': state,
            'ad_user_data': state,
            'ad_personalization': state
        });
    }

    /**
     * Inicializa Google Analytics 4
     */
    let isInitialized = false;

    function initGA() {
        const measurementId = resolveMeasurementId();
        const consentGranted = hasAnalyticsConsent();

        // 1. Establecer Consent Mode inicial
        setConsentMode(consentGranted);

        // 2. Registro de inicialización gtag
        window.gtag('js', new Date());

        // 3. Configuración del Measurement ID
        if (measurementId && measurementId !== DEFAULT_MEASUREMENT_ID) {
            window.gtag('config', measurementId, {
                anonymize_ip: true,
                send_page_view: true,
                transport_type: 'beacon'
            });

            // Si hay consentimiento, inyectar el script externo de Google
            if (consentGranted) {
                injectGtagScript(measurementId);
            }
        }

        isInitialized = true;
    }

    /**
     * Manejador del cambio de consentimiento de cookies
     * @param {CustomEvent} event
     */
    function handleConsentChange(event) {
        const consentType = event && event.detail ? event.detail.consent : null;
        const granted = (consentType === 'accepted');

        updateConsentMode(granted);

        if (granted) {
            const measurementId = resolveMeasurementId();
            if (measurementId && measurementId !== DEFAULT_MEASUREMENT_ID) {
                injectGtagScript(measurementId);
            }
        }
    }

    // Escuchar eventos de cambio de consentimiento emitidos por js/cookies.js
    window.addEventListener('cookieConsentChanged', handleConsentChange);
    document.addEventListener('cookieConsentChanged', handleConsentChange);

    // Inicializar al cargar el DOM o inmediatamente si ya está listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGA);
    } else {
        initGA();
    }

    /**
     * API Pública expuesta en window.AR_ANALYTICS
     */
    window.AR_ANALYTICS = {
        getMeasurementId: resolveMeasurementId,
        setMeasurementId: function (id) {
            if (typeof id === 'string' && id.trim()) {
                window.GA_MEASUREMENT_ID = id.trim();
                if (hasAnalyticsConsent()) {
                    injectGtagScript(id.trim());
                    window.gtag('config', id.trim(), {
                        anonymize_ip: true,
                        send_page_view: true
                    });
                }
            }
        },
        hasConsent: hasAnalyticsConsent,
        trackEvent: function (eventName, eventParams) {
            if (typeof window.gtag === 'function') {
                window.gtag('event', eventName, eventParams || {});
            }
        }
    };

})(window, document);
