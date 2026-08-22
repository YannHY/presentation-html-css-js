(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const slides = [...document.querySelectorAll('.slide')];
  const chapters = [...new Set(slides.map(slide => slide.dataset.chapter))];
  const chapterLabels = Object.fromEntries(slides.map(slide => [slide.dataset.chapter, slide.dataset.chapterLabel || slide.dataset.chapter]));
  const nav = document.getElementById('chapter-nav');
  const previousButton = document.getElementById('previous');
  const nextButton = document.getElementById('next');
  const fullscreenButton = document.getElementById('fullscreen');
  const shortcutsToggle = document.getElementById('shortcuts-toggle');
  const shortcutsPanel = document.getElementById('keyboard-shortcuts');
  const notesToggle = document.getElementById('notes-toggle');
  const notesPanel = document.getElementById('notes');
  const notesContent = document.getElementById('notes-content');
  const notesStatus = document.getElementById('notes-status');
  const timerSettingsToggle = document.getElementById('timer-settings-toggle');
  const timerSettingsPanel = document.getElementById('timer-settings');
  const counter = document.getElementById('counter');
  const progress = document.getElementById('progress');
  const notesStorageKey = `presentation-notes:${location.pathname || document.title}`;
  let storedNotes = {};
  let notesCanPersist = true;
  let current = 0;
  let currentBuild = 1;
  let touchStartX = null;

  try {
    storedNotes = JSON.parse(localStorage.getItem(notesStorageKey) || '{}');
    if (!storedNotes || Array.isArray(storedNotes) || typeof storedNotes !== 'object') storedNotes = {};
  } catch (_) {
    notesCanPersist = false;
  }

  chapters.forEach(chapter => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chapter-button';
    button.dataset.chapter = chapter;
    button.textContent = chapterLabels[chapter];
    button.addEventListener('click', () => goTo(slides.findIndex(slide => slide.dataset.chapter === chapter)));
    nav.appendChild(button);
  });

  function maxBuild(index = current) {
    const steps = [...slides[index].querySelectorAll('[data-build]')].map(item => Number(item.dataset.build));
    return steps.length ? Math.max(1, ...steps) : 1;
  }

  function closeNotes() {
    if (document.activeElement === notesContent) notesContent.blur();
    notesPanel.classList.remove('open');
    notesToggle.setAttribute('aria-expanded', 'false');
    notesToggle.setAttribute('aria-label', 'Afficher les notes');
  }

  function noteKey(index = current) {
    return slides[index].id || `slide-${index + 1}`;
  }

  function noteFor(index = current) {
    const key = noteKey(index);
    return Object.prototype.hasOwnProperty.call(storedNotes, key)
      ? String(storedNotes[key])
      : slides[index].dataset.notes || '';
  }

  function updateNotesStatus() {
    if (!notesStatus) return;
    notesStatus.textContent = notesCanPersist
      ? 'Modifications enregistrées dans ce navigateur'
      : 'Modifications conservées pour cette session';
  }

  function saveCurrentNote() {
    const value = notesContent.innerText.replace(/\r\n?/g, '\n');
    slides[current].dataset.notes = value;
    storedNotes[noteKey()] = value;
    if (notesCanPersist) {
      try {
        localStorage.setItem(notesStorageKey, JSON.stringify(storedNotes));
      } catch (_) {
        notesCanPersist = false;
      }
    }
    updateNotesStatus();
  }

  function closeShortcuts() {
    shortcutsPanel.classList.remove('open');
    shortcutsToggle.setAttribute('aria-expanded', 'false');
    shortcutsToggle.setAttribute('aria-label', 'Afficher les raccourcis clavier');
  }

  function closeTimerSettings() {
    if (timerSettingsPanel.contains(document.activeElement)) document.activeElement.blur();
    timerSettingsPanel.classList.remove('open');
    timerSettingsToggle.setAttribute('aria-expanded', 'false');
    timerSettingsToggle.setAttribute('aria-label', 'Régler le minuteur');
  }

  // Les apparitions ne servent qu'en projection : hors plein écran la slide se
  // montre entière, pour relire et retoucher sans dérouler les étapes.
  function buildsActifs() {
    return (Boolean(fullscreenElement()) || Boolean(window.__presentationVideoExport)) && !reducedMotion.matches;
  }

  function updateBuildState() {
    const revealAll = !buildsActifs();
    const lastBuild = maxBuild();
    slides[current].querySelectorAll('[data-build]').forEach(item => {
      const visible = revealAll || Number(item.dataset.build) <= currentBuild;
      item.classList.toggle('is-visible', visible);
      item.setAttribute('aria-hidden', String(!visible));
    });
    const hasNextBuild = !revealAll && currentBuild < lastBuild;
    const hasPreviousBuild = !revealAll && currentBuild > 1;
    nextButton.classList.toggle('has-build', hasNextBuild);
    nextButton.disabled = current === slides.length - 1 && !hasNextBuild;
    previousButton.disabled = current === 0 && !hasPreviousBuild;
    nextButton.setAttribute('aria-label', hasNextBuild ? 'Afficher la suite' : 'Slide suivante');
    previousButton.setAttribute('aria-label', hasPreviousBuild ? 'Masquer la dernière étape' : 'Slide précédente');
    // Les visuels s'abonnent à cet évènement pour démarrer en arrivant sur leur
    // slide et s'arrêter en la quittant : une slide inactive ne fait rien tourner.
    document.dispatchEvent(new CustomEvent('presentation:build', {
      detail: { slide: slides[current], slideIndex: current, build: revealAll ? lastBuild : currentBuild, lastBuild }
    }));
  }


  // Une slide est une maquette de taille fixe (1310 × 700 px de dessin) : plutôt
  // que d'ajuster chaque taille à la fenêtre, on met le bloc entier à l'échelle.
  // Le facteur vient de la place réellement disponible dans la slide, bordures
  // décoratives comprises, et il est plafonné pour ne pas devenir grotesque sur
  // un très grand écran.
  const FRAME = { width: 1310, height: 700 };
  const FRAME_FALLBACK = 900;

  function updateSlideScale() {
    if (window.innerWidth <= FRAME_FALLBACK) {
      document.documentElement.style.removeProperty('--slide-scale');
      return;
    }
    const slide = slides[current] || slides[0];
    const box = getComputedStyle(slide);
    const width = slide.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight);
    const height = slide.clientHeight - parseFloat(box.paddingTop) - parseFloat(box.paddingBottom);
    if (width <= 0 || height <= 0) return;
    const scale = Math.min(2.4, Math.min(width / FRAME.width, height / FRAME.height));
    document.documentElement.style.setProperty('--slide-scale', scale.toFixed(4));
  }

  function goTo(index, { updateHash = true, reveal = 'start' } = {}) {
    updateSlideScale();
    const next = Math.max(0, Math.min(slides.length - 1, index));
    const changed = next !== current;
    current = next;
    currentBuild = reveal === 'end' && buildsActifs() ? maxBuild(current) : 1;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    document.querySelectorAll('.chapter-button').forEach(button => {
      const first = slides.findIndex(slide => slide.dataset.chapter === button.dataset.chapter);
      button.classList.toggle('active', button.dataset.chapter === slides[current].dataset.chapter);
      button.classList.toggle('visited', first <= current);
      button.setAttribute('aria-current', button.dataset.chapter === slides[current].dataset.chapter ? 'step' : 'false');
    });
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    const note = noteFor(current);
    notesContent.textContent = note;
    slides[current].dataset.notes = note;
    updateNotesStatus();
    updateBuildState();
    if (changed) { closeNotes(); closeShortcuts(); closeTimerSettings(); }
    if (updateHash) history.replaceState(null, '', `#slide-${current + 1}`);
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function updateFullscreenUi() {
    const active = Boolean(fullscreenElement());
    document.documentElement.classList.toggle('presentation-fullscreen', active);
    updateSlideScale();
    const icon = fullscreenButton.querySelector('i');
    icon.classList.toggle('fa-expand', !active);
    icon.classList.toggle('fa-compress', active);
    fullscreenButton.setAttribute('aria-label', active ? 'Quitter le plein écran' : 'Passer en plein écran');
    currentBuild = 1;
    updateBuildState();
  }

  function advance() {
    if (buildsActifs() && currentBuild < maxBuild()) { currentBuild += 1; updateBuildState(); return; }
    if (current < slides.length - 1) goTo(current + 1);
  }

  function retreat() {
    if (buildsActifs() && currentBuild > 1) { currentBuild -= 1; updateBuildState(); return; }
    if (current > 0) goTo(current - 1, { reveal: 'end' });
  }

  // Les visuels construits en JavaScript ajoutent leurs [data-build] après le
  // premier rendu. Sans ce crochet, ils n'obtiennent jamais `is-visible` et
  // restent invisibles pour toujours.
  document.addEventListener('presentation:refresh', () => updateBuildState());

  previousButton.addEventListener('click', retreat);
  nextButton.addEventListener('click', advance);
  notesContent.addEventListener('input', saveCurrentNote);
  notesContent.addEventListener('blur', () => {
    const value = notesContent.innerText.replace(/\r\n?/g, '\n');
    notesContent.textContent = value;
    saveCurrentNote();
  });
  notesToggle.addEventListener('click', () => {
    const open = notesPanel.classList.toggle('open');
    if (open) { closeShortcuts(); closeTimerSettings(); }
    notesToggle.setAttribute('aria-expanded', String(open));
    notesToggle.setAttribute('aria-label', open ? 'Masquer les notes' : 'Afficher les notes');
  });
  shortcutsToggle.addEventListener('click', () => {
    const open = shortcutsPanel.classList.toggle('open');
    if (open) { closeNotes(); closeTimerSettings(); }
    shortcutsToggle.setAttribute('aria-expanded', String(open));
    shortcutsToggle.setAttribute('aria-label', open ? 'Masquer les raccourcis clavier' : 'Afficher les raccourcis clavier');
  });
  timerSettingsToggle.addEventListener('click', () => {
    const open = timerSettingsPanel.classList.toggle('open');
    if (open) { closeNotes(); closeShortcuts(); }
    timerSettingsToggle.setAttribute('aria-expanded', String(open));
    timerSettingsToggle.setAttribute('aria-label', open ? 'Masquer les réglages du minuteur' : 'Régler le minuteur');
  });
  fullscreenButton.addEventListener('click', async () => {
    if (fullscreenElement()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else document.webkitExitFullscreen?.();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    } else {
      document.documentElement.webkitRequestFullscreen?.();
    }
  });

  document.addEventListener('fullscreenchange', updateFullscreenUi);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUi);
  window.addEventListener('resize', () => {
    updateSlideScale();
    if (fullscreenElement()) updateFullscreenUi();
  });
  // La fenêtre n'est pas la seule à changer de taille : un panneau d'aperçu qui
  // se rétrécit ne déclenche aucun resize, mais bien un ResizeObserver.
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => updateSlideScale()).observe(stage);
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeNotes(); closeShortcuts(); closeTimerSettings(); return; }
    const focused = document.activeElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(focused?.tagName) || focused?.isContentEditable) return;
    // Un bouton de slide gardé au focus ne doit pas confisquer les flèches du
    // deck : on ne lui laisse que les touches qui l'activent.
    if (['BUTTON', 'A'].includes(focused?.tagName) && (event.key === ' ' || event.key === 'Enter')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); advance(); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); retreat(); }
    if (event.key === 'Home') { event.preventDefault(); goTo(0); }
    if (event.key === 'End') { event.preventDefault(); goTo(slides.length - 1); }
    if (event.key.toLowerCase() === 'f') { event.preventDefault(); fullscreenButton.click(); }
    if (event.key.toLowerCase() === 'n') { event.preventDefault(); notesToggle.click(); }
  });
  document.addEventListener('touchstart', event => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', event => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 55) delta < 0 ? advance() : retreat();
    touchStartX = null;
  }, { passive: true });
  window.addEventListener('hashchange', () => {
    const match = location.hash.match(/slide-(\d+)/);
    if (match) goTo(Number(match[1]) - 1, { updateHash: false });
  });

  const initial = location.hash.match(/slide-(\d+)/);
  goTo(initial ? Number(initial[1]) - 1 : 0, { updateHash: false });
})();

/* ----------------------------------------------------------------------------
   Utilitaires partagés par les figures. Ils vivent au niveau du fichier, pas
   dans l'IIFE du moteur : chaque figure est une IIFE séparée et ne verrait rien
   d'une constante déclarée ailleurs.
   ------------------------------------------------------------------------- */

/* Le facteur d'échelle du cadre de maquette. Tout calcul fait à partir d'un
   getBoundingClientRect() rend des pixels d'écran, alors que style.left ou
   style.top sont relus en pixels de maquette : sans cette division, un
   positionnement dérive dès que la fenêtre n'est pas exactement à l'échelle 1. */
function slideScale() {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--slide-scale'));
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/* Centre un pop-up sur sa cible sans le laisser sortir de sa scène. La marge est
   prise sur sa demi-largeur réelle : une constante devinée finit toujours par
   couper un pop-up plus large que prévu. */
function placePop(pop, target, host) {
  const scale = slideScale();
  const hostBox = host.getBoundingClientRect();
  const targetBox = target.getBoundingClientRect();
  const hostWidth = hostBox.width / scale;
  const centre = (targetBox.left - hostBox.left + targetBox.width / 2) / scale;
  const half = pop.offsetWidth / 2 + 6;
  pop.style.left = `${Math.min(Math.max(centre, half), Math.max(half, hostWidth - half))}px`;
}

/* Déclenche une animation à l'arrivée sur la slide et l'arrête en partant. Une
   figure qui démarre au chargement a déjà tourné quand on arrive : le public ne
   voit que la fin. */
function onSlideVisit(element, enter, leave) {
  const slide = element.closest('.slide');
  let inside = false;
  document.addEventListener('presentation:build', event => {
    const now = event.detail.slide === slide;
    if (now && !inside) { inside = true; enter(); }
    else if (!now && inside) { inside = false; if (leave) leave(); }
  });
  if (slide.classList.contains('active')) { inside = true; enter(); }
}

/* Minuteur optionnel par slide. La slide ne porte que le décompte et sa barre ;
   durée, lecture-pause et remise à zéro vivent dans le panneau de la barre. */
(() => {
  const timers = [...document.querySelectorAll('[data-slide-timer]')];
  const settingsToggle = document.getElementById('timer-settings-toggle');
  const settingsPanel = document.getElementById('timer-settings');
  const minutesInput = document.getElementById('timer-minutes');
  const secondsInput = document.getElementById('timer-seconds');
  const controlToggle = document.getElementById('timer-control-toggle');
  const controlReset = document.getElementById('timer-control-reset');
  if (!settingsToggle || !settingsPanel || !minutesInput || !secondsInput || !controlToggle || !controlReset) return;

  let activeState = null;

  function formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function closeSettings() {
    if (settingsPanel.contains(document.activeElement)) document.activeElement.blur();
    settingsPanel.classList.remove('open');
    settingsToggle.setAttribute('aria-expanded', 'false');
    settingsToggle.setAttribute('aria-label', 'Régler le minuteur');
  }

  function updateControlButton(state) {
    const running = Boolean(state?.running);
    const icon = controlToggle.querySelector('i');
    icon?.classList.toggle('fa-play', !running);
    icon?.classList.toggle('fa-pause', running);
    controlToggle.setAttribute('aria-label', running ? 'Mettre le minuteur en pause' : 'Démarrer le minuteur');
    controlToggle.title = running ? 'Pause' : 'Démarrer';
  }

  function syncPanel(state) {
    if (!state) return;
    const totalSeconds = Math.round(state.configuredMs / 1000);
    minutesInput.value = String(Math.floor(totalSeconds / 60));
    secondsInput.value = String(totalSeconds % 60);
    updateControlButton(state);
  }

  function makeTimerState(timer) {
    const display = timer.querySelector('[data-timer-display]');
    const progress = timer.querySelector('[data-timer-progress]');
    const status = timer.querySelector('[data-timer-status]');
    if (!display || !progress) return null;

    const initialSeconds = Math.max(1, Math.round(Number(timer.dataset.duration) || 300));
    let configuredMs = initialSeconds * 1000;
    let remainingMs = configuredMs;
    let deadline = 0;
    let intervalId = null;
    let running = false;

    function render() {
      const ratio = configuredMs > 0 ? remainingMs / configuredMs : 0;
      timer.style.setProperty('--timer-progress', `${(100 * ratio).toFixed(2)}%`);
      display.textContent = formatTime(remainingMs);
    }

    function setRunning(next) {
      running = next;
      timer.classList.toggle('is-running', running);
      if (activeState === state) updateControlButton(state);
    }

    function stopInterval() {
      if (intervalId !== null) window.clearInterval(intervalId);
      intervalId = null;
      setRunning(false);
    }

    function tick() {
      remainingMs = Math.max(0, deadline - performance.now());
      render();
      if (remainingMs > 0) return;
      stopInterval();
      timer.classList.add('is-finished');
      if (status) status.textContent = 'Temps écoulé.';
    }

    function pause({ announce = true } = {}) {
      if (!running) return;
      remainingMs = Math.max(0, deadline - performance.now());
      stopInterval();
      render();
      if (announce && status) status.textContent = 'Minuteur en pause.';
    }

    function start() {
      if (running) { pause(); return; }
      if (remainingMs <= 0) remainingMs = configuredMs;
      timer.classList.remove('is-finished');
      if (status) status.textContent = '';
      deadline = performance.now() + remainingMs;
      setRunning(true);
      intervalId = window.setInterval(tick, 200);
      tick();
    }

    function reset() {
      pause({ announce: false });
      remainingMs = configuredMs;
      timer.classList.remove('is-finished');
      render();
      if (status) status.textContent = `Minuteur réinitialisé à ${formatTime(configuredMs)}.`;
    }

    function setDuration(totalSeconds) {
      pause({ announce: false });
      configuredMs = Math.max(1, totalSeconds) * 1000;
      remainingMs = configuredMs;
      timer.dataset.duration = String(Math.max(1, totalSeconds));
      timer.classList.remove('is-finished');
      render();
      if (status) status.textContent = `Durée réglée sur ${formatTime(configuredMs)}.`;
    }

    const state = {
      timer,
      get configuredMs() { return configuredMs; },
      get running() { return running; },
      start,
      pause,
      reset,
      setDuration
    };
    render();
    return state;
  }

  const states = new Map(timers.map(timer => [timer, makeTimerState(timer)]).filter(([, state]) => state));

  function setActiveTimer(slide) {
    const nextState = states.get(slide?.querySelector('[data-slide-timer]')) || null;
    if (activeState && activeState !== nextState) activeState.pause();
    if (activeState !== nextState) closeSettings();
    activeState = nextState;
    settingsToggle.hidden = !activeState;
    if (activeState) syncPanel(activeState);
  }

  function applyDuration({ normalise = false } = {}) {
    if (!activeState) return;
    const minutes = Math.min(180, Math.max(0, Number.parseInt(minutesInput.value, 10) || 0));
    const seconds = Math.min(59, Math.max(0, Number.parseInt(secondsInput.value, 10) || 0));
    const totalSeconds = Math.max(1, minutes * 60 + seconds);
    activeState.setDuration(totalSeconds);
    if (normalise) syncPanel(activeState);
  }

  function bindButton(button, action) {
    let pointerActivation = false;
    button.addEventListener('pointerdown', () => { pointerActivation = true; });
    button.addEventListener('keydown', () => { pointerActivation = false; });
    button.addEventListener('click', () => {
      action();
      if (pointerActivation) button.blur();
      pointerActivation = false;
    });
  }

  minutesInput.addEventListener('input', applyDuration);
  secondsInput.addEventListener('input', applyDuration);
  minutesInput.addEventListener('change', () => applyDuration({ normalise: true }));
  secondsInput.addEventListener('change', () => applyDuration({ normalise: true }));
  minutesInput.addEventListener('blur', () => applyDuration({ normalise: true }));
  secondsInput.addEventListener('blur', () => applyDuration({ normalise: true }));
  bindButton(controlToggle, () => activeState?.start());
  bindButton(controlReset, () => activeState?.reset());
  document.addEventListener('presentation:build', event => setActiveTimer(event.detail.slide));
  setActiveTimer(document.querySelector('.slide.active'));
})();
