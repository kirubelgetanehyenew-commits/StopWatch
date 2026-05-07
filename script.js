// State variables
let isRunning = false;
let startTime = 0;
let accumulatedTime = 0;
let timerAnimationFrame = null;

// DOM elements
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const lapBtn = document.getElementById('lapBtn');
const clearLapsBtn = document.getElementById('clearLapsBtn');
const lapsList = document.getElementById('lapsList');
const lapStatsSpan = document.getElementById('lapStats');

// Laps storage
let laps = [];
let lapCounter = 0;

// Format milliseconds to readable time
function formatTimeFromMs(totalMs) {
  if (totalMs < 0) totalMs = 0;
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const centiseconds = Math.floor((totalMs % 1000) / 10);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }
}

// Get current elapsed time
function getCurrentElapsedMs() {
  if (!isRunning) {
    return accumulatedTime;
  }
  const now = performance.now();
  return accumulatedTime + (now - startTime);
}

// Update timer display
function updateTimerDisplay() {
  const elapsedMs = getCurrentElapsedMs();
  timerDisplay.innerText = formatTimeFromMs(elapsedMs);
}

// Animation loop
function startAnimationLoop() {
  if (timerAnimationFrame) cancelAnimationFrame(timerAnimationFrame);
  function loop() {
    updateTimerDisplay();
    timerAnimationFrame = requestAnimationFrame(loop);
  }
  timerAnimationFrame = requestAnimationFrame(loop);
}

// Render laps list
function renderLaps() {
  if (laps.length === 0) {
    lapsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⏱️</div>
        <p>No laps recorded yet</p>
        <span>Press the lap button to track your splits</span>
      </div>
    `;
    lapStatsSpan.innerText = `0 Laps`;
    return;
  }
  
  lapStatsSpan.innerText = `${laps.length} ${laps.length === 1 ? 'Lap' : 'Laps'}`;
  
  let html = '';
  for (let i = 0; i < laps.length; i++) {
    const lap = laps[i];
    let diffText = '';
    
    if (i === 0) {
      diffText = `Started at ${lap.lapTimeFormatted}`;
    } else {
      const prevLapMs = laps[i-1].absoluteTimeMs;
      const currentLapMs = lap.absoluteTimeMs;
      const diffMs = currentLapMs - prevLapMs;
      const diffFormatted = formatTimeFromMs(diffMs);
      diffText = `+${diffFormatted}`;
    }
    
    html += `
      <div class="lap-item">
        <div class="lap-number">
          <div class="lap-badge">${lap.lapIndex}</div>
          <div class="lap-label">Lap ${lap.lapIndex}</div>
        </div>
        <div class="lap-time">${lap.lapTimeFormatted}</div>
        <div class="lap-diff">${diffText}</div>
      </div>
    `;
  }
  lapsList.innerHTML = html;
  
  // Auto-scroll to latest lap
  const wrapper = document.querySelector('.laps-list-wrapper');
  if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
}

// Record a lap
function recordLap() {
  const currentTotalMs = getCurrentElapsedMs();
  
  if (laps.length >= 50) {
    showNotification('⚠️ Maximum 50 laps reached! Clear some laps to continue.', 'error');
    return;
  }
  
  lapCounter++;
  const formattedMain = formatTimeFromMs(currentTotalMs);
  
  laps.push({
    lapIndex: lapCounter,
    lapTimeFormatted: formattedMain,
    absoluteTimeMs: currentTotalMs,
  });
  
  renderLaps();
  showNotification(`✅ Lap ${lapCounter} recorded: ${formattedMain}`, 'success');
}

// Clear all laps
function clearLaps() {
  if (laps.length === 0) return;
  laps = [];
  lapCounter = 0;
  renderLaps();
  showNotification('🗑️ All laps cleared', 'info');
}

// Start stopwatch
function startStopwatch() {
  if (isRunning) return;
  startTime = performance.now();
  isRunning = true;
  if (!timerAnimationFrame) {
    startAnimationLoop();
  }
  updateTimerDisplay();
}

// Pause stopwatch
function pauseStopwatch() {
  if (!isRunning) return;
  const now = performance.now();
  accumulatedTime += (now - startTime);
  isRunning = false;
  startTime = 0;
  updateTimerDisplay();
}

// Reset stopwatch
function resetStopwatch() {
  if (isRunning) {
    pauseStopwatch();
  }
  accumulatedTime = 0;
  startTime = 0;
  isRunning = false;
  clearLaps();
  lapCounter = 0;
  updateTimerDisplay();
  showNotification('🔄 Stopwatch reset', 'info');
}

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    border-left: 3px solid ${type === 'success' ? '#00d4ff' : type === 'error' ? '#f5576c' : '#fee140'};
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Keyboard shortcuts
function bindKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.target.matches('input, button, textarea')) {
      e.preventDefault();
      if (isRunning) pauseStopwatch();
      else startStopwatch();
    }
    if (e.code === 'KeyL' && !e.target.matches('input, button, textarea')) {
      e.preventDefault();
      recordLap();
    }
    if (e.code === 'KeyR' && !e.target.matches('input, button, textarea')) {
      e.preventDefault();
      resetStopwatch();
    }
    if (e.code === 'KeyC' && !e.ctrlKey && !e.target.matches('input, textarea')) {
      e.preventDefault();
      clearLaps();
    }
  });
}

// Event listeners
function initEventListeners() {
  startBtn.addEventListener('click', startStopwatch);
  pauseBtn.addEventListener('click', pauseStopwatch);
  resetBtn.addEventListener('click', resetStopwatch);
  lapBtn.addEventListener('click', recordLap);
  clearLapsBtn.addEventListener('click', clearLaps);
}

// Initialize app
function init() {
  initEventListeners();
  bindKeyboardShortcuts();
  startAnimationLoop();
  updateTimerDisplay();
  renderLaps();
  isRunning = false;
  accumulatedTime = 0;
  startTime = 0;
}

// Start the application
init();