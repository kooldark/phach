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
