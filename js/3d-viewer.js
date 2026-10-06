document.addEventListener('DOMContentLoaded', () => {
    // 1. LÓGICA DE COTIZADOR (Tarifas Oficiales Alzado Rojo: $90 CLP/g, -20% Ready to Print)
    const gramsInput = document.getElementById('grams-input');
    const discountCheck = document.getElementById('discount-check');
    const priceDisplay = document.getElementById('total-price');

    function calculatePrice() {
        const grams = parseFloat(gramsInput.value) || 0;
        const isReadyToPrint = discountCheck ? discountCheck.checked : false;

        let total = 0;
        if (typeof window !== 'undefined' && window.AlzadoQuote && typeof window.AlzadoQuote.calculateArchitecturalQuote === 'function') {
            const res = window.AlzadoQuote.calculateArchitecturalQuote({
                grams,
                isReadyToPrint,
                quality: 'standard',
                infill: 'standard',
                material: 'pla_matte'
            });
            total = res.total;
        } else {
            const basePricePerGram = 90;
            let subtotal = grams * basePricePerGram;
            total = isReadyToPrint ? Math.round(subtotal * 0.80) : Math.round(subtotal);
        }
        
        // Format to CLP (e.g. 15.000)
        const formattedTotal = Math.round(total).toLocaleString('es-CL');
        if (priceDisplay) {
            priceDisplay.innerHTML = `$${formattedTotal} <span style="font-size: 1rem; color: var(--text-color);">CLP</span>`;
        }
    }

    if (gramsInput && discountCheck) {
        gramsInput.addEventListener('input', calculatePrice);
        discountCheck.addEventListener('change', calculatePrice);
    }

    // 2. CONFIGURACIÓN VISOR 3D (Three.js)
    const container = document.getElementById('stl-viewer');
    const uploadOverlay = document.getElementById('upload-overlay');
    const fileInput = document.getElementById('stl-upload');

    if (!container) return;

    // Escena, Cámara y Renderizador
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF9F9F8); // var(--bg-alt)

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(100, 100, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Controles Orbitales
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Iluminación (Estilo Arquitectónico Limpio)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(100, 200, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-100, -100, -50);
    scene.add(dirLight2);

    let currentMesh = null;

    // Material PLA (Rojo Alzado o Gris Neutro)
    const materialPLA = new THREE.MeshStandardMaterial({ 
        color: 0xD92525, // brand-red
        roughness: 0.6,
        metalness: 0.1
    });

    // Función de Renderizado Animado
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        if(currentMesh) {
            currentMesh.rotation.z += 0.005; // Rotación lenta y elegante
        }
        renderer.render(scene, camera);
    }
    animate();

    // Redimensionado
    window.addEventListener('resize', () => {
        if(container) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });

    // Carga de Archivos STL
    function loadSTL(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contents = e.target.result;
            const loader = new THREE.STLLoader();
            const geometry = loader.parse(contents);
            
            if (currentMesh) {
                scene.remove(currentMesh);
            }

            geometry.center(); // Centrar modelo
            currentMesh = new THREE.Mesh(geometry, materialPLA);
            
            // Ajustar escala para que quepa en la vista
            const boundingBox = new THREE.Box3().setFromObject(currentMesh);
            const size = boundingBox.getSize(new THREE.Vector3()).length();
            const scale = 100 / size;
            currentMesh.scale.set(scale, scale, scale);

            // STLs a veces vienen rotados 90 grados en X dependiendo del software
            currentMesh.rotation.x = -Math.PI / 2;

            scene.add(currentMesh);
            
            // Ocultar Overlay
            uploadOverlay.style.display = 'none';
        };
        reader.readAsArrayBuffer(file);
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.name.toLowerCase().endsWith('.stl')) {
                loadSTL(file);
            } else {
                alert('Por favor, selecciona un archivo .stl válido.');
            }
        });
    }

    // Drag and Drop Effects
    uploadOverlay.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadOverlay.style.backgroundColor = 'rgba(217, 37, 37, 0.1)'; // Red tint on drag
    });
    uploadOverlay.addEventListener('dragleave', (e) => {
        uploadOverlay.style.backgroundColor = 'rgba(255,255,255,0.85)';
    });
    uploadOverlay.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadOverlay.style.backgroundColor = 'rgba(255,255,255,0.85)';
        const file = e.dataTransfer.files[0];
        if (file && file.name.toLowerCase().endsWith('.stl')) {
            loadSTL(file);
        } else {
            alert('Por favor, selecciona un archivo .stl válido.');
        }
    });
});
