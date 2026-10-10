/**
 * ALZADO ROJO | Arquitectura & Fabricación Digital
 * Módulo de Gestión de Consentimiento de Cookies y Privacidad
 *
 * Provee la lógica de persistencia, validación y control de estado
 * conforme a normativas de privacidad y cookies (GDPR / LSSI / Ley chilena).
 */

(function (window, document) {
    'use strict';

    // Constantes de persistencia y configuración
    const STORAGE_KEY_CONSENT = 'ar_cookie_consent';
    const STORAGE_KEY_DATE = 'ar_cookie_consent_date';
    const BANNER_ID = 'ar-cookie-banner';

    const CONSENT_ACCEPTED = 'accepted';
    const CONSENT_NECESSARY = 'necessary';

    // Almacén seguro en memoria para navegadores con almacenamiento bloqueado (ej. incógnito estricto)
    const memoryStorage = {};

    /**
     * Lectura segura de almacenamiento local con respaldo en memoria
     * @param {string} key
     * @returns {string|null}
     */
    function safeStorageGet(key) {
        try {
            if (window.localStorage) {
                return window.localStorage.getItem(key);
            }
        } catch (error) {
            // Manejo de restricciones en navegación privada o cuotas
        }
        return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null;
    }

    /**
     * Escritura segura en almacenamiento local con respaldo en memoria
     * @param {string} key
     * @param {string} value
     */
    function safeStorageSet(key, value) {
        try {
            if (window.localStorage) {
                window.localStorage.setItem(key, value);
            }
        } catch (error) {
            // Manejo de restricciones en navegación privada o cuotas
        }
        memoryStorage[key] = String(value);
    }

    /**
     * Eliminación segura de almacenamiento local y memoria
     * @param {string} key
     */
    function safeStorageRemove(key) {
        try {
            if (window.localStorage) {
                window.localStorage.removeItem(key);
            }
        } catch (error) {
            // Manejo de restricciones en navegación privada o cuotas
        }
        delete memoryStorage[key];
    }

    /**
     * Obtiene el estado actual de consentimiento
     * @returns {string|null} 'accepted' | 'necessary' | null
     */
    function getConsentStatus() {
        const val = safeStorageGet(STORAGE_KEY_CONSENT);
        if (val === CONSENT_ACCEPTED || val === CONSENT_NECESSARY) {
            return val;
        }
        return null;
    }

    /**
     * Oculta el banner accesible de cookies del DOM
     */
    function hideBanner() {
        const banner = document.getElementById(BANNER_ID);
        if (banner) {
            banner.setAttribute('hidden', '');
            banner.setAttribute('aria-hidden', 'true');
            banner.classList.remove('ar-cookie-banner--visible');
            banner.classList.add('ar-cookie-banner--hidden');
        }
    }

    /**
     * Hace visible el banner accesible de cookies
     */
    function showBanner() {
        let banner = document.getElementById(BANNER_ID);
        if (!banner) {
            banner = createBannerDOM(true);
        }
        if (banner) {
            banner.removeAttribute('hidden');
            banner.setAttribute('aria-hidden', 'false');
            banner.classList.remove('ar-cookie-banner--hidden');
            banner.classList.add('ar-cookie-banner--visible');
        }
    }

    /**
     * Almacena el consentimiento, actualiza la interfaz y despacha el evento de cambio
     * @param {string} type 'accepted' | 'necessary'
     */
    function setConsent(type) {
        const normalizedType = (type === CONSENT_ACCEPTED) ? CONSENT_ACCEPTED : CONSENT_NECESSARY;
        const timestamp = new Date().toISOString();

        safeStorageSet(STORAGE_KEY_CONSENT, normalizedType);
        safeStorageSet(STORAGE_KEY_DATE, timestamp);

        hideBanner();

        // Despachar evento para componentes o scripts analíticos de terceros
        const detail = {
            consent: normalizedType,
            timestamp: timestamp
        };

        const customEvent = new CustomEvent('cookieConsentChanged', {
            bubbles: true,
            cancelable: false,
            detail: detail
        });

        window.dispatchEvent(customEvent);
        document.dispatchEvent(customEvent);

        return normalizedType;
    }

    /**
     * Elimina el consentimiento guardado y vuelve a mostrar el banner para su reconfiguración
     */
    function resetConsent() {
        safeStorageRemove(STORAGE_KEY_CONSENT);
        safeStorageRemove(STORAGE_KEY_DATE);

        const customEvent = new CustomEvent('cookieConsentChanged', {
            bubbles: true,
            cancelable: false,
            detail: {
                consent: null,
                timestamp: new Date().toISOString()
            }
        });

        window.dispatchEvent(customEvent);
        document.dispatchEvent(customEvent);

        showBanner();
    }

    /**
     * Genera e inyecta en el DOM el banner accesible de cookies si no existe consentimiento
     * @param {boolean} [force=false] Forzar la creación aunque ya exista consentimiento previo
     * @returns {HTMLElement|null}
     */
    function createBannerDOM(force = false) {
        if (!force && getConsentStatus()) {
            return null;
        }

        let existingBanner = document.getElementById(BANNER_ID);
        if (existingBanner) {
            existingBanner.removeAttribute('hidden');
            existingBanner.setAttribute('aria-hidden', 'false');
            existingBanner.classList.remove('ar-cookie-banner--hidden');
            existingBanner.classList.add('ar-cookie-banner--visible');
            return existingBanner;
        }

        const banner = document.createElement('aside');
        banner.id = BANNER_ID;
        banner.className = 'ar-cookie-banner ar-cookie-banner--visible';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Consentimiento de cookies y privacidad');
        banner.setAttribute('aria-describedby', 'ar-cookie-text');

        banner.innerHTML = `
            <div class="ar-cookie-banner__inner">
                <div class="ar-cookie-banner__content">
                    <p id="ar-cookie-text" class="ar-cookie-banner__text">
                        En ALZADO ROJO utilizamos cookies técnicas estrictamente necesarias para la navegación y personalización de preferencias. Puede aceptar todas las funciones o limitar su uso a las necesarias. Consulte los detalles en nuestra <a href="politica-cookies.html" class="ar-cookie-banner__link" aria-label="Leer política de cookies">Política de Cookies</a>.
                    </p>
                </div>
                <div class="ar-cookie-banner__actions">
                    <button type="button" id="ar-cookie-btn-necessary" class="ar-cookie-btn ar-cookie-btn--necessary" aria-label="Aceptar únicamente cookies técnicas necesarias">
                        SOLO NECESARIAS
                    </button>
                    <button type="button" id="ar-cookie-btn-accept" class="ar-cookie-btn ar-cookie-btn--accept" aria-label="Aceptar todas las cookies técnicas y de preferencias">
                        ACEPTAR
                    </button>
                </div>
            </div>
        `;

        const btnAccept = banner.querySelector('#ar-cookie-btn-accept');
        const btnNecessary = banner.querySelector('#ar-cookie-btn-necessary');

        if (btnAccept) {
            btnAccept.addEventListener('click', function () {
                setConsent(CONSENT_ACCEPTED);
            });
        }

        if (btnNecessary) {
            btnNecessary.addEventListener('click', function () {
                setConsent(CONSENT_NECESSARY);
            });
        }

        // Inyección en el body si está disponible, o en el documentElement
        if (document.body) {
            document.body.appendChild(banner);
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                document.body.appendChild(banner);
            });
        }

        return banner;
    }

    /**
     * Inicialización automática al cargar el DOM
     */
    function init() {
        if (!getConsentStatus()) {
            createBannerDOM();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exposición de API pública en window.AR_COOKIES
    window.AR_COOKIES = {
        getConsentStatus: getConsentStatus,
        setConsent: setConsent,
        resetConsent: resetConsent,
        showBanner: showBanner
    };

})(window, document);
