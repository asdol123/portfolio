/**
 * ALZADO ROJO · AR ARQ SpA
 * liquid-motion.js — Motor de Animaciones Inmersivas y Micro-Interacciones
 * Inspirado en Apple Liquid Glass & Motion Graphics
 * Cero dependencias externas · Alto rendimiento · Respeto a prefers-reduced-motion
 */

(function () {
  'use strict';

  // Detección de preferencia de movimiento reducido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. HALO AMBIENTAL DE LUZ INTERACTIVA (CURSOR AMBIENT FOLLOWER)
     ========================================================================== */
  function initAmbientHalo() {
    if (prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

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

    // Interpolación suave (lerp) condicional: se detiene si no hay desplazamiento
    function animateHalo() {
      if (!isLoopRunning) return;

      if (isVisible) {
        currentX += (mouseX - currentX) * 0.08;
        currentY += (mouseY - currentY) * 0.08;
        halo.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

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
     2. EFECTO SPECULAR LIQUID GLARE & 3D MICRO-TILT EN TARJETAS
     ========================================================================== */
  function initLiquidTilt() {
    if (prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

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
      '.calc-clean-card',
      '.trust-capsule'
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

      let bounds = null;
      let isHovering = false;
      let tiltRafId = null;
      let lastClientX = 0;
      let lastClientY = 0;

      function updateBounds() {
        bounds = card.getBoundingClientRect();
      }

      card.addEventListener('mouseenter', () => {
        isHovering = true;
        updateBounds();
        // Asignar will-change exclusivamente en interacción activa para liberar memoria GPU en reposo
        card.style.willChange = 'transform';
        card.style.transition = 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease';
      });

      card.addEventListener('mousemove', (e) => {
        lastClientX = e.clientX;
        lastClientY = e.clientY;

        // Desacoplar cálculo con requestAnimationFrame para 60 FPS estables sin jank
        if (!tiltRafId) {
          tiltRafId = requestAnimationFrame(() => {
            tiltRafId = null;
            if (!isHovering) return;
            if (!bounds) updateBounds();

            const x = lastClientX - bounds.left;
            const y = lastClientY - bounds.top;
            const width = bounds.width;
            const height = bounds.height;

            if (width === 0 || height === 0) return;

            // Rango normalizado de -1 a 1
            const normX = (x / width) * 2 - 1;
            const normY = (y / height) * 2 - 1;

            // Coordenadas en porcentaje para el reflejo
            const pctX = Math.round((x / width) * 100);
            const pctY = Math.round((y / height) * 100);

            // Ángulo de inclinación (muy sutil y refinado)
            const maxTilt = 4.5;
            const tiltX = -normY * maxTilt;
            const tiltY = normX * maxTilt;

            card.style.setProperty('--glare-x', `${pctX}%`);
            card.style.setProperty('--glare-y', `${pctY}%`);
            card.style.transform = `perspective(1200px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-5px)`;
          });
        }
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        isHovering = false;
        if (tiltRafId) {
          cancelAnimationFrame(tiltRafId);
          tiltRafId = null;
        }
        // Quitar will-change inmediatamente al salir para liberar memoria de texturas GPU
        card.style.willChange = 'auto';
        card.style.transition = 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.65s ease, border-color 0.35s ease';
        card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        card.style.setProperty('--glare-x', '50%');
        card.style.setProperty('--glare-y', '50%');
      });
    });
  }

  /* ==========================================================================
     3. SCROLL-DRIVEN STAGGERED REVEALS (APARICIÓN CINEMÁTICA CON FÍSICA)
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

    // Observer ligero: desconecta cada elemento una vez revelado para 0 overhead
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          
          // Calcular índice entre hermanos visibles para escalonamiento
          let delay = 0;
          if (target.parentElement) {
            const siblings = Array.from(target.parentElement.children);
            const index = siblings.indexOf(target);
            if (index >= 0) {
              delay = Math.min(index * 60, 360);
            }
          }

          if (delay > 0) {
            setTimeout(() => {
              target.classList.add('is-revealed');
            }, delay);
          } else {
            target.classList.add('is-revealed');
          }

          // Desconexión inmediata
          obs.unobserve(target);
        }
      });
    }, {
      root: null,
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => {
      el.classList.add('liquid-reveal-init');
      observer.observe(el);
    });
  }

  /* ==========================================================================
     4. HEADER FLOTANTE DINÁMICO CON COMPACTACIÓN AL SCROLL
     ========================================================================== */
  function initFloatingHeader() {
    const header = document.querySelector('.ed-header');
    if (!header) return;

    let lastScroll = 0;
    let ticking = false;

    function onScroll() {
      const top = window.scrollY || document.documentElement.scrollTop;
      if (top > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      lastScroll = top;
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
     5. INICIALIZACIÓN GLOBAL
     ========================================================================== */
  function init() {
    initAmbientHalo();
    initLiquidTilt();
    initScrollReveals();
    initFloatingHeader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exponer a window para reactivación tras cambios dinámicos
  window.AlzadoLiquidMotion = {
    reinitTilt: initLiquidTilt,
    reinitReveals: initScrollReveals
  };
})();
