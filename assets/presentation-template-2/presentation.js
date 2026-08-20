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
  const counter = document.getElementById('counter');
  const progress = document.getElementById('progress');
  let current = 0;
  let currentBuild = 1;
  let touchStartX = null;

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
    notesPanel.classList.remove('open');
    notesToggle.setAttribute('aria-expanded', 'false');
    notesToggle.setAttribute('aria-label', 'Afficher les notes');
  }

  function closeShortcuts() {
    shortcutsPanel.classList.remove('open');
    shortcutsToggle.setAttribute('aria-expanded', 'false');
    shortcutsToggle.setAttribute('aria-label', 'Afficher les raccourcis clavier');
  }

  // Les apparitions ne servent qu'en projection : hors plein écran la slide se
  // montre entière, pour relire et retoucher sans dérouler les étapes.
  function buildsActifs() {
    return Boolean(fullscreenElement()) && !reducedMotion.matches;
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
    notesContent.textContent = slides[current].dataset.notes || '';
    updateBuildState();
    if (changed) { closeNotes(); closeShortcuts(); }
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
  notesToggle.addEventListener('click', () => {
    const open = notesPanel.classList.toggle('open');
    if (open) closeShortcuts();
    notesToggle.setAttribute('aria-expanded', String(open));
    notesToggle.setAttribute('aria-label', open ? 'Masquer les notes' : 'Afficher les notes');
  });
  shortcutsToggle.addEventListener('click', () => {
    const open = shortcutsPanel.classList.toggle('open');
    if (open) closeNotes();
    shortcutsToggle.setAttribute('aria-expanded', String(open));
    shortcutsToggle.setAttribute('aria-label', open ? 'Masquer les raccourcis clavier' : 'Afficher les raccourcis clavier');
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
    if (event.key === 'Escape') { closeNotes(); closeShortcuts(); return; }
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
