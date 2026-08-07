/* ═══════════════════════════════════════════════ */
/* Birthday Website — Plain HTML/CSS/JS Entry       */
/* All modules consolidated. No bundler needed.     */
/* External CDNs: GSAP + ScrollTrigger, confetti   */
/* ═══════════════════════════════════════════════ */

/* Mobile is the primary target — scale down anything */
/* that costs real CPU/GPU (confetti volume, particle  */
/* redraw rate) so low-power phones stay smooth.        */
var IS_MOBILE = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/* ─────────────────────────────────────────────── */
/* UTILS: Confetti                                  */
/* ─────────────────────────────────────────────── */
function celebrationBurst() {
  if (typeof confetti === 'undefined') return;
  confetti({
    particleCount: IS_MOBILE ? 60 : 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4F7CFF', '#7FB2FF', '#D6ECFF', '#4F7CFF', '#2F4FCC', '#ffffff'],
  });
}

function sideCannons() {
  if (typeof confetti === 'undefined') return;
  const defaults = {
    spread: 55, ticks: 60, gravity: 1.2, decay: 0.94,
    startVelocity: 30,
    colors: ['#4F7CFF', '#7FB2FF', '#4F7CFF', '#2F4FCC', '#8FA8D9'],
  };
  const count = IS_MOBILE ? 25 : 40;
  confetti({ ...defaults, particleCount: count, origin: { x: 0, y: 0.6 }, angle: 60 });
  confetti({ ...defaults, particleCount: count, origin: { x: 1, y: 0.6 }, angle: 120 });
}

function smallPop(x, y) {
  if (typeof confetti === 'undefined') return;
  confetti({
    particleCount: IS_MOBILE ? 18 : 30, spread: 50, origin: { x, y },
    colors: ['#4F7CFF', '#7FB2FF', '#D6ECFF', '#ffffff'],
    startVelocity: 20, gravity: 1.5,
  });
}

function heartBurst() {
  if (typeof confetti === 'undefined') return;
  try {
    const heart = confetti.shapeFromPath({ path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' });
    confetti({ particleCount: IS_MOBILE ? 30 : 50, spread: 100, origin: { y: 0.6 }, shapes: [heart], colors: ['#4F7CFF', '#7FB2FF', '#D6ECFF'], scalar: 1.5 });
  } catch (e) {
    celebrationBurst();
  }
}

function grandFinale() {
  if (typeof confetti === 'undefined') return;
  const duration = IS_MOBILE ? 1800 : 3000;
  const end = Date.now() + duration;
  const perBurst = IS_MOBILE ? 2 : 3;
  const colors = ['#4F7CFF', '#7FB2FF', '#4F7CFF', '#2F4FCC', '#8FA8D9', '#ffffff'];
  (function frame() {
    confetti({ particleCount: perBurst, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: perBurst, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/* ─────────────────────────────────────────────── */
/* UTILS: Animations (GSAP wrappers)                */
/* ─────────────────────────────────────────────── */
function fadeInOnScroll(selector, options) {
  options = options || {};
  var elements = document.querySelectorAll(selector);
  elements.forEach(function(el, i) {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: options.start || 'top 85%',
        toggleActions: 'play none none none',
      },
      y: options.y || 40,
      opacity: 0,
      duration: options.duration || 0.8,
      delay: options.stagger ? i * options.stagger : (options.delay || 0),
      ease: options.ease || 'power2.out',
    });
  });
}

function animateSectionHeading(sectionId) {
  var section = document.getElementById(sectionId);
  if (!section) return;
  var heading = section.querySelector('.section-heading');
  var subtitle = heading ? heading.nextElementSibling : null;
  if (heading) {
    gsap.from(heading, {
      scrollTrigger: { trigger: section, start: 'top 80%' },
      y: 30, opacity: 0, duration: 0.8, ease: 'power2.out',
    });
  }
  if (subtitle && subtitle.tagName === 'P') {
    gsap.from(subtitle, {
      scrollTrigger: { trigger: section, start: 'top 80%' },
      y: 20, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power2.out',
    });
  }
}

/* ─────────────────────────────────────────────── */
/* UTILS: Audio Manager (native HTML5 Audio)        */
/* ─────────────────────────────────────────────── */
var audioManager = (function() {
  var audio = null;
  var _isMuted = false;
  var volume = 0.7;
  var progressCallbacks = [];
  var stateCallbacks = [];
  var rafId = null;

  // The <audio> element is the single source of truth for playback state.
  // A separate boolean would lag, because 'play'/'pause' events fire
  // asynchronously — anything reading it right after calling play()/pause()
  // would see the previous state.
  function isPlaying() { return !!audio && !audio.paused && !audio.ended; }

  function emitState() { stateCallbacks.forEach(function(cb) { cb(isPlaying()); }); }

  function loadMusic(src) {
    audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    ['play', 'playing', 'pause', 'ended', 'error', 'stalled'].forEach(function(evt) {
      audio.addEventListener(evt, function() {
        if (isPlaying()) startProgress();
        emitState();
      });
    });
  }

  // Returns a promise so callers can react to autoplay being blocked.
  function play() {
    if (!audio) return Promise.resolve(false);
    if (isPlaying()) return Promise.resolve(true);
    var p = audio.play();
    // Older browsers return undefined rather than a promise.
    if (!p || !p.then) return Promise.resolve(true);
    return p.then(function() { return true; }, function() { return false; });
  }
  function pause() { if (audio && !audio.paused) audio.pause(); }
  function toggle() { if (isPlaying()) { pause(); return Promise.resolve(false); } return play(); }
  function onState(cb) { stateCallbacks.push(cb); }

  function setVolume(v) {
    volume = v;
    if (audio) audio.volume = v;
  }

  function mute() { _isMuted = true; if (audio) audio.muted = true; }
  function unmute() { _isMuted = false; if (audio) audio.muted = false; }
  function toggleMute() { if (_isMuted) unmute(); else mute(); }

  function seek(pct) { if (audio && audio.duration) audio.currentTime = audio.duration * pct; }

  function getProgress() {
    if (!audio || !audio.duration || isNaN(audio.duration)) return { current: 0, duration: 0, pct: 0 };
    var current = audio.currentTime || 0, duration = audio.duration;
    return { current: current, duration: duration, pct: current / duration };
  }

  function onProgress(cb) { progressCallbacks.push(cb); }

  // rafId guards against stacking multiple concurrent loops if playback
  // events fire more than once.
  function startProgress() {
    if (rafId !== null) return;
    function update() {
      if (!isPlaying()) { rafId = null; return; }
      progressCallbacks.forEach(function(cb) { cb(getProgress()); });
      rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);
  }

  function formatTime(s) {
    var mins = Math.floor(s / 60), secs = Math.floor(s % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  return {
    get isPlaying() { return isPlaying(); },
    get isMuted() { return _isMuted; },
    loadMusic: loadMusic, play: play, pause: pause, toggle: toggle,
    setVolume: setVolume, mute: mute, unmute: unmute, toggleMute: toggleMute,
    seek: seek, getProgress: getProgress, onProgress: onProgress,
    onState: onState, formatTime: formatTime
  };
})();

/* ─────────────────────────────────────────────── */
/* COMPONENT: Particle System                       */
/* ─────────────────────────────────────────────── */
function ParticleSystem(canvasId) {
  this.canvas = document.getElementById(canvasId);
  this.ctx = this.canvas.getContext('2d');
  this.particles = [];
  this.nightMode = false;
  this.mouse = { x: 0, y: 0 };
  this.animationId = null;
  this.isMobile = window.innerWidth < 768;
  this.frameCount = 0;
  this.auroraCanvas = document.createElement('canvas');
  this.auroraCtx = this.auroraCanvas.getContext('2d');
  var self = this;
  this.resize();
  window.addEventListener('resize', function() { self.resize(); });
  window.addEventListener('mousemove', function(e) { self.mouse.x = e.clientX; self.mouse.y = e.clientY; });
}

ParticleSystem.prototype.resize = function() {
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;
  this.isMobile = window.innerWidth < 768;
  this.auroraCanvas.width = window.innerWidth;
  this.auroraCanvas.height = window.innerHeight;
  this.init();
};

ParticleSystem.prototype.init = function() {
  this.particles = [];
  var isMobile = window.innerWidth < 768;
  var count = isMobile ? 40 : 80;
  for (var i = 0; i < count; i++) this.particles.push(this.createParticle());
};

ParticleSystem.prototype.createParticle = function() {
  var types = ['orb', 'star', 'bokeh', 'sparkle'];
  if (Math.random() < 0.08) types.push('heart');
  if (Math.random() < 0.08) types.push('petal');
  var type = types[Math.floor(Math.random() * types.length)];
  var w = this.canvas.width, h = this.canvas.height;
  return {
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 - 0.15,
    size: type === 'bokeh' ? Math.random() * 40 + 15 :
          type === 'orb' ? Math.random() * 4 + 1 :
          type === 'heart' ? Math.random() * 6 + 4 :
          type === 'petal' ? Math.random() * 5 + 3 : Math.random() * 2 + 1,
    opacity: type === 'bokeh' ? Math.random() * 0.06 + 0.02 : Math.random() * 0.5 + 0.1,
    type: type, angle: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    pulse: Math.random() * Math.PI * 2, pulseSpeed: Math.random() * 0.02 + 0.005,
    color: this.getColor(type),
  };
};

ParticleSystem.prototype.getColor = function(type) {
  if (this.nightMode) {
    var firefly = ['#7FB2FF', '#4F7CFF', '#BFDDFF', '#2F4FCC'];
    return firefly[Math.floor(Math.random() * firefly.length)];
  }
  var colors = {
    orb: ['rgba(79,124,255,', 'rgba(47, 79, 204,', 'rgba(127, 178, 255,', 'rgba(255,255,255,'],
    star: ['rgba(255,255,255,', 'rgba(47, 79, 204,', 'rgba(143, 168, 217,'],
    bokeh: ['rgba(79,124,255,', 'rgba(79, 124, 255,', 'rgba(47, 79, 204,', 'rgba(127, 178, 255,'],
    sparkle: ['rgba(255,255,255,', 'rgba(143, 168, 217,', 'rgba(214, 236, 255,'],
    heart: ['rgba(79, 124, 255,', 'rgba(127, 178, 255,'],
    petal: ['rgba(214, 236, 255,', 'rgba(127, 178, 255,', 'rgba(47, 79, 204,'],
  };
  var set = colors[type] || colors.orb;
  return set[Math.floor(Math.random() * set.length)];
};

ParticleSystem.prototype.drawParticle = function(p) {
  var ctx = this.ctx;
  var pulse = Math.sin(p.pulse) * 0.3 + 0.7;
  var alpha = p.opacity * pulse;
  ctx.save();
  if (this.nightMode && p.type !== 'bokeh') {
    ctx.shadowBlur = 15;
    ctx.shadowColor = p.color.replace('rgba', 'rgb').replace(/,$/, ')');
  }
  switch (p.type) {
    case 'orb':
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')'; ctx.fill(); break;
    case 'star':
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillStyle = p.color + alpha + ')';
      this.drawStar(ctx, 0, 0, 4, p.size, p.size * 0.4); break;
    case 'bokeh':
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')'; ctx.fill(); break;
    case 'sparkle':
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fillRect(-p.size * 2, -0.5, p.size * 4, 1);
      ctx.fillRect(-0.5, -p.size * 2, 1, p.size * 4); break;
    case 'heart':
      ctx.translate(p.x, p.y); ctx.scale(p.size / 10, p.size / 10);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.beginPath(); ctx.moveTo(0, -3);
      ctx.bezierCurveTo(-5, -8, -10, -3, 0, 5);
      ctx.bezierCurveTo(10, -3, 5, -8, 0, -3); ctx.fill(); break;
    case 'petal':
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 2, 0, 0, Math.PI * 2); ctx.fill(); break;
  }
  ctx.restore();
};

ParticleSystem.prototype.drawStar = function(ctx, cx, cy, spikes, outerR, innerR) {
  var rot = Math.PI / 2 * 3, step = Math.PI / spikes;
  ctx.beginPath(); ctx.moveTo(cx, cy - outerR);
  for (var i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step;
  }
  ctx.lineTo(cx, cy - outerR); ctx.closePath(); ctx.fill();
};

ParticleSystem.prototype.drawAurora = function() {
  // Renders into an offscreen canvas so the main render loop can cheaply
  // blit it every frame instead of rebuilding the gradient + wavy path
  // every tick — the aurora drifts slowly, so on phones we only rebuild
  // this every few frames (see render()) to save CPU/GPU.
  var ctx = this.auroraCtx, w = this.auroraCanvas.width, h = this.auroraCanvas.height, t = Date.now() * 0.0003;
  ctx.clearRect(0, 0, w, h);
  ctx.save(); ctx.globalAlpha = this.nightMode ? 0.06 : 0.03;
  var grad1 = ctx.createLinearGradient(0, 0, w, 0);
  grad1.addColorStop(0, 'transparent');
  grad1.addColorStop(0.3 + Math.sin(t) * 0.1, 'rgba(79,124,255,0.3)');
  grad1.addColorStop(0.6 + Math.cos(t) * 0.1, 'rgba(47, 79, 204,0.3)');
  grad1.addColorStop(1, 'transparent');
  ctx.fillStyle = grad1;
  ctx.beginPath(); ctx.moveTo(0, h * 0.15);
  for (var x = 0; x <= w; x += 20) {
    ctx.lineTo(x, h * 0.15 + Math.sin(x * 0.003 + t * 2) * 40 + Math.sin(x * 0.007 + t) * 20);
  }
  ctx.lineTo(w, h * 0.35); ctx.lineTo(0, h * 0.35); ctx.closePath(); ctx.fill();
  ctx.restore();
};

ParticleSystem.prototype.update = function() {
  var w = this.canvas.width, h = this.canvas.height;
  this.particles.forEach(function(p) {
    p.x += p.vx; p.y += p.vy; p.angle += p.rotationSpeed; p.pulse += p.pulseSpeed;
    if (p.type === 'petal') p.x += Math.sin(p.pulse * 2) * 0.3;
    if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
    if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
  });
};

ParticleSystem.prototype.render = function() {
  var self = this;
  this.frameCount++;
  var auroraRefreshRate = this.isMobile ? 4 : 1;
  if (this.frameCount % auroraRefreshRate === 0) this.drawAurora();
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.drawImage(this.auroraCanvas, 0, 0);
  this.particles.forEach(function(p) { self.drawParticle(p); });
  this.update();
  this.animationId = requestAnimationFrame(function() { self.render(); });
};

ParticleSystem.prototype.start = function() { if (!this.animationId) this.render(); };

ParticleSystem.prototype.setNightMode = function(enabled) {
  var self = this;
  this.nightMode = enabled;
  this.particles.forEach(function(p) { p.color = self.getColor(p.type); });
};

ParticleSystem.prototype.destroy = function() {
  if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
};

function initParticles() {
  var system = new ParticleSystem('particles-canvas');
  system.start();
  return system;
}

/* ─────────────────────────────────────────────── */
/* COMPONENT: Night Mode Toggle                     */
/* ─────────────────────────────────────────────── */
function initNightMode(particleSystem) {
  var toggleBtn = document.getElementById('night-toggle');
  var iconMoon = document.getElementById('night-icon-moon');
  var iconSun = document.getElementById('night-icon-sun');
  var body = document.body;
  if (!toggleBtn) return;
  var isNight = localStorage.getItem('birthday_night_mode') === 'true';

  function updateTheme() {
    if (isNight) {
      body.classList.add('night-mode'); iconMoon.classList.add('hidden'); iconSun.classList.remove('hidden');
    } else {
      body.classList.remove('night-mode'); iconMoon.classList.remove('hidden'); iconSun.classList.add('hidden');
    }
    if (particleSystem) particleSystem.setNightMode(isNight);
    localStorage.setItem('birthday_night_mode', isNight);
  }

  toggleBtn.addEventListener('click', function() {
    isNight = !isNight; updateTheme();
    var rect = toggleBtn.getBoundingClientRect();
    smallPop((rect.left + rect.width / 2) / window.innerWidth, (rect.top + rect.height / 2) / window.innerHeight);
  });
  updateTheme();
}

/* ─────────────────────────────────────────────── */
/* COMPONENT: Navigation Dock                       */
/* ─────────────────────────────────────────────── */
function initNavigation() {
  var dock = document.getElementById('floating-dock');
  var items = document.querySelectorAll('.dock-item');
  var sections = Array.from(items).map(function(item) { return document.getElementById(item.dataset.section); });
  if (!dock) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 300) gsap.to(dock, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
    else gsap.to(dock, { y: 80, opacity: 0, duration: 0.5, ease: 'power2.in' });

    var current = '';
    var scrollPos = window.scrollY + window.innerHeight / 3;
    sections.forEach(function(section) {
      if (section && section.offsetTop <= scrollPos) current = section.id;
    });
    items.forEach(function(item) {
      item.classList.remove('active');
      if (item.dataset.section === current) item.classList.add('active');
    });
  });

  items.forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.getElementById(item.dataset.section);
      if (target) window.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────────── */
/* COMPONENT: Music Player                          */
/* ─────────────────────────────────────────────── */
function initMusicPlayer() {
  if (!document.getElementById('music-play-btn')) return;
  audioManager.loadMusic('public/music/Happy%20Birthday%20-%20Background%20Score.mp3');
  var playBtn = document.getElementById('music-play-btn');
  var iconPlay = document.getElementById('music-icon-play');
  var iconPause = document.getElementById('music-icon-pause');
  var expandBtn = document.getElementById('music-expand-btn');
  var expandIcon = document.getElementById('music-expand-icon');
  var expandedView = document.getElementById('music-expanded');
  var muteBtn = document.getElementById('music-mute-btn');
  var iconVolume = document.getElementById('music-icon-volume');
  var iconMuted = document.getElementById('music-icon-muted');
  var volSlider = document.getElementById('music-volume');
  var progressBar = document.getElementById('music-progress-bar');
  var progressFill = document.getElementById('music-progress');
  var timeText = document.getElementById('music-time');
  var tooltip = document.getElementById('music-tooltip');
  var isExpanded = false;

  // Attention pulse on the play button, shown only while autoplay is blocked
  // and dropped for good once the visitor has taken control of playback.
  var hintDismissed = false;
  function showHint() {
    if (hintDismissed || audioManager.isPlaying) return;
    playBtn.classList.add('music-nudge');
  }
  function hideHint(permanent) {
    if (permanent) hintDismissed = true;
    playBtn.classList.remove('music-nudge');
  }

  // The tooltip tracks playback state only, so it comes back if the visitor
  // pauses — unlike the pulse, which is a one-time nudge.
  function syncTooltip() {
    if (!tooltip) return;
    tooltip.classList.toggle('hidden', audioManager.isPlaying);
  }

  function syncPlayingUI() {
    if (audioManager.isPlaying) {
      iconPlay.classList.add('hidden'); iconPause.classList.remove('hidden'); playBtn.classList.add('animate-pulse-glow');
      hideHint(false);
    } else {
      iconPlay.classList.remove('hidden'); iconPause.classList.add('hidden'); playBtn.classList.remove('animate-pulse-glow');
    }
    syncTooltip();
  }

  // Tracks what the visitor wants, which is NOT the same as what the audio
  // element is doing: autoplay may be blocked while wantsMusic is true.
  // Without this, the unlock listener below would restart the music every
  // time the visitor deliberately paused it.
  var wantsMusic = true;

  // Repaint from real media events rather than synchronously after
  // play()/pause(), which would read the pre-change state.
  audioManager.onState(syncPlayingUI);

  playBtn.addEventListener('click', function() {
    wantsMusic = !audioManager.isPlaying;
    hideHint(true);
    audioManager.toggle();
  });

  // Best-effort autoplay on load. Browsers block audio-with-sound until the
  // visitor has interacted with the page at least once — browsers require
  // this and there is no way around it. As a fallback, catch the first
  // real user gesture so playback starts as close to instantly as allowed.
  audioManager.play().then(function(ok) {
    if (!ok) showHint();
  });
  syncPlayingUI();

  // Only click/touchstart/keydown count as "user activation" for autoplay
  // policies — scroll and wheel do not, so they cannot unlock playback.
  var firstInteractionEvents = ['click', 'touchstart', 'keydown'];
  function playOnFirstInteraction() {
    if (!wantsMusic) return removeUnlockListeners();
    if (audioManager.isPlaying) return removeUnlockListeners();
    audioManager.play().then(function(ok) {
      // Only stop listening once playback actually succeeded; a rejected
      // play() means this gesture was not enough to unlock audio.
      if (ok) removeUnlockListeners();
    });
  }
  function removeUnlockListeners() {
    firstInteractionEvents.forEach(function(evt) {
      document.removeEventListener(evt, playOnFirstInteraction);
    });
  }
  firstInteractionEvents.forEach(function(evt) {
    document.addEventListener(evt, playOnFirstInteraction, { passive: true });
  });

  // A page opened in a background tab has play() rejected outright; retry
  // when it first becomes visible.
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && wantsMusic && !audioManager.isPlaying) audioManager.play();
  });

  expandBtn.addEventListener('click', function() {
    isExpanded = !isExpanded;
    if (isExpanded) { expandedView.classList.remove('hidden'); expandIcon.style.transform = 'rotate(180deg)'; }
    else { expandedView.classList.add('hidden'); expandIcon.style.transform = 'rotate(0deg)'; }
  });

  muteBtn.addEventListener('click', function() {
    audioManager.toggleMute();
    if (audioManager.isMuted) { iconVolume.classList.add('hidden'); iconMuted.classList.remove('hidden'); }
    else { iconVolume.classList.remove('hidden'); iconMuted.classList.add('hidden'); }
  });

  volSlider.addEventListener('input', function(e) {
    audioManager.setVolume(e.target.value / 100);
    if (audioManager.isMuted && e.target.value > 0) {
      audioManager.unmute(); iconVolume.classList.remove('hidden'); iconMuted.classList.add('hidden');
    }
  });

  progressBar.addEventListener('click', function(e) {
    var rect = progressBar.getBoundingClientRect();
    audioManager.seek((e.clientX - rect.left) / rect.width);
  });

  audioManager.onProgress(function(state) {
    progressFill.style.width = (state.pct * 100) + '%';
    timeText.textContent = audioManager.formatTime(state.current) + ' / ' + audioManager.formatTime(state.duration);
    syncPlayingUI();
  });
}


/* ─────────────────────────────────────────────── */
/* COMPONENT: Lightbox                              */
/* ─────────────────────────────────────────────── */
function initLightbox() {
  var lightbox = document.getElementById('lightbox');
  var imgEl = document.getElementById('lightbox-img');
  var captionEl = document.getElementById('lightbox-caption');
  var closeBtn = document.getElementById('lightbox-close');
  var prevBtn = document.getElementById('lightbox-prev');
  var nextBtn = document.getElementById('lightbox-next');
  var overlay = document.getElementById('lightbox-overlay');
  if (!lightbox) return;

  var currentImages = [], currentIndex = 0;

  function open(images, index) {
    currentImages = images; currentIndex = index; updateView();
    lightbox.classList.remove('hidden'); lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lightbox.classList.add('hidden'); lightbox.classList.remove('flex');
    document.body.style.overflow = '';
  }
  function updateView() {
    var data = currentImages[currentIndex];
    imgEl.src = data.src; captionEl.textContent = data.caption || '';
    imgEl.style.transform = 'scale(0.95)'; imgEl.style.opacity = '0';
    setTimeout(function() {
      imgEl.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      imgEl.style.transform = 'scale(1)'; imgEl.style.opacity = '1';
    }, 10);
  }
  function next() { currentIndex = (currentIndex + 1) % currentImages.length; updateView(); }
  function prev() { currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length; updateView(); }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  document.addEventListener('keydown', function(e) {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });
  window.openLightbox = open;
}

/* ─────────────────────────────────────────────── */
/* SECTION: Landing                                 */
/* ─────────────────────────────────────────────── */
function initLanding() {
  var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to('#landing-subtitle-top', { y: 0, opacity: 1, duration: 1, delay: 0.5 })
    .fromTo('#landing-name', { y: 50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 1.2 }, '-=0.5')
    .to('#landing-subtitle', { y: 0, opacity: 1, duration: 1 }, '-=0.8')
    .to('#landing-illustration', { y: 0, opacity: 1, duration: 1 }, '-=0.6')
    .to('#begin-journey-btn', { y: 0, opacity: 1, duration: 0.8 }, '-=0.4')
    .to('#scroll-indicator', { opacity: 1, duration: 1 }, '+=0.5');

  var btn = document.getElementById('begin-journey-btn');
  if (btn) {
    btn.addEventListener('click', function() {
      var ripple = document.createElement('span');
      ripple.classList.add('ripple');
      btn.querySelector('.ripple-container').appendChild(ripple);
      setTimeout(function() { ripple.remove(); }, 600);
      setTimeout(function() { document.getElementById('countdown').scrollIntoView({ behavior: 'smooth' }); }, 300);
    });
  }

  var landing = document.getElementById('landing');
  var illustration = document.getElementById('landing-illustration');
  if (landing && illustration) {
    landing.addEventListener('mousemove', function(e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 20;
      var y = (e.clientY / window.innerHeight - 0.5) * 20;
      gsap.to(illustration, { x: x, y: y, duration: 1, ease: 'power1.out' });
    });
  }
}

/* ─────────────────────────────────────────────── */
/* SECTION: Age Counter (time elapsed since birth)  */
/* ─────────────────────────────────────────────── */
function initCountdown() {
  animateSectionHeading('countdown');
  var birthDate = new Date(2003, 7, 11, 0, 0, 0); // 11 Aug 2003, 12:00 AM
  var elYears = document.getElementById('cd-years');
  var elDays = document.getElementById('cd-days');
  var elHours = document.getElementById('cd-hours');
  var elMinutes = document.getElementById('cd-minutes');
  var elSeconds = document.getElementById('cd-seconds');

  function pad(n) { return n.toString().padStart(2, '0'); }
  function update() {
    var now = new Date();
    var years = now.getFullYear() - birthDate.getFullYear();
    var lastBirthday = new Date(birthDate.getTime());
    lastBirthday.setFullYear(birthDate.getFullYear() + years);
    if (lastBirthday > now) {
      years--;
      lastBirthday.setFullYear(birthDate.getFullYear() + years);
    }
    var elapsed = now.getTime() - lastBirthday.getTime();
    elYears.textContent = pad(years);
    elDays.textContent = pad(Math.floor(elapsed / (1000 * 60 * 60 * 24)));
    elHours.textContent = pad(Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    elMinutes.textContent = pad(Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60)));
    elSeconds.textContent = pad(Math.floor((elapsed % (1000 * 60)) / 1000));
  }
  setInterval(update, 1000); update();
}

/* ─────────────────────────────────────────────── */
/* SECTION: Gallery                                 */
/* ─────────────────────────────────────────────── */
function initGallery() {
  if (!document.getElementById('gallery-masonry')) return;
  animateSectionHeading('gallery');
  var photos = [];
  for (var i = 0; i < 12; i++) {
    photos.push({
      src: 'https://picsum.photos/seed/love' + i + '/600/800',
      caption: 'Memory ' + (i + 1) + ' \u2764\ufe0f',
      aspect: i % 3 === 0 ? 'aspect-square' : i % 2 === 0 ? 'aspect-video' : 'aspect-[3/4]'
    });
  }

  var tabs = document.querySelectorAll('.gallery-tab');
  var views = document.querySelectorAll('.gallery-view');

  var masonryContainer = document.getElementById('gallery-masonry');
  photos.forEach(function(photo, i) {
    var div = document.createElement('div');
    div.className = 'gallery-img break-inside-avoid mb-4 ' + photo.aspect;
    div.innerHTML = '<img src="' + photo.src + '" alt="Memory" loading="lazy" />';
    div.onclick = function() { window.openLightbox(photos, i); };
    masonryContainer.appendChild(div);
  });

  var track = document.getElementById('carousel-track');
  photos.forEach(function(photo, i) {
    var div = document.createElement('div');
    div.className = 'gallery-img flex-shrink-0 w-64 md:w-80 h-96 mx-2';
    div.innerHTML = '<img src="' + photo.src + '" alt="Memory" loading="lazy" />';
    div.onclick = function() { window.openLightbox(photos, i); };
    track.appendChild(div);
  });

  var polaroidContainer = document.getElementById('gallery-polaroid');
  photos.slice(0, 6).forEach(function(photo, i) {
    var div = document.createElement('div');
    div.className = 'polaroid-card';
    div.innerHTML = '<img src="' + photo.src + '" alt="Memory" loading="lazy" /><p class="caption">' + photo.caption + '</p>';
    div.onclick = function() { window.openLightbox(photos, i); };
    polaroidContainer.appendChild(div);
  });

  var stackContainer = document.getElementById('gallery-stack');
  var stackPhotos = photos.slice(0, 5);
  stackPhotos.forEach(function(photo, i) {
    var div = document.createElement('div');
    div.className = 'stack-card';
    div.style.transform = 'rotate(' + ((i - 2) * 5) + 'deg) translateX(' + ((i - 2) * 10) + 'px) translateY(' + (Math.abs(i - 2) * 5) + 'px)';
    div.style.zIndex = stackPhotos.length - Math.abs(i - 2);
    div.innerHTML = '<img src="' + photo.src + '" alt="Memory" loading="lazy" />';
    div.onclick = function() { window.openLightbox(stackPhotos, i); };
    div.addEventListener('mouseenter', function() {
      div.style.transform = 'rotate(' + ((i - 2) * 2) + 'deg) translateX(' + ((i - 2) * 30) + 'px) translateY(-30px) scale(1.05)';
      div.style.zIndex = 100;
    });
    div.addEventListener('mouseleave', function() {
      div.style.transform = 'rotate(' + ((i - 2) * 5) + 'deg) translateX(' + ((i - 2) * 10) + 'px) translateY(' + (Math.abs(i - 2) * 5) + 'px)';
      div.style.zIndex = stackPhotos.length - Math.abs(i - 2);
    });
    stackContainer.appendChild(div);
  });

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var targetStyle = tab.dataset.style;
      views.forEach(function(view) {
        if (view.id === 'gallery-' + targetStyle) {
          view.classList.remove('hidden');
          gsap.from(view.children, { y: 30, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' });
        } else view.classList.add('hidden');
      });
    });
  });

  var prevBtn = document.getElementById('carousel-prev');
  var nextBtn = document.getElementById('carousel-next');
  var currentScroll = 0;
  function goNext() {
    currentScroll = Math.min(currentScroll + 300, Math.max(track.scrollWidth - track.clientWidth, 0));
    track.style.transform = 'translateX(-' + currentScroll + 'px)';
  }
  function goPrev() {
    currentScroll = Math.max(currentScroll - 300, 0);
    track.style.transform = 'translateX(-' + currentScroll + 'px)';
  }
  if (prevBtn && nextBtn) {
    nextBtn.addEventListener('click', goNext);
    prevBtn.addEventListener('click', goPrev);
  }

  var carouselView = document.getElementById('gallery-carousel');
  var carouselTouchStartX = 0, carouselTouchStartY = 0, carouselSwiping = false;
  if (carouselView) {
    carouselView.addEventListener('touchstart', function(e) {
      carouselTouchStartX = e.touches[0].clientX;
      carouselTouchStartY = e.touches[0].clientY;
      carouselSwiping = false;
    }, { passive: true });
    carouselView.addEventListener('touchmove', function(e) {
      var dx = e.touches[0].clientX - carouselTouchStartX;
      var dy = e.touches[0].clientY - carouselTouchStartY;
      if (Math.abs(dx) > Math.abs(dy)) { carouselSwiping = true; e.preventDefault(); }
    }, { passive: false });
    carouselView.addEventListener('touchend', function(e) {
      if (!carouselSwiping) return;
      var dx = e.changedTouches[0].clientX - carouselTouchStartX;
      if (dx < -50) goNext(); else if (dx > 50) goPrev();
    });
  }

  gsap.from('#gallery-masonry .gallery-img', {
    scrollTrigger: { trigger: '#gallery-masonry', start: 'top 80%' },
    y: 40, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out'
  });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Timeline                                */
/* ─────────────────────────────────────────────── */
function initTimeline() {
  animateSectionHeading('timeline');
  var timelineStories = [
    { title: 'The First Crush', desc: 'One wave was enough to change my world forever.' },
    { title: 'Her Bus Stop', desc: 'Every extra mile on my bicycle was just another excuse to see you.' },
    { title: 'Looking at Her Profile', desc: 'You became the reason I smiled at my phone.' },
    { title: 'Years of Waiting', desc: 'Time moved on, but my heart never left that first wave.' },
    { title: 'Meeting Again', desc: 'Fate gave us another chance when I least expected it.' },
    { title: 'Singing Together', desc: 'Our voices met long before our hearts did.' },
    { title: 'Best Friends', desc: 'The best love stories often begin with the best friendships.' },
    { title: 'The Proposal', desc: 'The hardest words I ever spoke came straight from my heart.' },
    { title: 'The Rejection', desc: 'Sometimes love has to wait, even when the heart is ready.' },
    { title: 'Heartbreak', desc: 'Some nights were filled with silence only my heart could hear.' },
    { title: 'Moving On', desc: 'I learned to smile again, never knowing what tomorrow would bring.' },
    { title: 'She Fell in Love', desc: 'While I was letting go, your heart was quietly finding its way to mine.' },
    { title: 'Her Secret Glance', desc: 'The love I once searched for was already looking back at me.' },
    { title: 'Singing Together Again', desc: 'This time, every song carried a different meaning.' },
    { title: 'Her Confession', desc: 'The message I had dreamed of finally became real.' },
    { title: 'Tears of Happiness', desc: 'For the first time, my tears were filled with nothing but joy.' },
    { title: 'Our First Date', desc: 'Every conversation felt like home.' },
    { title: 'Most Beautiful Click', desc: 'The photo that stays close to our hearts' },
    { title: 'Phone Calls', desc: 'Every ring brought us closer, turning simple conversations into cherished memories.' },
  ];
  var timelineData = timelineStories.map(function(story, i) {
    return {
      date: 'Chapter ' + (i + 1),
      title: story.title,
      desc: story.desc,
      img: 'public/images/timeline/' + (i + 1) + '.jpg',
    };
  });
  var container = document.getElementById('timeline-items');
  var lineFill = document.getElementById('timeline-line-fill');
  if (!container) return;

  timelineData.forEach(function(item, index) {
    var side = index % 2 === 0 ? 'left' : 'right';
    var div = document.createElement('div');
    div.className = 'timeline-item ' + side + ' w-full';
    div.innerHTML = '<div class="dot"></div><div class="timeline-card inline-block text-left w-full sm:w-[90%] md:w-[80%]"><span class="timeline-date">' + item.date + '</span><h3 class="text-xl font-display font-bold text-white mb-2">' + item.title + '</h3><p class="text-white/60 text-sm mb-4">' + item.desc + '</p><img src="' + item.img + '" alt="' + item.title + '" loading="lazy" /></div>';
    container.appendChild(div);
  });

  gsap.to(lineFill, {
    scrollTrigger: { trigger: '#timeline-container', start: 'top center', end: 'bottom center', scrub: 1 },
    height: '100%', ease: 'none'
  });

  document.querySelectorAll('.timeline-item').forEach(function(item) {
    // Vertical only: a horizontal offset pushed cards past the viewport edge
    // and left the page scrollable sideways on narrow screens.
    gsap.fromTo(item, { y: 60, opacity: 0 }, { scrollTrigger: { trigger: item, start: 'top 85%' }, y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
    gsap.fromTo(item.querySelector('.dot'), { scale: 0, backgroundColor: '#ffffff' }, { scrollTrigger: { trigger: item, start: 'top 60%' }, scale: 1, backgroundColor: '#4F7CFF', duration: 0.4, ease: 'back.out(1.7)' });
  });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Love Letter                             */
/* ─────────────────────────────────────────────── */
function initLoveLetter() {
  animateSectionHeading('love-letter');
  var letterText = [
    "Nee vayikkan vendi mathram ezhuthunnath,",
    "This is a letter without chatgpt. More than a love letter, this is my mind's voice.",
    "Njan alochikkuvayirunnu... Ithrem kaalam njan jeevichath enthinayirunnu? Angane chinthikkan oru karanam und. Ipo enik jeevikkan enthokkeyo karanangal ulla pole thonna... Appo njan ente pandathe life ne patti aloichu. Njan enthinu vendi ayirunnu jeevichath? Ente life le ithuvareyulla time period il ithrem importance koduthittulla vere oru vyakthi illa. Chilapozhoke njan swayam chinthikkum, enthinayirunnu ente life il nee vannath enn. Don Bosco le varanthayiloode nadakumbo nee pala thavana ente opposite loode nadann poyittund... Annu njan chinthichirunna oru karyam und. WHY? Enthenkilum sambavikkan pokunnathinte vella soochana aano ith? Annu ninne njan shredhikkarillenkilum, entho oru karanam kond nee annu nadann poyirunnath njan ipozhum orkkunnund.",
    "Mattoru karyam... nee parayarille njan bhayankara effort okke eduthu enn. But this is the minimum that I can do for you. Enik kore parimithikal undayirunnu. Ath illayirunnenkil, enik boundaries illayirunnenkil... Oru pakshe njan...",
    "Chilapozhokke enik thonniyittund... Ninte perumaattathil, samsaarathil chiriyil, ninak ennodulla feel. But I think, do I deserve this love? I'm not that good. Athukond thanne I controlled myself, samadhanathode, ninak oru burden aavathe. I was afraid even to touch you. Even now!",
    "Nirbandhich pidich vangunnathinekkalum swayam thonnunna snehathinu aanu ennum vilayullath, athukond thanneyaanu njan orikkalum ninne nirbandhikkathirunnath. But nee thirich vannapo I was in a fantasy world. It was never about chase. It was always about choice. Njan chase cheyyathe nee enne choose cheyyukayaanu cheythath.",
    "Iniyum njan perfect alla, chilapozhoke njan over aavum, chilapozhoke njan silent aavum. Palappozhum njan arinjo ariyatheyo ninne vedhanippichittund.",
    "Palappozhum future ne patti chinthikumbo pedi thonnarund, but ipo oru pratheeksha thonunu. Nee enne motivate cheyyarillenkilum your presence itself motivates me a lot, to do many things. Life le pala kaaryangalum cheyyan thonnunnath nee undennulla thonnal kondaanu. Ellam immediate aayi change aakum enn njan pratheekshikkunnilla. Pakshe namukk orumich povaan pattum enn oru vishwasam enikk und. Slow aayalum sheri, silent aayalum sheri. Ente life il nilavil bhakiyundayirunna ore oru agraham ayirunnu ith. Njan ninne orikkalum ittitt povilla.",
    "Anyway, Thank God!",
    "<strong>Happy Birthday my Gem🪄</strong>",
    "💎"
  ];
  var envelope = document.getElementById('envelope');
  var letter = document.getElementById('letter');
  var content = document.getElementById('letter-content');
  var closeBtn = document.getElementById('letter-close');
  if (!envelope || !letter) return;
  var isOpen = false;

  envelope.addEventListener('click', function() {
    if (isOpen) return; isOpen = true;
    envelope.classList.add('open');
    setTimeout(heartBurst, 400);
    setTimeout(function() {
      envelope.style.display = 'none'; letter.classList.remove('hidden');
      content.innerHTML = '';
      letterText.forEach(function(line, index) {
        var p = document.createElement('p');
        p.className = 'letter-line'; p.innerHTML = line; content.appendChild(p);
        setTimeout(function() { p.classList.add('visible'); }, 800 + index * 800);
      });
    }, 800);
  });

  closeBtn.addEventListener('click', function() {
    isOpen = false;
    letter.classList.add('hidden'); envelope.style.display = 'block';
    setTimeout(function() { envelope.classList.remove('open'); }, 50);
  });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Reasons                                 */
/* ─────────────────────────────────────────────── */
function initReasons() {
  animateSectionHeading('reasons');
  var reasons = [];
  for (var i = 0; i < 50; i++) reasons.push('Reason ' + (i + 1) + ': Because of your beautiful smile.');
  var grid = document.getElementById('reasons-grid');
  var counter = document.getElementById('reasons-counter');
  var revealAllBtn = document.getElementById('reasons-reveal-all');
  if (!grid) return;
  var revealedCount = 0, cards = [];

  reasons.forEach(function(reason, index) {
    var card = document.createElement('div');
    card.className = 'reason-card';
    card.innerHTML = '<div class="reason-card-inner"><div class="reason-card-front"><span>' + (index + 1) + '</span></div><div class="reason-card-back"><p>' + reason + '</p></div></div>';
    card.addEventListener('click', function() {
      if (!card.classList.contains('flipped')) {
        card.classList.add('flipped'); revealedCount++;
        counter.textContent = revealedCount + ' / 50 revealed';
        if (revealedCount % 5 === 0 || revealedCount === 50) celebrationBurst();
      }
    });
    cards.push(card); grid.appendChild(card);
  });

  revealAllBtn.addEventListener('click', function() {
    cards.forEach(function(card, i) {
      setTimeout(function() {
        if (!card.classList.contains('flipped')) {
          card.classList.add('flipped'); revealedCount++;
          counter.textContent = revealedCount + ' / 50 revealed';
        }
      }, i * 30);
    });
    setTimeout(celebrationBurst, 50 * 30 + 300);
  });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Interactive Heart                       */
/* ─────────────────────────────────────────────── */
function initInteractiveHeart() {
  animateSectionHeading('interactive-heart');
  var messages = [
    "Every click means one more reason I love you", "Wow, you really love me! \uD83E\uDD70",
    "My heart beats faster for you", "You're making my heart melt...",
    "I love you more than words can say", "Okay, you're the absolute best",
    "I can't stop smiling when I'm with you", "You are my everything",
    "Keep going, my love!", "Okay, my heart is officially yours forever! \u2764\uFE0F"
  ];
  var btn = document.getElementById('heart-btn');
  var counter = document.getElementById('heart-counter');
  var message = document.getElementById('heart-message');
  var particles = document.getElementById('heart-particles');
  if (!btn) return;
  var clicks = 0;

  btn.addEventListener('click', function(e) {
    clicks++;
    counter.textContent = '\u2764\uFE0F ' + clicks;
    var msgIndex = Math.min(Math.floor(clicks / 10), messages.length - 1);
    if (message.textContent !== messages[msgIndex]) {
      message.style.opacity = 0;
      setTimeout(function() { message.textContent = messages[msgIndex]; message.style.opacity = 1; }, 200);
    }
    btn.classList.remove('animate-heartbeat');
    setTimeout(function() { btn.classList.add('animate-heartbeat'); }, 10);
    var p = document.createElement('div');
    p.className = 'heart-particle';
    p.style.cssText = 'position:absolute;font-size:1.5rem;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;animation:heart-particle-fly 1s ease-out forwards';
    p.textContent = '\u2764\uFE0F';
    var angle = Math.random() * Math.PI * 2, distance = Math.random() * 100 + 50;
    p.style.setProperty('--tx', (Math.cos(angle) * distance) + 'px');
    p.style.setProperty('--ty', (Math.sin(angle) * distance) + 'px');
    particles.appendChild(p);
    setTimeout(function() { if (p.parentNode === particles) particles.removeChild(p); }, 1000);
  });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Gift Boxes                              */
/* ─────────────────────────────────────────────── */
function initGiftBoxes() {
  animateSectionHeading('gift-boxes');
  var gifts = [
    { label: 'Gift 1', content: 'A Thousand kisses \uD83D\uDE18', type: 'text' },
    { label: 'Gift 2', content: 'Unlimited hugs \uD83E\uDD17', type: 'text' },
    { label: 'Gift 3', content: 'My Whole Life 💙', type: 'text' },
    { label: 'Gift 4  ', content: 'My whole heart \u2764\uFE0F', type: 'text' },
  ];
  var grid = document.getElementById('gift-grid');
  if (!grid) return;

  gifts.forEach(function(gift) {
    var box = document.createElement('div');
    box.className = 'gift-box';
    var contentHtml = gift.type === 'text'
      ? '<p style="color:white;font-family:\'Exo\',sans-serif;font-size:1.125rem">' + gift.content + '</p>'
      : '<img src="' + gift.content + '" style="width:6rem;height:6rem;border-radius:0.5rem;object-fit:cover;box-shadow:0 4px 20px rgba(0,0,0,0.3)" alt="Gift" />';
    box.innerHTML = '<div class="gift-box-wrap"><div class="gift-ribbon"></div><div class="gift-bow" style="color:#4F7CFF">\uD83C\uDF80</div><div class="gift-label" style="color:rgba(255,255,255,0.5);font-size:0.875rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase">' + gift.label + '</div><div class="gift-content">' + contentHtml + '</div></div>';
    box.addEventListener('click', function(e) {
      if (!box.classList.contains('opened')) {
        box.classList.add('opened');
        smallPop(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
      }
    });
    grid.appendChild(box);
  });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Cake                                    */
/* ─────────────────────────────────────────────── */
function initCake() {
  animateSectionHeading('cake');
  var btn = document.getElementById('blow-candles-btn');
  var message = document.getElementById('cake-message');
  var sparklesEl = document.getElementById('cake-sparkles');
  var flames = document.querySelectorAll('.big-flame');
  if (!btn) return;
  var blown = false;

  btn.addEventListener('click', function() {
    if (blown) return; blown = true;
    gsap.to(btn, { opacity: 0, scale: 0.9, duration: 0.3, onComplete: function() { btn.style.display = 'none'; } });
    flames.forEach(function(flame, i) { setTimeout(function() { flame.classList.add('out'); }, i * 150); });
    setTimeout(function() {
      sparklesEl.classList.remove('hidden');
      for (var i = 0; i < 20; i++) {
        (function() {
          var s = document.createElement('div');
          s.style.cssText = 'position:absolute;color:#8FA8D9;font-size:1.125rem';
          s.innerHTML = '\u2746';
          s.style.left = (Math.random() * 100) + '%';
          s.style.top = (Math.random() * 100) + '%';
          gsap.fromTo(s, { scale: 0, opacity: 0 }, { scale: Math.random() * 1.5 + 0.5, opacity: 1, duration: 0.4, yoyo: true, repeat: -1, delay: Math.random() * 2 });
          sparklesEl.appendChild(s);
        })();
      }
      celebrationBurst();
      message.classList.remove('hidden');
    }, 800);
  });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Balloons                                */
/* ─────────────────────────────────────────────── */
function initBalloons() {
  animateSectionHeading('balloons');
  var balloonMessages = [
    'Pop!', 'Love you!', 'Surprise!', 'Cutie!', 'You found love!', 'Oops!', 'Yay!', 'Smiles!',
    'My heart, always ❤️', 'You’re my favorite person', 'Forever yours',
    'You make my heart pop 💖', 'Cutest human alive', 'I adore you',
    'My sunshine ☀️', 'You + Me = ❤️', 'Head over heels for you',
    'You’re my home', 'My whole heart', 'Sweetest soul I know',
  ];
  var balloonColors = ['#4F7CFF', '#7FB2FF', '#D6ECFF', '#2F4FCC', '#8FA8D9'];
  var container = document.getElementById('balloons-container');
  if (!container) return;

  function createBalloon() {
    var balloon = document.createElement('div');
    balloon.className = 'balloon animate-float';
    var color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
    var size = Math.random() * 40 + 60, left = Math.random() * 80 + 10;
    var bottom = Math.random() * 55 + 5; // stay within the visible container, gently bobbing in place
    var delay = Math.random() * 5, duration = Math.random() * 4 + 4;
    balloon.style.left = left + '%'; balloon.style.bottom = bottom + '%';
    balloon.style.width = size + 'px'; balloon.style.height = (size * 1.3) + 'px';
    balloon.style.animationDelay = delay + 's'; balloon.style.animationDuration = duration + 's';
    balloon.innerHTML = '<svg viewBox="0 0 100 130" width="100%" height="100%"><path d="M50 0 C10 0 0 30 0 60 C0 90 30 110 50 120 C70 110 100 90 100 60 C100 30 90 0 50 0 Z" fill="' + color + '" opacity="0.85"/><path d="M50 120 L45 130 L55 130 Z" fill="' + color + '" opacity="0.85"/><path d="M20 30 C30 15 45 10 50 10" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4" stroke-linecap="round"/></svg>';
    balloon.addEventListener('click', function(e) {
      balloon.style.animationDelay = '0s';
      balloon.classList.add('balloon-pop');
      var msg = document.createElement('div');
      msg.className = 'balloon-message';
      msg.textContent = balloonMessages[Math.floor(Math.random() * balloonMessages.length)];
      msg.style.left = e.clientX + 'px'; msg.style.top = e.clientY + 'px';
      document.body.appendChild(msg); setTimeout(function() { msg.remove(); }, 1500);
      setTimeout(function() { balloon.remove(); setTimeout(createBalloon, Math.random() * 2000); }, 600);
    });
    container.appendChild(balloon);
  }

  for (var i = 0; i < 12; i++) createBalloon();
}

/* ─────────────────────────────────────────────── */
/* SECTION: Scratch Card                            */
/* ─────────────────────────────────────────────── */
function initScratchCard() {
  animateSectionHeading('scratch-card');
  var canvas = document.getElementById('scratch-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d', { willReadFrequently: true });
  var isDrawing = false, isRevealed = false;

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
    if (!isRevealed) fillCanvas();
  }

  function fillCanvas() {
    var gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#B0B5C1'); gradient.addColorStop(0.5, '#E5E7EB'); gradient.addColorStop(1, '#9CA3AF');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (var i = 0; i < 2000; i++) ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, Math.random() * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.font = 'bold 24px Poppins';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Scratch Here', canvas.width / 2, canvas.height / 2);
  }

  function getPos(evt) {
    var rect = canvas.getBoundingClientRect();
    return { x: (evt.clientX || evt.touches[0].clientX) - rect.left, y: (evt.clientY || evt.touches[0].clientY) - rect.top };
  }

  function startScratch(e) { if (!isRevealed) { isDrawing = true; scratch(e); } }
  function endScratch() { isDrawing = false; ctx.beginPath(); checkReveal(); }
  function scratch(e) {
    if (!isDrawing || isRevealed) return; e.preventDefault();
    var pos = getPos(e);
    ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 40; ctx.lineCap = 'round';
    ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  }

  function checkReveal() {
    var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var transparent = 0;
    for (var i = 3; i < pixels.length; i += 4) { if (pixels[i] < 10) transparent++; }
    if ((transparent / (pixels.length / 4)) * 100 > 50) {
      isRevealed = true;
      canvas.style.transition = 'opacity 0.5s ease'; canvas.style.opacity = '0';
      setTimeout(function() { canvas.style.display = 'none'; celebrationBurst(); }, 500);
    }
  }

  window.addEventListener('resize', resizeCanvas); resizeCanvas();
  canvas.addEventListener('mousedown', startScratch); canvas.addEventListener('mouseup', endScratch); canvas.addEventListener('mousemove', scratch);
  canvas.addEventListener('touchstart', startScratch, { passive: false }); canvas.addEventListener('touchend', endScratch); canvas.addEventListener('touchmove', scratch, { passive: false });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Spin Wheel                              */
/* ─────────────────────────────────────────────── */
function initSpinWheel() {
  animateSectionHeading('spin-wheel');
  var segments = [
    { label: 'One Hug', color: '#1B3399' }, { label: 'One Kiss', color: '#2F4FCC' },
    { label: 'Movie Night', color: '#4F7CFF' }, { label: 'Ice Cream', color: '#5E97FF' },
    { label: 'Long Walk', color: '#7FB2FF' }, { label: 'Surprise!', color: '#9CC5FF' },
    { label: 'Free Hugs', color: '#BFDDFF' }, { label: 'Your Choice', color: '#D6ECFF' }
  ];
  var canvas = document.getElementById('wheel-canvas');
  var btn = document.getElementById('spin-btn');
  var modal = document.getElementById('spin-result');
  var modalText = document.getElementById('spin-result-text');
  var modalClose = document.getElementById('spin-result-close');
  var modalOverlay = document.getElementById('spin-result-overlay');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var radius = canvas.width / 2, arc = Math.PI / (segments.length / 2);
  var rotation = 0, isSpinning = false;

  function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    segments.forEach(function(seg, i) {
      var angle = rotation + i * arc;
      ctx.beginPath(); ctx.fillStyle = seg.color; ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius, angle, angle + arc, false); ctx.lineTo(radius, radius); ctx.fill();
      ctx.save();
      ctx.translate(radius + Math.cos(angle + arc / 2) * (radius * 0.7), radius + Math.sin(angle + arc / 2) * (radius * 0.7));
      ctx.rotate(angle + arc / 2 + Math.PI / 2);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Poppins'; ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
      ctx.fillText(seg.label, 0, 0); ctx.restore();
    });
    ctx.beginPath(); ctx.arc(radius, radius, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowBlur = 0;
  }

  drawWheel();

  btn.addEventListener('click', function() {
    if (isSpinning) return; isSpinning = true;
    var spinDuration = 4000, spins = 5;
    var randomOffset = Math.random() * Math.PI * 2;
    var targetRotation = rotation + (Math.PI * 2 * spins) + randomOffset;
    var startTime = performance.now();
    function easeOutQuart(t) { return 1 - (--t) * t * t * t; }
    function animate(currentTime) {
      var progress = Math.min((currentTime - startTime) / spinDuration, 1);
      rotation = targetRotation * easeOutQuart(progress); drawWheel();
      if (progress < 1) requestAnimationFrame(animate);
      else { isSpinning = false; showResult(); }
    }
    requestAnimationFrame(animate);
  });

  function showResult() {
    var normalizedRot = rotation % (Math.PI * 2);
    var pointerAngle = (Math.PI * 1.5 - normalizedRot + Math.PI * 2) % (Math.PI * 2);
    var winningIndex = Math.floor(pointerAngle / arc) % segments.length;
    modalText.textContent = segments[winningIndex].label;
    setTimeout(function() { modal.classList.remove('hidden'); celebrationBurst(); }, 300);
  }

  function closeModal() { modal.classList.add('hidden'); }
  modalClose.addEventListener('click', closeModal); modalOverlay.addEventListener('click', closeModal);
}

/* ─────────────────────────────────────────────── */
/* SECTION: Love Meter                              */
/* ─────────────────────────────────────────────── */
function initLoveMeter() {
  animateSectionHeading('love-meter');
  var meterFill = document.getElementById('meter-fill');
  var meterValue = document.getElementById('meter-value');
  var meterLabel = document.getElementById('meter-label');
  var meterSvg = document.getElementById('meter-svg');
  if (!meterFill) return;

  ScrollTrigger.create({
    trigger: '#love-meter', start: 'top 60%', once: true,
    onEnter: function() {
      var obj = { val: 0, dash: 471 };
      gsap.to(obj, {
        val: 100, dash: 0, duration: 3, ease: 'power3.inOut',
        onUpdate: function() { meterFill.style.strokeDashoffset = obj.dash; meterValue.textContent = Math.floor(obj.val) + '%'; },
        onComplete: function() {
          meterLabel.textContent = 'Capacity reached...';
          setTimeout(function() {
            gsap.to(meterSvg, { filter: 'drop-shadow(0 0 30px rgba(79, 124, 255,0.8))', duration: 1 });
            meterValue.innerHTML = '<span style="font-size:3.75rem;color:#4F7CFF">\u221E</span>';
            meterValue.style.transform = 'scale(1.2)'; meterValue.style.transition = 'transform 0.5s ease';
            meterLabel.textContent = 'Infinity \u2764\uFE0F'; meterLabel.style.color = '#4F7CFF';
          }, 1000);
        }
      });
    }
  });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Promise Cards                           */
/* ─────────────────────────────────────────────── */
function initPromiseCards() {
  animateSectionHeading('promise-cards');
  var promises = [
    "I promise that I will never leave you.",
    "I promise to always make you laugh, even when you're mad.",
    "I promise to listen to your rants about your day.",
    "I promise to support your wildest dreams.",
    "I promise to hold your hand through the hard times.",
    "I promise to remind you how beautiful you are every day.",
    "I promise to be your safe space.",
    "I promise to choose you, every single day."
  ];
  var grid = document.getElementById('promises-grid');
  if (!grid) return;
  promises.forEach(function(promise, index) {
    var card = document.createElement('div');
    card.className = 'promise-card';
    card.innerHTML = '<div class="promise-card-inner shadow-lg"><div class="promise-card-front"><p style="color:#8FA8D9;font-size:0.875rem;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5rem">Promise</p><h3 style="font-size:1.5rem;font-family:\'Exo\',sans-serif;color:white">#' + (index + 1) + '</h3></div><div class="promise-card-back"><p style="text-align:center;color:rgba(255,255,255,0.9);font-size:0.875rem;line-height:1.6">"' + promise + '"</p></div></div>';
    card.addEventListener('click', function() { card.classList.toggle('flipped'); });
    grid.appendChild(card);
  });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Quotes                                  */
/* ─────────────────────────────────────────────── */
function initQuotes() {
  animateSectionHeading('quotes');
  var quotesList = [
    { text: "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.", author: "Maya Angelou" },
    { text: "I love you not only for what you are, but for what I am when I am with you.", author: "Roy Croft" },
    { text: "If I know what love is, it is because of you.", author: "Hermann Hesse" },
    { text: "You are the finest, loveliest, tenderest, and most beautiful person I have ever known—and even that is an understatement.", author: "F. Scott Fitzgerald" },
    { text: "I look at you and see the rest of my life in front of my eyes.", author: "Unknown" }
  ];
  var textEl = document.getElementById('quote-text');
  var authorEl = document.getElementById('quote-author');
  var prevBtn = document.getElementById('quote-prev');
  var nextBtn = document.getElementById('quote-next');
  if (!textEl) return;
  var currentIndex = 0, intervalId;

  function showQuote(index) {
    textEl.style.opacity = 0; textEl.style.transform = 'scale(0.98)'; authorEl.style.opacity = 0;
    setTimeout(function() {
      textEl.textContent = quotesList[index].text; authorEl.textContent = '\u2014 ' + quotesList[index].author;
      textEl.style.opacity = 1; textEl.style.transform = 'scale(1)'; authorEl.style.opacity = 1;
    }, 600);
  }
  function next() { currentIndex = (currentIndex + 1) % quotesList.length; showQuote(currentIndex); resetInterval(); }
  function prev() { currentIndex = (currentIndex - 1 + quotesList.length) % quotesList.length; showQuote(currentIndex); resetInterval(); }
  function resetInterval() { clearInterval(intervalId); intervalId = setInterval(next, 6000); }
  showQuote(0); intervalId = setInterval(next, 6000);
  prevBtn.addEventListener('click', prev); nextBtn.addEventListener('click', next);
}

/* ─────────────────────────────────────────────── */
/* SECTION: Puzzle                                  */
/* ─────────────────────────────────────────────── */
function initPuzzle() {
  animateSectionHeading('puzzle');
  var IMAGE_SRC = 'public/images/memories/11.jpg';
  var grid = document.getElementById('puzzle-grid');
  var hintBtn = document.getElementById('puzzle-hint');
  var completeMsg = document.getElementById('puzzle-complete');
  if (!grid) return;
  var size = 3, pieces = [], isComplete = false;
  var draggedEl = null, touchDraggedEl = null;
  var touchStartX = 0, touchStartY = 0, touchDragOverEl = null;
  var bgSize = '300% 300%'; // pieces always show the image untouched — the grid itself is reshaped to the image's aspect ratio instead

  var probeImg = new Image();
  probeImg.onload = function() {
    grid.style.aspectRatio = probeImg.naturalWidth + ' / ' + probeImg.naturalHeight;
    render();
  };
  probeImg.src = IMAGE_SRC;

  for (var i = 0; i < size * size; i++) {
    var x = (i % size) * (100 / (size - 1));
    var y = Math.floor(i / size) * (100 / (size - 1));
    pieces.push({ id: i, currentPos: i, correctPos: i, bgPos: x + '% ' + y + '%' });
  }

  var shuffled = false;
  while (!shuffled) {
    pieces.sort(function() { return Math.random() - 0.5; });
    pieces.forEach(function(p, i) { p.currentPos = i; });
    if (pieces.filter(function(p) { return p.currentPos !== p.correctPos; }).length >= 4) shuffled = true;
  }

  function render() {
    grid.innerHTML = '';
    pieces.forEach(function(piece) {
      var el = document.createElement('div');
      el.className = 'puzzle-piece';
      if (piece.currentPos === piece.correctPos) el.classList.add('correct');
      el.style.backgroundImage = 'url(' + IMAGE_SRC + ')';
      el.style.backgroundPosition = piece.bgPos;
      el.style.backgroundSize = bgSize;
      el.draggable = true; el.dataset.id = piece.id;

      el.addEventListener('dragstart', function(e) {
        if (isComplete) return; draggedEl = this; this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', this.dataset.id);
      });
      el.addEventListener('dragover', function(e) { if (e.preventDefault) e.preventDefault(); return false; });
      el.addEventListener('dragenter', function() { if (this !== draggedEl && !isComplete) this.classList.add('drag-over'); });
      el.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
      el.addEventListener('drop', function(e) {
        if (e.stopPropagation) e.stopPropagation();
        if (draggedEl !== this && !isComplete) swapPieces(parseInt(draggedEl.dataset.id), parseInt(this.dataset.id));
        return false;
      });
      el.addEventListener('dragend', function() {
        this.classList.remove('dragging');
        document.querySelectorAll('.puzzle-piece').forEach(function(p) { p.classList.remove('drag-over'); });
      });
      el.addEventListener('touchstart', function(e) {
        if (isComplete) return;
        touchDraggedEl = this;
        var t = e.touches[0];
        touchStartX = t.clientX; touchStartY = t.clientY;
        this.classList.add('dragging');
      }, { passive: false });
      el.addEventListener('touchmove', function(e) {
        if (!touchDraggedEl || isComplete) return;
        e.preventDefault();
        var t = e.touches[0];
        var dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
        touchDraggedEl.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(1.08)';
        var target = document.elementFromPoint(t.clientX, t.clientY);
        var pieceTarget = target && target.closest('.puzzle-piece');
        if (touchDragOverEl && touchDragOverEl !== pieceTarget) touchDragOverEl.classList.remove('drag-over');
        if (pieceTarget && pieceTarget !== touchDraggedEl) { pieceTarget.classList.add('drag-over'); touchDragOverEl = pieceTarget; }
        else touchDragOverEl = null;
      }, { passive: false });
      el.addEventListener('touchend', function(e) {
        if (!touchDraggedEl || isComplete) return;
        var t = e.changedTouches[0];
        touchDraggedEl.style.transform = '';
        touchDraggedEl.classList.remove('dragging');
        if (touchDragOverEl) { touchDragOverEl.classList.remove('drag-over'); }
        var target = document.elementFromPoint(t.clientX, t.clientY);
        var pieceTarget = target && target.closest('.puzzle-piece');
        if (pieceTarget && pieceTarget !== touchDraggedEl)
          swapPieces(parseInt(touchDraggedEl.dataset.id), parseInt(pieceTarget.dataset.id));
        touchDraggedEl = null; touchDragOverEl = null;
      });
      grid.appendChild(el);
    });
  }

  function swapPieces(id1, id2) {
    var idx1 = pieces.findIndex(function(p) { return p.id === id1; });
    var idx2 = pieces.findIndex(function(p) { return p.id === id2; });
    var temp = pieces[idx1]; pieces[idx1] = pieces[idx2]; pieces[idx2] = temp;
    pieces.forEach(function(p, i) { p.currentPos = i; });
    render(); checkWin();
  }

  function checkWin() {
    isComplete = pieces.every(function(p) { return p.currentPos === p.correctPos; });
    if (isComplete) {
      grid.style.gap = '0'; grid.style.padding = '0'; grid.style.border = 'none';
      grid.style.boxShadow = '0 10px 40px rgba(79, 124, 255, 0.4)';
      document.querySelectorAll('.puzzle-piece').forEach(function(p) { p.style.border = 'none'; p.draggable = false; p.style.cursor = 'default'; });
      completeMsg.classList.remove('hidden'); celebrationBurst();
    }
  }

  hintBtn.addEventListener('click', function() {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;z-index:20;border-radius:0.75rem;background-image:url(' + IMAGE_SRC + ');background-size:cover;background-position:center;opacity:0;transition:opacity 0.3s ease';
    grid.style.position = 'relative'; grid.appendChild(overlay);
    setTimeout(function() { overlay.style.opacity = '1'; }, 50);
    setTimeout(function() { overlay.style.opacity = '0'; setTimeout(function() { overlay.remove(); }, 300); }, 2000);
  });

  render();
}

/* ─────────────────────────────────────────────── */
/* SECTION: Quiz                                    */
/* ─────────────────────────────────────────────── */
function initQuiz() {
  animateSectionHeading('quiz');
  var questions = [
    { question: "When was our first date?", options: ["January 31st", "February 14th", "March 10th", "April 1st"], correct: 0 },
    { question: "What is my favorite memory of us?", options: ["First Date", "Video Calls", "College Day", "That Late Night Call"], correct: 2 },
    { question: "How much do I love you?", options: ["A lot", "So much", "More than words can say", "All of the above"], correct: 3, allCorrect: true }
  ];
  var container = document.getElementById('quiz-container');
  if (!container) return;

  questions.forEach(function(q, qIndex) {
    var qDiv = document.createElement('div');
    qDiv.className = 'bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8';
    var optionsHtml = '';
    q.options.forEach(function(opt, oIndex) {
      optionsHtml += '<button class="quiz-option mb-3" data-q="' + qIndex + '" data-o="' + oIndex + '">' + opt + '</button>';
    });
    qDiv.innerHTML = '<h3 class="text-xl md:text-2xl font-display text-white mb-6">' + q.question + '</h3><div class="options-container">' + optionsHtml + '</div><p class="quiz-feedback hidden mt-4 text-sm"></p>';
    container.appendChild(qDiv);
  });

  document.querySelectorAll('.quiz-option').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var qIndex = parseInt(this.dataset.q), oIndex = parseInt(this.dataset.o);
      var question = questions[qIndex];
      var parent = this.closest('div').parentElement;
      var feedback = parent.querySelector('.quiz-feedback');
      var siblings = parent.querySelectorAll('.quiz-option');
      siblings.forEach(function(s) { s.classList.remove('correct', 'wrong'); s.disabled = true; });
      var isCorrect = question.allCorrect || question.correct === oIndex;
      if (isCorrect) {
        this.classList.add('correct'); feedback.textContent = 'Correct! \u2764\uFE0F';
        feedback.className = 'quiz-feedback mt-4 text-sm'; feedback.style.color = '#4F7CFF';
        var rect = this.getBoundingClientRect();
        smallPop((rect.left + rect.width / 2) / window.innerWidth, (rect.top + rect.height / 2) / window.innerHeight);
      } else {
        var self = this;
        this.classList.add('wrong'); feedback.textContent = 'Oops, try again! (But I still love you)';
        feedback.className = 'quiz-feedback mt-4 text-sm'; feedback.style.color = '#2F4FCC';
        setTimeout(function() { siblings.forEach(function(s) { s.disabled = false; }); self.classList.remove('wrong'); feedback.classList.add('hidden'); }, 1500);
      }
      feedback.classList.remove('hidden');
    });
  });
}

/* ─────────────────────────────────────────────── */
/* SECTION: Memory Book                             */
/* ─────────────────────────────────────────────── */
function initMemoryBook() {
  animateSectionHeading('memory-book');
  var MEMORY_PHOTO_COUNT = 14;
  var pagesData = [];
  for (var m = 1; m <= MEMORY_PHOTO_COUNT; m++) {
    pagesData.push({
      img: 'public/images/memories/' + m + '.jpg',
    });
  }
  var book = document.getElementById('book');
  var prevBtn = document.getElementById('book-prev');
  var nextBtn = document.getElementById('book-next');
  var pageNum = document.getElementById('book-page-num');
  if (!book) return;
  var currentPage = 0, totalPages = pagesData.length;
  var lightboxImages = pagesData.map(function(page) { return { src: page.img, caption: '' }; });

  pagesData.forEach(function(page, index) {
    var el = document.createElement('div');
    el.className = 'book-page'; el.style.zIndex = totalPages - index;
    el.innerHTML = '<img src="' + page.img + '" alt="Memory" loading="lazy" style="cursor: pointer;" />';
    el.querySelector('img').addEventListener('click', function() { window.openLightbox(lightboxImages, index); });
    book.appendChild(el);
  });

  var pages = document.querySelectorAll('.book-page');

  function updateBook() {
    pageNum.textContent = 'Page ' + (currentPage + 1) + ' / ' + totalPages;
    pages.forEach(function(page, index) {
      if (index < currentPage) { page.classList.add('flipped'); page.style.zIndex = index + 1; }
      else { page.classList.remove('flipped'); page.style.zIndex = totalPages - index; }
    });
    prevBtn.style.opacity = currentPage === 0 ? '0.3' : '1';
    nextBtn.style.opacity = currentPage === totalPages - 1 ? '0.3' : '1';
  }

  nextBtn.addEventListener('click', function() { if (currentPage < totalPages - 1) { currentPage++; updateBook(); } });
  prevBtn.addEventListener('click', function() { if (currentPage > 0) { currentPage--; updateBook(); } });

  var touchStartX = 0;
  book.addEventListener('touchstart', function(e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  book.addEventListener('touchend', function(e) {
    var touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 50 && currentPage < totalPages - 1) { currentPage++; updateBook(); }
    if (touchEndX > touchStartX + 50 && currentPage > 0) { currentPage--; updateBook(); }
  }, { passive: true });
  updateBook();
}

/* ─────────────────────────────────────────────── */
/* SECTION: Ending                                  */
/* ─────────────────────────────────────────────── */
function initEnding() {
  var ending = document.getElementById('ending');
  var replayBtn = document.getElementById('replay-btn');
  if (!ending) return;

  gsap.set('#ending-love', { scale: 0.8 });

  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: ending, start: 'top 50%',
      onEnter: function() { setTimeout(grandFinale, 1000); }
    }
  });
  tl.to('#ending-pretext', { y: -20, opacity: 1, duration: 1, ease: 'power2.out' })
    .to('#ending-text', { y: -20, opacity: 1, duration: 1.5, ease: 'power2.out' }, '-=0.5')
    .to('#ending-love', { scale: 1, opacity: 1, duration: 1.5, ease: 'elastic.out(1, 0.5)' }, '-=0.5')
    .to('#replay-btn', { y: -20, opacity: 1, duration: 1, ease: 'power2.out' }, '-=0.5');

  if (replayBtn) {
    replayBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function() { window.location.reload(); }, 1000);
    });
  }
}

/* ─────────────────────────────────────────────── */
/* INIT: Bootstrap Everything on DOMContentLoaded   */
/* ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  // Register GSAP ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // Init Lucide icons
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // 1. Base systems
  var particleSystem = initParticles();
  initNightMode(particleSystem);
  initNavigation();
  initMusicPlayer();
  initLightbox();

  // 2. Sections
  initLanding();
  initCountdown();
  initGallery();
  initTimeline();
  initLoveLetter();
  initReasons();
  initInteractiveHeart();
  initGiftBoxes();
  initCake();
  initBalloons();
  initScratchCard();
  initSpinWheel();
  initLoveMeter();
  initPromiseCards();
  initQuotes();
  initPuzzle();
  initQuiz();
  initMemoryBook();
  initEnding();

  console.log('\u2764\uFE0F Birthday website fully loaded \u2764\uFE0F');
});
