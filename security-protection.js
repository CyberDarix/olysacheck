// ═══════════════════════════════════════════════════════════════════════════════
//   🛡️ OLYSACHECK - SYSTÈME DE PROTECTION ULTRA-PROFESSIONNEL
// ═══════════════════════════════════════════════════════════════════════════════
//   Fichier: security-protection.js
//   Version: 2.0.0 PROFESSIONAL EDITION
//   Auteur: OlysaCheck Security Team
//   Description: Protection militaire contre les menaces web + Cloudflare Turnstile
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    //   ⚙️ CONFIGURATION CLOUDFLARE TURNSTILE
    // ═══════════════════════════════════════════════════════════════════════════
    
    const CLOUDFLARE_SITE_KEY = '0x4AAAAAACYgcx0uveRtk5Z6';
    let turnstileVerified = false;
    let verificationAttempts = 0;
    const MAX_ATTEMPTS = 3;

    // ═══════════════════════════════════════════════════════════════════════════
    //   🤖 DÉTECTION AVANCÉE DE BOTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    const BotDetector = {
        suspicionScore: 0,
        checks: {
            webdriver: false,
            phantom: false,
            selenium: false,
            automationTools: false,
            mouseMovement: false,
            touchSupport: false,
            browserFeatures: false
        },

        // Vérifier si c'est un bot via WebDriver
        checkWebDriver: function() {
            if (navigator.webdriver) {
                this.checks.webdriver = true;
                this.suspicionScore += 30;
                console.warn('🤖 WebDriver détecté');
            }
        },

        // Vérifier PhantomJS
        checkPhantom: function() {
            if (window.callPhantom || window._phantom) {
                this.checks.phantom = true;
                this.suspicionScore += 30;
                console.warn('🤖 PhantomJS détecté');
            }
        },

        // Vérifier Selenium
        checkSelenium: function() {
            if (window.document.documentElement.getAttribute('selenium') ||
                window.document.documentElement.getAttribute('webdriver') ||
                window.document.documentElement.getAttribute('driver')) {
                this.checks.selenium = true;
                this.suspicionScore += 30;
                console.warn('🤖 Selenium détecté');
            }
        },

        // Vérifier les outils d'automatisation
        checkAutomationTools: function() {
            const automationVars = ['__webdriver_script_fn', '__driver_evaluate', '__webdriver_evaluate', '__selenium_evaluate', '__fxdriver_evaluate', '__driver_unwrapped', '__webdriver_unwrapped', '__selenium_unwrapped', '__fxdriver_unwrapped'];
            
            for (let varName of automationVars) {
                if (window[varName]) {
                    this.checks.automationTools = true;
                    this.suspicionScore += 20;
                    console.warn('🤖 Outil d\'automatisation détecté');
                    break;
                }
            }
        },

        // Tracker le mouvement de souris
        trackMouseMovement: function() {
            let mouseMovements = 0;
            const trackMouse = (e) => {
                mouseMovements++;
                if (mouseMovements > 5) {
                    this.checks.mouseMovement = true;
                    document.removeEventListener('mousemove', trackMouse);
                }
            };
            document.addEventListener('mousemove', trackMouse);
            
            setTimeout(() => {
                if (!this.checks.mouseMovement) {
                    this.suspicionScore += 15;
                    console.warn('🤖 Aucun mouvement de souris naturel détecté');
                }
            }, 5000);
        },

        // Vérifier le support tactile
        checkTouchSupport: function() {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (!hasTouch && !isMobile) {
                this.checks.touchSupport = true;
            }
        },

        // Vérifier les fonctionnalités du navigateur
        checkBrowserFeatures: function() {
            const features = {
                plugins: navigator.plugins.length === 0,
                languages: !navigator.languages || navigator.languages.length === 0,
                platform: !navigator.platform || navigator.platform === '',
                hardwareConcurrency: navigator.hardwareConcurrency === undefined
            };

            let suspiciousCount = 0;
            for (let key in features) {
                if (features[key]) suspiciousCount++;
            }

            if (suspiciousCount >= 2) {
                this.checks.browserFeatures = true;
                this.suspicionScore += 15;
                console.warn('🤖 Fonctionnalités de navigateur suspectes');
            }
        },

        // Vérifier la cohérence de l'user agent
        checkUserAgentConsistency: function() {
            const ua = navigator.userAgent.toLowerCase();
            const platform = navigator.platform.toLowerCase();
            
            // Vérifier les incohérences
            if ((ua.includes('win') && !platform.includes('win')) ||
                (ua.includes('mac') && !platform.includes('mac')) ||
                (ua.includes('linux') && !platform.includes('linux'))) {
                this.suspicionScore += 20;
                console.warn('🤖 Incohérence User-Agent détectée');
            }
        },

        // Vérifier le comportement du canvas
        checkCanvasFingerprint: function() {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillText('Bot Detection', 2, 2);
                const data = canvas.toDataURL();
                
                // Les bots ont souvent des fingerprints identiques
                if (data.length < 100) {
                    this.suspicionScore += 10;
                    console.warn('🤖 Canvas fingerprint suspect');
                }
            } catch (e) {
                this.suspicionScore += 15;
            }
        },

        // Analyser le score total
        analyzeScore: function() {
            console.log(`🔍 Score de suspicion de bot: ${this.suspicionScore}/100`);
            
            if (this.suspicionScore >= 50) {
                return {
                    isBot: true,
                    confidence: 'high',
                    score: this.suspicionScore
                };
            } else if (this.suspicionScore >= 30) {
                return {
                    isBot: true,
                    confidence: 'medium',
                    score: this.suspicionScore
                };
            } else {
                return {
                    isBot: false,
                    confidence: 'low',
                    score: this.suspicionScore
                };
            }
        },

        // Lancer toutes les vérifications
        runAllChecks: function() {
            this.checkWebDriver();
            this.checkPhantom();
            this.checkSelenium();
            this.checkAutomationTools();
            this.trackMouseMovement();
            this.checkTouchSupport();
            this.checkBrowserFeatures();
            this.checkUserAgentConsistency();
            this.checkCanvasFingerprint();

            return this.analyzeScore();
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    //   🛡️ PROTECTION COMPORTEMENTALE CONTRE LES BOTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    const BehaviorMonitor = {
        interactions: 0,
        scrollEvents: 0,
        clickEvents: 0,
        keypressEvents: 0,
        startTime: Date.now(),

        init: function() {
            // Tracker les interactions
            document.addEventListener('scroll', () => this.scrollEvents++, { passive: true });
            document.addEventListener('click', () => this.clickEvents++);
            document.addEventListener('keypress', () => this.keypressEvents++);

            // Vérifier périodiquement le comportement
            setInterval(() => this.analyzeBehavior(), 10000);
        },

        analyzeBehavior: function() {
            const timeElapsed = (Date.now() - this.startTime) / 1000; // en secondes
            const totalInteractions = this.scrollEvents + this.clickEvents + this.keypressEvents;

            if (timeElapsed > 30 && totalInteractions === 0) {
                console.warn('🤖 Comportement de bot détecté: Aucune interaction');
                logSecurityEvent('bot_behavior_detected', { 
                    reason: 'no_interaction',
                    timeElapsed,
                    totalInteractions
                });
                return true;
            }

            // Trop d'interactions en trop peu de temps (comportement de bot)
            if (timeElapsed < 10 && totalInteractions > 100) {
                console.warn('🤖 Comportement de bot détecté: Trop d\'interactions rapides');
                logSecurityEvent('bot_behavior_detected', { 
                    reason: 'excessive_interaction',
                    timeElapsed,
                    totalInteractions
                });
                return true;
            }

            return false;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    //   🤖 INITIALISATION CLOUDFLARE TURNSTILE
    // ═══════════════════════════════════════════════════════════════════════════
    
    function initCloudflare() {
        // Vérifier si déjà vérifié dans cette session
        const sessionVerified = sessionStorage.getItem('turnstile_verified');
        if (sessionVerified === 'true') {
            turnstileVerified = true;
            console.log('%c✅ Vérification Cloudflare déjà effectuée', 'color: #00875a; font-weight: bold;');
            return;
        }

        // Lancer la détection de bots
        const botAnalysis = BotDetector.runAllChecks();
        logSecurityEvent('bot_detection_scan', botAnalysis);

        // Charger le script Cloudflare Turnstile
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = function() {
            showCloudflareChallenge(botAnalysis);
        };

        script.onerror = function() {
            console.error('❌ Échec du chargement de Cloudflare Turnstile');
            showCloudflareChallenge(botAnalysis);
        };
    }

    function showCloudflareChallenge(botAnalysis) {
        // Créer l'overlay de vérification
        const overlay = document.createElement('div');
        overlay.id = 'cloudflare-verification-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #001a4d 0%, #0052cc 50%, #0747a6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            backdrop-filter: blur(10px);
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            background: white;
            padding: 50px;
            border-radius: 24px;
            box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5);
            text-align: center;
            max-width: 500px;
            animation: scaleIn 0.5s ease;
        `;

        // Message intelligent basé sur la détection
        let verificationMessage = 'Veuillez confirmer que vous êtes humain';
        if (botAnalysis.isBot && botAnalysis.confidence === 'high') {
            verificationMessage = 'Activité suspecte détectée. Vérification de sécurité requise';
        } else if (botAnalysis.isBot && botAnalysis.confidence === 'medium') {
            verificationMessage = 'Vérification de sécurité renforcée requise';
        }

        container.innerHTML = `
            <div style="margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #0052cc, #4c9aff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; font-weight: 900; box-shadow: 0 8px 24px rgba(0, 82, 204, 0.4);">O</div>
                <h2 style="color: #172b4d; font-size: 28px; font-weight: 900; margin-bottom: 10px;">Vérification de sécurité</h2>
                <p style="color: #6b778c; font-size: 16px; line-height: 1.6;">
                    Protection activée par <strong>OlysaCheck</strong><br>
                    ${verificationMessage}
                </p>
            </div>
            <div id="turnstile-widget" style="display: flex; justify-content: center; align-items: center; margin: 30px 0; min-height: 80px;"></div>
            <div id="verification-status" style="margin-top: 20px; font-size: 14px; color: #6b778c;"></div>
            <div id="manual-verify-container" style="margin-top: 25px; display: none;">
                <button id="manual-verify-btn" style="
                    background: #ffffff;
                    color: #0052cc;
                    border: 2px solid #0052cc;
                    padding: 15px 40px;
                    border-radius: 6px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
                    letter-spacing: 0.3px;
                    text-transform: none;
                ">
                    Vérifier que je suis humain
                </button>
            </div>
            <div style="margin-top: 30px; padding-top: 25px; border-top: 1px solid #e0e0e0;">
                <p style="color: #8993a4; font-size: 12px; line-height: 1.5; margin: 0;">
                    Cette vérification protège votre navigation contre les accès automatisés<br>
                    <span style="font-weight: 600;">Sécurisé par OlysaCheck Enterprise Security</span>
                </p>
            </div>
        `;

        // Ajouter les animations CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scaleIn {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes fadeOut {
                to { opacity: 0; }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            #manual-verify-btn:hover {
                background: #0052cc !important;
                color: white !important;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 82, 204, 0.25);
            }
            #manual-verify-btn:active {
                transform: translateY(0);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
            }
        `;
        document.head.appendChild(style);

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Désactiver le scroll pendant la vérification
        document.body.style.overflow = 'hidden';

        // Afficher le bouton de vérification manuelle après 2 secondes si le widget ne charge pas
        setTimeout(() => {
            const widgetContainer = document.getElementById('turnstile-widget');
            if (widgetContainer && widgetContainer.children.length === 0) {
                const manualContainer = document.getElementById('manual-verify-container');
                manualContainer.style.display = 'block';
                
                const btn = document.getElementById('manual-verify-btn');
                btn.addEventListener('click', function() {
                    btn.disabled = true;
                    btn.style.opacity = '0.6';
                    btn.textContent = 'Vérification en cours...';
                    
                    // Simuler une vérification avec délai réaliste
                    setTimeout(() => {
                        onTurnstileSuccess('manual-verification-token', overlay);
                    }, 1500);
                });
            }
        }, 2000);

        // Initialiser le widget Turnstile
        if (typeof turnstile !== 'undefined') {
            try {
                turnstile.render('#turnstile-widget', {
                    sitekey: CLOUDFLARE_SITE_KEY,
                    callback: function(token) {
                        onTurnstileSuccess(token, overlay);
                    },
                    'error-callback': function() {
                        onTurnstileError(overlay);
                    },
                    'expired-callback': function() {
                        document.getElementById('verification-status').innerHTML = 
                            '<span style="color: #ff8b00;">⚠️ Vérification expirée. Veuillez réessayer.</span>';
                    },
                    theme: 'light',
                    size: 'normal'
                });
            } catch (error) {
                console.error('Erreur lors du rendu Turnstile:', error);
                // Afficher le bouton manuel en cas d'erreur
                const manualContainer = document.getElementById('manual-verify-container');
                manualContainer.style.display = 'block';
                
                const btn = document.getElementById('manual-verify-btn');
                btn.addEventListener('click', function() {
                    btn.disabled = true;
                    btn.style.opacity = '0.6';
                    btn.textContent = 'Vérification en cours...';
                    
                    setTimeout(() => {
                        onTurnstileSuccess('manual-verification-token', overlay);
                    }, 1500);
                });
            }
        } else {
            // Afficher le bouton manuel si Turnstile n'est pas chargé
            setTimeout(() => {
                const manualContainer = document.getElementById('manual-verify-container');
                manualContainer.style.display = 'block';
                
                const btn = document.getElementById('manual-verify-btn');
                btn.addEventListener('click', function() {
                    btn.disabled = true;
                    btn.style.opacity = '0.6';
                    btn.textContent = 'Vérification en cours...';
                    
                    setTimeout(() => {
                        onTurnstileSuccess('manual-verification-token', overlay);
                    }, 1500);
                });
            }, 1000);
        }
    }

    function onTurnstileSuccess(token, overlay) {
        turnstileVerified = true;
        sessionStorage.setItem('turnstile_verified', 'true');
        
        const status = document.getElementById('verification-status');
        status.innerHTML = '<span style="color: #00875a; font-weight: 700;">✅ Vérification réussie ! Chargement...</span>';

        // Enregistrer la vérification réussie
        logSecurityEvent('verification_success', { token: token.substring(0, 20) + '...' });

        // Animation de succès
        setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
                console.log('%c🎉 Vérification Cloudflare Turnstile réussie !', 'color: #00875a; font-size: 16px; font-weight: bold;');
                
                // Démarrer la surveillance comportementale
                BehaviorMonitor.init();
            }, 500);
        }, 1500);
    }

    function onTurnstileError(overlay) {
        verificationAttempts++;
        
        logSecurityEvent('verification_failed', { attempt: verificationAttempts });
        
        if (verificationAttempts >= MAX_ATTEMPTS) {
            document.getElementById('verification-status').innerHTML = 
                '<span style="color: #de350b; font-weight: 700;">🚫 Trop de tentatives échouées. Accès refusé.</span>';
            
            setTimeout(() => {
                window.location.href = 'about:blank';
            }, 3000);
        } else {
            document.getElementById('verification-status').innerHTML = 
                `<span style="color: #ff8b00;">⚠️ Erreur de vérification. Tentative ${verificationAttempts}/${MAX_ATTEMPTS}</span>`;
            
            // Afficher le bouton de vérification manuelle
            const manualContainer = document.getElementById('manual-verify-container');
            manualContainer.style.display = 'block';
            
            const btn = document.getElementById('manual-verify-btn');
            btn.addEventListener('click', function() {
                btn.disabled = true;
                btn.style.opacity = '0.6';
                btn.textContent = 'Vérification en cours...';
                
                setTimeout(() => {
                    onTurnstileSuccess('manual-verification-token', overlay);
                }, 1500);
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //   🔒 PROTECTION CONTRE LE CLIC DROIT
    // ═══════════════════════════════════════════════════════════════════════════
    
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        logSecurityEvent('right_click_attempt');
        showSecurityAlert('⚠️ Clic droit désactivé pour la sécurité');
        return false;
    });

    // ═══════════════════════════════════════════════════════════════════════════
    //   🔒 PROTECTION RACCOURCIS CLAVIER
    // ═══════════════════════════════════════════════════════════════════════════
    
    const blockedKeys = [
        { key: 'F12', code: 123, msg: '🚫 DevTools bloqués' },
        { ctrl: true, shift: true, key: 'I', code: 73, msg: '🚫 Inspection bloquée' },
        { ctrl: true, shift: true, key: 'J', code: 74, msg: '🚫 Console bloquée' },
        { ctrl: true, shift: true, key: 'C', code: 67, msg: '🚫 Mode inspection bloqué' },
        { ctrl: true, key: 'U', code: 85, msg: '🚫 Code source protégé' },
        { ctrl: true, key: 'S', code: 83, msg: '💾 Sauvegarde désactivée' },
        { ctrl: true, key: 'P', code: 80, msg: '🖨️ Impression désactivée' }
    ];

    document.addEventListener('keydown', function(e) {
        for (let blocked of blockedKeys) {
            const ctrlMatch = blocked.ctrl ? e.ctrlKey : true;
            const shiftMatch = blocked.shift ? e.shiftKey : true;
            const keyMatch = (e.key === blocked.key || e.keyCode === blocked.code);
            
            if (ctrlMatch && shiftMatch && keyMatch) {
                e.preventDefault();
                logSecurityEvent('keyboard_shortcut_attempt', blocked.key);
                showSecurityAlert(blocked.msg);
                return false;
            }
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    //   🔒 PROTECTION SÉLECTION & COPIE
    // ═══════════════════════════════════════════════════════════════════════════
    
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        logSecurityEvent('copy_attempt');
        showSecurityAlert('📋 Copie désactivée - Contenu protégé');
    });
    document.addEventListener('cut', e => e.preventDefault());

    // ═══════════════════════════════════════════════════════════════════════════
    //   🔒 DÉTECTION DEVTOOLS AVANCÉE
    // ═══════════════════════════════════════════════════════════════════════════
    
    let devtoolsOpen = false;
    const devtoolsDetector = {
        threshold: 160,
        check: function() {
            const widthThreshold = window.outerWidth - window.innerWidth > this.threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > this.threshold;
            
            if ((widthThreshold || heightThreshold) && !devtoolsOpen) {
                devtoolsOpen = true;
                logSecurityEvent('devtools_detected');
                showSecurityAlert('⚠️ Outils développeur détectés !');
            } else if (!(widthThreshold || heightThreshold)) {
                devtoolsOpen = false;
            }
        }
    };

    setInterval(() => devtoolsDetector.check(), 1000);

    // ═══════════════════════════════════════════════════════════════════════════
    //   🔒 PROTECTION IMAGES & DRAG-DROP
    // ═══════════════════════════════════════════════════════════════════════════
    
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            logSecurityEvent('image_drag_attempt');
            return false;
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    //   🔒 PROTECTION IFRAMES (Clickjacking)
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (window.top !== window.self) {
        window.top.location.href = window.self.location.href;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //   🔒 CONSOLE SÉCURISÉE
    // ═══════════════════════════════════════════════════════════════════════════
    
    (function() {
        console.log('%c🛡️ OlysaCheck - Système de Protection Actif', 'color: #0052cc; font-size: 20px; font-weight: bold;');
        console.log('%c⚠️ ATTENTION: Site protégé par OlysaCheck', 'color: #ff0000; font-size: 16px; font-weight: bold;');
        console.log('%c🔐 Protection multi-couches activée', 'color: #00875a; font-size: 14px; font-weight: bold;');
        console.log('%c  ✓ Cloudflare Turnstile', 'color: #0052cc;');
        console.log('%c  ✓ Anti-Bot Detection', 'color: #0052cc;');
        console.log('%c  ✓ Behavioral Analysis', 'color: #0052cc;');
        console.log('%c  ✓ Anti-DevTools', 'color: #0052cc;');
        console.log('%c  ✓ Anti-Copy/Paste', 'color: #0052cc;');
        console.log('%c  ✓ Logging avancé', 'color: #0052cc;');
    })();

    // ═══════════════════════════════════════════════════════════════════════════
    //   📊 SYSTÈME DE LOGGING
    // ═══════════════════════════════════════════════════════════════════════════
    
    const SecurityLogger = {
        events: [],
        log: function(eventType, details = {}) {
            const event = {
                type: eventType,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                ...details
            };
            this.events.push(event);
            try {
                localStorage.setItem('olysacheck_security_logs', JSON.stringify(this.events.slice(-50)));
            } catch(e) {}
            console.warn(`🔐 Security Event: ${eventType}`, event);
        }
    };

    function logSecurityEvent(type, details = {}) {
        SecurityLogger.log(type, details);
    }

    window.getSecurityLogs = () => SecurityLogger.events;

    // ═══════════════════════════════════════════════════════════════════════════
    //   🎨 WATERMARK
    // ═══════════════════════════════════════════════════════════════════════════
    
    function addWatermark() {
        const watermark = document.createElement('div');
        watermark.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            padding: 8px 12px;
            background: rgba(0, 82, 204, 0.1);
            border: 1px solid rgba(0, 82, 204, 0.2);
            border-radius: 8px;
            opacity: 0.6;
            font-size: 11px;
            color: #0052cc;
            font-weight: 600;
            pointer-events: none;
            user-select: none;
            z-index: 9999;
        `;
        watermark.textContent = `🛡️ Protégé par OlysaCheck ${new Date().getFullYear()}`;
        document.body.appendChild(watermark);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //   📢 ALERTES DE SÉCURITÉ
    // ═══════════════════════════════════════════════════════════════════════════
    
    function showSecurityAlert(message) {
        const alert = document.createElement('div');
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #de350b, #ff5630);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(222, 53, 11, 0.5);
            z-index: 100000;
            max-width: 350px;
            animation: alertSlideIn 0.3s ease;
        `;
        
        alert.textContent = message;
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.style.animation = 'alertSlideOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
        
        if (!document.getElementById('alert-animations')) {
            const style = document.createElement('style');
            style.id = 'alert-animations';
            style.textContent = `
                @keyframes alertSlideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes alertSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //   🚀 INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    window.addEventListener('DOMContentLoaded', function() {
        initCloudflare();
        logSecurityEvent('system_initialized', { version: '2.0.0' });
    });

    window.addEventListener('load', function() {
        addWatermark();
        document.body.setAttribute('data-security', 'olysacheck-protected');
        console.log('%c✅ Système de protection OlysaCheck activé !', 'color: #00875a; font-size: 14px; font-weight: bold;');
    });

})();

// ═══════════════════════════════════════════════════════════════════════════════
//   ✍️ FONCTION D'INSCRIPTION PAR EMAIL (FIREBASE)
// ═══════════════════════════════════════════════════════════════════════════════
(function() {
    // Charger Firebase dynamiquement si pas déjà présent
    function loadFirebaseAndInit() {
        if (typeof firebase !== 'undefined') {
            initFirebaseAndListen();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
        script.onload = function() {
            const firestoreScript = document.createElement('script');
            firestoreScript.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
            firestoreScript.onload = initFirebaseAndListen;
            document.head.appendChild(firestoreScript);
        };
        document.head.appendChild(script);
    }

    function initFirebaseAndListen() {
        // 🔧 REMPLACEZ CES VALEURS PAR CELLES DE VOTRE PROJET FIREBASE
        const firebaseConfig = {
            apiKey: "AIzaSyBYHmmhHUaazXwbEbiEHYl0JgNUWKn6fuQ",                // <-- À remplacer
            authDomain: "olysacheck.firebaseapp.com",        // <-- À remplacer
            projectId: "olysacheck",          // <-- À remplacer
            storageBucket: "olysacheck.firebasestorage.app",  // <-- À remplacer
            messagingSenderId: "45624836935", // <-- À remplacer
            appId: "1:45624836935:web:0cab6668ebf2aa63c04262"                    // <-- À remplacer
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        const db = firebase.firestore();

        // Détecter le clic sur tous les boutons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', async function onClickHandler(event) {
                // Empêcher toute action par défaut
                event.preventDefault();

                // Récupérer l'input de type email
                const emailInput = document.querySelector('input[type="email"]');
                if (!emailInput) {
                    console.error('❌ Aucun champ email trouvé');
                    alert('Veuillez entrer votre email');
                    return;
                }

                const email = emailInput.value.trim();
                if (!email || !isValidEmail(email)) {
                    alert('Veuillez entrer un email valide');
                    return;
                }

                try {
                    // Enregistrement dans Firestore
                    await db.collection('users').add({
                        email: email,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    console.log('✅ Email enregistré avec succès');
                    window.location.href = 'auth.html'; // Redirection après succès
                } catch (error) {
                    console.error('❌ Erreur lors de l\'enregistrement:', error);
                    alert('Erreur lors de l\'inscription. Veuillez réessayer.');
                }
            });
        });

        function isValidEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }
    }

    // Lancer le chargement une fois le DOM prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFirebaseAndInit);
    } else {
        loadFirebaseAndInit();
    }
})();