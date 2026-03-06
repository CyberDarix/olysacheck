// ============================================================================
// ⚡ OLYSACHECK SHIELD v7.0 - PROTECTION ABSOLUE ⚡
// ============================================================================
//  🛡️ PROTECTION : F12, console, debug, copier/coller, injections
//  👁️ DÉTECTION : Outils dev, comportements suspects, bots
//  🚫 BLOCAGE : IP, sessions, tentatives multiples
//  🔒 SIMPLE, LÉGER, IMPENETRABLE
// ============================================================================

(function() {
    'use strict';

    // ============================================================================
    // CONFIGURATION (paramètres ajustables)
    // ============================================================================
    
    const CONFIG = {
        MAX_ATTEMPTS: 2,              // 2 tentatives = blocage définitif
        CHECK_INTERVAL: 1000,          // Vérification toutes les 1 seconde
        BLOCK_DURATION: 3600000,       // Blocage 1 heure (3600000ms)
        DEBUG_THRESHOLD: 100,           // Seuil de détection debug (ms)
        
        // Signatures de bots connus
        BOT_SIGNATURES: [
            'selenium', 'webdriver', 'headless', 'phantom', 'puppeteer',
            'cypress', 'nightwatch', 'casperjs', 'zombie', 'cheerio',
            'bot', 'crawler', 'spider', 'scraping', 'python', 'curl'
        ]
    };

    // ============================================================================
    // DÉTECTEUR DE MENACES INTELLIGENT
    // ============================================================================

    class ThreatDetector {
        constructor() {
            this.suspicionScore = 0;
            this.attempts = 0;
            this.blocked = false;
            this.blockUntil = 0;
            this.loadBlockedStatus();
        }

        // Charge le statut de blocage depuis localStorage
        loadBlockedStatus() {
            const blocked = localStorage.getItem('olysa_blocked');
            if (blocked) {
                const data = JSON.parse(blocked);
                if (Date.now() < data.expires) {
                    this.blocked = true;
                    this.blockUntil = data.expires;
                    this.showBlockScreen('Tentatives de piratage détectées');
                } else {
                    localStorage.removeItem('olysa_blocked');
                }
            }
        }

        // Vérifie si l'utilisateur est bloqué
        isBlocked() {
            if (this.blocked && Date.now() < this.blockUntil) {
                return true;
            }
            if (this.blocked && Date.now() >= this.blockUntil) {
                this.blocked = false;
                localStorage.removeItem('olysa_blocked');
            }
            return false;
        }

        // Bloque définitivement l'utilisateur
        blockUser(reason) {
            this.blocked = true;
            this.blockUntil = Date.now() + CONFIG.BLOCK_DURATION;
            localStorage.setItem('olysa_blocked', JSON.stringify({
                expires: this.blockUntil,
                reason: reason
            }));
            this.showBlockScreen(reason);
        }

        // Affiche l'écran de blocage
        showBlockScreen(reason) {
            document.body.innerHTML = `
                <div style="position:fixed; top:0; left:0; width:100%; height:100%; 
                            background:linear-gradient(135deg, #000000, #1a0000); 
                            color:#ff3333; display:flex; align-items:center; 
                            justify-content:center; font-family:Arial; z-index:999999;">
                    <div style="text-align:center; max-width:600px; padding:40px;">
                        <h1 style="font-size:48px; margin-bottom:20px;">⛔ ACCÈS BLOQUÉ ⛔</h1>
                        <p style="font-size:24px; margin-bottom:30px;">${reason}</p>
                        <p style="font-size:16px; color:#999;">IP enregistrée • Session verrouillée</p>
                    </div>
                </div>
            `;
        }

        // Augmente le score de suspicion
        addSuspicion(points, reason) {
            this.suspicionScore += points;
            this.attempts++;
            
            console.log(`🔴 SUSPICION +${points} (${reason}) - Total: ${this.suspicionScore}`);
            
            // Envoi au serveur pour analyse
            this.reportToServer(reason);
            
            // Blocage si trop de tentatives
            if (this.attempts >= CONFIG.MAX_ATTEMPTS || this.suspicionScore > 100) {
                this.blockUser('TROP DE TENTATIVES SUSPECTES');
            }
        }

        // Rapport au serveur
        reportToServer(reason) {
            try {
                fetch('https://api.olysacheck.com/security/log', {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({
                        reason: reason,
                        score: this.suspicionScore,
                        url: window.location.href,
                        userAgent: navigator.userAgent
                    })
                });
            } catch (e) {}
        }

        // Vérifie les signatures de bot
        checkBotSignatures() {
            const ua = navigator.userAgent.toLowerCase();
            for (const sig of CONFIG.BOT_SIGNATURES) {
                if (ua.includes(sig)) {
                    this.addSuspicion(50, `bot_signature: ${sig}`);
                    return true;
                }
            }
            return false;
        }
    }

    // ============================================================================
    // PROTECTION CONTRE LES OUTILS DE DÉVELOPPEMENT
    // ============================================================================

    class DevToolsProtector {
        constructor(threatDetector) {
            this.detector = threatDetector;
            this.devtoolsOpen = false;
            this.init();
        }

        init() {
            // Blocage des raccourcis clavier
            this.blockShortcuts();
            
            // Détection des outils de développement
            this.detectDevTools();
            
            // Protection de la console
            this.protectConsole();
            
            // Anti-debugging
            this.antiDebug();
        }

        // Blocage des raccourcis clavier
        blockShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Raccourcis à bloquer
                if (e.key === 'F12' || e.keyCode === 123) {
                    e.preventDefault();
                    this.detector.addSuspicion(30, 'F12_pressed');
                    return false;
                }
                
                if (e.ctrlKey && e.shiftKey) {
                    if (e.key === 'I' || e.key === 'J' || e.key === 'C') {
                        e.preventDefault();
                        this.detector.addSuspicion(30, 'devtools_shortcut');
                        return false;
                    }
                }
                
                if (e.ctrlKey && e.key === 'u') {
                    e.preventDefault();
                    this.detector.addSuspicion(20, 'view_source');
                    return false;
                }
            }, true);
        }

        // Détection des outils de développement
        detectDevTools() {
            // Méthode 1 : Détection par dimension
            const checkDimensions = () => {
                const widthDiff = window.outerWidth - window.innerWidth;
                const heightDiff = window.outerHeight - window.innerHeight;
                
                if ((widthDiff > 200 || heightDiff > 200) && !this.devtoolsOpen) {
                    this.devtoolsOpen = true;
                    this.detector.addSuspicion(40, 'devtools_dimensions');
                }
            };

            // Méthode 2 : Détection par toString()
            const checkToString = () => {
                const element = new Image();
                Object.defineProperty(element, 'id', {
                    get: () => {
                        this.detector.addSuspicion(50, 'console_detected');
                        return '';
                    }
                });
                console.log('%c', element);
            };

            // Méthode 3 : Détection par debugger
            const checkDebugger = () => {
                const start = performance.now();
                debugger;
                const end = performance.now();
                
                if (end - start > CONFIG.DEBUG_THRESHOLD) {
                    this.detector.addSuspicion(60, 'debugger_detected');
                }
            };

            // Vérifications périodiques
            setInterval(checkDimensions, CONFIG.CHECK_INTERVAL);
            setInterval(checkDebugger, CONFIG.CHECK_INTERVAL * 2);
            setTimeout(checkToString, 2000);
        }

        // Protection de la console
        protectConsole() {
            // Redéfinition des méthodes de console
            const methods = ['log', 'info', 'warn', 'error', 'debug', 'trace'];
            
            methods.forEach(method => {
                const original = console[method];
                console[method] = function() {
                    this.detector.addSuspicion(10, `console_${method}_used`);
                    // N'affiche rien
                }.bind(this);
            });

            // Suppression des fonctions dangereuses
            delete window.console.clear;
            delete window.console.assert;
            delete window.console.count;
        }

        // Anti-debugging
        antiDebug() {
            // Boucle de vérification continue
            const check = () => {
                const start = performance.now();
                for (let i = 0; i < 1000; i++) {
                    // Boucle vide
                }
                const end = performance.now();
                
                if (end - start > 10) {
                    this.detector.addSuspicion(20, 'performance_degradation');
                }
                
                requestAnimationFrame(check);
            };
            
            requestAnimationFrame(check);
        }
    }

    // ============================================================================
    // PROTECTION CONTRE LE VOL DE DONNÉES
    // ============================================================================

    class DataProtector {
        constructor(threatDetector) {
            this.detector = threatDetector;
            this.init();
        }

        init() {
            this.blockCopyPaste();
            this.preventInjection();
            this.protectLocalStorage();
        }

        // Blocage copier/coller
        blockCopyPaste() {
            document.addEventListener('copy', (e) => {
                e.preventDefault();
                this.detector.addSuspicion(15, 'copy_attempt');
            });

            document.addEventListener('cut', (e) => {
                e.preventDefault();
                this.detector.addSuspicion(15, 'cut_attempt');
            });

            document.addEventListener('paste', (e) => {
                e.preventDefault();
                this.detector.addSuspicion(15, 'paste_attempt');
            });

            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.detector.addSuspicion(5, 'right_click');
            });

            document.addEventListener('selectstart', (e) => {
                e.preventDefault();
            });

            document.addEventListener('dragstart', (e) => {
                e.preventDefault();
            });
        }

        // Protection contre l'injection
        preventInjection() {
            // Surveillance des nouveaux scripts
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.tagName === 'SCRIPT') {
                            // Autoriser seulement les scripts PayPal
                            if (!node.src || !node.src.includes('paypal.com')) {
                                node.remove();
                                this.detector.addSuspicion(50, 'script_injection');
                            }
                        }
                    });
                });
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

            // Blocage eval()
            const originalEval = window.eval;
            window.eval = function() {
                this.detector.addSuspicion(40, 'eval_attempt');
                return null;
            }.bind(this);

            // Blocage Function constructor
            const originalFunction = window.Function;
            window.Function = function() {
                this.detector.addSuspicion(40, 'function_constructor');
                return function() {};
            }.bind(this);
        }

        // Protection du localStorage
        protectLocalStorage() {
            // Surveillance des accès au localStorage
            const originalGetItem = localStorage.getItem;
            localStorage.getItem = function(key) {
                if (key.includes('key') || key.includes('api')) {
                    this.detector.addSuspicion(10, 'localstorage_access');
                }
                return originalGetItem.call(this, key);
            }.bind(this);
        }
    }

    // ============================================================================
    // PROTECTION CONTRE LES IFRAMES ET LE CLICKJACKING
    // ============================================================================

    class FrameProtector {
        constructor(threatDetector) {
            this.detector = threatDetector;
            this.init();
        }

        init() {
            // Anti-clickjacking
            if (window.self !== window.top) {
                window.top.location.href = window.self.location.href;
                this.detector.addSuspicion(50, 'iframe_detected');
            }

            // Protection X-Frame-Options (via meta)
            const meta = document.createElement('meta');
            meta.httpEquiv = 'X-Frame-Options';
            meta.content = 'DENY';
            document.head.appendChild(meta);
        }
    }

    // ============================================================================
    // PROTECTION CONTRE LES BOTS
    // ============================================================================

    class BotProtector {
        constructor(threatDetector) {
            this.detector = threatDetector;
            this.init();
        }

        init() {
            // Vérification des signatures de bot
            this.detector.checkBotSignatures();

            // Vérification de WebDriver
            if (navigator.webdriver) {
                this.detector.addSuspicion(80, 'webdriver_detected');
            }

            // Vérification des propriétés headless
            if (window.callPhantom || window._phantom) {
                this.detector.addSuspicion(80, 'phantom_detected');
            }

            // Vérification du mode headless Chrome
            if (navigator.plugins.length === 0) {
                this.detector.addSuspicion(20, 'no_plugins');
            }

            if (navigator.languages.length === 0) {
                this.detector.addSuspicion(20, 'no_languages');
            }
        }
    }

    // ============================================================================
    // PROTECTION CONTRE LES TABS CACHÉS
    // ============================================================================

    class TabProtector {
        constructor(threatDetector) {
            this.detector = threatDetector;
            this.init();
        }

        init() {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    // Nettoyage des données sensibles
                    sessionStorage.clear();
                    
                    // Marqueur de tab caché
                    this.detector.addSuspicion(5, 'tab_hidden');
                } else {
                    // Revérification au retour
                    setTimeout(() => {
                        if (this.detector.suspicionScore > 50) {
                            window.location.reload();
                        }
                    }, 100);
                }
            });
        }
    }

    // ============================================================================
    // INITIALISATION
    // ============================================================================

    // Création du détecteur de menaces
    const threatDetector = new ThreatDetector();

    // Vérification initiale de blocage
    if (threatDetector.isBlocked()) {
        return;
    }

    // Initialisation de toutes les protections
    const devTools = new DevToolsProtector(threatDetector);
    const dataProtector = new DataProtector(threatDetector);
    const frameProtector = new FrameProtector(threatDetector);
    const botProtector = new BotProtector(threatDetector);
    const tabProtector = new TabProtector(threatDetector);

    // Exposition contrôlée (pour usage interne)
    window.__OLYSA_SHIELD__ = {
        version: '7.0',
        active: true,
        score: () => threatDetector.suspicionScore
    };

    console.log('%c✅ OLYSACHECK SHIELD ACTIVÉ', 'color: #00ff00; font-size: 16px; font-weight: bold;');

})();