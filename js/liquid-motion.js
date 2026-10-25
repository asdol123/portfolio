/**
 * ALZADO ROJO · AR ARQ SpA
 * liquid-motion.js — Motor de Animaciones Inmersivas y Micro-Interacciones
 * 100% Borderless Depth · Animaciones Magnéticas · Interpolación Sedosa (60/120 FPS)
 * Inspirado en Apple Liquid Glass & Awwwards Motion Standards
 * Cero dependencias externas · Cero consumo CPU en reposo · Respeto a prefers-reduced-motion
 */

(function () {
  'use strict';

  // Detección de preferencia de movimiento reducido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ==========================================================================
     1. HALO AMBIENTAL DE LUZ INTERACTIVA (CURSOR AMBIENT FOLLOWER)
     ========================================================================== */
  function initAmbientHalo() {
    if (prefersReducedMotion || !isFinePointer) return;

    let halo = document.getElementById('liquid-ambient-halo');
    if (!halo) {
      halo = document.createElement('div');
      halo.id = 'liquid-ambient-halo';
      halo.className = 'liquid-ambient-halo';
      halo.setAttribute('aria-hidden', 'true');
      document.body.appendChild(halo);
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isVisible = false;
    let isLoopRunning = false;

    // Interpolación suave (lerp) condicional: se detiene al alcanzar el cursor
    function animateHalo() {
      if (!isLoopRunning) return;

      if (isVisible) {
        currentX += (mouseX - currentX) * 0.085;
        currentY += (mouseY - currentY) * 0.085;
        halo.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) translate(-50%, -50%)`;

        // Detener bucle cuando el halo alcanza el cursor para 0% consumo en reposo
        if (Math.abs(currentX - mouseX) < 0.1 && Math.abs(currentY - mouseY) < 0.1) {
          currentX = mouseX;
          currentY = mouseY;
          isLoopRunning = false;
          return;
        }
      } else {
        isLoopRunning = false;
        return;
      }
      requestAnimationFrame(animateHalo);
    }

    function startHaloLoop() {
      if (!isLoopRunning) {
        isLoopRunning = true;
        requestAnimationFrame(animateHalo);
      }
    }

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        halo.style.opacity = '1';
      }
      startHaloLoop();
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', function () {
      isVisible = false;
      halo.style.opacity = '0';
      isLoopRunning = false;
    });
  }

  /* ==========================================================================
     2. TILT 3D LÍQUIDO + PARALLAX INTERNO DE IMÁGENES CON INTERPOLACIÓN LERP
     ========================================================================== */
  function initLiquidTilt() {
    if (prefersReducedMotion || !isFinePointer) return;

    const tiltSelector = [
      '.bionova-card',
      '.bionova-dir-card',
      '.ecom-card',
      '.directory-item',
      '.type-card',
      '.format-card',
      '.manual-card',
      '.spec-3d-box',
      '.ecom-perk-item',
      '.calc-clean-card'
    ].join(', ');

    const cards = document.querySelectorAll(tiltSelector);

    cards.forEach(card => {
      if (card.__hasLiquidTilt) return;
      card.__hasLiquidTilt = true;

      // Inyectar overlay de brillo especular si no existe
      if (!card.querySelector('.liquid-glare-layer')) {
        const glare = document.createElement('div');
        glare.className = 'liquid-glare-layer';
        glare.setAttribute('aria-hidden', 'true');
        card.appendChild(glare);
      }

      const innerImg = card.querySelector('.bionova-card-bg-img, .bionova-dir-card-bg, .ecom-img');

      let bounds = null;
      let isHovering = false;
      let isLoopRunning = false;

      let targetTiltX = 0;
      let targetTiltY = 0;
      let currentTiltX = 0;
      let currentTiltY = 0;

      let targetImgX = 0;
      let targetImgY = 0;
      let currentImgX = 0;
      let currentImgY = 0;

      let targetGlareX = 50;
      let targetGlareY = 50;
      let currentGlareX = 50;
      let currentGlareY = 50;

      function updateBounds() {
        bounds = card.getBoundingClientRect();
      }

      function updateTiltFrame() {
        if (!isLoopRunning) return;

        // Interpolación sedosa estilo Awwwards (lerp factor 0.1)
        currentTiltX += (targetTiltX - currentTiltX) * 0.1;
        currentTiltY += (targetTiltY - currentTiltY) * 0.1;
        currentImgX += (targetImgX - currentImgX) * 0.08;
        currentImgY += (targetImgY - currentImgY) * 0.08;
        currentGlareX += (targetGlareX - currentGlareX) * 0.12;
        currentGlareY += (targetGlareY - currentGlareY) * 0.12;

        card.style.transform = `perspective(1200px) rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg) translateY(-5px)`;
        card.style.setProperty('--glare-x', `${currentGlareX.toFixed(1)}%`);
        card.style.setProperty('--glare-y', `${currentGlareY.toFixed(1)}%`);

        if (innerImg) {
          innerImg.style.transform = `scale(1.06) translate3d(${currentImgX.toFixed(2)}px, ${currentImgY.toFixed(2)}px, 0)`;
        }

        // Si ya no hay hover y la inercia volvió al reposo absoluto: apagar loop
        if (!isHovering) {
          const atRest =
            Math.abs(currentTiltX) < 0.02 &&
            Math.abs(currentTiltY) < 0.02 &&
            Math.abs(currentImgX) < 0.05 &&
            Math.abs(currentImgY) < 0.05;

          if (atRest) {
            card.style.transform = '';
            card.style.willChange = 'auto';
            card.classList.remove('is-tilting');
            if (innerImg) {
              innerImg.style.transform = '';
            }
            isLoopRunning = false;
            return;
          }
        }

        requestAnimationFrame(updateTiltFrame);
      }

      function startTiltLoop() {
        if (!isLoopRunning) {
          isLoopRunning = true;
          requestAnimationFrame(updateTiltFrame);
        }
      }

      card.addEventListener('mouseenter', () => {
        isHovering = true;
        updateBounds();
        card.style.willChange = 'transform';
        card.classList.add('is-tilting');
        startTiltLoop();
      });

      card.addEventListener('mousemove', (e) => {
        if (!bounds) updateBounds();
        const width = bounds.width;
        const height = bounds.height;
        if (width === 0 || height === 0) return;

        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;

        const normX = (x / width) * 2 - 1;
        const normY = (y / height) * 2 - 1;

        // Ángulo de inclinación sutil, fino y controlado
        const maxTilt = 4.8;
        targetTiltX = -normY * maxTilt;
        targetTiltY = normX * maxTilt;

        // Parallax interno de imagen
        targetImgX = -normX * 8;
        targetImgY = -normY * 8;

        targetGlareX = Math.round((x / width) * 100);
        targetGlareY = Math.round((y / height) * 100);

        startTiltLoop();
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        isHovering = false;
        targetTiltX = 0;
        targetTiltY = 0;
        targetImgX = 0;
        targetImgY = 0;
        targetGlareX = 50;
        targetGlareY = 50;
        startTiltLoop();
      });
    });
  }

  /* ==========================================================================
     3. BOTONES Y ELEMENTOS MAGNÉTICOS ULTRA FLUIDOS (MAGNETIC INTERACTION)
     ========================================================================== */
  function initMagneticElements() {
    if (prefersReducedMotion || !isFinePointer) return;

    const magneticSelectors = [
      '.bionova-cta-pill-btn',
      '.bionova-nav-pill-btn',
      '.btn-ecom-checkout',
      '.btn-format-buy',
      '.btn-ed-primary',
      '.ed-logo-link'
    ].join(', ');

    const elements = document.querySelectorAll(magneticSelectors);

    elements.forEach(el => {
      if (el.__hasMagnetic) return;
      el.__hasMagnetic = true;

      let bounds = null;
      let isHovered = false;
      let isLoopRunning = false;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      function updateBounds() {
        bounds = el.getBoundingClientRect();
      }

      function updateMagneticFrame() {
        if (!isLoopRunning) return;

        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;

        if (isHovered) {
          el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(1.03)`;
        } else {
          el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(1)`;

          // Detener bucle y limpiar inline style al llegar al reposo elástico
          if (Math.abs(currentX) < 0.04 && Math.abs(currentY) < 0.04) {
            el.style.transform = '';
            el.style.willChange = 'auto';
            isLoopRunning = false;
            return;
          }
        }

        requestAnimationFrame(updateMagneticFrame);
      }

      function startMagneticLoop() {
        if (!isLoopRunning) {
          isLoopRunning = true;
          requestAnimationFrame(updateMagneticFrame);
        }
      }

      el.addEventListener('mouseenter', () => {
        isHovered = true;
        updateBounds();
        el.style.willChange = 'transform';
        startMagneticLoop();
      });

      el.addEventListener('mousemove', (e) => {
        if (!bounds) updateBounds();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;

        // Desplazamiento magnético sedoso
        targetX = dx * 0.22;
        targetY = dy * 0.22;

        startMagneticLoop();
      }, { passive: true });

      el.addEventListener('mouseleave', () => {
        isHovered = false;
        targetX = 0;
        targetY = 0;
        startMagneticLoop();
      });
    });
  }

  /* ==========================================================================
     4. SCROLL-DRIVEN STAGGERED REVEALS (APARICIÓN CINEMÁTICA CON FÍSICA)
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

          // Escalonamiento orgánico entre elementos hermanos
          let delay = 0;
          if (target.parentElement) {
            const siblings = Array.from(target.parentElement.children);
            const index = siblings.indexOf(target);
            if (index >= 0) {
              delay = Math.min(index * 55, 330);
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
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    });

    elements.forEach(el => {
      el.classList.add('liquid-reveal-init');
      observer.observe(el);
    });
  }

  /* ==========================================================================
     5. HEADER FLOTANTE DINÁMICO (CERO BORDES + PURE GLASS DEPTH)
     ========================================================================== */
  function initFloatingHeader() {
    const header = document.querySelector('.ed-header');
    if (!header) return;

    let ticking = false;

    function onScroll() {
      const top = window.scrollY || document.documentElement.scrollTop;
      if (top > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
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
     6. MICRO-INTERACCIONES TÁCTILES Y PULSO ELÁSTICO (EMIL KOWALSKI CRAFT)
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
     7. INICIALIZACIÓN GLOBAL
     ========================================================================== */
  function init() {
    initAmbientHalo();
    initLiquidTilt();
    initMagneticElements();
    initScrollReveals();
    initFloatingHeader();
    initTactileInteractions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exponer a window para reactivación tras cambios dinámicos
  window.AlzadoLiquidMotion = {
    reinitTilt: initLiquidTilt,
    reinitMagnetic: initMagneticElements,
    reinitReveals: initScrollReveals,
    reinitTactile: initTactileInteractions
  };
})();
