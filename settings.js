/**
 * Unified Settings Manager - Shared across all app pages
 * Cung cấp API thống nhất để quản lý settings cho toàn bộ ứng dụng
 */

class SettingsManager {
    constructor() {
        this.storageKey = 'kidAppSettings';
        this.defaults = {
            cardDuration: 4,        // seconds
            mode: 'sequential',     // sequential, random
            soundEnabled: true,
            animationEnabled: true,
            animationSpeed: 1,      // 0.5 - 2x
            autoplayEnabled: false,
            reduceMotion: false
        };
        this.settings = this.load();
        this.listeners = [];
    }

    /**
     * Load settings from localStorage or return defaults
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return { ...this.defaults, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        return { ...this.defaults };
    }

    /**
     * Save settings to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            this.notifyListeners();
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    /**
     * Get a setting value
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default if not found
     */
    get(key, defaultValue = null) {
        return this.settings.hasOwnProperty(key) ? this.settings[key] : defaultValue;
    }

    /**
     * Set a setting value
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    set(key, value) {
        if (this.settings[key] !== value) {
            this.settings[key] = value;
            this.save();
        }
    }

    /**
     * Update multiple settings at once
     * @param {Object} updates - Object with key-value pairs
     */
    update(updates) {
        Object.keys(updates).forEach(key => {
            this.settings[key] = updates[key];
        });
        this.save();
    }

    /**
     * Reset to defaults
     */
    reset() {
        this.settings = { ...this.defaults };
        this.save();
    }

    /**
     * Subscribe to settings changes
     * @param {Function} callback - Function to call when settings change
     * @returns {Function} Unsubscribe function
     */
    onChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners of changes
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.settings);
            } catch (e) {
                console.error('Settings listener error:', e);
            }
        });
    }

    /**
     * Check if reduce motion is preferred by system
     */
    isPrefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Get animation duration considering speed multiplier
     * @param {number} baseDuration - Base duration in seconds
     */
    getAnimationDuration(baseDuration = 0.5) {
        if (this.isPrefersReducedMotion() || !this.get('animationEnabled')) {
            return 0;
        }
        return baseDuration / this.get('animationSpeed');
    }
}

// Create global instance
window.settingsManager = new SettingsManager();

// Auto-detect system's prefers-reduced-motion
if (window.settingsManager.isPrefersReducedMotion()) {
    window.settingsManager.set('animationEnabled', false);
}

// ============================================
// SETTINGS UI - Tạo giao diện settings
// ============================================

class SettingsUI {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Initialize settings panel UI on page
     * Gọi hàm này ở mỗi trang để hiển thị settings
     */
    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Inject CSS
        this.injectStyles();

        // Create HTML
        this.createPanel();

        // Attach event listeners
        this.attachListeners();
    }

    /**
     * Inject CSS for settings panel
     */
    injectStyles() {
        const styleId = 'settings-ui-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Settings Panel Styles */
            .settings-btn {
                position: fixed;
                top: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: white;
                color: #333;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 101;
                transition: all 0.3s ease;
            }

            .settings-btn:hover {
                transform: rotate(20deg) scale(1.1);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
            }

            .settings-panel {
                position: fixed;
                top: 0;
                right: 0;
                width: 320px;
                height: 100vh;
                background: white;
                box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
                transform: translateX(100%);
                transition: transform 0.3s ease;
                z-index: 102;
                overflow-y: auto;
                padding: 20px;
            }

            .settings-panel.open {
                transform: translateX(0);
            }

            .settings-panel h2 {
                font-size: 20px;
                margin-bottom: 20px;
                color: #333;
            }

            .settings-group {
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }

            .settings-group label {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                cursor: pointer;
                font-size: 14px;
                color: #555;
            }

            .settings-group input[type="range"] {
                width: 100%;
                height: 6px;
                cursor: pointer;
            }

            .settings-group input[type="checkbox"] {
                width: 18px;
                height: 18px;
                margin-right: 10px;
                cursor: pointer;
            }

            .settings-group select {
                width: 100%;
                padding: 8px 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
            }

            .slider-value {
                display: inline-block;
                margin-left: auto;
                font-weight: 600;
                color: #667eea;
            }

            .close-settings {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-settings:hover {
                color: #333;
            }

            .reset-btn {
                width: 100%;
                padding: 10px;
                margin-top: 20px;
                background: #f0f0f0;
                border: 2px solid #ddd;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                color: #555;
                transition: all 0.3s ease;
            }

            .reset-btn:hover {
                background: #e0e0e0;
                border-color: #999;
            }

            @media (max-width: 768px) {
                .settings-btn {
                    top: 20px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                    font-size: 20px;
                }

                .settings-panel {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Create settings panel HTML
     */
    createPanel() {
        // Check if already exists
        if (document.getElementById('settingsBtn')) return;

        // Create button
        const btn = document.createElement('button');
        btn.id = 'settingsBtn';
        btn.className = 'settings-btn';
        btn.textContent = '⚙️';
        btn.title = 'Settings';
        btn.setAttribute('aria-label', 'Open settings');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'settingsPanel');

        // Create panel
        const panel = document.createElement('div');
        panel.id = 'settingsPanel';
        panel.className = 'settings-panel';
        panel.role = 'dialog';
        panel.setAttribute('aria-labelledby', 'settingsTitle');

        panel.innerHTML = `
            <button class="close-settings" id="closeSettings" aria-label="Close settings">✕</button>
            <h2 id="settingsTitle">⚙️ Settings</h2>

            <div class="settings-group">
                <label for="timerSlider">Card Duration (seconds):
                    <span class="slider-value"><span id="timerValue">4</span>s</span>
                </label>
                <input type="range" id="timerSlider" min="2" max="10" value="4" step="1" aria-label="Card display duration in seconds">
            </div>

            <div class="settings-group">
                <label for="modeSelect">Display Mode:</label>
                <select id="modeSelect" aria-label="Choose between sequential or random card display">
                    <option value="sequential">Sequential</option>
                    <option value="random">Random</option>
                </select>
            </div>

            <div class="settings-group">
                <label>
                    <input type="checkbox" id="soundToggle" checked aria-label="Toggle sound effects on or off">
                    Enable Sound Effects
                </label>
            </div>

            <div class="settings-group">
                <label>
                    <input type="checkbox" id="animationToggle" checked aria-label="Toggle card animations on or off">
                    Enable Animations
                </label>
            </div>

            <div class="settings-group">
                <label for="speedMultiplier">Animation Speed:
                    <span class="slider-value" id="speedValue">1x</span>
                </label>
                <input type="range" id="speedMultiplier" min="0.5" max="2" value="1" step="0.25" aria-label="Adjust animation playback speed">
            </div>

            <button class="reset-btn" id="resetBtn">Reset to Defaults</button>
        `;

        document.body.appendChild(btn);
        document.body.appendChild(panel);
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        const btn = document.getElementById('settingsBtn');
        const panel = document.getElementById('settingsPanel');
        const closeBtn = document.getElementById('closeSettings');
        const resetBtn = document.getElementById('resetBtn');

        // Toggle panel
        const toggle = () => {
            panel.classList.toggle('open');
            btn.setAttribute('aria-expanded', panel.classList.contains('open'));
        };

        btn.addEventListener('click', toggle);
        closeBtn.addEventListener('click', toggle);

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (panel.classList.contains('open') &&
                !panel.contains(e.target) &&
                !btn.contains(e.target)) {
                toggle();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('open')) {
                toggle();
            }
        });

        // Settings controls
        const timerSlider = document.getElementById('timerSlider');
        const timerValue = document.getElementById('timerValue');
        const modeSelect = document.getElementById('modeSelect');
        const soundToggle = document.getElementById('soundToggle');
        const animationToggle = document.getElementById('animationToggle');
        const speedMultiplier = document.getElementById('speedMultiplier');
        const speedValue = document.getElementById('speedValue');

        // Timer
        timerSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            timerValue.textContent = val;
            window.settingsManager.set('cardDuration', val);
        });

        // Mode
        modeSelect.addEventListener('change', (e) => {
            window.settingsManager.set('mode', e.target.value);
        });

        // Sound
        soundToggle.addEventListener('change', (e) => {
            window.settingsManager.set('soundEnabled', e.target.checked);
        });

        // Animation
        animationToggle.addEventListener('change', (e) => {
            window.settingsManager.set('animationEnabled', e.target.checked);
            if (window.updateAnimationSpeed) {
                window.updateAnimationSpeed();
            }
        });

        // Speed
        speedMultiplier.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            speedValue.textContent = val + 'x';
            window.settingsManager.set('animationSpeed', val);
            if (window.updateAnimationSpeed) {
                window.updateAnimationSpeed();
            }
        });

        // Reset button
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all settings to defaults?')) {
                window.settingsManager.reset();
                this.syncUI();
            }
        });

        // Sync UI on settings change
        window.settingsManager.onChange(() => this.syncUI());

        // Initial sync
        this.syncUI();
    }

    /**
     * Sync UI with settings
     */
    syncUI() {
        const mgr = window.settingsManager;

        const timerSlider = document.getElementById('timerSlider');
        const timerValue = document.getElementById('timerValue');
        const modeSelect = document.getElementById('modeSelect');
        const soundToggle = document.getElementById('soundToggle');
        const animationToggle = document.getElementById('animationToggle');
        const speedMultiplier = document.getElementById('speedMultiplier');
        const speedValue = document.getElementById('speedValue');

        if (timerSlider) {
            timerSlider.value = mgr.get('cardDuration');
            timerValue.textContent = mgr.get('cardDuration');
        }

        if (modeSelect) {
            modeSelect.value = mgr.get('mode');
        }

        if (soundToggle) {
            soundToggle.checked = mgr.get('soundEnabled');
        }

        if (animationToggle) {
            animationToggle.checked = mgr.get('animationEnabled');
        }

        if (speedMultiplier) {
            speedMultiplier.value = mgr.get('animationSpeed');
            speedValue.textContent = mgr.get('animationSpeed') + 'x';
        }
    }
}

// Create global settings UI instance
window.settingsUI = new SettingsUI();

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.settingsUI.init();
    });
} else {
    window.settingsUI.init();
}

