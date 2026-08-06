document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. ANIMACIÓN DE SPLASH SCREEN
    // ==========================================
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 2400);

    // ==========================================
    // 1. RENDERIZADO DE PROYECTOS Y MODAL
    // ==========================================
    const gridAcademicos = document.getElementById('grid-academicos');
    const gridProfesionales = document.getElementById('grid-profesionales');
    const modal = document.getElementById('project-modal');
    const btnClose = document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalYear = document.getElementById('modal-year');
    const modalDesc = document.getElementById('modal-desc');
    const modalGallery = document.getElementById('modal-gallery');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    // El diseño ahora usa CSS Columns (Masonry), por lo que no forzamos clases de grid.
    if (typeof misProyectos !== 'undefined') {
        misProyectos.forEach((proyecto, index) => {
            const card = document.createElement('div');
            
            // Asignación estándar sin clases rígidas
            card.className = `portfolio-item`;
            
            // Tarjeta Liquid Glass
            card.innerHTML = `
                <img src="${proyecto.imagen_principal}" alt="${proyecto.titulo}" loading="lazy">
                <div class="portfolio-info">
                    <span class="tag-year">${proyecto.year}</span>
                    <h3>${proyecto.titulo}</h3>
                </div>
            `;

            // Lógica al hacer clic en un proyecto (Abre el Modal)
            card.addEventListener('click', () => {
                modalTitle.textContent = proyecto.titulo;
                modalYear.textContent = proyecto.year;
                
                if (proyecto.descripcion && proyecto.descripcion.trim() !== "") {
                    modalDesc.innerHTML = proyecto.descripcion.split('\n').map(p => `<p>${p}</p>`).join('');
                } else {
                    modalDesc.innerHTML = '<p>Sin descripción disponible.</p>';
                }
                
                modalGallery.innerHTML = ''; 
                
                // Validación para galerías
                if (proyecto.galeria && proyecto.galeria.length > 0) {
                    proyecto.galeria.forEach(imgSrc => {
                        const imgElement = document.createElement('img');
                        imgElement.src = imgSrc;
                        imgElement.loading = "lazy";
                        imgElement.alt = proyecto.titulo;
                        modalGallery.appendChild(imgElement);
                    });
                    
                    // Mostrar/Ocultar flechas del carrusel
                    if (proyecto.galeria.length > 1) {
                        prevBtn.style.display = 'flex';
                        nextBtn.style.display = 'flex';
                    } else {
                        prevBtn.style.display = 'none';
                        nextBtn.style.display = 'none';
                    }
                }

                modalGallery.scrollLeft = 0;
                
                if (typeof modal.showModal === 'function') {
                    modal.showModal();
                } else {
                    modal.classList.add('show');
                }
                document.body.style.overflow = 'hidden'; 
            });

            // Inyectar en el DOM según la categoría
            if (proyecto.tipo === 'academicos' && gridAcademicos) {
                gridAcademicos.appendChild(card);
            } else if (proyecto.tipo === 'profesionales' && gridProfesionales) {
                gridProfesionales.appendChild(card);
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DEL CARRUSEL INFINITO (MODAL)
    // ==========================================
    if (nextBtn && prevBtn && modalGallery) {
        nextBtn.addEventListener('click', () => {
            const maxScrollLeft = modalGallery.scrollWidth - modalGallery.clientWidth;
            if (modalGallery.scrollLeft >= maxScrollLeft - 5) {
                modalGallery.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                modalGallery.scrollBy({ left: modalGallery.clientWidth, behavior: 'smooth' });
            }
        });

        prevBtn.addEventListener('click', () => {
            if (modalGallery.scrollLeft <= 5) {
                const maxScrollLeft = modalGallery.scrollWidth - modalGallery.clientWidth;
                modalGallery.scrollTo({ left: maxScrollLeft, behavior: 'smooth' });
            } else {
                modalGallery.scrollBy({ left: -modalGallery.clientWidth, behavior: 'smooth' });
            }
        });
    }

    // Cerrar Modal
    const closeModal = () => {
        if (typeof modal.close === 'function' && modal.open) {
            modal.close();
        }
        modal.classList.remove('show');
        document.body.style.overflow = 'auto'; 
    };

    if (btnClose) {
        btnClose.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            const rect = modal.getBoundingClientRect();
            const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
              rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
            if (!isInDialog || e.target === modal) {
                closeModal();
            }
        });

        modal.addEventListener('cancel', () => {
            document.body.style.overflow = 'auto';
        });
    }

    // ==========================================
    // 3. HIGHLIGHT DE NAVEGACIÓN SEGÚN SCROLL
    // ==========================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(section => navObserver.observe(section));

    // ==========================================
    // 4. VALIDACIÓN FORMULARIO (10MB)
    // ==========================================
    const fileInput = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name');

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const maxSizeEnBytes = 10 * 1024 * 1024; 

                if (file.size > maxSizeEnBytes) {
                    alert('El archivo excede los 10MB permitidos. Adjunta un link de Drive en el mensaje.');
                    this.value = ''; 
                    fileNameDisplay.textContent = '📎 Adjuntar archivo (Max 10MB)';
                    fileNameDisplay.style.color = 'inherit';
                } else {
                    fileNameDisplay.textContent = '📎 ' + file.name;
                    fileNameDisplay.style.color = '#1A1A1A'; 
                }
            } else {
                fileNameDisplay.textContent = '📎 Adjuntar archivo (Max 10MB)';
            }
        });
    }

    // ==========================================
    // 5. ANIMACIÓN BARRAS DE SOFTWARE (SCROLL)
    // ==========================================
    const skillFills = document.querySelectorAll('.skill-fill');
    
    if (skillFills.length > 0) {
        const skillObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fill = entry.target;
                    const widthTarget = fill.getAttribute('data-width');
                    fill.style.width = widthTarget;
                    observer.unobserve(fill);
                }
            });
        }, { threshold: 0.2 }); 

        skillFills.forEach(fill => skillObserver.observe(fill));
    }
});