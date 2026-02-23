// ═══════════════════════════════════════════════════════════════════════════════
//   🛡️ OLYSACHECK - SYSTÈME DE PROTECTION ULTRA-OPTIMISÉ
// ═══════════════════════════════════════════════════════════════════════════════
//   Version: 3.2.0 ULTRA OPTIMISÉE
//   Auteur: OlysaCheck Security Team
//   Description: Protection professionnelle, légère et rapide (99% optimisé)
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    //   ⚙️ CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    const CLOUDFLARE_SITE_KEY = '0x4AAAAAACYgcx0uveRtk5Z6';
    const MAX_ATTEMPTS = 3;
    
    let verificationAttempts = 0;

    // ═══════════════════════════════════════════════════════════════════════════
    //   🤖 DÉTECTION DE BOTS (ULTRA LÉGER)
    // ═══════════════════════════════════════════════════════════════════════════
    
    const BotDetector = {
        suspicionScore: 0,

        checkWebDriver() {
            if (navigator.webdriver) this.suspicionScore += 30;
        },

        checkPhantom() {
            if (window.callPhantom || window._phantom) this.suspicionScore += 30;
        },

        checkSelenium() {
            const attrs = ['selenium', 'webdriver', 'driver'];
            if (attrs.some(attr => document.documentElement.getAttribute(attr))) {
                this.suspicionScore += 30;
            }
        },

        trackMouseMovement() {
            let moved = false;
            const handler = () => { moved = true; };
            document.addEventListener('mousemove', handler, { once: true });
            setTimeout(() => { if (!moved) this.suspicionScore += 15; }, 3000);
        },

        analyzeScore() {
            if (this.suspicionScore >= 40) return { isBot: true };
            if (this.suspicionScore >= 20) return { isBot: true };
            return { isBot: false };
        },

        runAllChecks() {
            this.checkWebDriver();
            this.checkPhantom();
            this.checkSelenium();
            this.trackMouseMovement();
            return this.analyzeScore();
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    //   🤖 CLOUDFLARE TURNSTILE
    // ═══════════════════════════════════════════════════════════════════════════
    
    function initCloudflare() {
        if (sessionStorage.getItem('turnstile_verified') === 'true') return;

        const botAnalysis = BotDetector.runAllChecks();
        
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => showChallenge(botAnalysis);
        script.onerror = () => showChallenge(botAnalysis);
        document.head.appendChild(script);
    }

    function showChallenge(botAnalysis) {
        const overlay = document.createElement('div');
        overlay.id = 'cloudflare-verification-overlay';
        overlay.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:linear-gradient(135deg,#001a4d,#0052cc,#0747a6);
            display:flex; align-items:center; justify-content:center; z-index:999999;
            backdrop-filter:blur(10px);
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            background:white; padding:40px; border-radius:24px; box-shadow:0 32px 64px rgba(0,0,0,0.5);
            text-align:center; max-width:450px; animation:scaleIn 0.5s ease;
        `;

        const msg = botAnalysis.isBot ? 'Vérification de sécurité requise' : 'Veuillez confirmer que vous êtes humain';

        container.innerHTML = `
            <div style="width:70px; height:70px; margin:0 auto 20px; background:linear-gradient(135deg,#0052cc,#4c9aff); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:35px; color:white; font-weight:900;">O</div>
            <h2 style="color:#172b4d; font-size:24px; margin-bottom:10px;">Vérification</h2>
            <p style="color:#6b778c; font-size:15px; margin-bottom:20px;">${msg}</p>
            <div id="turnstile-widget" style="min-height:70px; margin:15px 0;"></div>
            <div id="manual-verify-container" style="display:none;">
                <button id="manual-verify-btn" style="background:#0052cc; color:white; border:none; padding:12px 30px; border-radius:30px; cursor:pointer; font-weight:600;">Vérifier</button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
            @keyframes fadeOut { to { opacity:0; } }
        `;
        document.head.appendChild(style);

        overlay.appendChild(container);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            if (!document.getElementById('turnstile-widget').children.length) {
                document.getElementById('manual-verify-container').style.display = 'block';
                document.getElementById('manual-verify-btn').onclick = () => success('manual', overlay);
            }
        }, 2000);

        if (typeof turnstile !== 'undefined') {
            try {
                turnstile.render('#turnstile-widget', {
                    sitekey: CLOUDFLARE_SITE_KEY,
                    callback: (token) => success(token, overlay),
                    'error-callback': () => error(overlay),
                    theme: 'light'
                });
            } catch (e) {
                document.getElementById('manual-verify-container').style.display = 'block';
            }
        }
    }

    function success(token, overlay) {
        sessionStorage.setItem('turnstile_verified', 'true');
        setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 500);
        }, 1000);
    }

    function error(overlay) {
        verificationAttempts++;
        if (verificationAttempts >= MAX_ATTEMPTS) {
            window.location.href = 'about:blank';
        } else {
            document.getElementById('manual-verify-container').style.display = 'block';
            document.getElementById('manual-verify-btn').onclick = () => success('manual', overlay);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //   🔒 PROTECTIONS ESSENTIELLES
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Clic droit
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Raccourcis clavier
    const blockedKeys = [
        { key: 'F12', code: 123 },
        { ctrl: true, shift: true, key: 'I', code: 73 },
        { ctrl: true, shift: true, key: 'J', code: 74 },
        { ctrl: true, shift: true, key: 'C', code: 67 },
        { ctrl: true, key: 'U', code: 85 }
    ];

    document.addEventListener('keydown', (e) => {
        if (blockedKeys.some(b => 
            (b.ctrl ? e.ctrlKey : true) &&
            (b.shift ? e.shiftKey : true) &&
            (e.key === b.key || e.keyCode === b.code)
        )) {
            e.preventDefault();
        }
    });

    // Anti-copie
    ['copy', 'cut', 'selectstart'].forEach(ev => 
        document.addEventListener(ev, (e) => e.preventDefault())
    );

    // Protection images
    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') e.preventDefault();
    });

    // Anti-clickjacking
    if (window.top !== window.self) window.top.location.href = window.self.location.href;

    // ═══════════════════════════════════════════════════════════════════════════
    //   🎨 WATERMARK
    // ═══════════════════════════════════════════════════════════════════════════
    
    function addWatermark() {
        const wm = document.createElement('div');
        wm.style.cssText = `
            position:fixed; bottom:8px; right:8px; padding:6px 10px;
            background:rgba(0,82,204,0.1); border-radius:6px;
            font-size:10px; color:#0052cc; pointer-events:none; z-index:9999;
        `;
        wm.textContent = `🛡️ OlysaCheck`;
        document.body.appendChild(wm);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //   🚀 INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    window.addEventListener('DOMContentLoaded', initCloudflare);
    window.addEventListener('load', () => {
        addWatermark();
        document.body.setAttribute('data-security', 'active');
        console.log('%c✅ OlysaCheck Protection Active', 'color: #0052cc; font-weight: bold;');
    });

})();

// Firebase supprimé - Version 3.2.0 ultra optimisée