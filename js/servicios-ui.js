/**
 * ALZADO ROJO | Arquitectura & Fabricación Digital
 * Controlador Frontend para la Plataforma Comercial y Cotizador Formal
 * Archivo: js/servicios-ui.js
 */

document.addEventListener('DOMContentLoaded', () => {

    'use strict';

    // =========================================================================
    // 0. CONTROL DE TEMA (CLARO / OSCURO)
    // =========================================================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const metaThemeColor = document.getElementById('meta-theme-color');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('ar_theme', theme);
        } catch (e) {
            console.warn('LocalStorage inaccesible para tema:', e);
        }

        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0D0D10' : '#FCFCFB');
        }

        if (themeToggleBtn) {
            themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        }

        // Actualizar fondo de escena Three.js si está inicializado
        if (window.arStlScene && window.THREE) {
            window.arStlScene.background = new window.THREE.Color(theme === 'dark' ? 0x141418 : 0xF4F4F0);
        }
    }

    let initialTheme = 'light';
    try {
        const savedTheme = localStorage.getItem('ar_theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            initialTheme = savedTheme;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            initialTheme = 'dark';
        }
    } catch (e) {
        console.warn(e);
    }
    applyTheme(initialTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
        });
    }

    // Navegación móvil
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const primaryNav = document.getElementById('primary-nav');
    if (mobileNavToggle && primaryNav) {
        mobileNavToggle.addEventListener('click', () => {
            const isOpen = primaryNav.classList.toggle('open');
            mobileNavToggle.classList.toggle('open', isOpen);
            mobileNavToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        primaryNav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                primaryNav.classList.remove('open');
                mobileNavToggle.classList.remove('open');
                mobileNavToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // =========================================================================
    // 1. TOAST HELPER (NOTIFICACIONES FLOTANTES)
    // =========================================================================
    const toastElement = document.getElementById('ar-toast');
    let toastTimeout = null;

    function showToast(message) {
        if (!toastElement) return;
        toastElement.textContent = message;
        toastElement.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastElement.classList.remove('show');
        }, 3200);
    }

    // =========================================================================
    // 2. ACTUALIZACIÓN DEL BADGE DEL CARRITO FLOTANTE
    // =========================================================================
    const floatingQuotePill = document.getElementById('floating-quote-pill');
    const navQuoteBtn = document.getElementById('nav-quote-btn');
    const quoteCountBadges = document.querySelectorAll('.quote-count-badge');

    function updateQuoteBadge() {
        if (!window.AlzadoFormalQuote) return;
        const activeQuote = window.AlzadoFormalQuote.getActiveQuote();
        const count = activeQuote && Array.isArray(activeQuote.items) ? activeQuote.items.length : 0;
        
        quoteCountBadges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-flex' : 'none';
        });

        if (floatingQuotePill) {
            floatingQuotePill.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // =========================================================================
    // 3. VISOR 3D STL (THREE.JS)
    // =========================================================================
    const stlContainer = document.getElementById('stl-canvas-container');
    const stlDropOverlay = document.getElementById('stl-drop-overlay');
    const stlFileInput = document.getElementById('stl-file-input');
    const stlResetBtn = document.getElementById('stl-reset-btn');

    let currentMesh = null;

    if (stlContainer && window.THREE) {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(currentTheme === 'dark' ? 0x141418 : 0xF4F4F0);
        window.arStlScene = scene;

        const camera = new THREE.PerspectiveCamera(45, stlContainer.clientWidth / stlContainer.clientHeight, 0.1, 1000);
        camera.position.set(110, 110, 110);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(stlContainer.clientWidth, stlContainer.clientHeight);
        stlContainer.appendChild(renderer.domElement);

        let controls = null;
        if (THREE.OrbitControls) {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
        }

        // Iluminación arquitectónica nítida
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
        dirLight1.position.set(100, 200, 80);
        scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.35);
        dirLight2.position.set(-100, -100, -60);
        scene.add(dirLight2);

        // Material PLA Rojo Alzado
        const materialPLA = new THREE.MeshStandardMaterial({
            color: 0xD92525,
            roughness: 0.55,
            metalness: 0.1
        });

        // Bucle de animación
        function animate() {
            requestAnimationFrame(animate);
            if (controls) controls.update();
            if (currentMesh) {
                currentMesh.rotation.z += 0.003; // Rotación lenta y elegante
            }
            renderer.render(scene, camera);
        }
        animate();

        // Responsive Resize
        window.addEventListener('resize', () => {
            if (stlContainer) {
                camera.aspect = stlContainer.clientWidth / stlContainer.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(stlContainer.clientWidth, stlContainer.clientHeight);
            }
        });

        // Función para cargar y mostrar el modelo STL
        function loadSTLFile(file) {
            if (!THREE.STLLoader) {
                console.error('STLLoader no está disponible');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const contents = e.target.result;
                const loader = new THREE.STLLoader();
                const geometry = loader.parse(contents);

                if (currentMesh) {
                    scene.remove(currentMesh);
                }

                geometry.center();
                currentMesh = new THREE.Mesh(geometry, materialPLA);

                // Autoescala para centrar en cámara
                const boundingBox = new THREE.Box3().setFromObject(currentMesh);
                const sizeVector = boundingBox.getSize(new THREE.Vector3());
                const maxDim = Math.max(sizeVector.x, sizeVector.y, sizeVector.z) || 1;
                const scale = 75 / maxDim;
                currentMesh.scale.set(scale, scale, scale);
                currentMesh.rotation.x = -Math.PI / 2;

                scene.add(currentMesh);

                if (stlDropOverlay) {
                    stlDropOverlay.style.display = 'none';
                }
                if (stlResetBtn) {
                    stlResetBtn.style.display = 'inline-block';
                }

                showToast(`Modelo STL cargado: "${file.name}"`);
            };
            reader.readAsArrayBuffer(file);
        }

        // Eventos drag and drop
        if (stlDropOverlay) {
            stlDropOverlay.addEventListener('dragover', (e) => {
                e.preventDefault();
                stlDropOverlay.classList.add('drag-over');
            });

            stlDropOverlay.addEventListener('dragleave', () => {
                stlDropOverlay.classList.remove('drag-over');
            });

            stlDropOverlay.addEventListener('drop', (e) => {
                e.preventDefault();
                stlDropOverlay.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.name.toLowerCase().endsWith('.stl')) {
                    loadSTLFile(file);
                } else {
                    alert('Por favor selecciona un archivo con extensión .stl');
                }
            });
        }

        if (stlFileInput) {
            stlFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.name.toLowerCase().endsWith('.stl')) {
                    loadSTLFile(file);
                }
            });
        }

        if (stlResetBtn) {
            stlResetBtn.addEventListener('click', () => {
                if (currentMesh) {
                    scene.remove(currentMesh);
                    currentMesh = null;
                }
                if (stlDropOverlay) {
                    stlDropOverlay.style.display = 'flex';
                }
                if (stlFileInput) {
                    stlFileInput.value = '';
                }
                stlResetBtn.style.display = 'none';
            });
        }
    }

    // =========================================================================
    // 4. COTIZADOR INTERACTIVO DE MAQUETAS DE ARQUITECTURA (3D)
    // =========================================================================
    const archGramsInput = document.getElementById('arch-grams');
    const archReadyCheck = document.getElementById('arch-ready-to-print');
    const archQualitySelect = document.getElementById('arch-quality');
    const archInfillSelect = document.getElementById('arch-infill');
    const archMaterialSelect = document.getElementById('arch-material');

    // Elementos de desglose
    const archEffectiveRateDisplay = document.getElementById('arch-effective-rate');
    const archSubtotalDisplay = document.getElementById('arch-subtotal-display');
    const archDiscountRow = document.getElementById('arch-discount-row');
    const archDiscountDisplay = document.getElementById('arch-discount-display');
    const archTotalDisplay = document.getElementById('arch-total-display');
    const btnAddArchQuote = document.getElementById('btn-add-arch-quote');
    const btnWspArchDirect = document.getElementById('btn-wsp-arch-direct');

    let currentArchCalc = null;

    function recalculateArchQuote() {
        if (!window.AlzadoQuote) return;

        const grams = parseFloat(archGramsInput ? archGramsInput.value : 0) || 0;
        const isReadyToPrint = archReadyCheck ? archReadyCheck.checked : false;
        const quality = archQualitySelect ? archQualitySelect.value : 'standard';
        const infill = archInfillSelect ? archInfillSelect.value : 'standard';
        const material = archMaterialSelect ? archMaterialSelect.value : 'pla_matte';

        currentArchCalc = window.AlzadoQuote.calculateArchitecturalQuote({
            grams,
            isReadyToPrint,
            quality,
            infill,
            material
        });

        if (archEffectiveRateDisplay) {
            archEffectiveRateDisplay.textContent = currentArchCalc.formatted.effectiveRatePerGram;
        }
        if (archSubtotalDisplay) {
            archSubtotalDisplay.textContent = currentArchCalc.formatted.subtotal;
        }
        if (archDiscountDisplay) {
            archDiscountDisplay.textContent = `-${currentArchCalc.formatted.discountAmount}`;
        }
        if (archDiscountRow) {
            archDiscountRow.style.display = isReadyToPrint ? 'flex' : 'none';
        }
        if (archTotalDisplay) {
            archTotalDisplay.textContent = `$${Math.round(currentArchCalc.total).toLocaleString('es-CL')}`;
        }

        // Actualizar URL de WhatsApp directo
        if (btnWspArchDirect) {
            const mockItem = window.AlzadoFormalQuote.createArchitecturalItem(currentArchCalc);
            const mockQuote = window.AlzadoFormalQuote.createFormalQuote({}, [mockItem]);
            btnWspArchDirect.href = window.AlzadoFormalQuote.generateWhatsAppQuoteUrl(mockQuote);
        }
    }

    if (archGramsInput) archGramsInput.addEventListener('input', recalculateArchQuote);
    if (archReadyCheck) archReadyCheck.addEventListener('change', recalculateArchQuote);
    if (archQualitySelect) archQualitySelect.addEventListener('change', recalculateArchQuote);
    if (archInfillSelect) archInfillSelect.addEventListener('change', recalculateArchQuote);
    if (archMaterialSelect) archMaterialSelect.addEventListener('change', recalculateArchQuote);

    // Agregar Maqueta Arquitectura a Cotización Formal
    if (btnAddArchQuote) {
        btnAddArchQuote.addEventListener('click', () => {
            if (!currentArchCalc || currentArchCalc.grams <= 0) {
                alert('Por favor ingresa un peso estimado en gramos para cotizar la maqueta.');
                if (archGramsInput) archGramsInput.focus();
                return;
            }

            if (!window.AlzadoFormalQuote) return;
            const item = window.AlzadoFormalQuote.createArchitecturalItem(currentArchCalc);
            window.AlzadoFormalQuote.addQuoteItem(item);
            updateQuoteBadge();
            showToast(`Maqueta 3D (${currentArchCalc.grams}g) agregada a la cotización.`);
            openFormalQuoteModal();
        });
    }

    // Inicializar cálculo inicial
    recalculateArchQuote();

    // =========================================================================
    // 5. SECCIÓN MAQUETAS URBANAS TOPOGRÁFICAS 3D
    // =========================================================================
    const urbanCitySelect = document.getElementById('urban-city-select');
    const urbanCustomCityInput = document.getElementById('urban-custom-city-input');
    const urbanFrameCheckbox = document.getElementById('urban-frame-checkbox');
    const urbanFormatButtons = document.querySelectorAll('.btn-select-urban');

    if (urbanCitySelect && urbanCustomCityInput) {
        urbanCitySelect.addEventListener('change', () => {
            if (urbanCitySelect.value === 'custom') {
                urbanCustomCityInput.style.display = 'inline-block';
                urbanCustomCityInput.focus();
            } else {
                urbanCustomCityInput.style.display = 'none';
            }
        });
    }

    // Manejar selección de cualquier formato urbano
    urbanFormatButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const size = btn.getAttribute('data-size') || '25x25';
            const city = urbanCitySelect ? urbanCitySelect.value : 'santiago';
            const customCityName = urbanCustomCityInput ? urbanCustomCityInput.value.trim() : '';
            const withFrame = urbanFrameCheckbox ? urbanFrameCheckbox.checked : false;

            if (city === 'custom' && !customCityName) {
                alert('Por favor escribe el nombre de la ciudad o coordenadas que deseas.');
                if (urbanCustomCityInput) urbanCustomCityInput.focus();
                return;
            }

            if (!window.AlzadoQuote || !window.AlzadoFormalQuote) return;

            const calc = window.AlzadoQuote.calculateUrbanQuote({
                size,
                city,
                customCityName,
                withFrame,
                quantity: 1
            });

            const item = window.AlzadoFormalQuote.createUrbanItem(calc);
            window.AlzadoFormalQuote.addQuoteItem(item);
            updateQuoteBadge();
            showToast(`Maqueta Urbana (${size} cm) de ${calc.city.name} agregada.`);
            openFormalQuoteModal();
        });
    });

    // =========================================================================
    // 6. SECCIÓN SERVICIOS DE ARQUITECTURA TRADICIONAL & DOM
    // =========================================================================
    const requestServiceButtons = document.querySelectorAll('.btn-request-service');

    requestServiceButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const serviceId = btn.getAttribute('data-service-id');
            if (!serviceId || !window.AlzadoQuote || !window.AlzadoFormalQuote) return;

            const estimate = window.AlzadoQuote.estimateTraditionalQuote(serviceId);
            const item = window.AlzadoFormalQuote.createTraditionalItem(estimate);
            window.AlzadoFormalQuote.addQuoteItem(item);
            updateQuoteBadge();
            showToast(`Servicio "${estimate.titulo}" agregado a la cotización.`);
            openFormalQuoteModal();
        });
    });

    // =========================================================================
    // 7. MODAL DE COTIZACIÓN FORMAL ("EL FORMATO FINO")
    // =========================================================================
    const formalQuoteModal = document.getElementById('formal-quote-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const quoteFolioDisplay = document.getElementById('quote-folio-display');
    const quoteDateDisplay = document.getElementById('quote-date-display');
    const quoteValidityDisplay = document.getElementById('quote-validity-display');
    const quoteItemsTbody = document.getElementById('quote-items-tbody');

    // Totales
    const quoteSubtotalNeto = document.getElementById('quote-subtotal-neto');
    const quoteTotalDiscounts = document.getElementById('quote-total-discounts');
    const quoteDiscountsRow = document.getElementById('quote-discounts-row');
    const quoteNetoAjustado = document.getElementById('quote-neto-ajustado');
    const quoteIvaToggle = document.getElementById('quote-iva-toggle');
    const quoteIvaRow = document.getElementById('quote-iva-row');
    const quoteIvaAmount = document.getElementById('quote-iva-amount');
    const quoteTotalFinal = document.getElementById('quote-total-final');

    // Datos Mandante
    const clientNameInput = document.getElementById('client-name');
    const clientCompanyInput = document.getElementById('client-company');
    const clientRutInput = document.getElementById('client-rut');
    const clientPhoneInput = document.getElementById('client-phone');
    const clientEmailInput = document.getElementById('client-email');
    const clientCityInput = document.getElementById('client-city');

    // Acciones del modal
    const btnModalPrint = document.getElementById('btn-modal-print');
    const btnModalWsp = document.getElementById('btn-modal-wsp');
    const btnModalClear = document.getElementById('btn-modal-clear');

    function syncClientInputsFromQuote(quote) {
        if (!quote || !quote.client) return;
        if (clientNameInput) clientNameInput.value = quote.client.name !== 'Cliente Particular' ? quote.client.name : '';
        if (clientCompanyInput) clientCompanyInput.value = quote.client.company || '';
        if (clientRutInput) clientRutInput.value = quote.client.rut || '';
        if (clientPhoneInput) clientPhoneInput.value = quote.client.phone || '';
        if (clientEmailInput) clientEmailInput.value = quote.client.email || '';
        if (clientCityInput) clientCityInput.value = quote.client.city || '';
    }

    function syncClientDataToStorage() {
        if (!window.AlzadoFormalQuote) return;
        const activeQuote = window.AlzadoFormalQuote.getActiveQuote();
        activeQuote.client = {
            name: clientNameInput ? clientNameInput.value.trim() : '',
            company: clientCompanyInput ? clientCompanyInput.value.trim() : '',
            rut: clientRutInput ? clientRutInput.value.trim() : '',
            phone: clientPhoneInput ? clientPhoneInput.value.trim() : '',
            email: clientEmailInput ? clientEmailInput.value.trim() : '',
            city: clientCityInput ? clientCityInput.value.trim() : ''
        };
        window.AlzadoFormalQuote.saveQuoteToStorage(activeQuote);
        updateWspButtonUrl(activeQuote);
    }

    // Vincular inputs del cliente para guardar cambios
    [clientNameInput, clientCompanyInput, clientRutInput, clientPhoneInput, clientEmailInput, clientCityInput].forEach(inp => {
        if (inp) inp.addEventListener('input', syncClientDataToStorage);
    });

    function updateWspButtonUrl(quote) {
        if (!btnModalWsp || !window.AlzadoFormalQuote) return;
        btnModalWsp.href = window.AlzadoFormalQuote.generateWhatsAppQuoteUrl(quote);
    }

    function renderFormalQuote() {
        if (!window.AlzadoFormalQuote) return;
        const activeQuote = window.AlzadoFormalQuote.getActiveQuote();

        // Folio y Fechas
        if (quoteFolioDisplay) quoteFolioDisplay.textContent = activeQuote.folio;
        if (quoteDateDisplay) quoteDateDisplay.textContent = activeQuote.createdAtFormatted || '2026';
        if (quoteValidityDisplay) quoteValidityDisplay.textContent = activeQuote.validUntilFormatted || '15 días';

        // Sincronizar inputs
        syncClientInputsFromQuote(activeQuote);

        // Tabla de Partidas
        if (quoteItemsTbody) {
            quoteItemsTbody.innerHTML = '';
            if (!activeQuote.items || activeQuote.items.length === 0) {
                quoteItemsTbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="quote-empty-state">
                            No hay partidas en la cotización. Agrega una maqueta 3D, maqueta urbana o servicio de arquitectura.
                        </td>
                    </tr>
                `;
            } else {
                activeQuote.items.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <strong class="item-title-text">${item.title}</strong>
                            <span class="item-desc-text">${item.description || ''}</span>
                        </td>
                        <td style="text-align: center;">
                            <input type="number" min="1" max="99" class="item-qty-input" value="${item.quantity}" data-item-id="${item.id}">
                        </td>
                        <td style="text-align: right; white-space: nowrap;">
                            ${item.formatted ? item.formatted.unitPrice : '$' + item.unitPrice}
                        </td>
                        <td style="text-align: right; color: var(--brand-red); white-space: nowrap;">
                            ${item.discountAmount > 0 ? '-' + (window.AlzadoQuote ? window.AlzadoQuote.formatCLP(item.discountAmount) : '$' + item.discountAmount) : '—'}
                        </td>
                        <td style="text-align: right; font-weight: 600; white-space: nowrap;">
                            ${item.formatted ? item.formatted.subtotal : '$' + item.subtotal}
                        </td>
                        <td style="text-align: center;">
                            <button type="button" class="btn-remove-item" data-item-id="${item.id}" title="Eliminar partida">✕</button>
                        </td>
                    `;
                    quoteItemsTbody.appendChild(tr);
                });

                // Eventos de cantidad
                quoteItemsTbody.querySelectorAll('.item-qty-input').forEach(qtyInput => {
                    qtyInput.addEventListener('change', (e) => {
                        const itemId = e.target.getAttribute('data-item-id');
                        const newQty = Math.max(1, parseInt(e.target.value, 10) || 1);
                        const itemToUpdate = activeQuote.items.find(i => i.id === itemId);
                        if (itemToUpdate) {
                            itemToUpdate.quantity = newQty;
                            const recalculated = window.AlzadoFormalQuote.createFormalQuote(
                                activeQuote.client,
                                activeQuote.items,
                                {
                                    customFolio: activeQuote.folio,
                                    includeIVA: activeQuote.financials.includeIVA
                                }
                            );
                            window.AlzadoFormalQuote.saveQuoteToStorage(recalculated);
                            renderFormalQuote();
                            updateQuoteBadge();
                        }
                    });
                });

                // Eventos de eliminar partida
                quoteItemsTbody.querySelectorAll('.btn-remove-item').forEach(delBtn => {
                    delBtn.addEventListener('click', (e) => {
                        const itemId = e.target.getAttribute('data-item-id');
                        window.AlzadoFormalQuote.removeQuoteItem(itemId);
                        renderFormalQuote();
                        updateQuoteBadge();
                        showToast('Partida eliminada.');
                    });
                });
            }
        }

        // Totales financieros
        const fin = activeQuote.financials || {};
        if (quoteSubtotalNeto) quoteSubtotalNeto.textContent = fin.formatted ? fin.formatted.subtotalNeto : '$0 CLP';
        if (quoteTotalDiscounts) quoteTotalDiscounts.textContent = fin.formatted ? `-${fin.formatted.totalDiscounts}` : '$0 CLP';
        if (quoteDiscountsRow) quoteDiscountsRow.style.display = (fin.totalDiscounts > 0) ? 'flex' : 'none';
        if (quoteNetoAjustado) quoteNetoAjustado.textContent = fin.formatted ? fin.formatted.netoAjustado : '$0 CLP';

        if (quoteIvaToggle) quoteIvaToggle.checked = Boolean(fin.includeIVA);
        if (quoteIvaRow) quoteIvaRow.style.display = fin.includeIVA ? 'flex' : 'none';
        if (quoteIvaAmount) quoteIvaAmount.textContent = fin.formatted ? fin.formatted.ivaAmount : '$0 CLP';
        if (quoteTotalFinal) quoteTotalFinal.textContent = fin.formatted ? fin.formatted.total : '$0 CLP';

        // Actualizar URL de WhatsApp
        updateWspButtonUrl(activeQuote);
    }

    // Toggle de IVA
    if (quoteIvaToggle) {
        quoteIvaToggle.addEventListener('change', () => {
            if (!window.AlzadoFormalQuote) return;
            const activeQuote = window.AlzadoFormalQuote.getActiveQuote();
            const recalculated = window.AlzadoFormalQuote.createFormalQuote(
                activeQuote.client,
                activeQuote.items,
                {
                    customFolio: activeQuote.folio,
                    includeIVA: quoteIvaToggle.checked
                }
            );
            window.AlzadoFormalQuote.saveQuoteToStorage(recalculated);
            renderFormalQuote();
        });
    }

    // Abrir Modal
    function openFormalQuoteModal() {
        if (!formalQuoteModal) return;
        renderFormalQuote();
        formalQuoteModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    // Cerrar Modal
    function closeFormalQuoteModal() {
        if (!formalQuoteModal) return;
        formalQuoteModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeFormalQuoteModal);
    if (floatingQuotePill) floatingQuotePill.addEventListener('click', openFormalQuoteModal);
    if (navQuoteBtn) navQuoteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openFormalQuoteModal();
    });

    // Cerrar al hacer clic en el backdrop
    if (formalQuoteModal) {
        formalQuoteModal.addEventListener('click', (e) => {
            if (e.target === formalQuoteModal) {
                closeFormalQuoteModal();
            }
        });
    }

    // Escape para cerrar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && formalQuoteModal && formalQuoteModal.classList.contains('open')) {
            closeFormalQuoteModal();
        }
    });

    // Botón Imprimir / PDF
    if (btnModalPrint) {
        btnModalPrint.addEventListener('click', () => {
            window.print();
        });
    }

    // Botón Vaciar Cotización
    if (btnModalClear) {
        btnModalClear.addEventListener('click', () => {
            if (confirm('¿Deseas reiniciar la cotización y eliminar todas las partidas?')) {
                if (window.AlzadoFormalQuote) {
                    window.AlzadoFormalQuote.clearQuoteStorage();
                    renderFormalQuote();
                    updateQuoteBadge();
                    showToast('Cotización reiniciada.');
                }
            }
        });
    }

    // =========================================================================
    // 8. SCROLL OBSERVER PARA HIGHLIGHT DE NAVEGACIÓN
    // =========================================================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');

    if (sections.length > 0 && navLinks.length > 0 && 'IntersectionObserver' in window) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentId = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === `#${currentId}`) {
                            link.classList.add('active');
                        } else if (href && href.startsWith('#')) {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(sec => navObserver.observe(sec));
    }

    // Inicializar badge al arrancar
    updateQuoteBadge();
});
