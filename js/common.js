/**
 * COMMON UTILITIES - Các hàm dùng chung
 * Tránh lặp code giữa các trang
 */

// ============================================
// TOUCH GESTURES - Xử lý cử chỉ chạm
// ============================================

class TouchGestureHandler {
    constructor(onSwipeLeft = null, onSwipeRight = null) {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.onSwipeLeft = onSwipeLeft;
        this.onSwipeRight = onSwipeRight;
        this.attach();
    }

    attach() {
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), false);
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), false);
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), false);
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;
    }

    handleTouchMove(e) {
        e.preventDefault();
    }

    handleTouchEnd(e) {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = this.touchStartX - touchEndX;
        const diffY = Math.abs(this.touchStartY - touchEndY);

        if (Math.abs(diffX) > diffY && Math.abs(diffX) > 50) {
            if (diffX > 0 && this.onSwipeLeft) {
                this.onSwipeLeft();
            } else if (diffX < 0 && this.onSwipeRight) {
                this.onSwipeRight();
            }
        }
    }
}

// ============================================
// AUDIO CONTEXT - Quản lý âm thanh
// ============================================

class AudioManager {
    constructor() {
        this.audioContext = null;
    }

    getContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    playTone(frequency = 400, duration = 0.5, gain = 0.3) {
        try {
            if (!window.settingsManager || !window.settingsManager.get('soundEnabled')) {
                return;
            }

            const ctx = this.getContext();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.frequency.value = frequency;
            osc.type = 'sine';

            gainNode.gain.setValueAtTime(gain, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.log('Audio not available:', e.message);
        }
    }

    playMultiTone(frequencies = [], delayBetween = 0.1, duration = 0.3) {
        frequencies.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, duration);
            }, idx * delayBetween * 1000);
        });
    }

    close() {
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// ============================================
// SETTINGS UI SYNC - Đồng bộ UI với Settings
// ============================================

class SettingsUISync {
    constructor(elements = {}) {
        this.elements = elements;
        this.attachListeners();
        this.syncUI();
    }

    attachListeners() {
        if (this.elements.timerSlider) {
            this.elements.timerSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (window.settingsManager) {
                    window.settingsManager.set('cardDuration', val);
                }
                if (this.elements.timerValue) {
                    this.elements.timerValue.textContent = val;
                }
            });
        }

        if (this.elements.modeSelect) {
            this.elements.modeSelect.addEventListener('change', (e) => {
                if (window.settingsManager) {
                    window.settingsManager.set('mode', e.target.value);
                }
            });
        }

        if (this.elements.soundToggle) {
            this.elements.soundToggle.addEventListener('change', (e) => {
                if (window.settingsManager) {
                    window.settingsManager.set('soundEnabled', e.target.checked);
                }
            });
        }

        if (this.elements.animationToggle) {
            this.elements.animationToggle.addEventListener('change', (e) => {
                if (window.settingsManager) {
                    window.settingsManager.set('animationEnabled', e.target.checked);
                }
            });
        }

        if (this.elements.speedMultiplier) {
            this.elements.speedMultiplier.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (window.settingsManager) {
                    window.settingsManager.set('animationSpeed', val);
                }
                if (this.elements.speedValue) {
                    this.elements.speedValue.textContent = val + 'x';
                }
            });
        }

        // Listen for external changes
        if (window.settingsManager) {
            window.settingsManager.onChange(() => this.syncUI());
        }
    }

    syncUI() {
        if (!window.settingsManager) return;
        const mgr = window.settingsManager;

        if (this.elements.timerSlider) {
            this.elements.timerSlider.value = mgr.get('cardDuration');
            if (this.elements.timerValue) {
                this.elements.timerValue.textContent = mgr.get('cardDuration');
            }
        }

        if (this.elements.modeSelect) {
            this.elements.modeSelect.value = mgr.get('mode');
        }

        if (this.elements.soundToggle) {
            this.elements.soundToggle.checked = mgr.get('soundEnabled');
        }

        if (this.elements.animationToggle) {
            this.elements.animationToggle.checked = mgr.get('animationEnabled');
        }

        if (this.elements.speedMultiplier) {
            this.elements.speedMultiplier.value = mgr.get('animationSpeed');
            if (this.elements.speedValue) {
                this.elements.speedValue.textContent = mgr.get('animationSpeed') + 'x';
            }
        }
    }
}

// ============================================
// ANIMATION SPEED - Cập nhật tốc độ animation
// ============================================

function updateAnimationSpeed(speed = null) {
    if (speed === null && window.settingsManager) {
        speed = window.settingsManager.get('animationSpeed');
    }
    if (!speed) speed = 1;

    // Remove old style tag if exists
    const oldStyle = document.getElementById('animation-speed-style');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.id = 'animation-speed-style';
    style.textContent = `
        @keyframes slideIn { animation-duration: ${0.7 / speed}s !important; }
        @keyframes slideOut { animation-duration: ${0.5 / speed}s !important; }
        @keyframes float { animation-duration: ${3 / speed}s !important; }
        @keyframes bounce { animation-duration: ${0.6 / speed}s !important; }
        @keyframes pulse { animation-duration: ${1 / speed}s !important; }
        @keyframes rotate { animation-duration: ${4 / speed}s !important; }
        @keyframes wiggle { animation-duration: ${2 / speed}s !important; }
        @keyframes twinkle { animation-duration: ${2.5 / speed}s !important; }
    `;
    document.head.appendChild(style);
}

// ============================================
// SETTINGS PANEL TOGGLE
// ============================================

function setupSettingsPanel(settingsBtn, settingsPanel, closeSettings) {
    const toggleSettings = () => {
        settingsPanel.classList.toggle('open');
        settingsBtn.setAttribute('aria-expanded', settingsPanel.classList.contains('open'));
    };

    settingsBtn.addEventListener('click', toggleSettings);
    closeSettings.addEventListener('click', toggleSettings);

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (settingsPanel.classList.contains('open') &&
            !settingsPanel.contains(e.target) &&
            !settingsBtn.contains(e.target)) {
            toggleSettings();
        }
    });
}

// ============================================
// VISIBILITY CHANGE - Dừng khi tab ẩn
// ============================================

function setupVisibilityHandler(onHidden = null, onVisible = null) {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (onHidden) onHidden();
        } else {
            if (onVisible) onVisible();
        }
    });
}