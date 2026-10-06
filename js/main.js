/**
 * ALZADO ROJO | Arquitectura & Fabricación Digital
 * Controlador Frontend Principal (UI/UX)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. MODO CLARO EXCLUSIVO
    // ==========================================
    document.documentElement.setAttribute('data-theme', 'light');
    try {
        localStorage.removeItem('ar_theme');
    } catch (e) {
        // Ignorar si LocalStorage está restringido
    }

    // ==========================================
    // 1. ANIMACIÓN DE SPLASH SCREEN
    // ==========================================
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 1800);

    // ==========================================
    // 2. NAVEGACIÓN RESPONSIVA MÓVIL
    // ==========================================
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const primaryNav = document.getElementById('primary-nav');

    if (mobileNavToggle && primaryNav) {
        mobileNavToggle.addEventListener('click', () => {
            const isOpen = primaryNav.classList.toggle('open');
            mobileNavToggle.classList.toggle('open', isOpen);
            mobileNavToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Cerrar al hacer clic en cualquier enlace
        primaryNav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                primaryNav.classList.remove('open');
                mobileNavToggle.classList.remove('open');
                mobileNavToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Cerrar si se hace clic fuera del menú
        document.addEventListener('click', (e) => {
            if (!primaryNav.contains(e.target) && !mobileNavToggle.contains(e.target) && primaryNav.classList.contains('open')) {
                primaryNav.classList.remove('open');
                mobileNavToggle.classList.remove('open');
                mobileNavToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ==========================================
    // 3. RENDERIZADO DINÁMICO DE PROYECTOS & MODAL
    // ==========================================
    const gridAcademicos = document.getElementById('grid-academicos');
    const gridProfesionales = document.getElementById('grid-profesionales');
    const countAcademicos = document.getElementById('count-academicos');
    const countProfesionales = document.getElementById('count-profesionales');

    // Elementos del Modal
    const modal = document.getElementById('project-modal');
    const btnClose = document.getElementById('close-modal-btn') || document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalYear = document.getElementById('modal-year');
    const modalCrumbYear = document.getElementById('modal-crumb-year');
    const modalCategoryLabel = document.getElementById('modal-category-label');
    const modalDesc = document.getElementById('modal-desc');
    const modalGallery = document.getElementById('modal-gallery');
    const modalCounter = document.getElementById('modal-counter');
    const modalThumbnails = document.getElementById('modal-thumbnails');
    const prevBtn = document.getElementById('modal-prev-btn') || document.querySelector('.prev-btn');
    const nextBtn = document.getElementById('modal-next-btn') || document.querySelector('.next-btn');
    const modalQuoteLink = document.getElementById('modal-quote-link');

    let currentGalleryImages = [];
    let currentImageIndex = 0;

    // Función de apertura y configuración del Modal
    function openProjectModal(proyecto) {
        if (!modal) return;

        // Metadatos
        if (modalTitle) modalTitle.textContent = proyecto.titulo || 'Proyecto';
        if (modalYear) modalYear.textContent = proyecto.year || '';
        if (modalCrumbYear) modalCrumbYear.textContent = proyecto.year || '';
        if (modalCategoryLabel) {
            modalCategoryLabel.textContent = proyecto.tipo === 'academicos' ? 'INVESTIGACIÓN' : 'PRÁCTICA';
        }

        // Descripción
        if (modalDesc) {
            if (proyecto.descripcion && proyecto.descripcion.trim() !== '') {
                modalDesc.innerHTML = proyecto.descripcion
                    .split('\n')
                    .filter(p => p.trim().length > 0)
                    .map(p => `<p>${p}</p>`)
                    .join('');
            } else {
                modalDesc.innerHTML = '<p>Documentación técnica en proceso de catalogación.</p>';
            }
        }

        // Enlace WhatsApp dinámico según proyecto
        if (modalQuoteLink) {
            modalQuoteLink.href = `https://wa.me/56975412203?text=${encodeURIComponent(`Hola Adolfo, me interesa consultar por un proyecto similar a: "${proyecto.titulo || 'Proyecto'}"`)}`;
        }

        // Galería de imágenes
        modalGallery.innerHTML = '';
        if (modalThumbnails) modalThumbnails.innerHTML = '';

        currentGalleryImages = (proyecto.galeria && proyecto.galeria.length > 0)
            ? proyecto.galeria
            : [proyecto.imagen_principal];

        currentImageIndex = 0;

        // Inyectar imágenes en el visor principal y en la tira de miniaturas
        currentGalleryImages.forEach((imgSrc, imgIdx) => {
            const imgElement = document.createElement('img');
            imgElement.src = imgSrc;
            imgElement.loading = imgIdx === 0 ? 'eager' : 'lazy';
            imgElement.alt = `${proyecto.titulo} - Lámina ${imgIdx + 1}`;
            imgElement.dataset.index = imgIdx;
            modalGallery.appendChild(imgElement);

            if (modalThumbnails) {
                const thumb = document.createElement('button');
                thumb.type = 'button';
                thumb.className = `thumb-item ${imgIdx === 0 ? 'active' : ''}`;
                thumb.setAttribute('aria-label', `Ver lámina ${imgIdx + 1}`);
                thumb.innerHTML = `<img src="${imgSrc}" alt="Miniatura ${imgIdx + 1}">`;
                thumb.addEventListener('click', (e) => {
                    e.stopPropagation();
                    goToImage(imgIdx);
                });
                modalThumbnails.appendChild(thumb);
            }
        });

        // Controles de navegación carrusel
        const hasMultipleImages = currentGalleryImages.length > 1;
        if (prevBtn) prevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        if (modalThumbnails) modalThumbnails.style.display = hasMultipleImages ? 'flex' : 'none';

        goToImage(0);

        if (typeof modal.showModal === 'function') {
            modal.showModal();
        } else {
            modal.classList.add('show');
        }
        document.body.style.overflow = 'hidden';
    }

    // Navegar a una lámina específica
    function goToImage(index) {
        if (!currentGalleryImages || currentGalleryImages.length === 0) return;
        const total = currentGalleryImages.length;
        currentImageIndex = (index + total) % total;

        const targetImg = modalGallery.children[currentImageIndex];
        if (targetImg) {
            targetImg.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        if (modalCounter) {
            modalCounter.textContent = `${currentImageIndex + 1} / ${total}`;
        }

        if (modalThumbnails && modalThumbnails.children) {
            Array.from(modalThumbnails.children).forEach((thumb, i) => {
                if (i === currentImageIndex) {
                    thumb.classList.add('active');
                    thumb.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                } else {
                    thumb.classList.remove('active');
                }
            });
        }
    }

    // Cerrar Modal
    function closeModal() {
        if (!modal) return;
        if (typeof modal.close === 'function' && modal.open) {
            modal.close();
        }
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    if (btnClose) {
        btnClose.addEventListener('click', closeModal);
    }

    if (modalQuoteLink) {
        modalQuoteLink.addEventListener('click', () => {
            closeModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            const rect = modal.getBoundingClientRect();
            const isInDialog = (
                rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX && e.clientX <= rect.left + rect.width
            );
            if (!isInDialog || e.target === modal) {
                closeModal();
            }
        });

        modal.addEventListener('cancel', () => {
            document.body.style.overflow = '';
        });
    }

    // Botones siguiente / anterior del carrusel
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToImage(currentImageIndex + 1);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToImage(currentImageIndex - 1);
        });
    }

    // Atajos de Teclado para el Visor (Flechas y Escape)
    document.addEventListener('keydown', (e) => {
        if (!modal || (!modal.open && !modal.classList.contains('show'))) return;

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            goToImage(currentImageIndex + 1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goToImage(currentImageIndex - 1);
        } else if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Soporte para gestos táctiles (Swipe) en móvil dentro del visor
    if (modalGallery) {
        let touchStartX = 0;
        let touchEndX = 0;

        modalGallery.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        modalGallery.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 40) {
                if (diff < 0) {
                    goToImage(currentImageIndex + 1); // Swipe hacia la izquierda
                } else {
                    goToImage(currentImageIndex - 1); // Swipe hacia la derecha
                }
            }
        }, { passive: true });
    }

    // Inyectar proyectos dinámicamente desde `misProyectos`
    if (typeof misProyectos !== 'undefined' && Array.isArray(misProyectos)) {
        let academicCount = 0;
        let professionalCount = 0;

        misProyectos.forEach((proyecto, globalIndex) => {
            const card = document.createElement('article');
            card.className = 'portfolio-card portfolio-item';
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Explorar láminas de ${proyecto.titulo}`);

            const photoCount = (proyecto.galeria && proyecto.galeria.length) ? proyecto.galeria.length : 1;
            const isAcad = proyecto.tipo === 'academicos';
            
            if (isAcad) {
                academicCount++;
            } else {
                professionalCount++;
            }

            const itemIndex = isAcad ? academicCount : professionalCount;
            const formattedIndex = itemIndex.toString().padStart(2, '0');
            const categoryLabel = isAcad ? 'INVESTIGACIÓN' : 'PRÁCTICA';
            const categorySub = isAcad ? 'Académico & Sustentabilidad' : 'Desarrollo Profesional & Renders';

            card.innerHTML = `
                <div class="card-media-wrapper">
                    <img src="${proyecto.imagen_principal}" alt="${proyecto.titulo}" loading="lazy">
                    <div class="card-floating-badges">
                        <span class="badge-pill">${formattedIndex} / ${categoryLabel}</span>
                        <span class="badge-pill badge-photos">${photoCount} ${photoCount === 1 ? 'LÁMINA' : 'LÁMINAS'}</span>
                    </div>
                    <div class="card-hover-action" aria-hidden="true">
                        <span>VER PROYECTO</span>
                        <span>➔</span>
                    </div>
                </div>
                <div class="card-editorial-body">
                    <div class="card-editorial-top">
                        <span class="tag-year">${proyecto.year || '2026'}</span>
                        <span class="card-category-label">${categorySub}</span>
                    </div>
                    <h3 class="card-title">${proyecto.titulo}</h3>
                    <p class="card-excerpt">${proyecto.descripcion || ''}</p>
                    <div class="card-footer-cta">
                        <span>EXPLORAR DOCUMENTACIÓN</span>
                        <span class="action-arrow" aria-hidden="true">➔</span>
                    </div>
                </div>
            `;

            // Eventos de apertura
            card.addEventListener('click', () => openProjectModal(proyecto));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openProjectModal(proyecto);
                }
            });

            // Inyectar en la sección correspondiente
            if (isAcad && gridAcademicos) {
                gridAcademicos.appendChild(card);
            } else if (!isAcad && gridProfesionales) {
                gridProfesionales.appendChild(card);
            }
        });

        // Actualizar contadores en los encabezados
        if (countAcademicos) {
            countAcademicos.textContent = `${academicCount} ${academicCount === 1 ? 'PROYECTO' : 'PROYECTOS'}`;
        }
        if (countProfesionales) {
            countProfesionales.textContent = `${professionalCount} ${professionalCount === 1 ? 'PROYECTO' : 'PROYECTOS'}`;
        }
    }

    // ==========================================
    // 4. HIGHLIGHT DE NAVEGACIÓN SEGÚN SCROLL
    // ==========================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');

    if (sections.length > 0 && navLinks.length > 0) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentId = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === `#${currentId}` || href === `index.html#${currentId}`) {
                            link.classList.add('active');
                        } else if (!link.classList.contains('nav-3d')) {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }, { threshold: 0.35 });

        sections.forEach(section => navObserver.observe(section));
    }

    // ==========================================
    // 5. VALIDACIÓN FORMULARIO DE COTIZACIÓN (10MB)
    // ==========================================
    const fileInput = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name');

    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const maxSizeEnBytes = 10 * 1024 * 1024; // 10MB

                if (file.size > maxSizeEnBytes) {
                    alert('El archivo excede los 10MB permitidos. Por favor adjunta un enlace (Google Drive / WeTransfer) en el mensaje.');
                    this.value = '';
                    fileNameDisplay.textContent = 'Adjuntar archivo o plano (Máximo 10MB)';
                    fileNameDisplay.style.color = '';
                } else {
                    fileNameDisplay.textContent = `Archivo adjunto: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
                    fileNameDisplay.style.color = 'var(--brand-red)';
                }
            } else {
                fileNameDisplay.textContent = 'Adjuntar archivo o plano (Máximo 10MB)';
                fileNameDisplay.style.color = '';
            }
        });
    }

    // ==========================================
    // 6. ANIMACIÓN BARRAS DE SOFTWARE (SCROLL)
    // ==========================================
    const skillFills = document.querySelectorAll('.skill-fill');
    
    if (skillFills.length > 0) {
        const skillObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fill = entry.target;
                    const widthTarget = fill.getAttribute('data-width');
                    if (widthTarget) {
                        fill.style.width = widthTarget;
                    }
                    observer.unobserve(fill);
                }
            });
        }, { threshold: 0.25 });

        skillFills.forEach(fill => skillObserver.observe(fill));
    }
});