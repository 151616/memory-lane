// script.js - particles, scroll interactions, and reveal logic

// Smooth auto-scrolling for Start button with pause-on-user-scroll and continue control
const startBtn = document.getElementById('startBtn');
let autoScrolling = false;
let userPaused = false;
let rafId = null;
let lastTime = null;

// speeds (px per second)
const SPEED_FAST = 220; // when on top of an image
const SPEED_SLOW = 36;  // when caption visible for reading
const SPEED_NORMAL = 80;

// Create a floating Continue button (hidden until needed)
const continueBtn = document.createElement('button');
continueBtn.id = 'continueBtn';
continueBtn.className = 'continue-btn';
continueBtn.textContent = 'Continue';
continueBtn.style.display = 'none';
document.body.appendChild(continueBtn);

continueBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  userPaused = false;
  continueBtn.style.display = 'none';
  // resume animation loop
  if (autoScrolling && !rafId) lastTime = null, rafId = requestAnimationFrame(step);
});
function computeSpeed() {
  // Determine if currently over an image or caption
  const memories = document.querySelectorAll('.memory');
  for (const m of memories) {
    const photo = m.querySelector('.photo');
    const caption = m.querySelector('.caption');
    if (!photo || !caption) continue;
    const pRect = photo.getBoundingClientRect();
    const cRect = caption.getBoundingClientRect();
    // if photo is prominently visible in viewport => fast
    if (pRect.top < window.innerHeight * 0.5 && pRect.bottom > window.innerHeight * 0.15) return SPEED_FAST;
    // if caption is in readable area => slow
    if (cRect.top < window.innerHeight * 0.8 && cRect.bottom > window.innerHeight * 0.25) return SPEED_SLOW;
  }

  return SPEED_NORMAL;
}

// Confetti: spawn simple colored rectangles that fall and rotate
function spawnConfetti(count){
  const colors = ['#ff9fb6','#ffd6e8','#ffe1c6','#ffc6d8','#f7c9b6'];
  for(let i=0;i<count;i++){
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.background = colors[i % colors.length];
    el.style.left = (Math.random()*100) + '%';
    el.style.top = (-Math.random()*10) + 'vh';
    el.style.width = (8 + Math.random()*12) + 'px';
    el.style.height = (10 + Math.random()*18) + 'px';
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    const dur = 2000 + Math.random()*1800;
    el.style.animation = `confetti-fall ${dur}ms linear 0ms forwards`;
    document.body.appendChild(el);
    // remove after animation
    setTimeout(()=> el.remove(), dur + 200);
  }
}

// Smooth audio fade helpers
function fadeInMusic(targetVolume = 1.0, duration = 2000){
  if(!bgMusic) return Promise.reject(new Error('no-audio'));
  bgMusic.volume = 0;
  const playPromise = bgMusic.play();
  const startFade = () => {
    const start = performance.now();
    function tick(now){
      const t = Math.min(1, (now - start)/duration);
      try{ bgMusic.volume = t * targetVolume; }catch(e){}
      if(t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  if (playPromise && typeof playPromise.then === 'function'){
    return playPromise.then(()=>{ startFade(); }).catch((err)=>{ return Promise.reject(err); });
  } else {
    // older browsers may not return a promise
    try{ startFade(); }catch(e){}
    return Promise.resolve();
  }
}

function fadeOutMusic(duration = 800){
  if(!bgMusic) return;
  const startVol = bgMusic.volume || 1;
  const start = performance.now();
  function tick(now){
    const t = Math.min(1, (now - start)/duration);
    bgMusic.volume = startVol * (1 - t);
    if(t < 1) requestAnimationFrame(tick); else bgMusic.pause();
  }
  requestAnimationFrame(tick);
}

function step(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  if (!autoScrolling || userPaused) {
    rafId = null;
    return;
  }

  const speed = computeSpeed();
  window.scrollBy(0, speed * delta);

  // Stop at bottom
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
    autoScrolling = false;
    rafId = null;
    continueBtn.style.display = 'none';
    return;
  }

  rafId = requestAnimationFrame(step);
}

function startAutoScroll() {
  if (autoScrolling) return;
  autoScrolling = true;
  userPaused = false;
  if (typeof heartBoost === 'function') heartBoost();
  if (rafId) cancelAnimationFrame(rafId);
  lastTime = null;
  rafId = requestAnimationFrame(step);
}

function pauseForUser() {
  if (!autoScrolling || userPaused) return;
  userPaused = true;
  continueBtn.style.display = 'block';
  // cancel next frame so loop will pause
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

startBtn.addEventListener('click', () => {
  // start the auto-scroll journey
  startAutoScroll();
});

// If user interacts (wheel, touch, pointer, key nav), pause auto-scroll and show continue
['wheel','touchstart','pointerdown'].forEach(ev => window.addEventListener(ev, ()=>{
  // allow small scroll gestures without pausing if not auto-scrolling
  if (autoScrolling) pauseForUser();
}, { passive: true }));

window.addEventListener('keydown', (e)=>{
  const keys = ['ArrowDown','ArrowUp','PageDown','PageUp',' '];
  if (keys.includes(e.key) && autoScrolling) pauseForUser();
});

// Typewriter subtitle (option 3)
const typedSubtitleEl = document.getElementById('typedSubtitle');
const typedText = "Happy Valentines, baby! I hope you like itt"; // replaceable text
function typeWriter(el, text, delay = 60){
  el.textContent = '';
  el.classList.add('cursor');
  let i = 0;
  const timer = setInterval(()=>{
    el.textContent += text.charAt(i);
    i++;
    if(i >= text.length){ clearInterval(timer); el.classList.remove('cursor') }
  }, delay);
}
// Start typing after short delay
setTimeout(()=> typeWriter(typedSubtitleEl, typedText, 60), 700);

// Background music controls (option 4)
const musicToggle = document.getElementById('musicToggle');
const bgMusic = document.getElementById('bgMusic');

// Audio prompt in case autoplay is blocked
const audioPrompt = document.createElement('button');
audioPrompt.className = 'audio-prompt';
audioPrompt.textContent = 'Enable audio';
document.body.appendChild(audioPrompt);
audioPrompt.addEventListener('click', ()=>{
  // user gesture - try to start music with fade
  fadeInMusic(1.0, 1400).then(()=>{
    updateMusicUI(true);
    audioPrompt.style.display = 'none';
  }).catch(()=>{
    audioPrompt.style.display = 'none';
  });
});

function updateMusicUI(isPlaying){
  if(!musicToggle) return;
  if(isPlaying){
    musicToggle.classList.add('active');
    musicToggle.textContent = 'Pause Music';
  } else {
    musicToggle.classList.remove('active');
    musicToggle.textContent = 'Play Music';
  }
}

function toggleMusic(){
  if(!bgMusic) return;
  if(bgMusic.paused){
    // fade-in instead of abrupt play and update UI when play succeeds
    const p = fadeInMusic(1.0, 1800);
    if (p && typeof p.then === 'function'){
      p.then(()=>{
        updateMusicUI(true);
        try{ localStorage.setItem('ourstory.music', '1') }catch(e){}
        if (typeof heartBoost === 'function') heartBoost();
      }).catch(()=>{
        updateMusicUI(false);
      });
    } else {
      updateMusicUI(true);
      try{ localStorage.setItem('ourstory.music', '1') }catch(e){}
      if (typeof heartBoost === 'function') heartBoost();
    }
  } else {
    // fade out gracefully
    fadeOutMusic(700);
    updateMusicUI(false);
    try{ localStorage.setItem('ourstory.music', '0') }catch(e){}
  }
}

if(musicToggle) musicToggle.addEventListener('click', toggleMusic);

// On load try to restore preference (will not force-play if blocked by browser)
try{
  const pref = localStorage.getItem('ourstory.music');
  if(pref === '1' && bgMusic){
    const p = bgMusic.play();
    if(p && typeof p.then === 'function'){
      p.then(()=> updateMusicUI(true)).catch(()=> updateMusicUI(false));
    }
  }
} catch(e){}

// Relationship timer
const countdownLabel = document.getElementById('countdownLabel');
// Set this to the day your story started (year, monthIndex, day, hour, minute, second)
const relationshipStartDate = new Date(2023, 1, 14, 0, 0, 0);

function updateCountdown(){
  const now = Date.now();
  const diff = Math.max(0, now - relationshipStartDate.getTime());
  if (countdownLabel) countdownLabel.textContent = 'Together for';
  const secs = Math.floor(diff/1000) % 60;
  const mins = Math.floor(diff/1000/60) % 60;
  const hours = Math.floor(diff/1000/60/60) % 24;
  const days = Math.floor(diff/1000/60/60/24);
  document.getElementById('cd-days').textContent = days;
  document.getElementById('cd-hours').textContent = hours;
  document.getElementById('cd-mins').textContent = mins;
  document.getElementById('cd-secs').textContent = secs;
}

// start countdown and update every second
updateCountdown();
setInterval(updateCountdown, 1000);

// Reveal final message
const openMsgBtn = document.getElementById('openMsgBtn');
const finalMessage = document.getElementById('finalMessage');
openMsgBtn.addEventListener('click', () => {
  if (finalMessage.classList.contains('hidden')){
    finalMessage.classList.remove('hidden');
    finalMessage.classList.add('fade-in');
    openMsgBtn.textContent = 'Close Letter';
  } else {
    finalMessage.classList.add('hidden');
    finalMessage.classList.remove('fade-in');
    openMsgBtn.textContent = 'Read My Letter';
  }
});

// Fade-in memory sections when scrolled into view
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0.18 });

document.querySelectorAll('.memory').forEach(m => observer.observe(m));

// Ensure the first memory is visible on load so its caption shows immediately
const firstMemory = document.querySelector('.memory');
if (firstMemory) firstMemory.classList.add('in-view');

// Particle system - lightweight floating hearts/circles
const particlesContainer = document.getElementById('particles');
const PARTICLE_COUNT = 28; // keep small for performance
const colors = ['rgba(255,182,193,0.9)', 'rgba(255,150,180,0.85)'];

// Utility: random number in range
function rand(min, max){ return Math.random()*(max-min)+min }

// Create a single particle element
function createParticle(i){
  const el = document.createElement('div');
  el.className = 'particle';
  // Randomly choose circle or heart
  const isHeart = Math.random() < 0.35;
  el.innerHTML = isHeart ? '&#10084;' : '';
  const size = rand(8, 26);
  el.style.width = `${size}px`;
  el.style.height = isHeart ? `${size}px` : `${size}px`;
  el.style.left = `${rand(5,95)}%`;
  el.style.bottom = `${-rand(2,18)}%`;
  el.style.opacity = rand(0.35,0.95);
  el.style.fontSize = isHeart ? `${size}px` : '0px';
  el.style.background = isHeart ? 'transparent' : colors[Math.floor(Math.random()*colors.length)];
  el.style.boxShadow = isHeart ? '0 0 8px rgba(255,150,180,0.5)' : '0 0 16px rgba(255,182,193,0.4)';
  el.style.borderRadius = isHeart ? '0' : '50%';
  el.style.position = 'absolute';
  el.style.transform = `translateY(0) rotate(${rand(-20,20)}deg)`;
  el.style.transition = 'transform linear';
  // Give each particle a custom animation duration and delay
  const duration = rand(12, 26);
  el.dataset.duration = duration;
  el.dataset.delay = rand(0, 6);
  // assign id index for potential heart formation
  el.dataset.idx = i;
  particlesContainer.appendChild(el);
  // animate via CSS keyframes by setting custom properties
  el.style.animation = `rise ${duration}s linear ${el.dataset.delay}s infinite`;
}

// Generate particles
for(let i=0;i<PARTICLE_COUNT;i++) createParticle(i);

// Heart boost + music palette change (option 2 + 4 integration)
function heartBoost(){
  // temporarily increase hearts and warm the palette
  document.body.classList.add('valentine');
  const extra = 12;
  for(let i=0;i<extra;i++){
    const idx = PARTICLE_COUNT + i;
    createParticle(idx);
    const p = particlesContainer.lastChild;
    p.classList.add('extra-heart');
    // make these hearts more prominent and slower
    p.style.fontSize = `${rand(12,26)}px`;
    p.style.opacity = 0.95;
    p.style.animation = `rise ${rand(16,32)}s linear ${rand(0,3)}s infinite`;
  }
  // remove valentine class after some time so palette returns
  setTimeout(()=> document.body.classList.remove('valentine'), 6000);
}

// Heart formation: at near end of page, particles briefly gather into a heart shape then disperse
let heartFormed = false;
function formHeart(){
  if (heartFormed) return; // only once
  heartFormed = true;
  const parts = Array.from(document.querySelectorAll('.particle'));
  // Compute heart coordinates centered in viewport near final section
  const finalSection = document.getElementById('final');
  const rect = finalSection.getBoundingClientRect();
  const centerX = window.innerWidth/2;
  const centerY = rect.top + window.scrollY + rect.height/3;

  // Heart parametric function
  function heartXY(t, size){
    // t from 0..2PI
    const x = 16*Math.pow(Math.sin(t),3);
    const y = 13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
    return {x: x*size, y: -y*size};
  }

  const n = parts.length;
  parts.forEach((p, i) => {
    // stop CSS rise animation temporarily
    p.style.animationPlayState = 'paused';
    p.style.transition = 'transform 1.1s ease, left 1.1s ease, top 1.1s ease, opacity 1.1s ease';
    const t = (i / n) * Math.PI * 2;
    const pos = heartXY(t, 6 + rand(3,7));
    // position particle near center
    const targetLeft = centerX + pos.x - 10; // offset
    const targetTop = centerY + pos.y - 10;
    // convert to viewport-relative positions
    p.style.left = `${(targetLeft / window.innerWidth) * 100}%`;
    p.style.top = `${targetTop}px`;
    p.style.bottom = 'auto';
    p.style.opacity = 1;
    p.style.transform = 'scale(1.05)';
  });

  // After hold, disperse again: restore original upward animation with slight randomization
  setTimeout(()=>{
    parts.forEach((p)=>{
      p.style.transition = 'transform 1.8s ease, left 1.8s ease, top 1.8s ease, opacity 1.8s ease';
      p.style.opacity = rand(0.3,0.95);
      p.style.left = `${rand(5,95)}%`;
      p.style.top = 'auto';
      p.style.bottom = `${-rand(2,18)}%`;
      // resume rise animation with new duration
      const dur = rand(12,26);
      p.style.animation = `rise ${dur}s linear ${rand(0,6)}s infinite`;
    });
  }, 2200);
}

// Trigger heart formation when near final section
window.addEventListener('scroll', ()=>{
  const final = document.getElementById('final');
  const rect = final.getBoundingClientRect();
  if (rect.top < window.innerHeight*0.7) formHeart();
});

// Intro doors control
const intro = document.getElementById('intro');
const enterBtn = document.getElementById('enterBtn');
const leftDoor = document.querySelector('.door.left');
const rightDoor = document.querySelector('.door.right');

function openDoors(){
  if(!intro) return;
  leftDoor.classList.add('open-left');
  rightDoor.classList.add('open-right');
  // attempt to start music on user gesture (Enter click) if available, but fade-in smoothly
  try{ if(typeof fadeInMusic === 'function' && bgMusic && bgMusic.paused) fadeInMusic(1.0, 2200); }catch(e){}
  // fade out and remove overlay after animation
  setTimeout(()=>{
    intro.style.display = 'none';
    // small particle boost when entering
    if(typeof heartBoost === 'function') heartBoost();
    // spawn light confetti
    if(typeof spawnConfetti === 'function') spawnConfetti(28);
  }, 1100);
}

// Open on Enter key or button click
if(enterBtn) enterBtn.addEventListener('click', openDoors);
window.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') openDoors(); });

// Auto-open after a short delay if user doesn't interact (optional)
setTimeout(()=>{
  // only auto-open if overlay still visible
  if(intro && intro.style.display !== 'none'){
    openDoors();
  }
}, 7000);

// Initial CSS for particle elements via created stylesheet
(function injectParticleStyles(){
  const css = `
  @keyframes rise{from{transform:translateY(0)} to{transform:translateY(-120vh)}}
  .particle{will-change:transform, left, top, opacity;}
  .particle{font-family: serif; display:flex; align-items:center; justify-content:center;}
  `;
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
})();

// Accessibility: enable keyboard to open final message
openMsgBtn.addEventListener('keyup', (e)=>{ if(e.key === 'Enter') openMsgBtn.click() });

// Notes for maintainers: replace placeholder images and texts in index.html

