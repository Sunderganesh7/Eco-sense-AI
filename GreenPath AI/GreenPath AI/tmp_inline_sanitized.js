
        // Tab switching system
        function switchTab(tabId) {
            // Hide all panels
            document.querySelectorAll('.dashboard-panel').forEach(panel => {
                panel.classList.remove('active');
            });

            // Remove active class from menu items
            document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
                item.classList.remove('active');
            });

            // Show target panel
            const targetPanel = document.getElementById('panel-' + tabId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // Mark target menu item
            const targetMenuItem = document.getElementById('menu-' + tabId);
            if (targetMenuItem) {
                targetMenuItem.classList.add('active');
            }

            // Update topbar display
            const displayTitle = document.getElementById('topbar-display-title');
            const displaySub = document.getElementById('topbar-display-sub');

            const titles = {
                'overview': { title: 'Platform Overview', sub: 'Environmental AI platform dashboard & core metrics' },
                'workflow': { title: 'System Flow Architecture', sub: 'Interactive 5-stage deep learning dataflow' },
                'drone': { title: 'Live Drone Feed', sub: 'Real-time telemetry, mission tracking, and autonomous flight logs' },
                'vision': { title: 'Vision Analytics Core', sub: 'Spatial density heatmaps & OpenCV pre-processing pipelines' },
                'geoai': { title: 'Interactive GIS Map', sub: 'Georeferenced coordinate markings & optimal path planning' },
                'atmosphere': { title: 'Air Quality & Carbon cover', sub: 'AQI estimations, carbon timelines, & foliage statistics' },
                'simulation': { title: 'Microclimate Simulation', sub: 'Plant simulated mature canopies & compute cooling mitigations' },
                'health': { title: 'Health & Species Directory', sub: 'HSV color color-space health indexes & botanical directory' },
                'comparison': { title: 'Time-Series comparative delta', sub: 'Compare historical environment frames with delta diffs' },
                'report': { title: 'Executive Audit Report', sub: 'Print or export compiled analytical environmental audits' },
                'about': { title: 'System Administration', sub: 'MySQL greenpath_ai database portfolio metrics & configuration' },
                'admin_users': { title: 'Enterprise User Directory', sub: 'MySQL greenpath_ai registered credentials & RBAC role administration' },
                'admin_logins': { title: 'Authentication Telemetry & Login History', sub: 'Audited session history & telemetry from login_history MySQL table' },
                'modelinfo': { title: 'AI Model Details', sub: 'YOLOv8s neural topology, hyperparameter specs, & training PR curves' }
            };

            if (titles[tabId]) {
                displayTitle.innerText = titles[tabId].title;
                displaySub.innerText = titles[tabId].sub;
            }

            // Update browser URL elegantly
            const cleanUrl = tabId === 'overview' ? '/' : '/' + tabId;
            window.history.pushState(null, '', cleanUrl);

            // Trigger canvas resize/drawing if simulation tab is activated
            if (tabId === 'simulation') {
                initSimulationCanvas();
            }

            // Trigger Leaflet map mount if GIS Map tab is activated
            if (tabId === 'geoai') {
                setTimeout(initLeafletMap, 50);
            }

            if (tabId === 'about') {
                setTimeout(fetchApiStatus, 50);
            }

            if (tabId === 'admin_users') {
                setTimeout(fetchAdminUsers, 50);
            }

            if (tabId === 'admin_logins') {
                setTimeout(fetchAdminLogins, 50);
            }

            if (tabId === 'drone') {
                setTimeout(initDroneHud, 50);
            } else {
                stopDroneHud();
            }

            // Mount/Rebuild ChartJS objects
            mountAllCharts(tabId);
        }

        // Maintain back-forward button compatibility with tabs
        window.onpopstate = function () {
            const path = window.location.pathname.replace('/', '') || 'overview';
            switchTab(path);
        };

        // Filter Species Encyclopedia list
        function filterSpecies() {
            const query = document.getElementById('speciesSearch').value.toLowerCase();
            document.querySelectorAll('#speciesList .species-card').forEach(card => {
                const name = card.getAttribute('data-name').toLowerCase();
                if (name.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // ================= LIGHT/DARK THEME TOGGLE ENGINE =================
        function toggleTheme() {
            const body = document.body;
            const btn = document.getElementById('theme-toggle');

            body.classList.toggle('dark');

            const isDark = body.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            btn.innerText = isDark ? '☀️' : '🌙';

            // Re-draw map basemaps with dark or light OSM layers
            updateMapTheme();

            // Refresh charts styling
            refreshChartsTheme();
        }

        // ================= INTERACTIVE MICROCLIMATE SIMULATOR CORE =================
        let simBaseCount = 0;
        let simBaseGreen = 0;
        let simBaseTemp = 35.00;

        let canvas, ctx;
        let canvasImg = new Image();
        let addedTrees = [];

        function initSimulationCanvas() {
            canvas = document.getElementById('simCanvas');
            if (!canvas) return;

            ctx = canvas.getContext('2d');

            
            canvasImg.src = "/uploads/0";
            

            canvasImg.onload = function () {
                canvas.width = canvasImg.naturalWidth || 500;
                canvas.height = canvasImg.naturalHeight || 380;
                drawSimulationFrame();
            };
        }

        function drawSimulationFrame() {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(canvasImg, 0, 0, canvas.width, canvas.height);

            addedTrees.forEach((tree, idx) => {
                // Draw canopy (soft professional alpha green circle)
                ctx.beginPath();
                ctx.arc(tree.x, tree.y, 14, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(5, 150, 105, 0.7)';
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();

                // Draw core trunk (brown indicator)
                ctx.fillStyle = '#b45309';
                ctx.fillRect(tree.x - 2, tree.y + 12, 4, 8);
            });

            const badge = document.getElementById('canvasOverlayStats');
            if (badge) {
                badge.innerText = `SIMULATION ACTIVE // ${addedTrees.length} VIRTUAL CANOPIES PLANTED`;
            }
        }

        function updateSimulation(val) {
            const extraCount = parseInt(val);
            document.getElementById('simValBadge').innerText = extraCount;

            const totalTrees = simBaseCount + extraCount;
            const simulatedGreen = Math.min(simBaseGreen + (extraCount * 0.2), 100);

            const currentReduction = (totalTrees * 0.02) + (simulatedGreen * 0.03);
            const finalTemp = Math.max(18.0, simBaseTemp - currentReduction);

            let coolingLvl = "Low Cooling Effect 🟡";
            if (currentReduction >= 3.0) {
                coolingLvl = "High Cooling Effect 🔵";
            } else if (currentReduction >= 1.0) {
                coolingLvl = "Moderate Cooling Effect 🟢";
            }

            document.getElementById('simTotalCount').innerText = totalTrees;
            document.getElementById('simTempDrop').innerText = `-${currentReduction.toFixed(2)} °C`;
            document.getElementById('simFinalTemp').innerText = `${finalTemp.toFixed(2)} °C`;
            document.getElementById('simCoolingLvl').innerText = coolingLvl;

            if (canvas) {
                addedTrees = [];
                for (let i = 0; i < extraCount; i++) {
                    const seedX = Math.sin(i + 1.25) * 0.5 + 0.5;
                    const seedY = Math.cos(i + 3.84) * 0.5 + 0.5;

                    addedTrees.push({
                        x: Math.floor(seedX * (canvas.width - 60)) + 30,
                        y: Math.floor(seedY * (canvas.height - 60)) + 30
                    });
                }
                drawSimulationFrame();
            }
        }

        // ================= INTERACTIVE LEAFLET MAP MODULE =================
        let mapInstance;

        function initLeafletMap() {
            if (mapInstance) {
                mapInstance.invalidateSize();
                return;
            }

            const mapContainer = document.getElementById('geoaiMap');
            if (!mapContainer) return;

            const baseLat = 0;
            const baseLng = 0;

            mapInstance = L.map('geoaiMap', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([baseLat, baseLng], 18);

        updateMapTheme();

        // 1. Plot Base Center Marker
        let activePin = L.marker([baseLat, baseLng]).addTo(mapInstance)
            .bindPopup("<strong>Inspection Base Coordinate</strong><br/>Lat: " + baseLat.toFixed(6) + "<br/>Lng: " + baseLng.toFixed(6));

        // 2. Click handler to set new base coordinate center
        mapInstance.on('click', function (e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            activePin.setLatLng(e.latlng);
            activePin.bindPopup("<strong>New Coordinates Selected</strong><br/>Lat: " + lat.toFixed(6) + "<br/>Lng: " + lng.toFixed(6) + "<br/><br/><button onclick='saveNewCoordinates(" + lat + "," + lng + ")' style='background:var(--primary); color:#fff; border:none; padding:6px 10px; border-radius:4px; font-weight:600; font-size:11px; cursor:pointer;'>Confirm Base Center</button>").openPopup();
        });

        const points = [
            
        
        { lat: 0, lng: 0, confidence: 0 },
        
            
        ];

        points.forEach((pt, idx) => {
            const marker = L.circleMarker([pt.lat, pt.lng], {
                radius: 7,
                fillColor: '#10b981',
                color: '#ffffff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.85
            }).addTo(mapInstance);

            marker.bindTooltip(`<strong>Canopy TR_${String(idx + 1).padStart(3, '0')}</strong><br/>Detection Confidence: ${(pt.confidence * 100).toFixed(0)}%`, {
                direction: 'top'
            });
        });

        if (points.length > 1) {
            const pathCoords = points.map(p => [p.lat, p.lng]);
            L.polyline(pathCoords, {
                color: '#3b82f6',
                weight: 2.5,
                dashArray: '4, 6',
                opacity: 0.8
            }).addTo(mapInstance);
        }
    }

        function updateMapTheme() {
            if (!mapInstance) return;

            mapInstance.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                    mapInstance.removeLayer(layer);
                }
            });

            const isDark = document.body.classList.contains('dark');
            const url = isDark
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

            L.tileLayer(url, {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
                maxZoom: 20
            }).addTo(mapInstance);
        }

        // ================= MULTIPLE CHARTJS CONTROLLER =================
        let chartObjects = {};

        function mountAllCharts(tabId) {
            if (chartObjects[tabId]) {
                chartObjects[tabId].destroy();
            }

            const isDark = document.body.classList.contains('dark');
            const textColor = isDark ? '#9ca3af' : '#64748b';
            const gridColor = isDark ? '#374151' : '#e2e8f0';

            if (tabId === 'vision') {
                const quadrantCanvas = document.getElementById('quadrantChart');
                if (quadrantCanvas) {
                    const labels = [];
                    const counts = [];
                    
                    
                    labels.push("0");
                    counts.push(0);
                
                

                chartObjects['vision'] = new Chart(quadrantCanvas, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Detected Canopies',
                            data: counts,
                            backgroundColor: 'rgba(5, 150, 105, 0.8)',
                            borderColor: '#059669',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: {
                                grid: { color: gridColor },
                                ticks: { color: textColor }
                            },
                            y: {
                                grid: { display: false },
                                ticks: { color: textColor }
                            }
                        }
                    }
                });
            }
        }

        if (tabId === 'atmosphere') {
            const carbonCanvas = document.getElementById('carbonChart');
            if (carbonCanvas) {
                const labels = [];
                const co2Data = [];
                const treeCount = 0;
        const absorptionPerYear = treeCount * 22;
        const currentYear = new Date().getFullYear();

        for (let i = 0; i <= 50; i += 5) {
            labels.push(currentYear + i);
            co2Data.push(absorptionPerYear * i);
        }

        chartObjects['atmosphere'] = new Chart(carbonCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cumulative Sequestration (kg)',
                    data: co2Data,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderColor: '#10b981',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                }
            }
        });
            }
        }

        if (tabId === 'health') {
            const healthCanvas = document.getElementById('healthDoughnutChart');
            if (healthCanvas) {
                
                const healthy = 0;
                const dry = 0;
                const diseased = 0;
                const dead = 0;

                chartObjects['health'] = new Chart(healthCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Healthy', 'Dry', 'Diseased', 'Dead'],
                datasets: [{
                    data: [healthy, dry, diseased, dead],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#64748b'],
                    borderWidth: isDark ? 2 : 1,
                    borderColor: isDark ? '#1f2937' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: textColor, boxWidth: 12 }
                    }
                },
                cutout: '65%'
            }
        });
        
            }
        }

        if (tabId === 'comparison') {
            const growthCanvas = document.getElementById('growthChart');
            if (growthCanvas) {
                
                const currentCount = 0;
                const historicalCount = 0;

        chartObjects['comparison'] = new Chart(growthCanvas, {
            type: 'bar',
            data: {
                labels: ['Historical Frame', 'Current Frame'],
                datasets: [{
                    label: 'Canopy Count',
                    data: [historicalCount, currentCount],
                    backgroundColor: ['rgba(96, 165, 250, 0.8)', 'rgba(16, 185, 129, 0.8)'],
                    borderColor: ['#3b82f6', '#10b981'],
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                }
            }
        });
        
            }
        }

        if (tabId === 'about') {
            // Academic Custom Model Training Losses Chart (Double Line Chart)
            const evalCanvas = document.getElementById('evalChart');
            if (evalCanvas) {
                const epochs = Array.from({ length: 15 }, (_, i) => (i + 1) * 10);
                const trainLoss = [0.85, 0.62, 0.48, 0.39, 0.32, 0.28, 0.24, 0.21, 0.19, 0.17, 0.15, 0.14, 0.13, 0.12, 0.11];
                const mapScore = [0.42, 0.58, 0.69, 0.76, 0.81, 0.83, 0.85, 0.86, 0.87, 0.88, 0.89, 0.89, 0.895, 0.896, 0.896];

                chartObjects['about'] = new Chart(evalCanvas, {
                    type: 'line',
                    data: {
                        labels: epochs,
                        datasets: [
                            {
                                label: 'Training Loss (GIoU)',
                                data: trainLoss,
                                borderColor: '#ef4444',
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                yAxisID: 'y'
                            },
                            {
                                label: 'Model mAP@0.5',
                                data: mapScore,
                                borderColor: '#10b981',
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                grid: { color: gridColor },
                                ticks: { color: textColor },
                                title: { display: true, text: 'Training Epochs', color: textColor }
                            },
                            y: {
                                grid: { color: gridColor },
                                ticks: { color: textColor },
                                title: { display: true, text: 'Loss Value', color: textColor }
                            },
                            y1: {
                                position: 'right',
                                grid: { drawOnChartArea: false },
                                ticks: { color: textColor },
                                title: { display: true, text: 'mAP Score', color: textColor },
                                min: 0,
                                max: 1.0
                            }
                        }
                    }
                });
            }
        }

        if (tabId === 'modelinfo') {
            const lossCanvas = document.getElementById('modelLossChart');
            if (lossCanvas) {
                const epochs = Array.from({ length: 15 }, (_, i) => (i + 1) * 10);
                const giouLoss = [0.85, 0.62, 0.48, 0.39, 0.32, 0.28, 0.24, 0.21, 0.19, 0.17, 0.15, 0.14, 0.13, 0.12, 0.11];
                const classLoss = [1.25, 0.94, 0.72, 0.58, 0.47, 0.39, 0.33, 0.28, 0.24, 0.21, 0.19, 0.17, 0.15, 0.14, 0.13];

                chartObjects['modelinfo'] = new Chart(lossCanvas, {
                    type: 'line',
                    data: {
                        labels: epochs,
                        datasets: [
                            {
                                label: 'Bounding Box Loss (GIoU)',
                                data: giouLoss,
                                borderColor: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                borderWidth: 2.5,
                                fill: true,
                                tension: 0.35
                            },
                            {
                                label: 'Classification Loss (CLS)',
                                data: classLoss,
                                borderColor: '#2563eb',
                                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                                borderWidth: 2.5,
                                fill: true,
                                tension: 0.35
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: { color: textColor }
                            }
                        },
                        scales: {
                            x: {
                                grid: { color: gridColor },
                                ticks: { color: textColor },
                                title: { display: true, text: 'Training Epochs', color: textColor }
                            },
                            y: {
                                grid: { color: gridColor },
                                ticks: { color: textColor },
                                title: { display: true, text: 'Loss Value', color: textColor }
                            }
                        }
                    }
                });
            }
        }
    }

        // Modern real-time backend-polling progress radar loader
        function showRadarLoading() {
            const overlay = document.getElementById('radarLoadingOverlay');
            overlay.style.display = 'flex';

            let lastProgress = 0;
            const pollInterval = setInterval(() => {
                fetch('/analysis-progress')
                    .then(res => res.json())
                    .then(data => {
                        const progress = data.progress;
                        if (progress > lastProgress) {
                            for (let step = lastProgress + 1; step <= progress; step++) {
                                const currentCheck = document.getElementById('check-step' + step);
                                if (currentCheck) {
                                    currentCheck.querySelector('.chk-status').innerText = '\u2705';
                                    currentCheck.classList.remove('active');
                                }
                                const nextCheck = document.getElementById('check-step' + (step + 1));
                                if (nextCheck && step < 5) {
                                    nextCheck.classList.add('active');
                                    nextCheck.querySelector('.chk-status').innerText = '\uD83D\uDD04';
                                }
                            }
                            lastProgress = progress;
                        }
                        if (progress >= 6) {
                            clearInterval(pollInterval);
                            overlay.style.display = 'none';
                        }
                    })
                    .catch(err => {
                        console.error("Progress polling error:", err);
                    });
            }, 800);
        }

        // FIX: Always hide the loading overlay on page restore from bfcache.
        // This prevents the overlay from blocking sidebar clicks after detection.
        window.addEventListener('pageshow', function(event) {
            const overlay = document.getElementById('radarLoadingOverlay');
            if (overlay) overlay.style.display = 'none';
        });

        function fetchApiStatus() {
            const statuses = ['yolo', 'mongodb', 'weather', 'aqi'];
            statuses.forEach(api => {
                const container = document.getElementById('status-' + api);
                if (container) {
                    container.innerHTML = `<span style="color:var(--text-muted); font-size:11px;">⏳ Pinging...</span>`;
                }
            });

            fetch('/api-status')
                .then(res => res.json())
                .then(data => {
                    statuses.forEach(api => {
                        const container = document.getElementById('status-' + api);
                        if (container && data[api]) {
                            const statusObj = data[api];
                            const isOnline = statusObj.status === 'online';
                            const dotColor = isOnline ? '#10b981' : '#ef4444';

                            container.innerHTML = `
                            <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:8px;">
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${dotColor}; box-shadow: 0 0 6px ${dotColor}"></span>
                                    <span style="font-size:11px; font-weight:700; color: ${isOnline ? '#10b981' : '#ef4444'}; text-transform:uppercase;">${statusObj.status}</span>
                                </div>
                                <span style="font-size:11px; font-weight:700; color:var(--text-muted); font-family:var(--font-mono)">${statusObj.latency_ms > 0 ? statusObj.latency_ms + 'ms' : '-'}</span>
                            </div>
                        `;
                            container.title = statusObj.message;
                        }
                    });
                })
                .catch(err => {
                    console.error("Failed to fetch API status:", err);
                });
        }

        function refreshChartsTheme() {
            const activeTab = window.location.pathname.replace('/', '') || 'overview';
            mountAllCharts(activeTab);
        }

        window.saveNewCoordinates = function (lat, lng) {
            fetch('/set-coordinates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ latitude: lat, longitude: lng })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.reload();
                    } else {
                        alert("Failed to update inspection coordinates: " + data.message);
                    }
                })
                .catch(err => {
                    console.error("AJAX coordinate sync error:", err);
                    alert("Error syncing coordinates with backend.");
                });
        };


        // ================= LIVE DRONE DASHBOARD SYSTEM =================
        let dronePollInterval = null;
        let droneHudRaf = null;
        let droneHudActive = false;
        let droneData = null;
        let lockedTreeId = null;
        let cachedTreeDetail = null;
        let droneCharts = { health: null, species: null, detections: null, diseases: null };
        let shownToastIds = new Set();
        let prevAlerts = {
            low_battery: false,
            weak_signal: false,
            obstacle_detected: false,
            high_wind_warning: false
        };

        // Low-latency Audio Synthesizer utilizing Web Audio API
        let audioCtx = null;
        function playSynthBeep(frequency, duration, type = "sine") {
            try {
                if (!audioCtx) {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

                gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            } catch (e) {
                console.warn("Web Audio API not supported or blocked by user gesture:", e);
            }
        }

        // Interactive Toast Notification System
        function showDroneToast(alertObj) {
            if (shownToastIds.has(alertObj.id)) return;
            shownToastIds.add(alertObj.id);

            // Sound synthesiser triggers depending on alert severity
            if (alertObj.id === 'alert_cut') {
                // Critical tree cutting event: dual alert tones
                playSynthBeep(900, 0.15, "sawtooth");
                setTimeout(() => playSynthBeep(600, 0.15, "sawtooth"), 150);
                setTimeout(() => playSynthBeep(900, 0.15, "sawtooth"), 300);
            } else if (alertObj.id === 'alert_fallen') {
                // Structural crash
                playSynthBeep(700, 0.12, "triangle");
                setTimeout(() => playSynthBeep(500, 0.12, "triangle"), 120);
                setTimeout(() => playSynthBeep(300, 0.25, "triangle"), 240);
            } else if (alertObj.id === 'alert_health') {
                // Foliage warning beep
                playSynthBeep(500, 0.25, "sine");
            } else if (alertObj.type === 'critical') {
                // Standard critical alarms
                playSynthBeep(880, 0.15, "sine");
                setTimeout(() => playSynthBeep(880, 0.15, "sine"), 200);
            } else {
                // Warnings
                playSynthBeep(550, 0.2, "sine");
            }

            const container = document.getElementById('droneToastContainer');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `drone-toast ${alertObj.type || 'warning'}`;
            toast.innerHTML = `
            <div class="drone-toast-title">
                <span>${alertObj.type === 'critical' ? '🚨' : '⚠️'}</span>
                <span>${alertObj.title}</span>
            </div>
            <div class="drone-toast-desc">${alertObj.desc}</div>
            <div style="font-size:10px; color:var(--text-muted); margin-top:4px; text-align:right;">${alertObj.timestamp || ''}</div>
        `;

            container.appendChild(toast);
            toast.offsetHeight; // Force reflow
            toast.classList.add('show');

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 450);
            }, 6000);
        }

        // Process telemetry warnings
        function checkTelemetryAlerts(alerts) {
            if (!alerts) return;

            if (alerts.low_battery && !prevAlerts.low_battery) {
                showDroneToast({
                    id: 'alt_low_bat',
                    title: 'Critical Battery Level',
                    desc: 'Battery is below 20%. Autonomous Return Home (RTL) triggered.',
                    type: 'critical',
                    timestamp: new Date().toLocaleTimeString()
                });
            }
            if (alerts.weak_signal && !prevAlerts.weak_signal) {
                showDroneToast({
                    id: 'alt_weak_sig',
                    title: 'Weak RF Signal Warning',
                    desc: 'Telemetry links RSSI degraded below 40%.',
                    type: 'warning',
                    timestamp: new Date().toLocaleTimeString()
                });
            }
            if (alerts.obstacle_detected && !prevAlerts.obstacle_detected) {
                showDroneToast({
                    id: 'alt_obstacle',
                    title: 'Lidar Obstacle Detected',
                    desc: 'Flight corridor blocked by obstacle at 2.4m. Decelerating.',
                    type: 'critical',
                    timestamp: new Date().toLocaleTimeString()
                });
            }
            if (alerts.high_wind_warning && !prevAlerts.high_wind_warning) {
                showDroneToast({
                    id: 'alt_high_wind',
                    title: 'High Wind Warning',
                    desc: 'Crosswinds exceeding safety threshold. Controller adjusting Pitch.',
                    type: 'warning',
                    timestamp: new Date().toLocaleTimeString()
                });
            }

            prevAlerts = { ...alerts };
        }

        // Chart.js Live Dashboard Widgets
        function initDroneCharts() {
            const isDark = document.body.classList.contains('dark');
            const textColor = isDark ? '#9ca3af' : '#64748b';
            const gridColor = isDark ? '#374151' : '#e2e8f0';

            // 1. Health distribution
            const ctxHealth = document.getElementById('chartDroneHealth');
            if (ctxHealth) {
                if (droneCharts.health) droneCharts.health.destroy();
                droneCharts.health = new Chart(ctxHealth, {
                    type: 'doughnut',
                    data: {
                        labels: ['Healthy', 'Moderate', 'Unhealthy', 'Diseased', 'Dead'],
                        datasets: [{
                            data: [0, 0, 0, 0, 0],
                            backgroundColor: ['#10b981', '#f59e0b', '#d97706', '#dc2626', '#7f1d1d'],
                            borderWidth: 1.5,
                            borderColor: isDark ? '#111827' : '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { color: textColor, font: { size: 9, family: 'Inter' }, boxWidth: 10 }
                            }
                        },
                        cutout: '65%'
                    }
                });
            }

            // 2. Species composition
            const ctxSpecies = document.getElementById('chartDroneSpecies');
            if (ctxSpecies) {
                if (droneCharts.species) droneCharts.species.destroy();
                droneCharts.species = new Chart(ctxSpecies, {
                    type: 'bar',
                    data: {
                        labels: ['Neem', 'Banyan', 'Peepal', 'Mango', 'Ashoka', 'Palm', 'Coconut'],
                        datasets: [{
                            label: 'Trees Scanned',
                            data: [0, 0, 0, 0, 0, 0, 0],
                            backgroundColor: 'rgba(16, 185, 129, 0.75)',
                            borderColor: '#10b981',
                            borderWidth: 1,
                            borderRadius: 3
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: { grid: { color: gridColor }, ticks: { color: textColor, precision: 0, font: { size: 9 } } },
                            y: { grid: { display: false }, ticks: { color: textColor, font: { size: 9 } } }
                        }
                    }
                });
            }

            // 3. Detection trend
            const ctxDetections = document.getElementById('chartDroneDetections');
            if (ctxDetections) {
                if (droneCharts.detections) droneCharts.detections.destroy();
                droneCharts.detections = new Chart(ctxDetections, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Total Scanned',
                            data: [],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3,
                            pointRadius: 1.5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } },
                            y: { grid: { color: gridColor }, ticks: { color: textColor, precision: 0, font: { size: 8 } } }
                        }
                    }
                });
            }

            // 4. Disease trend
            const ctxDiseases = document.getElementById('chartDroneDiseases');
            if (ctxDiseases) {
                if (droneCharts.diseases) droneCharts.diseases.destroy();
                droneCharts.diseases = new Chart(ctxDiseases, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Diseased/Dead',
                            data: [],
                            borderColor: '#dc2626',
                            backgroundColor: 'rgba(220, 38, 38, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3,
                            pointRadius: 1.5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } },
                            y: { grid: { color: gridColor }, ticks: { color: textColor, precision: 0, font: { size: 8 } } }
                        }
                    }
                });
            }
        }

        function updateDroneCharts(data) {
            if (!data || !droneCharts.health || !droneCharts.species || !droneCharts.detections || !droneCharts.diseases) return;

            // Update health breakdown doughnut
            const hData = data.charts_data.health;
            droneCharts.health.data.datasets[0].data = [
                hData.Healthy || 0,
                hData.Moderate || 0,
                hData.Unhealthy || 0,
                hData.Diseased || 0,
                hData.Dead || 0
            ];
            droneCharts.health.update();

            // Update species horizontal bar
            const sData = data.charts_data.species;
            droneCharts.species.data.datasets[0].data = [
                sData.Neem || 0,
                sData.Banyan || 0,
                sData.Peepal || 0,
                sData.Mango || 0,
                sData.Ashoka || 0,
                sData.Palm || 0,
                sData.Coconut || 0
            ];
            droneCharts.species.update();

            // Accumulate rolling historical timeseries trends if mission active
            if (data.active && !data.paused) {
                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const labels = droneCharts.detections.data.labels;

                if (labels.length === 0 || labels[labels.length - 1] !== timestamp) {
                    labels.push(timestamp);
                    droneCharts.detections.data.datasets[0].data.push(data.vision_stats.total_scanned);

                    droneCharts.diseases.data.labels.push(timestamp);
                    droneCharts.diseases.data.datasets[0].data.push(data.vision_stats.diseased + data.vision_stats.dead);

                    // Keep history capped at 10 intervals
                    if (labels.length > 10) {
                        labels.shift();
                        droneCharts.detections.data.datasets[0].data.shift();
                        droneCharts.diseases.data.labels.shift();
                        droneCharts.diseases.data.datasets[0].data.shift();
                    }

                    droneCharts.detections.update();
                    droneCharts.diseases.update();
                }
            }
        }

        function clearDroneChartsTrends() {
            if (droneCharts.detections) {
                droneCharts.detections.data.labels = [];
                droneCharts.detections.data.datasets[0].data = [];
                droneCharts.detections.update();
            }
            if (droneCharts.diseases) {
                droneCharts.diseases.data.labels = [];
                droneCharts.diseases.data.datasets[0].data = [];
                droneCharts.diseases.update();
            }
        }

        // Target Selection Inspector & AI Explainability update functions
        function handleHudCanvasClick(e) {
            if (!droneData || !droneData.online || !droneData.scanned_trees) return;

            const rect = this.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;

            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            let clickedTree = null;
            for (let tree of droneData.scanned_trees) {
                const halfW = tree.width / 2;
                const halfH = tree.height / 2;
                if (mouseX >= tree.canvas_x - halfW && mouseX <= tree.canvas_x + halfW &&
                    mouseY >= tree.canvas_y - halfH && mouseY <= tree.canvas_y + halfH) {
                    clickedTree = tree;
                    break;
                }
            }

            if (clickedTree) {
                lockedTreeId = clickedTree.id;
                playSynthBeep(850, 0.08, "sine");
                updateTreeDetailCard(clickedTree);
            }
        }

        function updateTreeDetailCard(tree) {
            if (!tree) return;
            cachedTreeDetail = tree;

            const popupEl = document.getElementById('treeDetailPopup');
            const bodyEl = document.getElementById('treeDetailBody');
            const explainEl = document.getElementById('aiExplainabilityCard');

            if (!popupEl || !bodyEl || !explainEl) return;

            popupEl.querySelector('h3').innerHTML = `<span>🔍</span> Target Inspector: ${tree.id}`;

            let healthColor = 'var(--primary)';
            if (tree.health === 'Moderate') healthColor = 'var(--accent-orange)';
            if (tree.health === 'Unhealthy') healthColor = 'var(--accent-orange)';
            if (tree.health === 'Diseased') healthColor = 'var(--accent-red)';
            if (tree.health === 'Dead') healthColor = '#991b1b';

            const inView = droneData && droneData.scanned_trees.some(t => t.id === tree.id);
            const statusLabel = inView ?
                `<span style="color:#10b981; font-weight:800; font-family:var(--font-mono)">● IN VIEW (HUD SCANNED)</span>` :
                `<span style="color:var(--text-muted); font-weight:700; font-family:var(--font-mono)">▲ OUT OF VIEW (SIGNAL LOCK)</span>`;

            bodyEl.innerHTML = `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span style="color:var(--text-muted); font-weight:600;">Status</span>
                <span>${statusLabel}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span style="color:var(--text-muted); font-weight:600;">Species Name</span>
                <span style="font-weight:700; color:var(--text-main);">${tree.species}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span style="color:var(--text-muted); font-weight:600;">Foliage Health</span>
                <span style="font-weight:800; color:${healthColor};">${tree.health}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span style="color:var(--text-muted); font-weight:600;">Confidence score</span>
                <span style="font-weight:700; font-family:var(--font-mono);">${(tree.conf * 100).toFixed(0)}%</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span style="color:var(--text-muted); font-weight:600;">Canopy Diameter</span>
                <span style="font-weight:700;">${tree.canopy.toFixed(1)} m</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span style="color:var(--text-muted); font-weight:600;">GPS Coordinates</span>
                <span style="font-family:var(--font-mono); font-size:12px;">${tree.lat.toFixed(6)}, ${tree.lng.toFixed(6)}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-muted); font-weight:600;">Mapped Diseases</span>
                <span style="font-weight:600; color:${tree.diseases.length > 0 ? 'var(--accent-red)' : 'var(--primary)'}">
                    ${tree.diseases.length > 0 ? tree.diseases.join(', ') : 'None'}
                </span>
            </div>
        `;

            // Update explainability bars
            explainEl.style.display = 'block';

            let expVigor = 95;
            let expTexture = 8;
            let reasoning = "";

            if (tree.health === 'Healthy') {
                expVigor = 92;
                expTexture = 8;
                reasoning = "Foliage reflectances indicate optimal chlorophyll density. HSV greenness indexes align with healthy mature canopies.";
            } else if (tree.health === 'Moderate') {
                expVigor = 78;
                expTexture = 20;
                reasoning = "Slight chlorosis detected at crown margins. Evapotranspiration indices normal.";
            } else if (tree.health === 'Unhealthy') {
                expVigor = 52;
                expTexture = 45;
                reasoning = "Significant canopy discolouration present. Reduced carbon absorption capability calculated.";
            } else if (tree.health === 'Diseased') {
                expVigor = 34;
                expTexture = 75;
                reasoning = "Severe necrosis and spotting detected on leaves. Infestation risks or pest damage warning active.";
            } else if (tree.health === 'Dead') {
                expVigor = 8;
                expTexture = 92;
                reasoning = "Complete loss of foliage. Structural failure risk detected. Biomass is dry/dead.";
            }

            let expDensity = Math.min(99, Math.max(20, Math.floor(tree.canopy * 4.5)));

            document.getElementById('expVigorVal').innerText = `${expVigor}%`;
            document.getElementById('expVigorBar').style.width = `${expVigor}%`;

            const vigorBar = document.getElementById('expVigorBar');
            vigorBar.className = 'explain-bar-fill';
            if (expVigor < 35) vigorBar.classList.add('red');
            else if (expVigor < 65) vigorBar.classList.add('orange');

            document.getElementById('expDensityVal').innerText = `${expDensity}%`;
            document.getElementById('expDensityBar').style.width = `${expDensity}%`;

            document.getElementById('expTextureVal').innerText = `${expTexture}%`;
            document.getElementById('expTextureBar').style.width = `${expTexture}%`;

            const textureBar = document.getElementById('expTextureBar');
            textureBar.className = 'explain-bar-fill';
            if (expTexture > 60) textureBar.classList.add('red');
            else if (expTexture > 35) textureBar.classList.add('orange');

            document.getElementById('expReasoningText').innerText = reasoning;
        }

        function clearTreeDetailCard() {
            lockedTreeId = null;
            cachedTreeDetail = null;

            const popupEl = document.getElementById('treeDetailPopup');
            const bodyEl = document.getElementById('treeDetailBody');
            const explainEl = document.getElementById('aiExplainabilityCard');

            if (popupEl) popupEl.querySelector('h3').innerHTML = `<span>🔍</span> Target Inspector: TR_YOLO_---`;
            if (bodyEl) {
                bodyEl.innerHTML = `
                <div style="text-align:center; padding:20px; color:var(--text-muted);">
                    Click on any detected tree bounding box in the camera stream to inspect its live AI classification details.
                </div>
            `;
            }
            if (explainEl) explainEl.style.display = 'none';
        }

        function initDroneHud() {
            droneHudActive = true;

            setTimeout(initDroneCharts, 50);

            if (!dronePollInterval) {
                pollDroneTelemetry();
                dronePollInterval = setInterval(pollDroneTelemetry, 2000);
            }

            const canvas = document.getElementById('droneHudCanvas');
            if (canvas) {
                canvas.width = 640;
                canvas.height = 360;
                drawDroneHudLoop();

                canvas.addEventListener('click', handleHudCanvasClick);
            }
        }

        function stopDroneHud() {
            droneHudActive = false;
            if (dronePollInterval) {
                clearInterval(dronePollInterval);
                dronePollInterval = null;
            }
            if (droneHudRaf) {
                cancelAnimationFrame(droneHudRaf);
                droneHudRaf = null;
            }
            const canvas = document.getElementById('droneHudCanvas');
            if (canvas) {
                canvas.removeEventListener('click', handleHudCanvasClick);
            }
        }

        function pollDroneTelemetry() {
            fetch('/api/drone/telemetry')
                .then(res => res.json())
                .then(data => {
                    droneData = data;
                    updateDroneTelemetryUI(data);
                    updateDroneCharts(data);
                    checkTelemetryAlerts(data.alerts);

                    if (data.vision_alerts) {
                        data.vision_alerts.forEach(alert => showDroneToast(alert));
                    }

                    if (lockedTreeId) {
                        const matchedTree = data.scanned_trees.find(t => t.id === lockedTreeId);
                        if (matchedTree) {
                            updateTreeDetailCard(matchedTree);
                        } else if (cachedTreeDetail) {
                            updateTreeDetailCard(cachedTreeDetail);
                        }
                    }
                })
                .catch(err => console.error("Telemetry fetch error:", err));
        }

        function updateDroneTelemetryUI(data) {
            if (!data) return;

            // Online / Offline Status
            const statusEl = document.getElementById('telStatus');
            if (statusEl) {
                if (data.online) {
                    statusEl.innerHTML = `<span style="color:#10b981; font-weight:800; box-shadow: 0 0 8px rgba(16,185,129,0.3); padding: 2px 8px; border-radius: 4px; background: rgba(16,185,129,0.1);">ONLINE</span>`;
                } else {
                    statusEl.innerHTML = `<span style="color:#ef4444; font-weight:800; padding: 2px 8px; border-radius: 4px; background: rgba(239,68,68,0.1);">OFFLINE</span>`;
                }
            }

            // Battery
            const batteryTextEl = document.getElementById('telBattery');
            const batteryBarEl = document.getElementById('telBatteryBar');
            if (batteryTextEl) batteryTextEl.innerText = `${data.telemetry.battery.toFixed(1)} %`;
            if (batteryBarEl) {
                batteryBarEl.style.width = `${data.telemetry.battery}%`;
                batteryBarEl.className = 'battery-bar-fill';
                if (data.telemetry.battery <= 20) {
                    batteryBarEl.classList.add('critical');
                } else if (data.telemetry.battery <= 50) {
                    batteryBarEl.classList.add('warning');
                }
            }

            // Altitude, Speed, Signal, Mode
            document.getElementById('telAltitude').innerText = `${data.telemetry.altitude.toFixed(1)} m`;
            document.getElementById('telSpeed').innerText = `${data.telemetry.speed.toFixed(1)} km/h`;
            document.getElementById('telGps').innerHTML = `Lat: ${data.telemetry.latitude.toFixed(6)}° &nbsp; Lng: ${data.telemetry.longitude.toFixed(6)}°`;
            document.getElementById('telSignal').innerText = `${data.telemetry.signal_strength} %`;
            document.getElementById('telMode').innerText = data.mode;

            // Mission Progress
            document.getElementById('misProgressText').innerText = `${data.mission.progress.toFixed(1)}%`;
            document.getElementById('misProgressBar').style.width = `${data.mission.progress}%`;
            document.getElementById('misArea').innerText = `${data.mission.area_covered} m²`;
            document.getElementById('misDist').innerText = `${data.mission.remaining_distance} m`;

            // Mission ETA
            const etaSeconds = data.mission.eta_seconds;
            if (etaSeconds > 0) {
                const m = Math.floor(etaSeconds / 60);
                const s = etaSeconds % 60;
                document.getElementById('misEta').innerText = `${m}m ${s}s`;
            } else {
                document.getElementById('misEta').innerText = data.active ? "Descent..." : "Complete";
            }

            // Camera Status & Record Button
            const recDot = document.getElementById('recDot');
            const recordLabel = document.getElementById('recordLabel');
            const recordBtn = document.getElementById('btnDroneRecord');
            if (data.camera_status === "RECORDING") {
                recDot.style.display = 'inline-block';
                const m = Math.floor(data.record_duration / 60);
                const s = data.record_duration % 60;
                const timer = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                recordLabel.innerText = ` REC ${timer}`;
                recordBtn.classList.add('btn-active-danger');
            } else {
                recDot.style.display = 'none';
                recordLabel.innerText = `⏺ Record`;
                recordBtn.classList.remove('btn-active-danger');
            }

            // Alerts
            updateAlertStatusItem('altLowBattery', data.alerts.low_battery, 'critical');
            updateAlertStatusItem('altWeakSignal', data.alerts.weak_signal, 'warning');
            updateAlertStatusItem('altObstacle', data.alerts.obstacle_detected, 'critical');
            updateAlertStatusItem('altHighWind', data.alerts.high_wind_warning, 'warning');

            // Logs update
            const consoleEl = document.getElementById('droneLogsConsole');
            if (consoleEl && data.logs) {
                const isScrolledToBottom = consoleEl.scrollHeight - consoleEl.clientHeight <= consoleEl.scrollTop + 30;

                consoleEl.innerHTML = data.logs.map(log => {
                    let colorClass = 'log-info';
                    if (log.type === 'success') colorClass = 'log-success';
                    if (log.type === 'warning') colorClass = 'log-warning';
                    if (log.type === 'error') colorClass = 'log-error';

                    return `<div class="log-row ${colorClass}">
                    <span class="log-time">[${log.timestamp}]</span>
                    <span>${log.message}</span>
                </div>`;
                }).join('');

                if (isScrolledToBottom) {
                    consoleEl.scrollTop = consoleEl.scrollHeight;
                }
            }

            // Button highlight toggle based on active status
            const startBtn = document.getElementById('btnDroneStart');
            const pauseBtn = document.getElementById('btnDronePause');

            if (data.active) {
                if (data.paused) {
                    startBtn.classList.remove('btn-active-run');
                    pauseBtn.classList.add('btn-active-pause');
                    pauseBtn.innerText = '▶ Resume';
                } else {
                    startBtn.classList.add('btn-active-run');
                    startBtn.innerHTML = '<span>▶</span> Flying...';
                    pauseBtn.classList.remove('btn-active-pause');
                    pauseBtn.innerText = '⏸ Pause';
                }
            } else {
                startBtn.classList.remove('btn-active-run');
                startBtn.innerHTML = '<span>▶</span> Start Mission';
                pauseBtn.classList.remove('btn-active-pause');
                pauseBtn.innerText = '⏸ Pause';
            }

            // Live Vision statistics
            document.getElementById('statTotalScanned').innerText = data.vision_stats.total_scanned;
            document.getElementById('statHealthy').innerText = data.vision_stats.healthy;
            document.getElementById('statDiseased').innerText = data.vision_stats.diseased + data.vision_stats.dead;
            document.getElementById('statAccuracy').innerText = `${data.vision_stats.accuracy.toFixed(1)}%`;
            document.getElementById('statFps').innerText = data.vision_stats.fps.toFixed(1);
            document.getElementById('statCameraState').innerText = data.camera_status;

            const cameraStateEl = document.getElementById('statCameraState');
            if (data.camera_status === 'RECORDING') {
                cameraStateEl.style.color = 'var(--accent-red)';
            } else {
                cameraStateEl.style.color = 'var(--primary)';
            }
        }

        function updateAlertStatusItem(id, isActive, type) {
            const el = document.getElementById(id);
            if (!el) return;
            el.className = 'alert-status-item';
            if (isActive) {
                el.classList.add(type === 'critical' ? 'active-critical' : 'active-warning');
            } else {
                el.classList.add('inactive');
            }
        }

        function sendDroneCommand(action) {
            fetch('/api/drone/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (action === 'reset') {
                            clearTreeDetailCard();
                            clearDroneChartsTrends();
                            shownToastIds.clear();
                        }
                        pollDroneTelemetry();
                    } else {
                        alert("Control Command Failed: " + data.message);
                    }
                })
                .catch(err => console.error("Control request error:", err));
        }

        function toggleCameraRecord() {
            sendDroneCommand('record_toggle');
        }

        function captureDroneScreenshot() {
            const canvas = document.getElementById('droneHudCanvas');
            if (!canvas) return;
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.download = `drone_stream_capture_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        }

        function toggleStreamFullscreen() {
            const container = document.getElementById('droneStreamContainer');
            if (!container) return;
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(err => {
                    console.error(`Error enabling fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }

        function drawDroneHudLoop() {
            if (!droneHudActive) return;

            const canvas = document.getElementById('droneHudCanvas');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;

            // Clear canvas
            ctx.clearRect(0, 0, w, h);

            if (!droneData || !droneData.online) {
                // Draw static screen offline
                ctx.fillStyle = '#0f131a';
                ctx.fillRect(0, 0, w, h);

                // Draw analog static noise lines
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                for (let i = 0; i < h; i += 3) {
                    if (Math.random() > 0.4) {
                        ctx.fillRect(0, i + Math.floor(Math.random() * 2), w, 1);
                    }
                }

                // Text indicator
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 14px "JetBrains Mono", var(--font-mono)';
                ctx.textAlign = 'center';
                ctx.fillText("● SYSTEM OFFLINE // AWAITING STREAM CONNECT", w / 2, h / 2);

                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(15, 15, w - 30, h - 30);

                droneHudRaf = requestAnimationFrame(drawDroneHudLoop);
                return;
            }

            // Drone is online - draw HUD overlay
            // 1. Draw a dark camera scan grid back panel
            ctx.fillStyle = '#05070a';
            ctx.fillRect(0, 0, w, h);

            // Vector grid scan terrain representation
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
            ctx.lineWidth = 1;

            // Panning grid lines to simulate drone motion
            const isFlying = droneData.active && !droneData.paused;
            const panX = isFlying ? (Date.now() / 20) % 40 : 0;
            const panY = isFlying ? (Date.now() / 15) % 40 : 0;

            for (let x = -40; x < w + 40; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x + panX, 0);
                ctx.lineTo(x + panX, h);
                ctx.stroke();
            }
            for (let y = -40; y < h + 40; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y + panY);
                ctx.lineTo(w, y + panY);
                ctx.stroke();
            }

            // Draw simulated tree canopies on the terrain first (background layer)
            if (droneData.scanned_trees && droneData.scanned_trees.length > 0) {
                for (let tree of droneData.scanned_trees) {
                    const tx = tree.canvas_x;
                    const ty = tree.canvas_y;
                    const radius = tree.canopy * 2.5;

                    let circleColor = 'rgba(16, 185, 129, 0.12)';
                    let strokeColor = 'rgba(16, 185, 129, 0.25)';

                    if (tree.health === 'Moderate') {
                        circleColor = 'rgba(245, 158, 11, 0.12)';
                        strokeColor = 'rgba(245, 158, 11, 0.25)';
                    } else if (tree.health === 'Unhealthy') {
                        circleColor = 'rgba(217, 119, 6, 0.12)';
                        strokeColor = 'rgba(217, 119, 6, 0.25)';
                    } else if (tree.health === 'Diseased') {
                        circleColor = 'rgba(220, 38, 38, 0.12)';
                        strokeColor = 'rgba(220, 38, 38, 0.25)';
                    } else if (tree.health === 'Dead') {
                        circleColor = 'rgba(153, 27, 27, 0.12)';
                        strokeColor = 'rgba(153, 27, 27, 0.25)';
                    }

                    ctx.fillStyle = circleColor;
                    ctx.beginPath();
                    ctx.arc(tx, ty, radius, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            // Draw green camera filter sweep line
            const sweepY = (Date.now() / 8) % h;
            ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
            ctx.fillRect(0, sweepY, w, 2);

            // Dynamic noise parameters based on alerts
            let rollNoise = Math.sin(Date.now() / 500) * 0.02;
            let pitchNoise = Math.cos(Date.now() / 700) * 4;

            if (droneData.alerts.high_wind_warning) {
                rollNoise = Math.sin(Date.now() / 150) * 0.06;
                pitchNoise = Math.cos(Date.now() / 200) * 12;
            }

            // Save ctx context for transformation matrix
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.rotate(rollNoise);

            // 2. Draw Pitch Ladder (Artificial Horizon)
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            // Left horizon bar
            ctx.moveTo(-100, pitchNoise);
            ctx.lineTo(-40, pitchNoise);
            ctx.lineTo(-40, pitchNoise + 8);
            // Right horizon bar
            ctx.moveTo(100, pitchNoise);
            ctx.lineTo(40, pitchNoise);
            ctx.lineTo(40, pitchNoise + 8);
            ctx.stroke();

            // Pitch degree indicator brackets
            ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
            ctx.font = '9px "JetBrains Mono", var(--font-mono)';
            ctx.textAlign = 'right';
            ctx.fillText("10", -45, -30 + pitchNoise);
            ctx.fillText("-10", -45, 30 + pitchNoise);
            ctx.textAlign = 'left';
            ctx.fillText("10", 45, -30 + pitchNoise);
            ctx.fillText("-10", 45, 30 + pitchNoise);

            ctx.beginPath();
            // Pitch 10 lines
            ctx.moveTo(-70, -30 + pitchNoise); ctx.lineTo(-50, -30 + pitchNoise);
            ctx.moveTo(50, -30 + pitchNoise); ctx.lineTo(70, -30 + pitchNoise);
            // Pitch -10 lines
            ctx.moveTo(-70, 30 + pitchNoise); ctx.lineTo(-50, 30 + pitchNoise);
            ctx.moveTo(50, 30 + pitchNoise); ctx.lineTo(70, 30 + pitchNoise);
            ctx.stroke();

            ctx.restore();

            // 3. Central HUD square reticle
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(w / 2 - 15, h / 2 - 8); ctx.lineTo(w / 2 - 15, h / 2 - 15); ctx.lineTo(w / 2 - 8, h / 2 - 15);
            ctx.moveTo(w / 2 + 15, h / 2 - 8); ctx.lineTo(w / 2 + 15, h / 2 - 15); ctx.lineTo(w / 2 + 8, h / 2 - 15);
            ctx.moveTo(w / 2 - 15, h / 2 + 8); ctx.lineTo(w / 2 - 15, h / 2 + 15); ctx.lineTo(w / 2 - 8, h / 2 + 15);
            ctx.moveTo(w / 2 + 15, h / 2 + 8); ctx.lineTo(w / 2 + 15, h / 2 + 15); ctx.lineTo(w / 2 + 8, h / 2 + 15);
            ctx.stroke();

            // Center cross point
            ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
            ctx.fillRect(w / 2 - 1, h / 2 - 1, 2, 2);

            // 4. Speed tape (Left border)
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(60, 60); ctx.lineTo(60, h - 60);
            ctx.stroke();
            // Speed pointer
            const spdVal = droneData.telemetry.speed;
            ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.beginPath();
            ctx.moveTo(60, h / 2 - 12); ctx.lineTo(25, h / 2 - 12); ctx.lineTo(25, h / 2 + 12); ctx.lineTo(60, h / 2 + 12); ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px "JetBrains Mono", var(--font-mono)';
            ctx.textAlign = 'center';
            ctx.fillText(spdVal.toFixed(0), 42, h / 2 + 3.5);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.font = '8px "JetBrains Mono", var(--font-mono)';
            ctx.fillText("KMH", 42, h / 2 - 16);

            // 5. Altitude tape (Right border)
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.beginPath();
            ctx.moveTo(w - 60, 60); ctx.lineTo(w - 60, h - 60);
            ctx.stroke();
            // Altitude pointer
            const altVal = droneData.telemetry.altitude;
            ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.beginPath();
            ctx.moveTo(w - 60, h / 2 - 12); ctx.lineTo(w - 25, h / 2 - 12); ctx.lineTo(w - 25, h / 2 + 12); ctx.lineTo(w - 60, h / 2 + 12); ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px "JetBrains Mono", var(--font-mono)';
            ctx.fillText(altVal.toFixed(1), w - 42, h / 2 + 3.5);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.font = '8px "JetBrains Mono", var(--font-mono)';
            ctx.fillText("ALT", w - 42, h / 2 - 16);

            // 6. Compass Tape at Top
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.beginPath();
            ctx.moveTo(100, 30); ctx.lineTo(w - 100, 30);
            ctx.stroke();
            // Interpolate heading based on waypoints / simulated rotation
            const heading = (Date.now() / 200) % 360;
            ctx.save();
            // Clip to compass region
            ctx.beginPath();
            ctx.rect(100, 0, w - 200, 40);
            ctx.clip();

            ctx.font = '9px "JetBrains Mono", var(--font-mono)';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';

            for (let angle = -180; angle < 180; angle += 15) {
                let relativeAngle = angle - heading;
                if (relativeAngle < -180) relativeAngle += 360;
                if (relativeAngle > 180) relativeAngle -= 360;

                const x = w / 2 + relativeAngle * 1.5;

                ctx.beginPath();
                ctx.moveTo(x, 30);
                if (angle % 30 === 0) {
                    ctx.lineTo(x, 22);
                    let label = angle;
                    if (angle < 0) label += 360;

                    if (label === 0) label = "N";
                    else if (label === 90) label = "E";
                    else if (label === 180) label = "S";
                    else if (label === 270) label = "W";
                    else label = String(label / 10).padStart(2, '0');

                    ctx.fillText(label, x, 18);
                } else {
                    ctx.lineTo(x, 26);
                }
                ctx.stroke();
            }
            ctx.restore();

            // Compass central pointer
            ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
            ctx.beginPath();
            ctx.moveTo(w / 2, 30); ctx.lineTo(w / 2 - 5, 36); ctx.lineTo(w / 2 + 5, 36); ctx.closePath();
            ctx.fill();

            // 7. Status HUD Text overlays (Corners)
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px "JetBrains Mono", var(--font-mono)';
            ctx.textAlign = 'left';

            // Top Left
            ctx.fillText(`SYS_MODE: ${droneData.mode}`, 20, 20);
            ctx.fillText(`BATTERY: ${droneData.telemetry.battery.toFixed(1)}%`, 20, 34);

            // Top Right
            ctx.textAlign = 'right';
            if (droneData.camera_status === "RECORDING") {
                ctx.fillStyle = '#ef4444';
                const m = Math.floor(droneData.record_duration / 60);
                const s = droneData.record_duration % 60;
                ctx.fillText(`● REC ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, w - 20, 20);
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.fillText("● STREAMING (LIVE)", w - 20, 20);
            }
            ctx.fillText(`Rssi: ${droneData.telemetry.signal_strength}%`, w - 20, 34);

            // Bottom Left
            ctx.textAlign = 'left';
            ctx.fillText(`LAT: ${droneData.telemetry.latitude.toFixed(6)}`, 20, h - 34);
            ctx.fillText(`LNG: ${droneData.telemetry.longitude.toFixed(6)}`, 20, h - 20);

            // Bottom Right
            ctx.textAlign = 'right';
            ctx.fillText("FPS: 60 / WebRTC", w - 20, h - 34);
            ctx.fillText(`Rangefinder: ${droneData.telemetry.altitude.toFixed(1)}m`, w - 20, h - 20);

            // --- NEW: Draw scanned trees bounding boxes & classification overlays ---
            if (droneData.scanned_trees && droneData.scanned_trees.length > 0) {
                for (let tree of droneData.scanned_trees) {
                    let boxColor = '#10b981'; // Green
                    if (tree.health === 'Moderate') boxColor = '#f59e0b';
                    if (tree.health === 'Unhealthy') boxColor = '#d97706';
                    if (tree.health === 'Diseased') boxColor = '#dc2626';
                    if (tree.health === 'Dead') boxColor = '#991b1b';

                    const tx = tree.canvas_x;
                    const ty = tree.canvas_y;
                    const boxW = tree.width;
                    const boxH = tree.height;

                    ctx.strokeStyle = boxColor;
                    ctx.lineWidth = lockedTreeId === tree.id ? 2.5 : 1.5;

                    if (lockedTreeId === tree.id) {
                        ctx.setLineDash([]);
                        ctx.strokeRect(tx - boxW / 2, ty - boxH / 2, boxW, boxH);

                        // Draw locking indicator corners
                        ctx.fillStyle = boxColor;
                        const cornerL = 6;
                        ctx.fillRect(tx - boxW / 2 - 2, ty - boxH / 2 - 2, cornerL, 2);
                        ctx.fillRect(tx - boxW / 2 - 2, ty - boxH / 2 - 2, 2, cornerL);

                        ctx.fillRect(tx + boxW / 2 + 2 - cornerL, ty - boxH / 2 - 2, cornerL, 2);
                        ctx.fillRect(tx + boxW / 2, ty - boxH / 2 - 2, 2, cornerL);

                        ctx.fillRect(tx - boxW / 2 - 2, ty + boxH / 2 - 2, 2, cornerL);
                        ctx.fillRect(tx - boxW / 2 - 2, ty + boxH / 2, cornerL, 2);

                        ctx.fillRect(tx + boxW / 2, ty + boxH / 2 - 2, 2, cornerL);
                        ctx.fillRect(tx + boxW / 2 + 2 - cornerL, ty + boxH / 2, cornerL, 2);
                    } else {
                        ctx.setLineDash([4, 4]);
                        ctx.strokeRect(tx - boxW / 2, ty - boxH / 2, boxW, boxH);
                    }
                    ctx.setLineDash([]);

                    // Draw species label
                    ctx.fillStyle = boxColor;
                    ctx.font = 'bold 9px "JetBrains Mono", var(--font-mono)';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${tree.species} ${(tree.conf * 100).toFixed(0)}%`, tx, ty - boxH / 2 - 5);

                    if (lockedTreeId === tree.id) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(tx - boxW / 4, ty); ctx.lineTo(tx + boxW / 4, ty);
                        ctx.moveTo(tx, ty - boxH / 4); ctx.lineTo(tx, ty + boxH / 4);
                        ctx.stroke();
                    }
                }
            }

            // 8. Sweep Radar element in Bottom Right
            ctx.save();
            const radarSize = 40;
            const rx = w - 160;
            const ry = h - 35;

            ctx.beginPath();
            ctx.arc(rx, ry, radarSize, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
            ctx.stroke();

            // Sweeping arm
            const radarAngle = (Date.now() / 400) % (2 * Math.PI);
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + Math.cos(radarAngle) * radarSize, ry + Math.sin(radarAngle) * radarSize);
            ctx.stroke();

            // Radar green target dots representing scan targets
            ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.fillRect(rx + 8, ry - 14, 2, 2);
            ctx.fillRect(rx - 12, ry + 10, 3, 3);
            ctx.fillRect(rx + 18, ry + 8, 2, 2);
            ctx.restore();

            // Loop frame
            droneHudRaf = requestAnimationFrame(drawDroneHudLoop);
        }

        // ================= ENTERPRISE ADMIN USER MANAGEMENT & LOGIN AUDIT LOGIC =================
        function filterAdminUsersTable() {
            const query = (document.getElementById('admin-user-search')?.value || '').toLowerCase().trim();
            const role = (document.getElementById('admin-role-filter')?.value || 'ALL').toUpperCase();
            const status = (document.getElementById('admin-status-filter')?.value || 'ALL').toUpperCase();

            const rows = document.querySelectorAll('#admin-users-tbody tr[data-name]');
            let visibleCount = 0;
            rows.forEach(row => {
                const name = row.getAttribute('data-name') || '';
                const email = row.getAttribute('data-email') || '';
                const rRole = (row.getAttribute('data-role') || '').toUpperCase();
                const rStatus = (row.getAttribute('data-status') || '').toUpperCase();

                const matchesQuery = !query || name.includes(query) || email.includes(query) || rRole.toLowerCase().includes(query);
                const matchesRole = (role === 'ALL' || rRole === role);
                const matchesStatus = (status === 'ALL' || rStatus === status);

                if (matchesQuery && matchesRole && matchesStatus) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });
        }

        function fetchAdminUsers() {
            const query = document.getElementById('admin-user-search')?.value || '';
            const role = document.getElementById('admin-role-filter')?.value || 'ALL';
            const status = document.getElementById('admin-status-filter')?.value || 'ALL';

            fetch(`/api/admin/users?search=${encodeURIComponent(query)}&role=${encodeURIComponent(role)}&status=${encodeURIComponent(status)}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.success) {
                        return;
                    }
                    const tbody = document.getElementById('admin-users-tbody');
                    if (!tbody) return;

                    if (!data.users || data.users.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 28px; color: var(--text-muted);">No registered users found in MySQL directory matching criteria.</td></tr>';
                        return;
                    }

                    tbody.innerHTML = data.users.map(u => {
                        const statusBadge = u.is_active == 1
                            ? '<span style="background: rgba(5,150,105,0.15); color: #10b981; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 11px;">Active</span>'
                            : '<span style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 11px;">Disabled</span>';
                        const actionDisableText = u.is_active == 1 ? '⏸️ Disable' : '▶️ Enable';
                        const actionDisableBg = u.is_active == 1 ? 'rgba(239,68,68,0.2)' : 'var(--primary)';
                        return `
                        <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-main);" data-name="${(u.full_name || '').toLowerCase()}" data-email="${(u.email || '').toLowerCase()}" data-role="${u.role}" data-status="${u.is_active == 1 ? 'ACTIVE' : 'DISABLED'}">
                            <td style="padding: 12px 10px; font-weight: 700;">#${u.id}</td>
                            <td style="padding: 12px 10px; font-weight: 600;">${u.full_name || ''}</td>
                            <td style="padding: 12px 10px;">${u.email || ''}</td>
                            <td style="padding: 12px 10px;">${u.phone_number || ''}</td>
                            <td style="padding: 12px 10px;"><span class="role-badge role-${(u.role || '').toLowerCase()}">${u.role || ''}</span></td>
                            <td style="padding: 12px 10px;">${statusBadge}</td>
                            <td style="padding: 12px 10px; font-size: 12px; color: var(--text-muted);">${u.created_at || ''}</td>
                            <td style="padding: 12px 10px; font-size: 12px; color: var(--text-muted);">${u.last_login_at || 'Never'}</td>
                            <td style="padding: 12px 10px; font-weight: 700; color: var(--primary);">${u.login_count || 0}</td>
                            <td style="padding: 12px 10px; text-align: center;">
                                <div style="display: flex; gap: 6px; justify-content: center;">
                                    <button onclick="viewUserDetails(${u.id})" class="cyber-btn" style="padding: 4px 8px; font-size: 11px; background: var(--accent-blue);" title="View Details">👁️ View</button>
                                    <button onclick="toggleUserStatus(${u.id})" class="cyber-btn" style="padding: 4px 8px; font-size: 11px; background: ${actionDisableBg};" title="Toggle Status">${actionDisableText}</button>
                                    <button onclick="changeUserRole(${u.id}, '${u.role}')" class="cyber-btn" style="padding: 4px 8px; font-size: 11px; background: rgba(217,119,6,0.2); color: var(--accent-orange);" title="Change Role">🛡️ Role</button>
                                    <button onclick="deleteUserAccount(${u.id}, '${u.email}')" class="cyber-btn" style="padding: 4px 8px; font-size: 11px; background: rgba(239,68,68,0.8);" title="Delete Account">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `;
                    }).join('');
                })
                .catch(err => console.error('Error fetching admin users:', err));
        }

        function viewUserDetails(userId) {
            fetch(`/api/admin/users/${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.success || !data.user) {
                        alert('Error loading user profile: ' + (data.message || 'Unknown error'));
                        return;
                    }
                    const u = data.user;
                    const modalContent = document.getElementById('user-details-modal-content');
                    if (modalContent) {
                        modalContent.innerHTML = `
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-muted);">User ID</span>
                            <span style="font-weight:700;">#${u.id}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-muted);">Full Name</span>
                            <span style="font-weight:600;">${u.full_name}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-muted);">Academic / Enterprise Email</span>
                            <span style="font-family:var(--font-mono);">${u.email}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-muted);">Mobile Number</span>
                            <span>${u.phone_number || 'Not provided'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-muted);">RBAC Assigned Role</span>
                            <span class="role-badge role-${(u.role || '').toLowerCase()}">${u.role}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-muted);">Account Lifecycle Status</span>
                            <span>${u.is_active == 1 ? '<b style="color:#10b981;">Active</b>' : '<b style="color:#ef4444;">Deactivated</b>'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-muted);">Organization / University</span>
                            <span>${u.organization || 'GreenPath AI Partner'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-muted);">Designation</span>
                            <span>${u.designation || 'Academic Researcher'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-muted);">Registration Timestamp</span>
                            <span style="font-size:12px;">${u.created_at}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);">
                            <span style="color:var(--text-muted);">Last Authenticated Login</span>
                            <span style="font-size:12px;">${u.last_login_at || 'Never'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0;">
                            <span style="color:var(--text-muted);">Total Successful Sessions</span>
                            <span style="font-weight:700; color:var(--primary);">${u.login_count || 0}</span>
                        </div>
                    `;
                    }
                    const modal = document.getElementById('user-details-modal');
                    if (modal) {
                        modal.style.display = 'flex';
                    }
                })
                .catch(err => console.error('Error fetching user details:', err));
        }

        function closeUserDetailsModal() {
            const modal = document.getElementById('user-details-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        function toggleUserStatus(userId) {
            fetch(`/api/admin/users/${userId}/toggle-status`, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        fetchAdminUsers();
                    } else {
                        alert('Could not update user status: ' + (data.message || 'Error'));
                    }
                })
                .catch(err => console.error('Error toggling user status:', err));
        }

        function changeUserRole(userId, currentRole) {
            const newRole = prompt('Enter new role for user (Admin, Researcher, Officer):', currentRole || 'Researcher');
            if (!newRole) return;
            const cleaned = newRole.trim();
            if (!['Admin', 'Researcher', 'Officer'].includes(cleaned)) {
                alert('Invalid role. Must be exactly: Admin, Researcher, or Officer.');
                return;
            }
            fetch(`/api/admin/users/${userId}/role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: cleaned })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        fetchAdminUsers();
                    } else {
                        alert('Could not update role: ' + (data.message || 'Error'));
                    }
                })
                .catch(err => console.error('Error updating role:', err));
        }

        function deleteUserAccount(userId, email) {
            if (!confirm(`Are you sure you want to permanently delete user account ${email}? This action cannot be undone.`)) {
                return;
            }
            fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        fetchAdminUsers();
                    } else {
                        alert('Could not delete account: ' + (data.message || 'Error'));
                    }
                })
                .catch(err => console.error('Error deleting account:', err));
        }

        function fetchAdminLogins() {
            fetch('/api/admin/logins?limit=150')
                .then(res => res.json())
                .then(data => {
                    if (!data.success) return;
                    const tbody = document.getElementById('admin-logins-tbody');
                    if (!tbody) return;
                    if (!data.logins || data.logins.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 28px; color: var(--text-muted);">No login telemetry recorded yet in MySQL login_history table.</td></tr>';
                        return;
                    }
                    tbody.innerHTML = data.logins.map(l => {
                        const logoutText = l.logout_time === 'Active Session'
                            ? '<span style="background: rgba(5,150,105,0.15); color: #10b981; padding: 3px 8px; border-radius: 12px; font-weight: 700; font-size: 11px;">🟢 Active Session</span>'
                            : `<span style="color: var(--text-muted);">${l.logout_time}</span>`;
                        const statusBadge = l.status === 'SUCCESS'
                            ? '<span style="background: rgba(5,150,105,0.15); color: #10b981; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 11px;">SUCCESS</span>'
                            : '<span style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 11px;">FAILED</span>';
                        return `
                        <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-main);" data-search="${(l.user_name || '').toLowerCase()} ${(l.email || '').toLowerCase()} ${(l.ip_address || '').toLowerCase()}">
                            <td style="padding: 10px; font-weight: 700;">#${l.id}</td>
                            <td style="padding: 10px; font-weight: 600;">${l.user_name || ''}</td>
                            <td style="padding: 10px;">${l.email || ''}</td>
                            <td style="padding: 10px;">${l.phone_number || ''}</td>
                            <td style="padding: 10px;"><span class="role-badge role-${(l.role || '').toLowerCase()}">${l.role || ''}</span></td>
                            <td style="padding: 10px; font-size: 12px; color: var(--text-muted);">${l.login_time || ''}</td>
                            <td style="padding: 10px; font-size: 12px;">${logoutText}</td>
                            <td style="padding: 10px; font-family: var(--font-mono); font-size: 12px;">${l.ip_address || ''}</td>
                            <td style="padding: 10px;">${l.browser || ''} / ${l.device || ''}</td>
                            <td style="padding: 10px;">${l.operating_system || ''}</td>
                            <td style="padding: 10px;">${statusBadge}</td>
                        </tr>
                    `;
                    }).join('');
                })
                .catch(err => console.error('Error fetching admin logins:', err));
        }

        function filterAdminLoginsTable() {
            const query = (document.getElementById('admin-login-search')?.value || '').toLowerCase().trim();
            const rows = document.querySelectorAll('#admin-logins-tbody tr[data-search]');
            rows.forEach(row => {
                const searchStr = row.getAttribute('data-search') || '';
                if (!query || searchStr.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        // Auto restore preference and bind switches
        document.addEventListener("DOMContentLoaded", () => {
            const savedTheme = localStorage.getItem('theme') || 'light';
            const btn = document.getElementById('theme-toggle');

            if (savedTheme === 'dark') {
                document.body.classList.add('dark');
                if (btn) btn.innerText = '☀️';
            } else {
                document.body.classList.remove('dark');
                if (btn) btn.innerText = '🌙';
            }

            const path = window.location.pathname.replace('/', '') || 'overview';
            switchTab(path);
        });

        
        // ================= UPLOAD HANDLING & API JS =================
        let tsSelectedFile = null;
        let tsSelectedFiles = [];

        document.addEventListener("DOMContentLoaded", () => {
            const tsFileInput = document.getElementById('tsFileInput');
            if (tsFileInput) {
                tsFileInput.addEventListener('change', (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                        tsSelectedFiles = Array.from(files);
                        tsSelectedFile = files[0];
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            const tsPreviewImg = document.getElementById('tsPreviewImg');
                            const tsPreviewBox = document.getElementById('tsPreviewBox');
                            const tsAlert = document.getElementById('treeSpeciesAlert');
                            const tsResults = document.getElementById('tsResultsContainer');
                            const tsEmpty = document.getElementById('tsEmptyState');

                            if (tsPreviewImg) tsPreviewImg.src = ev.target.result;
                            if (tsPreviewBox) tsPreviewBox.style.display = 'block';
                            if (tsAlert) tsAlert.style.display = 'none';
                            if (tsResults) tsResults.style.display = 'none';
                            if (tsEmpty) tsEmpty.style.display = 'block';
                        };
                        reader.readAsDataURL(tsSelectedFile);
                    }
                });
            }

            const imgInput = document.getElementById('image-upload-input');
            const ovFileInput = document.getElementById('overviewFileInput');

            const handleOvFiles = (files) => {
                if (!files || files.length === 0) return;
                
                if (files.length === 1) {
                    // Create an explicit form submission to the root route if imgInput isn't available
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = '/';
                    form.enctype = 'multipart/form-data';
                    form.style.display = 'none';

                    const input = document.createElement('input');
                    input.type = 'file';
                    input.name = 'image';
                    
                    const dt = new DataTransfer();
                    dt.items.add(files[0]);
                    input.files = dt.files;
                    
                    form.appendChild(input);
                    document.body.appendChild(form);
                    
                    if (typeof showRadarLoading === 'function') {
                        showRadarLoading();
                    }
                    form.submit();
                } else {
                    runOverviewMultiImageDetection(files);
                }
            };

            if (ovFileInput) {
                ovFileInput.addEventListener('change', (e) => handleOvFiles(e.target.files));
            }
            // NOTE: #image-upload-input is already wired via onchange="this.form.submit()"
            // and the form has onsubmit="showRadarLoading()". Adding a second listener here
            // caused double polling intervals and a permanently-visible overlay.
            // imgInput change listener intentionally removed.
        });

        async function runTreeSpeciesDetection() {
            if (tsSelectedFiles && tsSelectedFiles.length > 1) {
                return runMultiImageDetection(tsSelectedFiles);
            }

            const alertBox = document.getElementById('treeSpeciesAlert');
            const alertMsg = document.getElementById('treeSpeciesAlertMsg');
            if (alertBox) alertBox.style.display = 'none';

            if (!tsSelectedFile) {
                if (alertMsg) alertMsg.textContent = "Please select an image file first.";
                if (alertBox) alertBox.style.display = 'block';
                return;
            }

            const btn = document.getElementById('tsDetectBtn');
            const origText = btn ? btn.textContent : '';
            if (btn) {
                btn.disabled = true;
                btn.textContent = "Running Inference...";
            }

            const formData = new FormData();
            formData.append('image', tsSelectedFile);

            try {
                const resp = await fetch('/api/detect-tree-species', {
                    method: 'POST',
                    body: formData
                });
                const data = await resp.json();
                if (!resp.ok || !data.success) {
                    throw new Error(data.message || "Tree species detection failed.");
                }

                const elSpecies = document.getElementById('tsResSpecies');
                if (elSpecies) elSpecies.textContent = data.species_name || "Unknown";
                const elStatus = document.getElementById('tsResStatus');
                if (elStatus) elStatus.textContent = data.detection_status || "Species Classified";
                const elTime = document.getElementById('tsResTime');
                if (elTime) elTime.textContent = data.detection_time || "0.00s";

                const timestamp = new Date().getTime();
                const imgUrl = `${data.detected_image_url}?t=${timestamp}`;
                const elImg = document.getElementById('tsResDetectedImg');
                if (elImg) elImg.src = imgUrl;

                const elDownloadBtn = document.getElementById('tsDownloadImgBtn');
                if (elDownloadBtn) {
                    elDownloadBtn.href = data.detected_image_url || "#";
                    elDownloadBtn.download = data.output_filename || "detected_tree_species.png";
                }

                const elBotCard = document.getElementById('tsBotanicalCard');
                if (elBotCard && data.botanical_info) {
                    const b = data.botanical_info;
                    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "---"; };
                    setTxt('botScientific', b.scientific_name);
                    setTxt('botFamily', b.family);
                    setTxt('botCommon', b.common_name);
                    setTxt('botStatus', b.conservation_status);
                    setTxt('botRegion', b.native_region);
                    setTxt('botDesc', b.description);
                    setTxt('botUses', b.uses);
                    elBotCard.style.display = 'block';
                } else if (elBotCard) {
                    elBotCard.style.display = 'none';
                }

                const elCareCard = document.getElementById('tsCareCard');
                if (elCareCard && data.care_recommendation) {
                    const c = data.care_recommendation;
                    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "---"; };
                    setTxt('careWater', c.watering);
                    setTxt('careSunlight', c.sunlight);
                    setTxt('careSoil', c.soil);
                    setTxt('careFertilizer', c.fertilizer);
                    setTxt('carePruning', c.pruning);
                    setTxt('carePests', c.pests_diseases);
                    setTxt('careGeneral', c.general_care);
                    elCareCard.style.display = 'block';
                } else if (elCareCard) {
                    elCareCard.style.display = 'none';
                }

                const tbody = document.getElementById('tsDebugTableBody');
                if (tbody) {
                    tbody.innerHTML = '';
                    if (data.detections && data.detections.length > 0) {
                        data.detections.forEach(d => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); color: var(--text-main); font-size: 13px;">${d.class_name || d.species || "Unknown"}</td>
                                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); color: #10b981; font-size: 13px;">${d.confidence_percent || "N/A"}</td>
                                <td style="padding: 10px; border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 13px;">[${(d.box || []).map(Math.round).join(', ')}]</td>
                            `;
                            tbody.appendChild(tr);
                        });
                    } else {
                        tbody.innerHTML = `<tr><td colspan="3" style="padding: 10px; text-align: center; color: var(--text-muted);">No robust bounding boxes detected. Inference used fallback mode.</td></tr>`;
                    }
                }

                const emptyState = document.getElementById('tsEmptyState');
                if (emptyState) emptyState.style.display = 'none';
                
                const resultsContainer = document.getElementById('tsResultsContainer');
                if (resultsContainer) resultsContainer.style.display = 'block';

            } catch (e) {
                if (alertMsg) alertMsg.textContent = e.message || "An error occurred during inference.";
                if (alertBox) alertBox.style.display = 'block';
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = origText;
                }
            }
        }

        async function runOverviewMultiImageDetection(files) {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('images', files[i]);
            }
            
            const progressBox = document.getElementById('radarLoadingState');
            if (progressBox) progressBox.style.display = 'flex';
            
            try {
                const resp = await fetch('/api/detect-multi-overview', {
                    method: 'POST',
                    body: formData
                });
                const data = await resp.json();
                if (!resp.ok || !data.success) {
                    throw new Error(data.message || "Batch detection failed.");
                }
                
                // Hide main overview sections safely
                document.querySelectorAll('#panel-overview > .cyber-card, #panel-overview > .metrics-grid, #panel-overview > .panel-grid-2, #panel-overview > div[style*="grid-template-columns"]').forEach(el => {
                    if (el.id !== 'ovBatchContainer' && el.style.display !== 'none') {
                        el.dataset.oldDisplay = el.style.display;
                        el.style.display = 'none';
                    }
                });
                
                const batchContainer = document.getElementById('ovBatchContainer');
                if (batchContainer) batchContainer.style.display = 'block';
                
                setTimeout(() => {
                    if (progressBox) progressBox.style.display = 'none';
                    renderOverviewBatchResults(data.results);
                }, 500);
            } catch (e) {
                if (progressBox) progressBox.style.display = 'none';
                alert(e.message);
            }
        }

        function renderOverviewBatchResults(results) {
            const summaryCard = document.getElementById('ovBatchSummaryCard');
            const gallery = document.getElementById('ovBatchCardsGallery');
            const statsGrid = document.getElementById('ovBatchStatsGrid');

            if (summaryCard) summaryCard.style.display = 'block';
            if (gallery) gallery.innerHTML = '';
            if (statsGrid) statsGrid.innerHTML = '';

            let totalTrees = 0;
            let totalHealthy = 0;
            let totalDry = 0;
            let sumEco = 0;
            let totalCO2 = 0.0;
            let sumHeat = 0.0;

            results.forEach(item => {
                totalTrees += (item.tree_count || 0);
                totalHealthy += (item.healthy || 0);
                totalDry += (item.dry || 0);
                sumEco += (item.eco_index || 0);
                totalCO2 += (item.co2_absorption || 0.0);
                sumHeat += (item.heat_reduction || 0.0);
            });

            const avgEco = results.length > 0 ? Math.round(sumEco / results.length) : 0;
            const avgHeat = results.length > 0 ? (sumHeat / results.length).toFixed(2) : '0.00';
            totalCO2 = totalCO2.toFixed(1);

            if (statsGrid) {
                statsGrid.innerHTML = `
                    <div class="cyber-card" style="padding: 12px; margin: 0; border-left: 3px solid #10b981;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Total Images</div>
                        <div style="font-size: 20px; font-weight: 800; color: #10b981; margin-top: 4px;">${results.length}</div>
                    </div>
                    <div class="cyber-card" style="padding: 12px; margin: 0; border-left: 3px solid #38bdf8;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Total Trees Analysed</div>
                        <div style="font-size: 20px; font-weight: 800; color: #38bdf8; margin-top: 4px;">${totalTrees}</div>
                    </div>
                    <div class="cyber-card" style="padding: 12px; margin: 0; border-left: 3px solid #10b981;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Healthy / Dry</div>
                        <div style="font-size: 16px; font-weight: 700; color: #10b981; margin-top: 4px;">${totalHealthy} H / ${totalDry} D</div>
                    </div>
                    <div class="cyber-card" style="padding: 12px; margin: 0; border-left: 3px solid #f59e0b;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Avg Eco-Index</div>
                        <div style="font-size: 20px; font-weight: 800; color: #f59e0b; margin-top: 4px;">${avgEco}%</div>
                    </div>
                    <div class="cyber-card" style="padding: 12px; margin: 0; border-left: 3px solid #6366f1;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Total CO₂ Offset</div>
                        <div style="font-size: 18px; font-weight: 800; color: #6366f1; margin-top: 4px;">${totalCO2} <span style="font-size:12px;">kg/yr</span></div>
                    </div>
                    <div class="cyber-card" style="padding: 12px; margin: 0; border-left: 3px solid #ec4899;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Avg Heat Mitigation</div>
                        <div style="font-size: 20px; font-weight: 800; color: #ec4899; margin-top: 4px;">-${avgHeat}°C</div>
                    </div>
                `;
            }

            results.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'cyber-card';
                card.style.margin = '0';
                card.style.borderLeft = item.eco_index > 60 ? '4px solid #10b981' : '4px solid #f59e0b';

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                        <div>
                            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Image ${index + 1}</div>
                            <div style="font-size: 14px; font-weight: 700;">${item.filename}</div>
                        </div>
                    </div>
                    <img src="${item.yolo_image}" alt="Detected" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: rgba(16,185,129,0.03); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-top: 12px;">
                        <div>
                            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Trees Detected</div>
                            <div style="font-size: 16px; font-weight: 800; color: #10b981;">${item.tree_count}</div>
                            <div style="font-size: 10px; color: var(--text-muted);">${item.healthy} Healthy, ${item.dry} Dry</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Eco-Index</div>
                            <div style="font-size: 16px; font-weight: 800; color: #38bdf8;">${item.eco_index}%</div>
                            <div style="font-size: 10px; color: var(--text-muted);">Status Score</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">CO₂ Offset</div>
                            <div style="font-size: 16px; font-weight: 800; color: #6366f1;">${item.co2_absorption} <span style="font-size:10px;">kg/yr</span></div>
                            <div style="font-size: 10px; color: var(--text-muted);">Sequestration</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Heat Mitigation</div>
                            <div style="font-size: 16px; font-weight: 800; color: #ec4899;">-${item.heat_reduction}°C</div>
                            <div style="font-size: 10px; color: var(--text-muted);">${item.detection_time}s CPU</div>
                        </div>
                    </div>
                `;
                if (gallery) gallery.appendChild(card);
            });
        }

        function closeOverviewBatchView() {
            const batchContainer = document.getElementById('ovBatchContainer');
            if (batchContainer) batchContainer.style.display = 'none';

            document.querySelectorAll('#panel-overview > .cyber-card, #panel-overview > .metrics-grid, #panel-overview > .panel-grid-2, #panel-overview > div[style*="grid-template-columns"]').forEach(el => {
                if (el.id !== 'ovBatchContainer') {
                    el.style.display = el.dataset.oldDisplay || '';
                }
            });
        }

        async function runMultiImageDetection(files) {
            // Check if there is an empty state to hide
            const emptyState = document.getElementById('tsEmptyState');
            if (emptyState) emptyState.style.display = 'none';

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('images', files[i]);
            }
            try {
                const btn = document.getElementById('tsDetectBtn');
                const origText = btn ? btn.textContent : '';
                if (btn) {
                    btn.disabled = true;
                    btn.textContent = "Batch Processing...";
                }
                const resp = await fetch('/api/detect-multi-image', {
                    method: 'POST',
                    body: formData
                });
                const data = await resp.json();
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = origText;
                }
                if (data.success) {
                    alert("Batch processing complete! Downloading Zip Archive...");
                    window.location.href = data.zip_url;
                } else {
                    alert("Batch failed: " + data.message);
                }
            } catch(e) {
                alert("Error during batch request: " + e.message);
            }
        }
    