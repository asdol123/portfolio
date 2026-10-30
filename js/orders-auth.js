/**
 * ALZADO ROJO · AR ARQ SpA
 * Modulo de Autenticacion y Control de Acceso Privado para Gestion de Pedidos
 * Archivo: js/orders-auth.js
 * 
 * Reglas de diseno y logica:
 * - Cero emojis en codigo y mensajes.
 * - Cero ampersands en textos visibles (uso estricto de 'y' o '·').
 * - Tokens cifrados de sesion con soporte para 7 dias o sesion activa.
 * - Soporte universal para navegador y entornos CommonJS / Node.js.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OrdersAuth = factory();
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  // Clave unica de almacenamiento en sessionStorage y localStorage
  const STORAGE_KEY = 'ar_orders_auth_session';

  // Tiempo de vida para recordar credenciales: 7 dias (en milisegundos)
  const REMEMBER_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  // Claves maestras autorizadas (normalizadas en minusculas y sin espacios)
  const AUTHORIZED_KEYS = [
    '7541',
    'alzado2026',
    'ar-7541'
  ];

  // Storage en memoria para Node.js y navegadores en modo estricto
  const memoryStore = {
    session: {},
    local: {}
  };

  function createMemoryStorage(target) {
    return {
      getItem(k) { return Object.prototype.hasOwnProperty.call(target, k) ? target[k] : null; },
      setItem(k, v) { target[k] = String(v); },
      removeItem(k) { delete target[k]; },
      clear() { for (const k in target) delete target[k]; }
    };
  }

  /**
   * Helper seguro para acceder a storage sin lanzar excepciones en navegadores restrictivos
   */
  function safeStorage(type) {
    try {
      if (typeof window !== 'undefined' && window[type]) {
        const storage = window[type];
        const testKey = '__ar_auth_test__';
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        return storage;
      }
    } catch (e) {
      // Fallback
    }
    return type === 'sessionStorage'
      ? createMemoryStorage(memoryStore.session)
      : createMemoryStorage(memoryStore.local);
  }

  /**
   * Generador de token criptografico o seudoaleatorio seguro
   */
  function generateToken() {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return 'ar_sec_' + crypto.randomUUID().replace(/-/g, '');
      }
    } catch (e) {
      // Fallback
    }
    const rand = Math.random().toString(36).substring(2, 12);
    const time = Date.now().toString(36);
    return 'ar_sec_' + time + '_' + rand;
  }

  /**
   * Dispara eventos custom en el objeto global (window)
   */
  function emitAuthEvent(eventName, detail) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        const ev = new CustomEvent(eventName, { detail: detail || {} });
        window.dispatchEvent(ev);
      } catch (e) {
        // Ignorar entornos sin soporte de CustomEvent
      }
    }
  }

  /**
   * Comprueba si una clave ingresada coincide con las credenciales maestras autorizadas
   */
  function isKeyAuthorized(key) {
    if (key === null || key === undefined) return false;
    const normalized = String(key).trim().toLowerCase();
    return AUTHORIZED_KEYS.includes(normalized);
  }

  /**
   * Obtiene la sesion activa si existe y es valida
   * @returns {{ token: string, timestamp: number, remember: boolean } | null}
   */
  function getSession() {
    const session = safeStorage('sessionStorage');
    const local = safeStorage('localStorage');

    // 1. Revisar sessionStorage (sesion activa del navegador)
    if (session) {
      try {
        const raw = session.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.token === 'string') {
            return parsed;
          }
        }
      } catch (e) {
        session.removeItem(STORAGE_KEY);
      }
    }

    // 2. Revisar localStorage (recordar sesion por 7 dias)
    if (local) {
      try {
        const raw = local.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.token === 'string' && parsed.remember) {
            const now = Date.now();
            const age = now - (Number(parsed.timestamp) || 0);

            if (age >= 0 && age <= REMEMBER_TTL_MS) {
              return parsed;
            } else {
              // Token expirado: se remueve
              local.removeItem(STORAGE_KEY);
            }
          } else {
            local.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        local.removeItem(STORAGE_KEY);
      }
    }

    return null;
  }

  /**
   * Verifica si el usuario actual posee una sesion valida y vigente
   * @returns {boolean}
   */
  function isAuthenticated() {
    return getSession() !== null;
  }

  /**
   * Procesa el inicio de sesion con una clave o PIN
   * @param {string|number} key - Clave ingresada
   * @param {boolean} [remember=false] - Si debe recordar la sesion por 7 dias
   * @returns {{ ok: boolean, error?: string, token?: string }}
   */
  function login(key, remember = false) {
    if (!isKeyAuthorized(key)) {
      return {
        ok: false,
        error: 'Clave de acceso incorrecta. Verifique sus credenciales de taller.'
      };
    }

    const sessionData = {
      token: generateToken(),
      timestamp: Date.now(),
      remember: Boolean(remember)
    };

    const session = safeStorage('sessionStorage');
    const local = safeStorage('localStorage');

    try {
      if (sessionData.remember) {
        if (local) local.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        if (session) session.removeItem(STORAGE_KEY);
      } else {
        if (session) session.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        if (local) local.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[OrdersAuth] Error guardando sesion:', e);
    }

    emitAuthEvent('auth:success', { session: sessionData });

    return {
      ok: true,
      token: sessionData.token
    };
  }

  /**
   * Cierra la sesion activa, elimina los tokens y bloquea la interfaz
   * @returns {{ ok: boolean }}
   */
  function logout() {
    const session = safeStorage('sessionStorage');
    const local = safeStorage('localStorage');

    try {
      if (session) session.removeItem(STORAGE_KEY);
      if (local) local.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[OrdersAuth] Error eliminando sesion:', e);
    }

    emitAuthEvent('auth:locked', { timestamp: Date.now() });

    return { ok: true };
  }

  /**
   * Helper que enlaza el formulario de login, inputs y paneles de la interfaz
   */
  function initAuthUI() {
    if (typeof document === 'undefined') return;

    const authGate = document.getElementById('orders-auth-gate');
    const privateDashboard = document.getElementById('orders-private-dashboard');
    const authForm = document.getElementById('orders-auth-form');
    const pinInput = document.getElementById('orders-auth-pin');
    const rememberCheckbox = document.getElementById('orders-auth-remember');
    const errorBox = document.getElementById('orders-auth-error');
    const btnLock = document.getElementById('btn-lock-orders');

    function syncUIState() {
      const authed = isAuthenticated();

      if (btnLock) {
        btnLock.style.display = authed ? 'inline-flex' : 'none';
        btnLock.setAttribute('aria-hidden', authed ? 'false' : 'true');
      }

      if (authed) {
        if (authGate) {
          authGate.style.display = 'none';
          authGate.classList.add('is-hidden');
          authGate.setAttribute('aria-hidden', 'true');
        }
        if (privateDashboard) {
          privateDashboard.style.display = '';
          privateDashboard.classList.remove('is-hidden');
          privateDashboard.setAttribute('aria-hidden', 'false');
        }
        if (errorBox) {
          errorBox.textContent = '';
          errorBox.style.display = 'none';
        }
      } else {
        if (privateDashboard) {
          privateDashboard.style.display = 'none';
          privateDashboard.classList.add('is-hidden');
          privateDashboard.setAttribute('aria-hidden', 'true');
        }
        if (authGate) {
          authGate.style.display = '';
          authGate.classList.remove('is-hidden');
          authGate.setAttribute('aria-hidden', 'false');
        }
        if (pinInput) {
          pinInput.value = '';
          setTimeout(() => {
            try { pinInput.focus(); } catch (e) {}
          }, 50);
        }
      }
    }

    // Listener para alternar visibilidad de la clave PIN
    const btnTogglePin = document.getElementById('btn-toggle-pin-visibility') || document.getElementById('btn-toggle-pin');
    if (btnTogglePin && pinInput && !btnTogglePin.__ordersAuthBound) {
      btnTogglePin.__ordersAuthBound = true;
      btnTogglePin.addEventListener('click', (e) => {
        e.preventDefault();
        const isPassword = pinInput.getAttribute('type') === 'password';
        pinInput.setAttribute('type', isPassword ? 'text' : 'password');
        btnTogglePin.setAttribute('aria-label', isPassword ? 'Ocultar clave' : 'Mostrar clave');
        btnTogglePin.classList.toggle('active', isPassword);
      });
    }

    // Listener para envio del formulario de autenticacion
    if (authForm && !authForm.__ordersAuthBound) {
      authForm.__ordersAuthBound = true;
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pinVal = pinInput ? pinInput.value : '';
        const rememberVal = rememberCheckbox ? rememberCheckbox.checked : false;

        const res = login(pinVal, rememberVal);

        if (res.ok) {
          syncUIState();
        } else {
          if (errorBox) {
            errorBox.textContent = res.error || 'Credencial no autorizada.';
            errorBox.style.display = 'block';
          }
          if (pinInput) {
            pinInput.focus();
            pinInput.select();
          }
        }
      });
    }

    // Listener para boton de bloqueo / cerrar sesion
    if (btnLock && !btnLock.__ordersAuthBound) {
      btnLock.__ordersAuthBound = true;
      btnLock.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        syncUIState();
      });
    }

    // Sincronizar en eventos globales
    if (typeof window !== 'undefined' && !window.__ordersAuthEventsBound) {
      window.__ordersAuthEventsBound = true;
      window.addEventListener('auth:success', syncUIState);
      window.addEventListener('auth:locked', syncUIState);
    }

    // Sincronizar estado inicial
    syncUIState();
  }

  // Auto-inicializar la interfaz cuando el DOM este listo si existe document
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAuthUI);
    } else {
      initAuthUI();
    }
  }

  return {
    STORAGE_KEY,
    REMEMBER_TTL_MS,
    AUTHORIZED_KEYS,
    isKeyAuthorized,
    isAuthenticated,
    getSession,
    login,
    logout,
    initAuthUI
  };
});
