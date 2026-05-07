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
    lapsList.innerHTML = `<div class="empty-laps">🏁 No laps recorded. Press 'Lap' to capture splits.</div>`;
    lapStatsSpan.innerText = `0 laps recorded`;
    return;
  }
  
  lapStatsSpan.innerText = `${laps.length} lap${laps.length !== 1 ? 's' : ''} recorded`;
  
  let html = '';
  for (let i = 0; i < laps.length; i++) {
    const lap = laps[i];
    let diffText = '';
    if (i === 0) {
      diffText = `start → ${lap.lapTimeFormatted}`;
    } else {
      const prevLapMs = laps[i-1].absoluteTimeMs;
      const currentLapMs = lap.absoluteTimeMs;
      const diffMs = currentLapMs - prevLapMs;
      const diffFormatted = formatTimeFromMs(diffMs);
      diffText = `+ ${diffFormatted}`;
    }
    html += `
      <div class="lap-item">
        <span class="lap-num">#${lap.lapIndex}</span>
        <span class="lap-time">⌚ ${lap.lapTimeFormatted}</span>
        <span style="font-size:0.75rem; opacity:0.8;">${diffText}</span>
      </div>
    `;
  }
  lapsList.innerHTML = html;
  const container = document.querySelector('.laps-list-container');
  if (container) container.scrollTop = container.scrollHeight;
}

// Record a lap
function recordLap() {
  const currentTotalMs = getCurrentElapsedMs();
  
  if (laps.length >= 50) {
    const notifMsg = document.createElement('div');
    notifMsg.textContent = '⚠️ Max 50 laps reached, clear some laps';
    notifMsg.style.position = 'fixed';
    notifMsg.style.bottom = '20px';
    notifMsg.style.left = '20px';
    notifMsg.style.backgroundColor = '#b91c1c';
    notifMsg.style.color = 'white';
    notifMsg.style.padding = '6px 12px';
    notifMsg.style.borderRadius = '30px';
    notifMsg.style.fontSize = '12px';
    notifMsg.style.zIndex = '999';
    document.body.appendChild(notifMsg);
    setTimeout(() => notifMsg.remove(), 1500);
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
}

// Clear all laps
function clearLaps() {
  laps = [];
  lapCounter = 0;
  renderLaps();
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
}

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