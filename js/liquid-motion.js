/**
 * ALZADO ROJO · AR ARQ SpA
 * liquid-motion.js — Motor de Animaciones Ultra Fluido (120 FPS Zero-Lag)
 * Arquitectura 100% Compositor-Thread · Emil Kowalski Tactile Craft
 * Cero dependencias externas · Cero reflows · Cero consumo CPU en reposo
 */

(function () {
  'use strict';

  // Detección de preferencia de movimiento reducido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. SCROLL-DRIVEN STAGGERED REVEALS (ZERO-BLUR · COMPOSITOR ACCELERATED)
     ========================================================================== */
  function initScrollReveals() {
    const revealSelector = [
      '.bionova-hero-section',
      '.bionova-card',
      '.bionova-collections-section',
      '.index-manifesto',
      '.trust-capsule-row',
      '.directory-section',
      '.directory-item',
      '.ecom-card',
      '.calc-clean-card',
      '.specs-3d-grid',
      '.spec-3d-box',
      '.scale-comparator-section',
      '.portfolio-gallery-section',
      '.gallery-item',
      '.manual-card',
      '.type-card',
      '.format-card',
      '.ed-animate-fade'
    ].join(', ');

    const elements = document.querySelectorAll(revealSelector);

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    // Observer ultra-ligero que desconecta cada elemento una vez revelado
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;

          let delay = 0;
          if (target.parentElement) {
            const siblings = Array.from(target.parentElement.children);
            const index = siblings.indexOf(target);
            if (index >= 0) {
              delay = Math.min(index * 40, 240);
            }
          }

          if (delay > 0) {
            setTimeout(() => {
              target.classList.add('is-revealed');
            }, delay);
          } else {
            target.classList.add('is-revealed');
          }

          obs.unobserve(target);
        }
      });
    }, {
      root: null,
      threshold: 0.05,
      rootMargin: '0px 0px -20px 0px'
    });

    elements.forEach(el => {
      el.classList.add('liquid-reveal-init');
      observer.observe(el);
    });
  }

  /* ==========================================================================
     2. HEADER FLOTANTE DINÁMICO (ZERO-JANK)
     ========================================================================== */
  function initFloatingHeader() {
    const header = document.querySelector('.ed-header');
    if (!header) return;

    let ticking = false;

    function onScroll() {
      const top = window.scrollY || document.documentElement.scrollTop;
      if (top > 30) {
        if (!header.classList.contains('is-scrolled')) {
          header.classList.add('is-scrolled');
        }
      } else {
        if (header.classList.contains('is-scrolled')) {
          header.classList.remove('is-scrolled');
        }
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });

    onScroll();
  }

  /* ==========================================================================
     3. MICRO-INTERACCIONES TÁCTILES Y PULSO ELÁSTICO (EMIL KOWALSKI CRAFT)
     ========================================================================== */
  function initTactileInteractions() {
    if (prefersReducedMotion) return;

    const interactiveSelectors = [
      '.bionova-cta-pill-btn',
      '.bionova-card-text-cta',
      '.bionova-round-arrow-btn',
      '.btn-ed-primary',
      '.btn-ed-secondary',
      '.bionova-inline-btn',
      '.bionova-nav-pill-btn',
      '.ecom-btn-buy',
      '.ecom-btn-wsp',
      '.btn-ecom-checkout',
      '.btn-format-buy',
      '.ed-logo-link'
    ].join(', ');

    const buttons = document.querySelectorAll(interactiveSelectors);

    buttons.forEach(btn => {
      if (btn.__hasTactile) return;
      btn.__hasTactile = true;

      btn.addEventListener('pointerdown', () => {
        btn.style.transform = 'scale(0.965)';
        btn.style.transition = 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)';
      }, { passive: true });

      const releaseBtn = () => {
        btn.style.transform = '';
        btn.style.transition = '';
      };

      btn.addEventListener('pointerup', releaseBtn, { passive: true });
      btn.addEventListener('pointercancel', releaseBtn, { passive: true });
      btn.addEventListener('mouseleave', releaseBtn, { passive: true });
    });
  }

  /* ==========================================================================
     4. INICIALIZACIÓN GLOBAL ZERO-LAG
     ========================================================================== */
  function init() {
    initScrollReveals();
    initFloatingHeader();
    initTactileInteractions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Compatibilidad hacia atrás de la API pública sin loops pesados
  window.AlzadoLiquidMotion = {
    reinitTilt: function () {},
    reinitMagnetic: function () {},
    reinitReveals: initScrollReveals,
    reinitTactile: initTactileInteractions
  };
})();
