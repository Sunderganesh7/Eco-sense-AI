/**
 * EcoSense AI - Dashboard Integration Script
 * Embedded CarbonWise AI & Platform Navigation
 */

import './env.js';

(function () {
    'use strict';

    // Retrieve configured CarbonWise AI URL or default to the verified deployed frontend
    const CARBONWISE_URL = (window.ENV && window.ENV.VITE_CARBONWISE_URL) 
        || 'https://eco-sense-ai-bvxx.vercel.app';

    // DOM Elements
    const dashboardOverview = document.getElementById('dashboard-overview');
    const carbonwiseContainer = document.getElementById('carbonwise-container');
    const carbonwiseIframe = document.getElementById('carbonwise-iframe');
    const frameLoadingOverlay = document.getElementById('frame-loading-overlay');
    const frameFallbackBanner = document.getElementById('frame-fallback-banner');
    const btnBackOverview = document.getElementById('btn-back-overview');
    const btnReloadIframe = document.getElementById('btn-reload-iframe');
    const btnFullscreenIframe = document.getElementById('btn-fullscreen-iframe');
    const navItemDashboard = document.getElementById('nav-item-dashboard');
    const navItemCarbonwise = document.getElementById('nav-item-carbonwise');
    const cardCarbonwise = document.getElementById('card-carbonwise');
    const brandElement = document.querySelector('.brand');
    const fallbackSameTab = document.getElementById('fallback-same-tab');

    let iframeLoaded = false;
    let loadTimeoutId = null;

    /**
     * Switch view to embedded CarbonWise AI
     */
    function openCarbonWise() {
        if (!dashboardOverview || !carbonwiseContainer || !carbonwiseIframe) return;

        // Hide main dashboard overview, show embedded view
        dashboardOverview.style.display = 'none';
        carbonwiseContainer.style.display = 'flex';

        // Update sidebar navigation active indicator
        if (navItemDashboard) navItemDashboard.classList.remove('active');
        if (navItemCarbonwise) navItemCarbonwise.classList.add('active');

        // Update URL hash without extra history spam
        if (window.location.hash !== '#carbonwise') {
            try {
                history.pushState(null, '', '#carbonwise');
            } catch (e) {
                window.location.hash = 'carbonwise';
            }
        }

        // Lazy load iframe on first open
        if (!iframeLoaded || carbonwiseIframe.src === '' || carbonwiseIframe.src === 'about:blank') {
            loadIframe();
        }

        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Return to Platform Overview
     */
    function showPlatformOverview() {
        if (!dashboardOverview || !carbonwiseContainer) return;

        // Hide embedded view, show dashboard overview
        carbonwiseContainer.style.display = 'none';
        dashboardOverview.style.display = 'block';

        // Exit fullscreen if active
        if (carbonwiseContainer.classList.contains('is-fullscreen')) {
            exitFullscreen();
        }

        // Restore sidebar navigation active indicator
        if (navItemCarbonwise) navItemCarbonwise.classList.remove('active');
        if (navItemDashboard) navItemDashboard.classList.add('active');

        // Reset URL hash
        if (window.location.hash === '#carbonwise') {
            try {
                history.pushState(null, '', window.location.pathname + window.location.search);
            } catch (e) {
                window.location.hash = '';
            }
        }

        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Load iframe and handle loading / security fallback
     */
    function loadIframe() {
        if (!carbonwiseIframe) return;

        if (frameLoadingOverlay) {
            frameLoadingOverlay.classList.remove('hidden');
        }
        if (frameFallbackBanner) {
            frameFallbackBanner.style.display = 'none';
        }

        // Set safety timeout for frame response
        if (loadTimeoutId) clearTimeout(loadTimeoutId);
        loadTimeoutId = setTimeout(() => {
            // Check if iframe failed to communicate or load
            if (!iframeLoaded && frameFallbackBanner) {
                console.warn('Iframe load timeout reached for CarbonWise AI. Displaying fallback option.');
                // Keep overlay hidden so fallback banner is visible
                if (frameLoadingOverlay) frameLoadingOverlay.classList.add('hidden');
                frameFallbackBanner.style.display = 'flex';
            }
        }, 12000);

        carbonwiseIframe.onload = function () {
            iframeLoaded = true;
            if (loadTimeoutId) clearTimeout(loadTimeoutId);
            if (frameLoadingOverlay) {
                frameLoadingOverlay.classList.add('hidden');
            }
            if (frameFallbackBanner) {
                frameFallbackBanner.style.display = 'none';
            }
        };

        carbonwiseIframe.onerror = function () {
            console.error('CarbonWise AI iframe loading failed or blocked by security policy.');
            if (loadTimeoutId) clearTimeout(loadTimeoutId);
            if (frameLoadingOverlay) frameLoadingOverlay.classList.add('hidden');
            if (frameFallbackBanner) {
                frameFallbackBanner.style.display = 'flex';
            } else {
                // Direct fallback to same tab navigation
                window.location.href = CARBONWISE_URL;
            }
        };

        carbonwiseIframe.src = CARBONWISE_URL;
    }

    /**
     * Reload iframe
     */
    function reloadIframe() {
        if (!carbonwiseIframe) return;
        iframeLoaded = false;
        loadIframe();
    }

    /**
     * Fullscreen toggle
     */
    function toggleFullscreen() {
        if (!carbonwiseContainer) return;
        const isFull = carbonwiseContainer.classList.toggle('is-fullscreen');
        const icon = btnFullscreenIframe?.querySelector('i');
        const label = btnFullscreenIframe?.querySelector('span');
        if (icon) {
            icon.className = isFull ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
        }
        if (label) {
            label.textContent = isFull ? 'Exit Fullscreen' : 'Fullscreen';
        }
    }

    function exitFullscreen() {
        if (!carbonwiseContainer) return;
        carbonwiseContainer.classList.remove('is-fullscreen');
        const icon = btnFullscreenIframe?.querySelector('i');
        const label = btnFullscreenIframe?.querySelector('span');
        if (icon) icon.className = 'fa-solid fa-expand';
        if (label) label.textContent = 'Fullscreen';
    }

    // Attach Event Listeners
    if (cardCarbonwise) {
        cardCarbonwise.addEventListener('click', function (e) {
            e.preventDefault();
            openCarbonWise();
        });
        cardCarbonwise.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openCarbonWise();
            }
        });
    }

    if (navItemCarbonwise) {
        navItemCarbonwise.addEventListener('click', function (e) {
            e.preventDefault();
            openCarbonWise();
        });
    }

    if (btnBackOverview) {
        btnBackOverview.addEventListener('click', function (e) {
            e.preventDefault();
            showPlatformOverview();
        });
    }

    if (navItemDashboard) {
        navItemDashboard.addEventListener('click', function (e) {
            e.preventDefault();
            showPlatformOverview();
        });
    }

    if (brandElement) {
        brandElement.style.cursor = 'pointer';
        brandElement.addEventListener('click', function () {
            showPlatformOverview();
        });
    }

    if (btnReloadIframe) {
        btnReloadIframe.addEventListener('click', reloadIframe);
    }

    if (btnFullscreenIframe) {
        btnFullscreenIframe.addEventListener('click', toggleFullscreen);
    }

    if (fallbackSameTab) {
        fallbackSameTab.href = CARBONWISE_URL;
    }

    // Escape key handler for fullscreen or returning
    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (carbonwiseContainer && carbonwiseContainer.classList.contains('is-fullscreen')) {
                exitFullscreen();
            }
        }
    });

    // Handle hash change (browser Back / Forward navigation)
    window.addEventListener('hashchange', function () {
        if (window.location.hash === '#carbonwise') {
            openCarbonWise();
        } else {
            showPlatformOverview();
        }
    });

    // Initial route check on page load
    if (window.location.hash === '#carbonwise') {
        openCarbonWise();
    }

    // Expose helpers globally if needed
    window.EcoSenseDashboard = {
        openCarbonWise,
        showPlatformOverview,
        reloadIframe,
        CARBONWISE_URL
    };
})();
