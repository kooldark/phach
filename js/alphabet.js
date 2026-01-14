/**
 * ALPHABET FLASHCARDS
 * Flashcard học bảng chữ cái với hình ảnh động vật
 */

const CARDS = Object.freeze([
    { emoji: '🐊', letter: 'A', word: 'Alligator' },
    { emoji: '🐻', letter: 'B', word: 'Bear' },
    { emoji: '🐱', letter: 'C', word: 'Cat' },
    { emoji: '🐕', letter: 'D', word: 'Dog' },
    { emoji: '🐘', letter: 'E', word: 'Elephant' },
    { emoji: '🦊', letter: 'F', word: 'Fox' },
    { emoji: '🦍', letter: 'G', word: 'Gorilla' },
    { emoji: '🐴', letter: 'H', word: 'Horse' },
    { emoji: '🦎', letter: 'I', word: 'Iguana' },
    { emoji: '🐆', letter: 'J', word: 'Jaguar' },
    { emoji: '🦘', letter: 'K', word: 'Kangaroo' },
    { emoji: '🦙', letter: 'L', word: 'Llama' },
    { emoji: '🐵', letter: 'M', word: 'Monkey' },
    { emoji: '🦎', letter: 'N', word: 'Newt' },
    { emoji: '🐦', letter: 'O', word: 'Ostrich' },
    { emoji: '🐧', letter: 'P', word: 'Penguin' },
    { emoji: '🐦', letter: 'Q', word: 'Quail' },
    { emoji: '🦏', letter: 'R', word: 'Rhinoceros' },
    { emoji: '🐍', letter: 'S', word: 'Snake' },
    { emoji: '🐯', letter: 'T', word: 'Tiger' },
    { emoji: '🐦', letter: 'U', word: 'Umbrella bird' },
    { emoji: '🦅', letter: 'V', word: 'Vulture' },
    { emoji: '🦘', letter: 'W', word: 'Wombat' },
    { emoji: '🐿️', letter: 'X', word: 'Xerus' },
    { emoji: '🐃', letter: 'Y', word: 'Yak' },
    { emoji: '🦓', letter: 'Z', word: 'Zebra' }
]);

const COLORS = Object.freeze([
    'color-red', 'color-orange', 'color-yellow', 'color-green',
    'color-cyan', 'color-blue', 'color-purple', 'color-pink'
]);

// Cache DOM elements
const dom = {
    container: document.getElementById('container'),
    cardCount: document.getElementById('cardCount'),
    cardTotal: document.getElementById('cardTotal'),
    playBtn: document.getElementById('playBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    closeSettings: document.getElementById('closeSettings'),
    timerSlider: document.getElementById('timerSlider'),
    timerValue: document.getElementById('timerValue'),
    modeSelect: document.getElementById('modeSelect'),
    soundToggle: document.getElementById('soundToggle'),
    animationToggle: document.getElementById('animationToggle'),
    speedMultiplier: document.getElementById('speedMultiplier'),
    speedValue: document.getElementById('speedValue')
};

// State
const state = {
    currentIndex: 0,
    isPlaying: false,
    currentCard: null,
    autoplayInterval: null,
    isTransitioning: false
};

// Managers
const audioManager = new AudioManager();
let touchHandler;
let settingsSync;

// Initialize
function init() {
    dom.cardTotal.textContent = CARDS.length;
    
    // Setup settings UI
    settingsSync = new SettingsUISync({
        timerSlider: dom.timerSlider,
        timerValue: dom.timerValue,
        modeSelect: dom.modeSelect,
        soundToggle: dom.soundToggle,
        animationToggle: dom.animationToggle,
        speedMultiplier: dom.speedMultiplier,
        speedValue: dom.speedValue
    });

    // Setup controls
    attachEventListeners();
    setupSettingsPanel(dom.settingsBtn, dom.settingsPanel, dom.closeSettings);
    
    // Setup touch gestures
    touchHandler = new TouchGestureHandler(nextCard, previousCard);
    
    // Setup visibility handler
    setupVisibilityHandler(stopAutoplay, () => {
        if (state.isPlaying) startAutoplay();
    });

    // Display first card
    displayCard();
}

function attachEventListeners() {
    dom.playBtn.addEventListener('click', togglePlayPause);
    dom.nextBtn.addEventListener('click', nextCard);
    dom.prevBtn.addEventListener('click', previousCard);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoplay();
        } else if (state.isPlaying) {
            startAutoplay();
        }
    });

    window.addEventListener('beforeunload', cleanup);
}

function displayCard() {
    if (state.isTransitioning) return;
    state.isTransitioning = true;

    const mgr = window.settingsManager;
    const card = CARDS[state.currentIndex];
    const colorClass = COLORS[state.currentIndex % COLORS.length];

    dom.cardCount.textContent = state.currentIndex + 1;

    const createNewCard = () => {
        const newCard = document.createElement('div');
        newCard.className = `card ${colorClass}`;
        newCard.innerHTML = `
            <div class="card-content">
                <div>
                    <div class="emoji" aria-label="${card.word} ${card.letter}">${card.emoji}</div>
                </div>
                <div>
                    <div class="letter" aria-label="Letter ${card.letter}">${card.letter}</div>
                    <div class="word" aria-label="${card.word}">${card.word}</div>
                </div>
            </div>
        `;

        dom.container.appendChild(newCard);
        dom.container.className = colorClass;

        if (mgr && mgr.get('animationEnabled')) {
            requestAnimationFrame(() => newCard.classList.add('active'));
        } else {
            newCard.classList.add('active');
        }

        state.currentCard = newCard;
        state.isTransitioning = false;
        
        // Play sound
        const freq = 400 + (card.letter.charCodeAt(0) - 65) * 20;
        audioManager.playMultiTone([freq, freq + 100], 0.1, 0.3);
    };

    if (state.currentCard) {
        state.currentCard.classList.add('exit');
        setTimeout(() => {
            if (state.currentCard?.parentNode) state.currentCard.remove();
            createNewCard();
        }, 500);
    } else {
        createNewCard();
    }
}

function nextCard() {
    if (state.isTransitioning) return;
    stopAutoplay();

    const mgr = window.settingsManager;
    if (mgr && mgr.get('mode') === 'random') {
        state.currentIndex = Math.floor(Math.random() * CARDS.length);
    } else {
        state.currentIndex = (state.currentIndex + 1) % CARDS.length;
    }
    displayCard();

    if (state.isPlaying) {
        setTimeout(startAutoplay, 600);
    }
}

function previousCard() {
    if (state.isTransitioning) return;
    stopAutoplay();
    state.currentIndex = (state.currentIndex - 1 + CARDS.length) % CARDS.length;
    displayCard();

    if (state.isPlaying) {
        setTimeout(startAutoplay, 600);
    }
}

function togglePlayPause() {
    state.isPlaying = !state.isPlaying;
    dom.playBtn.textContent = state.isPlaying ? '⏸' : '▶';

    if (state.isPlaying) {
        startAutoplay();
    } else {
        stopAutoplay();
    }
}

function startAutoplay() {
    if (state.autoplayInterval) return;

    const mgr = window.settingsManager;
    const duration = mgr ? mgr.get('cardDuration') : 4;
    state.autoplayInterval = setInterval(nextCard, duration * 1000);
}

function stopAutoplay() {
    if (state.autoplayInterval) {
        clearInterval(state.autoplayInterval);
        state.autoplayInterval = null;
    }
}

function cleanup() {
    stopAutoplay();
    audioManager.close();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}