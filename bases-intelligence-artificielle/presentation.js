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

  const FRAME = { width: 1310, height: 700 };


  function updateSlideScale() {
    if (window.innerWidth <= 900) {
      document.documentElement.style.removeProperty('--slide-scale');
      return;
    }
    const stage = document.getElementById('stage').getBoundingClientRect();
    const scale = Math.min(2.4, Math.min(stage.width / FRAME.width, stage.height / FRAME.height));
    document.documentElement.style.setProperty('--slide-scale', scale.toFixed(4));
  }

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
    document.dispatchEvent(new CustomEvent('presentation:build', {
      detail: { slide: slides[current], slideIndex: current, build: revealAll ? lastBuild : currentBuild, lastBuild }
    }));
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

  // La slide est dessinée dans un cadre fixe de 1310x700 puis mise à l'échelle
  // d'un bloc : le rendu reste identique à toute taille de fenêtre, au facteur
  // près. Sans cela le corps du texte suivait la largeur et la hauteur ne
  // suivait rien, d'où un contenu trop petit ou trop gros selon le format.
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

  // Les visuels construits en JavaScript ajoutent des [data-build] après le
  // premier rendu : ils demandent alors un recalcul de l'état des apparitions.
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
  // On observe la scène plutôt que la fenêtre : l'évènement `resize` n'est pas
  // émis dans tous les contextes, et la scène change aussi de hauteur quand la
  // barre de commandes se réorganise.
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(updateSlideScale).observe(document.getElementById('stage'));
  }
  window.addEventListener('resize', updateSlideScale);
  updateSlideScale();
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeNotes(); closeShortcuts(); return; }
    const focused = document.activeElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(focused?.tagName) || focused?.isContentEditable) return;
    // Un bouton de slide gardé au focus ne doit pas confisquer les flèches du deck.
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

/* ============================================================
   Ateliers et visuels animés du deck
   Chaque démonstration calcule réellement ce qu'elle montre.
   ============================================================ */

const SVG_NS = 'http://www.w3.org/2000/svg';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

/* `zoom` sur .slide-inner crée deux systèmes de coordonnées : getBoundingClientRect
   rend des pixels écran, alors que style.left est lu en pixels de maquette. Tout
   positionnement calculé à partir d'un rectangle doit donc être divisé par ce
   facteur, sinon il dérive dès que la fenêtre n'est pas exactement à l'échelle 1. */
function slideScale() {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--slide-scale'));
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/* Centre un pop-up sur une cible sans le laisser sortir de sa scène : la marge
   est calculée sur sa demi-largeur réelle, pas sur une constante devinée. */
function placePop(pop, target, host) {
  const scale = slideScale();
  const hostBox = host.getBoundingClientRect();
  const targetBox = target.getBoundingClientRect();
  const hostWidth = hostBox.width / scale;
  const centre = (targetBox.left - hostBox.left + targetBox.width / 2) / scale;
  const half = pop.offsetWidth / 2 + 6;
  pop.style.left = `${Math.min(Math.max(centre, half), Math.max(half, hostWidth - half))}px`;
}

function svgNode(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildGroup(build, attrs = {}) {
  return svgNode('g', { class: `build-step ${attrs.class || ''}`.trim(), 'data-build': build, ...attrs });
}

// Interpolation temporelle commune : l'état final est toujours atteint, même si
// la frame est perdue, et le mouvement réduit saute directement à la fin.
function tween(duration, onFrame) {
  if (reduced.matches) { onFrame(1); return () => {}; }
  let raf = 0;
  const started = performance.now();
  const step = now => {
    const t = Math.min(1, (now - started) / duration);
    onFrame(1 - Math.pow(1 - t, 3));
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

// Déclenche une animation à l'arrivée sur une slide et l'arrête en partant :
// une slide inactive ne doit rien faire tourner.
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

// Machine à écrire : frappe, tient, efface, passe à la suivante.
function typewriter(target, phrases, { speed = 46, erase = 24, hold = 1700, gap = 340 } = {}) {
  let timer = 0;
  let index = 0;
  let cursor = 0;
  let erasing = false;
  if (reduced.matches) { target.textContent = phrases[0]; return () => {}; }
  const tick = () => {
    const phrase = phrases[index];
    if (!erasing) {
      cursor += 1;
      target.textContent = phrase.slice(0, cursor);
      if (cursor >= phrase.length) { erasing = true; timer = setTimeout(tick, hold); return; }
      timer = setTimeout(tick, speed);
    } else {
      cursor -= 1;
      target.textContent = phrase.slice(0, cursor);
      if (cursor <= 0) {
        erasing = false;
        index = (index + 1) % phrases.length;
        timer = setTimeout(tick, gap);
        return;
      }
      timer = setTimeout(tick, erase);
    }
  };
  timer = setTimeout(tick, gap);
  return () => { clearTimeout(timer); target.textContent = ''; cursor = 0; erasing = false; };
}

function catmullPath(points) {
  if (points.length < 2) return '';
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/* ---------- Slide 2 · la frise illustrée ---------- */
(() => {
  const list = document.getElementById('timeline-marks');
  if (!list) return;

  const MILESTONES = [
    { year: '1943', tag: 'le neurone formel', title: 'Un neurone devient une formule',
      text: 'McCulloch et Pitts montrent qu’un neurone peut se décrire par une addition et un seuil. Tout part de là.', glyph: 'neuron' },
    { year: '1950', tag: 'le test de Turing', title: 'Turing pose la question',
      text: 'Si une machine tient une conversation sans qu’on la démasque, faut-il dire qu’elle pense ? Turing préfère cette question à « peut-elle penser ? ».',
      glyph: 'turing', photo: 'assets/turing-1951.jpg', alt: 'Portrait d’Alan Turing en 1951.', credit: 'Photo : Elliott & Fry · domaine public' },
    { year: '1956', tag: 'Dartmouth', title: 'L’expression est inventée',
      text: 'À la conférence de Dartmouth, une poignée de chercheurs baptise le domaine « intelligence artificielle » et annonce des résultats en quelques mois.', glyph: 'paper',
      photo: 'assets/dartmouth-1956.jpg', alt: 'Dartmouth Hall, le bâtiment du collège où s’est tenue la conférence de 1956.', credit: 'Photo : Daderot · CC0' },
    { year: '1958', tag: 'le perceptron', title: 'La première machine qui apprend',
      text: 'Rosenblatt ne programme pas sa machine : il lui montre des exemples jusqu’à ce qu’elle trouve seule ses réglages.',
      glyph: 'mark1', photo: 'assets/perceptron-mark1-1958.jpg', alt: 'Le Mark I Perceptron en 1958, devant lequel on présente la lettre C.', credit: 'Photo : National Museum of the U.S. Navy · domaine public' },
    { year: '1966', tag: 'ELIZA', title: 'Le premier robot de conversation',
      text: 'Weizenbaum écrit ELIZA, qui imite un psychothérapeute avec quelques règles. Des utilisateurs s’y confient — sans qu’elle comprenne un mot.', glyph: 'eliza' },
    { year: '1969', tag: 'le mur', title: 'La démonstration qui gèle tout',
      text: 'Minsky et Papert prouvent qu’un perceptron à une seule couche ne peut pas résoudre certains problèmes très simples. Les crédits s’arrêtent.', glyph: 'wall',
      photo: 'assets/minsky-1969.jpg', alt: 'Portrait de Marvin Minsky, coauteur du livre « Perceptrons ».', credit: 'Photo : David Orban · CC BY 2.0' },
    { year: '1986', tag: 'rétropropagation', title: 'On sait enfin entraîner plusieurs couches',
      text: 'Rumelhart, Hinton et Williams popularisent une méthode pour répartir l’erreur sur toutes les couches. La solution existe — la puissance manque encore.', glyph: 'backprop' },
    { year: '1997', tag: 'Deep Blue', title: 'La machine gagne aux échecs',
      text: 'Deep Blue bat le champion du monde Garry Kasparov. Mais elle n’a rien appris : elle calcule des millions de coups par seconde.',
      glyph: 'chess', photo: 'assets/deep-blue-1997.jpg', alt: 'Le calculateur IBM Deep Blue exposé dans un musée.', credit: 'Photo : Anton Chiang · CC BY 2.0' },
    { year: '2011', tag: 'Watson', title: 'Elle gagne à un jeu de culture générale',
      text: 'Watson bat les champions du jeu télévisé Jeopardy!. Comprendre une question posée en langage courant devient possible.', glyph: 'quiz',
      photo: 'assets/watson-2011.jpg', alt: 'Les trois pupitres du jeu Jeopardy!, celui de Watson affichant son score.', credit: 'Photo : Atomic Taco · CC BY-SA 2.0' },
    { year: '2012', tag: 'AlexNet', title: 'Le réveil des réseaux profonds',
      text: 'Au concours ImageNet, un réseau à plusieurs couches écrase la concurrence. L’idée de 1958 fonctionne enfin : on peut la nourrir et la calculer.', glyph: 'images',
      photo: 'assets/feifei-li-2012.jpg', alt: 'Portrait de Fei-Fei Li, à l’origine de la base d’images ImageNet.', credit: 'Fei-Fei Li, créatrice d’ImageNet · Photo : ITU Pictures · CC BY 2.0' },
    { year: '2016', tag: 'AlphaGo', title: 'Le go tombe aussi',
      text: 'Trop de coups possibles pour être calculés. AlphaGo a progressé en jouant des millions de parties contre lui-même.', glyph: 'go',
      photo: 'assets/go-2016.jpg', alt: 'Une main pose une pierre blanche sur un plateau de go.', credit: 'Photo : Luis de Bethencourt · CC BY 2.0' },
    { year: '2017', tag: 'l’attention', title: 'L’invention qui change le langage',
      text: '« Attention Is All You Need » : chaque mot va chercher les mots dont il a besoin. Tous les modèles de langage actuels en descendent.', glyph: 'attention' },
    { year: '2022', tag: 'ChatGPT', title: 'Le grand public entre en scène',
      text: 'La technologie n’est pas neuve : c’est son accès qui devient massif, et le débat public avec lui.', glyph: 'chat' }
  ];

  const pop = document.getElementById('timeline-pop');
  const popYear = document.getElementById('timeline-pop-year');
  const popTitle = document.getElementById('timeline-pop-title');
  const popText = document.getElementById('timeline-pop-text');
  const popCredit = document.getElementById('timeline-pop-credit');
  const popMedia = document.getElementById('timeline-pop-media');
  const stage = document.getElementById('timeline-stage');

  // Vignettes dessinées pour les jalons dont il n'existe pas d'image libre.
  function glyph(kind) {
    const node = svgNode('svg', { viewBox: '0 0 120 80', class: 'tl-glyph' });
    const add = (tag, attrs, text) => node.appendChild(svgNode(tag, attrs, text));
    if (kind === 'neuron') {
      [22, 40, 58].forEach(y => { add('circle', { class: 'g-dot', cx: 22, cy: y, r: 5 }); add('line', { class: 'g-line', x1: 27, y1: y, x2: 56, y2: 40 }); });
      add('circle', { class: 'g-core', cx: 62, cy: 40, r: 12 });
      add('line', { class: 'g-line', x1: 74, y1: 40, x2: 96, y2: 40 });
      add('rect', { class: 'g-box', x: 96, y: 32, width: 16, height: 16, rx: 4 });
    }
    if (kind === 'turing') {
      add('rect', { class: 'g-box', x: 14, y: 20, width: 40, height: 44, rx: 4 });
      add('rect', { class: 'g-box', x: 66, y: 20, width: 40, height: 44, rx: 4 });
      add('circle', { class: 'g-dot', cx: 34, cy: 36, r: 6 });
      add('path', { class: 'g-line', d: 'M26 56 c0 -10 16 -10 16 0' });
      add('rect', { class: 'g-core', x: 78, y: 30, width: 16, height: 16, rx: 3 });
      add('line', { class: 'g-line', x1: 86, y1: 46, x2: 86, y2: 56 });
      add('text', { class: 'g-text is-dim', x: 55, y: 76, 'text-anchor': 'middle' }, 'qui est qui' + ' ' + '?');
    }
    if (kind === 'mark1') {
      add('rect', { class: 'g-box', x: 22, y: 12, width: 76, height: 56, rx: 4 });
      [[36, 26], [56, 26], [76, 26], [36, 44], [56, 44], [76, 44]].forEach(([cx, cy], i) => {
        add('circle', { class: 'g-knob', cx, cy, r: 6 });
        add('line', { class: 'g-line', x1: cx, y1: cy, x2: cx + (i % 2 ? 4 : -3), y2: cy - 5 });
      });
      add('rect', { class: 'g-core-box', x: 44, y: 58, width: 32, height: 6, rx: 3 });
      add('text', { class: 'g-text is-dim', x: 60, y: 78, 'text-anchor': 'middle' }, 'des boutons');
    }
    if (kind === 'chess') {
      for (let r = 0; r < 4; r += 1) {
        for (let c = 0; c < 4; c += 1) {
          add('rect', { class: (r + c) % 2 ? 'g-square is-dark' : 'g-square is-light', x: 34 + c * 14, y: 16 + r * 14, width: 14, height: 14 });
        }
      }
      add('circle', { class: 'g-stone is-white', cx: 55, cy: 37, r: 6 });
      add('circle', { class: 'g-stone is-black', cx: 69, cy: 23, r: 6 });
      add('rect', { class: 'g-box', x: 40, y: 56, width: 40, height: 18, rx: 3 });
      add('text', { class: 'g-text is-dim', x: 60, y: 69, 'text-anchor': 'middle' }, 'IBM');
    }
    if (kind === 'paper') {
      add('rect', { class: 'g-box', x: 32, y: 10, width: 56, height: 60, rx: 5 });
      [24, 34, 44, 54, 62].forEach((y, i) => add('line', { class: 'g-line', x1: 42, y1: y, x2: i % 3 === 2 ? 64 : 78, y2: y }));
    }
    if (kind === 'eliza') {
      add('rect', { class: 'g-box', x: 18, y: 14, width: 84, height: 52, rx: 5 });
      add('text', { class: 'g-text', x: 27, y: 34 }, '> bonjour');
      add('text', { class: 'g-text is-dim', x: 27, y: 50 }, 'que ressentez-');
      add('rect', { class: 'g-caret', x: 27, y: 55, width: 7, height: 2 });
    }
    if (kind === 'wall') {
      [[38, 26, 'a'], [78, 26, 'b'], [38, 56, 'b'], [78, 56, 'a']].forEach(([x, y, k]) =>
        add('circle', { class: `g-dot is-${k}`, cx: x, cy: y, r: 6 }));
      add('line', { class: 'g-fail', x1: 26, y1: 62, x2: 92, y2: 20 });
      add('line', { class: 'g-strike', x1: 24, y1: 18, x2: 96, y2: 64 });
    }
    if (kind === 'backprop') {
      [24, 60, 96].forEach((x, i) => [26, 40, 54].slice(0, i === 1 ? 3 : 2).forEach(y =>
        add('circle', { class: 'g-dot', cx: x, cy: y + (i === 1 ? 0 : 7), r: 4.5 })));
      add('path', { class: 'g-back', d: 'M96 66 C74 76 46 76 24 66' });
      add('path', { class: 'g-arrow', d: 'M24 66 l9 -2 -1 7 z' });
    }
    if (kind === 'quiz') {
      add('rect', { class: 'g-box', x: 22, y: 16, width: 76, height: 34, rx: 5 });
      add('text', { class: 'g-text', x: 31, y: 38 }, '? ? ?');
      add('circle', { class: 'g-core', cx: 60, cy: 62, r: 9 });
    }
    if (kind === 'images') {
      [[26, 16], [58, 16], [26, 46], [58, 46]].forEach(([x, y], i) => {
        add('rect', { class: 'g-box', x, y, width: 26, height: 24, rx: 3 });
        add('circle', { class: i % 2 ? 'g-dot is-b' : 'g-dot is-a', cx: x + 13, cy: y + 12, r: 5 });
      });
      add('text', { class: 'g-text is-dim', x: 92, y: 44 }, '✓');
    }
    if (kind === 'go') {
      for (let i = 0; i < 5; i += 1) {
        add('line', { class: 'g-grid', x1: 34 + i * 13, y1: 14, x2: 34 + i * 13, y2: 66 });
        add('line', { class: 'g-grid', x1: 34, y1: 14 + i * 13, x2: 86, y2: 14 + i * 13 });
      }
      [[47, 27], [60, 40], [73, 27]].forEach(([x, y]) => add('circle', { class: 'g-stone is-black', cx: x, cy: y, r: 5.5 }));
      [[47, 40], [60, 27], [73, 53]].forEach(([x, y]) => add('circle', { class: 'g-stone is-white', cx: x, cy: y, r: 5.5 }));
    }
    if (kind === 'attention') {
      [26, 50, 74, 98].forEach(x => add('circle', { class: 'g-dot', cx: x, cy: 58, r: 5 }));
      add('path', { class: 'g-arc', d: 'M98 52 C98 18 50 18 50 52', 'stroke-width': 4 });
      add('path', { class: 'g-arc', d: 'M98 52 C96 30 74 30 74 52', 'stroke-width': 2 });
      add('path', { class: 'g-arc', d: 'M98 52 C94 10 26 12 26 52', 'stroke-width': 1.2 });
    }
    if (kind === 'chat') {
      add('rect', { class: 'g-box', x: 16, y: 14, width: 60, height: 26, rx: 8 });
      add('rect', { class: 'g-core-box', x: 44, y: 46, width: 60, height: 26, rx: 8 });
      [27, 38, 49].forEach(x => add('circle', { class: 'g-dot is-a', cx: x, cy: 27, r: 3.2 }));
      [56, 67, 78, 89].forEach(x => add('circle', { class: 'g-dot is-b', cx: x, cy: 59, r: 3.2 }));
    }
    return node;
  }

  const marks = MILESTONES.map((milestone, index) => {
    const item = document.createElement('li');
    item.className = index % 2 === 0 ? 'tl-item is-up' : 'tl-item is-down';
    if (index > 0) { item.classList.add('build-step'); item.dataset.build = String(index + 1); }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tl-mark';
    button.setAttribute('aria-label', `${milestone.year}, ${milestone.title}. ${milestone.text}`);

    const thumb = document.createElement('span');
    thumb.className = 'tl-thumb';
    thumb.appendChild(glyph(milestone.glyph));

    const dot = document.createElement('span');
    dot.className = 'tl-dot';

    const label = document.createElement('span');
    label.className = 'tl-label';
    label.innerHTML = `<b>${milestone.year}</b><span>${milestone.tag}</span>`;

    button.append(thumb, dot, label);
    item.appendChild(button);
    list.appendChild(item);

    const show = () => {
      popYear.textContent = milestone.year;
      popTitle.textContent = milestone.title;
      popText.textContent = milestone.text;
      popCredit.textContent = milestone.credit || '';
      popMedia.textContent = '';
      popMedia.hidden = !milestone.photo;
      pop.classList.toggle('has-media', Boolean(milestone.photo));
      if (milestone.photo) {
        const image = document.createElement('img');
        image.src = milestone.photo;
        image.alt = milestone.alt;
        popMedia.appendChild(image);
      }
      pop.hidden = false;
      pop.classList.toggle('is-below', index % 2 === 0);
      placePop(pop, button, stage);
      marks.forEach(other => other.classList.remove('is-current'));
      button.classList.add('is-current');
    };
    const hide = () => {
      pop.hidden = true;
      button.classList.remove('is-current');
    };

    button.addEventListener('mouseenter', show);
    button.addEventListener('mouseleave', hide);
    button.addEventListener('focus', show);
    button.addEventListener('blur', hide);
    button.addEventListener('click', show);
    return button;
  });

  // Le survol pilote seul l'affichage : rien ne dépend de l'état des apparitions.
  document.addEventListener('presentation:build', event => {
    if (event.detail.slide !== list.closest('.slide')) { pop.hidden = true; }
  });
})();

/* ---------- Slide 3 · les deux hivers ---------- */
(() => {
  const svg = document.getElementById('winters');
  if (!svg) return;

  const LEVELS = [
    [1950, .12], [1956, .34], [1960, .52], [1966, .63], [1970, .55], [1974, .40],
    [1977, .17], [1980, .21], [1984, .54], [1987, .63], [1990, .30], [1993, .15],
    [1998, .27], [2005, .32], [2010, .40], [2012, .52], [2016, .74], [2020, .86], [2025, .97]
  ];
  const ZONES = [
    { from: 1974, to: 1980, label: 'PREMIER HIVER', build: 4, css: '' },
    { from: 1987, to: 1993, label: 'SECOND HIVER', build: 5, css: '' },
    { from: 2012, to: 2025, label: 'DÉGEL', build: 6, css: ' is-thaw' }
  ];
  const X0 = 52;
  const X1 = 636;
  const BASE = 278;
  const TOP = 44;
  const zonesLayer = document.getElementById('winters-zones');
  const ticksLayer = document.getElementById('winters-ticks');
  const curve = document.getElementById('winters-curve');

  const sx = year => X0 + ((year - 1950) / 75) * (X1 - X0);
  const sy = level => BASE - level * (BASE - TOP);

  ZONES.forEach(zone => {
    const group = buildGroup(zone.build);
    group.appendChild(svgNode('rect', {
      class: `winter-zone${zone.css}`, x: sx(zone.from), y: TOP - 12,
      width: sx(zone.to) - sx(zone.from), height: BASE - TOP + 12
    }));
    group.appendChild(svgNode('text', {
      class: 'zone-label', x: (sx(zone.from) + sx(zone.to)) / 2, y: TOP - 22, 'text-anchor': 'middle'
    }, zone.label));
    zonesLayer.appendChild(group);
  });

  [1950, 1970, 1990, 2010, 2025].forEach(year => {
    ticksLayer.appendChild(svgNode('line', { class: 'axis-line', x1: sx(year), y1: BASE, x2: sx(year), y2: BASE + 5 }));
    ticksLayer.appendChild(svgNode('text', { class: 'tick-label', x: sx(year), y: BASE + 19, 'text-anchor': 'middle' }, year));
  });

  curve.setAttribute('d', catmullPath(LEVELS.map(([year, level]) => [sx(year), sy(level)])));

  // Chaque période reçoit une zone survolable — un vrai bouton, donc atteignable
  // au clavier — qui déplie ce qui s'est passé.
  const DETAIL = {
    1974: { year: '1974 – 1980', title: 'Premier hiver', text: 'Un rapport officiel de 1966 juge la traduction automatique décevante et hors de prix. Les États-Unis puis le Royaume-Uni coupent les financements. Les laboratoires ferment les uns après les autres.' },
    1987: { year: '1987 – 1993', title: 'Second hiver', text: 'Les entreprises avaient acheté des machines dédiées aux systèmes experts. Les ordinateurs ordinaires deviennent plus puissants et moins chers : le marché s’effondre en quelques mois.' },
    2012: { year: 'depuis 2012', title: 'Le dégel', text: 'Cette fois l’ordre s’inverse : les résultats arrivent avant les promesses. Images, traduction, go, langage — chaque année apporte une capacité qu’on n’avait pas l’année précédente.' }
  };
  const hits = document.getElementById('winters-hits');
  const pop = document.getElementById('winters-pop');
  const popYear = document.getElementById('winters-pop-year');
  const popTitle = document.getElementById('winters-pop-title');
  const popText = document.getElementById('winters-pop-text');

  ZONES.forEach(zone => {
    const detail = DETAIL[zone.from];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'zone-hit';
    button.setAttribute('aria-label', `${detail.year}, ${detail.title}. ${detail.text}`);
    button.style.left = `${(sx(zone.from) / 660 * 100).toFixed(2)}%`;
    button.style.width = `${((sx(zone.to) - sx(zone.from)) / 660 * 100).toFixed(2)}%`;
    button.style.top = `${((TOP - 32) / 330 * 100).toFixed(2)}%`;
    button.style.height = `${((BASE - TOP + 44) / 330 * 100).toFixed(2)}%`;

    const show = () => {
      popYear.textContent = detail.year;
      popTitle.textContent = detail.title;
      popText.textContent = detail.text;
      pop.hidden = false;
      placePop(pop, button, hits);
      button.classList.add('is-current');
    };
    const hide = () => { pop.hidden = true; button.classList.remove('is-current'); };
    button.addEventListener('mouseenter', show);
    button.addEventListener('mouseleave', hide);
    button.addEventListener('focus', show);
    button.addEventListener('blur', hide);
    button.addEventListener('click', show);
    hits.appendChild(button);
  });

  document.addEventListener('presentation:build', event => {
    if (event.detail.slide !== svg.closest('.slide')) pop.hidden = true;
  });
})();

/* ---------- Slide 4 · la convergence de 2012 ---------- */
(() => {
  const svg = document.getElementById('converge');
  if (!svg) return;

  const STREAMS = [
    { y: 62, css: 'is-data', title: 'Des montagnes de données', sub: 'photos, textes, étiquettes' },
    { y: 150, css: 'is-power', title: 'Des cartes graphiques', sub: 'milliers de calculs en parallèle' },
    { y: 238, css: 'is-algo', title: 'De meilleurs algorithmes', sub: 'de quoi entraîner des réseaux profonds' }
  ];
  const streamsLayer = document.getElementById('converge-streams');
  const target = document.getElementById('converge-target');
  const JOIN_X = 748;

  STREAMS.forEach((stream, index) => {
    const group = buildGroup(index + 2);
    group.appendChild(svgNode('path', {
      class: `stream ${stream.css}`,
      d: `M360,${stream.y} C520,${stream.y} 590,150 ${JOIN_X},150`
    }));
    group.appendChild(svgNode('text', { class: 'stream-label', x: 24, y: stream.y - 6 }, stream.title));
    group.appendChild(svgNode('text', { class: 'stream-sub', x: 24, y: stream.y + 15 }, stream.sub));
    streamsLayer.appendChild(group);
  });

  target.appendChild(svgNode('rect', { class: 'target-box', x: JOIN_X + 4, y: 104, width: 288, height: 92, rx: 16 }));
  target.appendChild(svgNode('text', { class: 'target-title', x: JOIN_X + 28, y: 142 }, 'Réseaux profonds'));
  target.appendChild(svgNode('text', { class: 'target-title', x: JOIN_X + 28, y: 164 }, 'enfin efficaces'));
  target.appendChild(svgNode('text', { class: 'target-sub', x: JOIN_X + 28, y: 184 }, '2012 · IMAGENET'));
})();

/* ---------- Slide 5 · le neurone qu'on entraîne ---------- */
(() => {
  const plot = document.getElementById('fruit-plot');
  if (!plot) return;

  const FRUITS = [
    { x: 7.5, y: 2.2, label: 1 }, { x: 8.6, y: 2.6, label: 1 }, { x: 9.2, y: 1.9, label: 1 },
    { x: 7.9, y: 3.1, label: 1 }, { x: 8.9, y: 2.4, label: 1 },
    { x: 5.9, y: 6.5, label: -1 }, { x: 5.1, y: 7.0, label: -1 }, { x: 6.8, y: 7.3, label: -1 },
    { x: 5.5, y: 6.1, label: -1 }, { x: 6.4, y: 6.9, label: -1 }
  ];
  const RATE = 0.26;
  const START = { w1: 0.2, w2: 0.9, b: -0.6 };
  const CORNERS = [[0, 0], [1, 0], [1, 1], [0, 1]];

  const ticks = document.getElementById('fruit-ticks');
  const dotsLayer = document.getElementById('fruit-dots');
  const labelsLayer = document.getElementById('fruit-labels');
  const boundary = document.getElementById('fruit-boundary');
  const bananaRegion = document.getElementById('region-banana');
  const appleRegion = document.getElementById('region-apple');
  const errorsOut = document.getElementById('fruit-errors');
  const epochOut = document.getElementById('fruit-epoch');
  const status = document.getElementById('fruit-status');
  const runButton = document.getElementById('fruit-run');
  const stepButton = document.getElementById('fruit-step');
  const resetButton = document.getElementById('fruit-reset');

  const nx = x => (x - 4) / 6;
  const ny = y => (y - 1) / 7;
  const px = value => 58 + value * 508;
  const py = value => 318 - value * 300;

  let weights = { ...START };
  let epoch = 0;
  let timer = null;
  let stopTween = () => {};

  [4, 6, 8, 10].forEach(value => {
    ticks.appendChild(svgNode('line', { class: 'axis-line', x1: px(nx(value)), y1: 318, x2: px(nx(value)), y2: 323 }));
    ticks.appendChild(svgNode('text', { class: 'tick-label', x: px(nx(value)), y: 335, 'text-anchor': 'middle' }, value));
  });
  [2, 4, 6, 8].forEach(value => {
    ticks.appendChild(svgNode('line', { class: 'axis-line', x1: 53, y1: py(ny(value)), x2: 58, y2: py(ny(value)) }));
    ticks.appendChild(svgNode('text', { class: 'tick-label', x: 47, y: py(ny(value)) + 4, 'text-anchor': 'end' }, value));
  });

  const dots = FRUITS.map(fruit => {
    const dot = svgNode('circle', {
      class: fruit.label === 1 ? 'dot-banana' : 'dot-apple',
      cx: px(nx(fruit.x)), cy: py(ny(fruit.y)), r: 9
    });
    dotsLayer.appendChild(dot);
    return dot;
  });

  const score = (fruit, w) => w.w1 * nx(fruit.x) + w.w2 * ny(fruit.y) + w.b;
  const wrong = w => FRUITS.filter(fruit => Math.sign(score(fruit, w)) !== fruit.label);

  function clipHalfPlane(polygon, w, sign) {
    const side = point => sign * (w.w1 * point[0] + w.w2 * point[1] + w.b);
    const kept = [];
    polygon.forEach((from, index) => {
      const to = polygon[(index + 1) % polygon.length];
      const a = side(from);
      const b = side(to);
      if (a >= 0) kept.push(from);
      if ((a >= 0) !== (b >= 0)) {
        const t = a / (a - b);
        kept.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
      }
    });
    return kept;
  }

  function area(polygon) {
    let sum = 0;
    polygon.forEach((point, index) => {
      const next = polygon[(index + 1) % polygon.length];
      sum += point[0] * next[1] - next[0] * point[1];
    });
    return Math.abs(sum) / 2;
  }

  function paint(w) {
    const from = -0.25;
    const to = 1.25;
    if (Math.abs(w.w2) < 1e-6) {
      const value = -w.b / (w.w1 || 1e-6);
      boundary.setAttribute('x1', px(value)); boundary.setAttribute('y1', py(from));
      boundary.setAttribute('x2', px(value)); boundary.setAttribute('y2', py(to));
    } else {
      boundary.setAttribute('x1', px(from));
      boundary.setAttribute('y1', py(-(w.w1 * from + w.b) / w.w2));
      boundary.setAttribute('x2', px(to));
      boundary.setAttribute('y2', py(-(w.w1 * to + w.b) / w.w2));
    }
    labelsLayer.textContent = '';
    [
      { node: bananaRegion, polygon: clipHalfPlane(CORNERS, w, 1), text: 'zone « banane »', css: 'is-banana' },
      { node: appleRegion, polygon: clipHalfPlane(CORNERS, w, -1), text: 'zone « pomme »', css: 'is-apple' }
    ].forEach(region => {
      region.node.setAttribute('points', region.polygon.map(([x, y]) => `${px(x)},${py(y)}`).join(' '));
      if (region.polygon.length < 3 || area(region.polygon) < 0.08) return;
      const cx = region.polygon.reduce((sum, point) => sum + point[0], 0) / region.polygon.length;
      const cy = region.polygon.reduce((sum, point) => sum + point[1], 0) / region.polygon.length;
      labelsLayer.appendChild(svgNode('text', {
        class: `region-label ${region.css}`, x: px(cx), y: py(cy) + 4, 'text-anchor': 'middle'
      }, region.text));
    });
  }

  // L'état affiché suit toujours les poids réels : l'animation ne fait
  // qu'illustrer le déplacement déjà décidé.
  function refresh() {
    const missed = wrong(weights);
    dots.forEach((dot, index) => dot.classList.toggle('dot-wrong', missed.includes(FRUITS[index])));
    errorsOut.textContent = missed.length;
    errorsOut.classList.toggle('is-solved', missed.length === 0);
    epochOut.textContent = epoch;
    stepButton.disabled = missed.length === 0;
    runButton.disabled = missed.length === 0;
    return missed.length;
  }

  function glideTo(target) {
    const from = { ...weights };
    stopTween();
    weights = target;
    paint(target);
    stopTween = tween(360, t => paint({
      w1: from.w1 + (target.w1 - from.w1) * t,
      w2: from.w2 + (target.w2 - from.w2) * t,
      b: from.b + (target.b - from.b) * t
    }));
  }

  function trainOnce() {
    const next = { ...weights };
    let corrections = 0;
    FRUITS.forEach(fruit => {
      if (Math.sign(score(fruit, next)) === fruit.label) return;
      corrections += 1;
      next.w1 += RATE * fruit.label * nx(fruit.x);
      next.w2 += RATE * fruit.label * ny(fruit.y);
      next.b += RATE * fruit.label;
    });
    epoch += 1;
    glideTo(next);
    const left = refresh();
    if (left === 0) {
      stop();
      status.classList.add('is-good');
      status.textContent = `Zéro erreur après ${epoch} tours : le neurone a trouvé une frontière qui sépare les deux fruits.`;
    } else {
      status.classList.remove('is-good');
      status.textContent = `Tour ${epoch} : ${corrections} correction${corrections > 1 ? 's' : ''}, il reste ${left} erreur${left > 1 ? 's' : ''}.`;
    }
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    runButton.classList.remove('is-running');
    runButton.innerHTML = '<i class="fa-solid fa-bolt" aria-hidden="true"></i>Entraîner';
  }

  function start() {
    if (timer) { stop(); return; }
    runButton.classList.add('is-running');
    runButton.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i>Pause';
    trainOnce();
    timer = setInterval(trainOnce, 520);
  }

  function reset(randomize) {
    stop();
    stopTween();
    epoch = 0;
    status.classList.remove('is-good');
    if (!randomize) {
      weights = { ...START };
      status.textContent = 'Les poids de départ sont pris au hasard : la frontière est n’importe où.';
    } else {
      let candidate;
      do {
        candidate = { w1: Math.random() * 2 - 1, w2: Math.random() * 2 - 1, b: Math.random() * 1.2 - 0.6 };
      } while (Math.abs(candidate.w2) < 0.3 || wrong(candidate).length < 4);
      weights = candidate;
      status.textContent = 'Nouveaux poids au hasard : le chemin sera différent, le résultat non.';
    }
    paint(weights);
    refresh();
  }

  runButton.addEventListener('click', start);
  stepButton.addEventListener('click', () => { stop(); trainOnce(); });
  resetButton.addEventListener('click', () => reset(true));
  document.addEventListener('presentation:build', event => {
    if (event.detail.slide !== plot.closest('.slide')) stop();
  });
  reset(false);
})();

/* ---------- Slide 7 · regrouper sans étiquettes ---------- */
(() => {
  const plot = document.getElementById('kmeans-plot');
  if (!plot) return;

  const K = 3;
  const BLOBS = [[.24, .30], [.76, .27], [.50, .76]];
  const FIELD = { x: 24, y: 16, w: 532, h: 328, pad: 34 };
  const pointsLayer = document.getElementById('kmeans-points');
  const linksLayer = document.getElementById('kmeans-links');
  const centersLayer = document.getElementById('kmeans-centers');
  const roundOut = document.getElementById('kmeans-round');
  const unitOut = document.getElementById('kmeans-unit');
  const status = document.getElementById('kmeans-status');
  const runButton = document.getElementById('kmeans-run');
  const stepButton = document.getElementById('kmeans-step');
  const newButton = document.getElementById('kmeans-new');

  const px = u => FIELD.x + FIELD.pad + u * (FIELD.w - 2 * FIELD.pad);
  const py = v => FIELD.y + FIELD.pad + v * (FIELD.h - 2 * FIELD.pad);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  let points = [];
  let centers = [];
  let round = 0;
  let phase = 'assign';
  let converged = false;
  let timer = null;
  let stopTween = () => {};

  function writeUnit(detail) {
    unitOut.innerHTML = `${round === 1 ? 'tour complet' : 'tours complets'}<br>${detail}`;
  }

  function makePoints() {
    points = [];
    BLOBS.forEach(([cx, cy]) => {
      for (let i = 0; i < 15; i += 1) {
        points.push({
          u: Math.min(.98, Math.max(.02, cx + gauss() * .155)),
          v: Math.min(.98, Math.max(.02, cy + gauss() * .155)),
          cluster: -1
        });
      }
    });
  }

  function nearestIndex(candidates, u, v) {
    let best = 0;
    let bestDistance = Infinity;
    candidates.forEach((candidate, index) => {
      const distance = (candidate.u - u) ** 2 + (candidate.v - v) ** 2;
      if (distance < bestDistance) { bestDistance = distance; best = index; }
    });
    return best;
  }

  // Les centres sont tirés au hasard dans le cadre, mais deux conditions sont
  // exigées : qu'ils soient écartés, et que chaque paquet réclame un centre
  // différent. Sans cela, la démonstration finit parfois sur deux groupes au
  // lieu de trois — un vrai comportement de k-means, mais illisible en classe.
  function makeCenters() {
    for (let attempt = 0; attempt < 600; attempt += 1) {
      const picks = Array.from({ length: K }, () => ({
        u: .1 + Math.random() * .8,
        v: .1 + Math.random() * .8
      }));
      const spread = picks.every((a, i) => picks.every((b, j) =>
        i === j || (a.u - b.u) ** 2 + (a.v - b.v) ** 2 > .12));
      if (!spread) continue;
      const claimed = new Set(BLOBS.map(([u, v]) => nearestIndex(picks, u, v)));
      if (claimed.size !== K) continue;
      centers = picks;
      return;
    }
    centers = BLOBS.map(([u, v]) => ({ u, v }));
  }

  function build() {
    pointsLayer.textContent = '';
    centersLayer.textContent = '';
    linksLayer.textContent = '';
    points.forEach(point => {
      point.node = svgNode('circle', { class: 'km-point is-free', cx: px(point.u), cy: py(point.v), r: 7 });
      point.link = svgNode('line', { class: 'km-link', x1: px(point.u), y1: py(point.v), x2: px(point.u), y2: py(point.v) });
      linksLayer.appendChild(point.link);
      pointsLayer.appendChild(point.node);
    });
    centers.forEach((center, index) => {
      center.halo = svgNode('circle', { class: 'km-halo', cx: px(center.u), cy: py(center.v), r: 13 });
      center.armA = svgNode('line', { class: `km-center is-c${index}` });
      center.armB = svgNode('line', { class: `km-center is-c${index}` });
      centersLayer.append(center.halo, center.armA, center.armB);
    });
    drawCenters(centers.map(center => ({ u: center.u, v: center.v })));
  }

  function drawCenters(positions) {
    positions.forEach((position, index) => {
      const center = centers[index];
      const x = px(position.u);
      const y = py(position.v);
      center.halo.setAttribute('cx', x);
      center.halo.setAttribute('cy', y);
      center.armA.setAttribute('x1', x - 9); center.armA.setAttribute('y1', y - 9);
      center.armA.setAttribute('x2', x + 9); center.armA.setAttribute('y2', y + 9);
      center.armB.setAttribute('x1', x - 9); center.armB.setAttribute('y1', y + 9);
      center.armB.setAttribute('x2', x + 9); center.armB.setAttribute('y2', y - 9);
    });
  }

  function drawLinks() {
    points.forEach(point => {
      point.node.setAttribute('class', point.cluster < 0 ? 'km-point is-free' : `km-point is-c${point.cluster}`);
      if (point.cluster < 0) { point.link.setAttribute('class', 'km-link'); return; }
      const center = centers[point.cluster];
      point.link.setAttribute('class', `km-link is-c${point.cluster}`);
      point.link.setAttribute('x2', px(center.u));
      point.link.setAttribute('y2', py(center.v));
    });
  }

  // Un clic = un geste, pas un tour entier : les élèves voient d'abord les points
  // changer de couleur, puis les centres se déplacer.
  function assignStep() {
    let moved = 0;
    points.forEach(point => {
      const best = nearestIndex(centers, point.u, point.v);
      if (point.cluster !== best) moved += 1;
      point.cluster = best;
    });
    drawLinks();
    if (moved === 0) {
      converged = true;
      stop();
      runButton.disabled = true;
      stepButton.disabled = true;
      status.classList.add('is-good');
      status.textContent = `Plus aucun point ne change de groupe : c’est terminé en ${round} tours. Les trois familles étaient dans les données, personne ne les avait nommées.`;
      writeUnit('plus aucun changement');
      return;
    }
    phase = 'move';
    status.classList.remove('is-good');
    status.textContent = `Geste 1 — chaque point rejoint le centre le plus proche : ${moved} point${moved > 1 ? 's' : ''} ${moved > 1 ? 'changent' : 'change'} de groupe.`;
    writeUnit(`${moved} point${moved > 1 ? 's' : ''} déplacé${moved > 1 ? 's' : ''}`);
  }

  function moveStep() {
    const from = centers.map(center => ({ u: center.u, v: center.v }));
    const to = centers.map((center, index) => {
      const owned = points.filter(point => point.cluster === index);
      if (!owned.length) return { u: center.u, v: center.v };
      return {
        u: owned.reduce((sum, point) => sum + point.u, 0) / owned.length,
        v: owned.reduce((sum, point) => sum + point.v, 0) / owned.length
      };
    });
    centers.forEach((center, index) => { center.u = to[index].u; center.v = to[index].v; });
    round += 1;
    roundOut.textContent = round;
    phase = 'assign';
    stopTween();
    drawCenters(to);
    drawLinks();
    stopTween = tween(460, progress => {
      drawCenters(from.map((position, index) => ({
        u: position.u + (to[index].u - position.u) * progress,
        v: position.v + (to[index].v - position.v) * progress
      })));
      drawLinks();
    });
    status.classList.remove('is-good');
    status.textContent = 'Geste 2 — chaque centre se replace au milieu des points qu’il a récupérés.';
    writeUnit('centres replacés');
  }

  function oneGesture() {
    if (converged) return;
    if (phase === 'assign') assignStep();
    else moveStep();
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    runButton.classList.remove('is-running');
    runButton.innerHTML = '<i class="fa-solid fa-bolt" aria-hidden="true"></i>Lancer';
  }

  function start() {
    if (timer) { stop(); return; }
    runButton.classList.add('is-running');
    runButton.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i>Pause';
    oneGesture();
    timer = setInterval(oneGesture, 700);
  }

  function reset() {
    stop();
    stopTween();
    round = 0;
    phase = 'assign';
    converged = false;
    runButton.disabled = false;
    stepButton.disabled = false;
    roundOut.textContent = '0';
    writeUnit('aucun point classé');
    status.classList.remove('is-good');
    status.textContent = 'Au départ, les trois centres sont posés au hasard et aucun point n’appartient à un groupe.';
    makePoints();
    makeCenters();
    build();
  }

  runButton.addEventListener('click', start);
  stepButton.addEventListener('click', () => { stop(); oneGesture(); });
  newButton.addEventListener('click', reset);
  document.addEventListener('presentation:build', event => {
    if (event.detail.slide !== plot.closest('.slide')) stop();
  });
  reset();
})();

/* ---------- Slide 8 · apprendre par récompense ---------- */
(() => {
  const plot = document.getElementById('grid-plot');
  if (!plot) return;

  const SIZE = 6;
  const CELL = 52;
  const X0 = 44;
  const Y0 = 24;
  const GOAL = [5, 5];
  const TRAPS = [[2, 3], [4, 1]];
  const ACTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const ALPHA = 0.5;
  const GAMMA = 0.92;

  const cellsLayer = document.getElementById('grid-cells');
  const arrowsLayer = document.getElementById('grid-arrows');
  const agentLayer = document.getElementById('grid-agent');
  const episodesOut = document.getElementById('grid-episodes');
  const stepsOut = document.getElementById('grid-steps');
  const status = document.getElementById('grid-status');
  const learnButton = document.getElementById('grid-learn');
  const replayButton = document.getElementById('grid-replay');
  const resetButton = document.getElementById('grid-reset');

  const cx = column => X0 + column * CELL + CELL / 2;
  const cy = row => Y0 + row * CELL + CELL / 2;
  const isGoal = (row, column) => row === GOAL[0] && column === GOAL[1];
  const isTrap = (row, column) => TRAPS.some(([r, c]) => r === row && c === column);
  const isEnd = (row, column) => isGoal(row, column) || isTrap(row, column);

  let q = [];
  let episodes = 0;
  let cells = [];
  let arrows = [];
  let agent = null;
  let replaying = false;

  function clearMemory() {
    q = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => [0, 0, 0, 0]));
    episodes = 0;
  }

  function build() {
    cellsLayer.textContent = '';
    arrowsLayer.textContent = '';
    agentLayer.textContent = '';
    cells = [];
    arrows = [];
    for (let row = 0; row < SIZE; row += 1) {
      cells[row] = [];
      arrows[row] = [];
      for (let column = 0; column < SIZE; column += 1) {
        const classes = `cell${isGoal(row, column) ? ' is-goal' : ''}${isTrap(row, column) ? ' is-trap' : ''}`;
        const rect = svgNode('rect', {
          class: classes, x: X0 + column * CELL, y: Y0 + row * CELL,
          width: CELL, height: CELL, rx: 8, fill: 'rgba(255,255,255,.03)'
        });
        cellsLayer.appendChild(rect);
        cells[row][column] = rect;
        if (isGoal(row, column)) {
          cellsLayer.appendChild(svgNode('text', { class: 'cell-icon is-goal', x: cx(column), y: cy(row) + 7 }, '★'));
        } else if (isTrap(row, column)) {
          cellsLayer.appendChild(svgNode('text', { class: 'cell-icon is-trap', x: cx(column), y: cy(row) + 7 }, '✕'));
        } else {
          const arrow = svgNode('path', { class: 'policy-arrow', d: '' });
          arrowsLayer.appendChild(arrow);
          arrows[row][column] = arrow;
        }
      }
    }
    agent = svgNode('circle', { class: 'agent', cx: cx(0), cy: cy(0), r: 13 });
    agentLayer.appendChild(agent);
  }

  function reward(row, column) {
    if (isGoal(row, column)) return 1;
    if (isTrap(row, column)) return -1;
    return -0.02;
  }

  function bestAction(row, column) {
    const values = q[row][column];
    let best = 0;
    for (let index = 1; index < 4; index += 1) if (values[index] > values[best]) best = index;
    return best;
  }

  function runEpisode(epsilon) {
    let row = 0;
    let column = 0;
    for (let step = 0; step < 120; step += 1) {
      const action = Math.random() < epsilon ? Math.floor(Math.random() * 4) : bestAction(row, column);
      const nextRow = Math.min(SIZE - 1, Math.max(0, row + ACTIONS[action][0]));
      const nextColumn = Math.min(SIZE - 1, Math.max(0, column + ACTIONS[action][1]));
      const gain = reward(nextRow, nextColumn);
      const future = isEnd(nextRow, nextColumn) ? 0 : Math.max(...q[nextRow][nextColumn]);
      q[row][column][action] += ALPHA * (gain + GAMMA * future - q[row][column][action]);
      row = nextRow;
      column = nextColumn;
      if (isEnd(row, column)) break;
    }
  }

  function greedyPath() {
    const path = [[0, 0]];
    const seen = new Set(['0,0']);
    let row = 0;
    let column = 0;
    for (let step = 0; step < 40; step += 1) {
      if (Math.max(...q[row][column]) <= 0) return null;
      const action = bestAction(row, column);
      row = Math.min(SIZE - 1, Math.max(0, row + ACTIONS[action][0]));
      column = Math.min(SIZE - 1, Math.max(0, column + ACTIONS[action][1]));
      const key = `${row},${column}`;
      if (seen.has(key)) return null;
      seen.add(key);
      path.push([row, column]);
      if (isGoal(row, column)) return path;
      if (isTrap(row, column)) return null;
    }
    return null;
  }

  function render() {
    let peak = 0;
    for (let row = 0; row < SIZE; row += 1) {
      for (let column = 0; column < SIZE; column += 1) {
        if (isEnd(row, column)) continue;
        peak = Math.max(peak, Math.max(...q[row][column]));
      }
    }
    for (let row = 0; row < SIZE; row += 1) {
      for (let column = 0; column < SIZE; column += 1) {
        if (isEnd(row, column)) continue;
        const value = Math.max(...q[row][column]);
        const ratio = peak > 0 ? Math.max(0, value) / peak : 0;
        cells[row][column].setAttribute('fill', `rgba(96, 165, 250, ${(0.03 + ratio * 0.42).toFixed(3)})`);
        const arrow = arrows[row][column];
        if (value <= 0.01) { arrow.classList.remove('is-known'); continue; }
        const [dr, dc] = ACTIONS[bestAction(row, column)];
        const x = cx(column);
        const y = cy(row);
        const tipX = x + dc * 15;
        const tipY = y + dr * 15;
        arrow.setAttribute('d', `M${x - dc * 12},${y - dr * 12} L${tipX},${tipY} M${tipX},${tipY} l${(-dc + dr) * 6},${(-dr - dc) * 6} M${tipX},${tipY} l${(-dc - dr) * 6},${(-dr + dc) * 6}`);
        arrow.classList.add('is-known');
      }
    }
    episodesOut.textContent = episodes;
    const path = greedyPath();
    stepsOut.textContent = path ? `${path.length - 1} pas` : '—';
    replayButton.disabled = !path;
    return path;
  }

  function learn() {
    learnButton.disabled = true;
    let batch = 0;
    const tick = () => {
      for (let i = 0; i < 10; i += 1) {
        episodes += 1;
        runEpisode(Math.max(0.06, 0.45 - episodes / 400));
      }
      batch += 1;
      const path = render();
      status.classList.toggle('is-good', Boolean(path));
      status.textContent = path
        ? `Après ${episodes} parties, les flèches se sont organisées : le robot connaît un chemin de ${path.length - 1} pas.`
        : `${episodes} parties jouées. Les cases visitées se colorent, mais aucun chemin complet n’est encore fiable.`;
      if (batch < 5) setTimeout(tick, 160);
      else learnButton.disabled = false;
    };
    tick();
  }

  function replay() {
    const path = greedyPath();
    if (!path || replaying) return;
    replaying = true;
    replayButton.disabled = true;
    let index = 0;
    const move = () => {
      const [row, column] = path[index];
      agent.setAttribute('cx', cx(column));
      agent.setAttribute('cy', cy(row));
      index += 1;
      if (index < path.length) setTimeout(move, reduced.matches ? 0 : 240);
      else {
        replaying = false;
        replayButton.disabled = false;
        status.classList.add('is-good');
        status.textContent = `Sortie atteinte en ${path.length - 1} pas. Personne n’a écrit ce trajet : il vient des récompenses.`;
      }
    };
    move();
  }

  function reset() {
    clearMemory();
    build();
    render();
    status.classList.remove('is-good');
    status.textContent = 'Mémoire vide : le robot se déplacera complètement au hasard.';
    stepsOut.textContent = '—';
  }

  learnButton.addEventListener('click', learn);
  replayButton.addEventListener('click', replay);
  resetButton.addEventListener('click', reset);
  reset();
})();

/* ---------- Slide 10 · empiler les couches ---------- */
(() => {
  const svg = document.getElementById('deep-net');
  if (!svg) return;

  const LAYERS = [
    { count: 5, build: 3, caption: 'ENTRÉE' },
    { count: 8, build: 3, caption: 'COUCHE 1' },
    { count: 8, build: 4, caption: 'COUCHE 2' },
    { count: 6, build: 5, caption: 'COUCHE 3' },
    { count: 3, build: 6, caption: 'SORTIE' }
  ];
  const linksLayer = document.getElementById('deep-links');
  const nodesLayer = document.getElementById('deep-nodes');
  const captionsLayer = document.getElementById('deep-captions');
  const COLUMNS = [62, 190, 318, 446, 574];

  const positions = LAYERS.map((layer, index) =>
    Array.from({ length: layer.count }, (_, row) => ({
      x: COLUMNS[index],
      y: 158 + (row - (layer.count - 1) / 2) * 34
    }))
  );

  const groups = new Map();
  function groupFor(build, layer) {
    const key = `${layer}-${build}`;
    if (!groups.has(key)) {
      const nodes = buildGroup(build);
      const links = buildGroup(build);
      linksLayer.appendChild(links);
      nodesLayer.appendChild(nodes);
      groups.set(key, { nodes, links });
    }
    return groups.get(key);
  }

  LAYERS.forEach((layer, index) => {
    const target = groupFor(layer.build, index);
    if (index > 0) {
      positions[index - 1].forEach(from => {
        positions[index].forEach(to => {
          const link = svgNode('line', { class: 'deep-link', x1: from.x, y1: from.y, x2: to.x, y2: to.y });
          link.style.animationDelay = `${index * 260}ms`;
          target.links.appendChild(link);
        });
      });
    }
    const kind = index === 0 ? ' is-in' : index === LAYERS.length - 1 ? ' is-out' : '';
    positions[index].forEach(node => {
      target.nodes.appendChild(svgNode('circle', { class: `deep-node${kind}`, cx: node.x, cy: node.y, r: 12 }));
    });
    const caption = buildGroup(layer.build);
    caption.appendChild(svgNode('text', { class: 'deep-caption', x: COLUMNS[index], y: 306, 'text-anchor': 'middle' }, layer.caption));
    captionsLayer.appendChild(caption);
  });
})();

/* ---------- Slide 11 · le découpage en jetons ---------- */
(() => {
  const input = document.getElementById('token-input');
  if (!input) return;

  const strip = document.getElementById('token-strip');
  const count = document.getElementById('token-count');
  const WORD = /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/;

  function tokenize(text) {
    const pieces = [];
    for (const match of text.matchAll(/[A-Za-zÀ-ÖØ-öø-ÿ]+|\d+|[^\sA-Za-zÀ-ÖØ-öø-ÿ\d]/g)) {
      const piece = match[0];
      if (WORD.test(piece) && piece.length > 4) {
        for (let index = 0; index < piece.length; index += 4) pieces.push(piece.slice(index, index + 4));
      } else {
        pieces.push(piece);
      }
    }
    return pieces;
  }

  function render() {
    const tokens = tokenize(input.value);
    strip.textContent = '';
    tokens.forEach((token, index) => {
      const chip = document.createElement('span');
      chip.className = WORD.test(token) || /^\d+$/.test(token) ? 'token' : 'token is-mark';
      chip.style.animationDelay = `${Math.min(index * 22, 600)}ms`;
      const value = document.createElement('b');
      value.textContent = token;
      const rank = document.createElement('small');
      rank.textContent = String(index + 1).padStart(2, '0');
      chip.append(value, rank);
      strip.appendChild(chip);
    });
    count.innerHTML = tokens.length
      ? `Cette phrase devient <b>${tokens.length}</b> jetons, donc <b>${tokens.length}</b> nombres pour la machine.`
      : 'Écris une phrase pour voir son découpage.';
  }

  input.addEventListener('input', render);
  render();
})();

/* ---------- Slide 17 · deviner le jeton suivant ---------- */
(() => {
  const sentence = document.getElementById('sentence-text');
  if (!sentence) return;

  const list = document.getElementById('candidates');
  const resetButton = document.getElementById('sentence-reset');
  const OPENING = 'Le chat dort sur le';
  const STEPS = [
    [{ word: 'canapé', p: 46 }, { word: 'tapis', p: 27 }, { word: 'lit', p: 18 }, { word: 'toit', p: 9 }],
    [{ word: 'du salon', p: 41 }, { word: 'depuis ce matin', p: 33 }, { word: 'et il ronronne', p: 26 }]
  ];
  let picked = [];
  let timers = [];

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function renderSentence() {
    sentence.textContent = '';
    sentence.append(document.createTextNode(`${OPENING} `));
    picked.forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'picked';
      span.textContent = word;
      sentence.appendChild(span);
      const last = index === picked.length - 1;
      if (!last || picked.length < STEPS.length) sentence.append(document.createTextNode(' '));
    });
    if (picked.length < STEPS.length) {
      const slot = document.createElement('span');
      slot.className = 'slot';
      slot.textContent = '    ';
      sentence.appendChild(slot);
    } else {
      sentence.append(document.createTextNode('.'));
    }
  }

  function renderCandidates() {
    clearTimers();
    list.textContent = '';
    if (picked.length >= STEPS.length) {
      const item = document.createElement('li');
      item.className = 'footnote';
      item.style.margin = '0';
      item.textContent = 'Chaque jeton choisi change les probabilités du suivant. Une réponse entière se construit ainsi, un jeton après l’autre.';
      list.appendChild(item);
      return;
    }

    const candidates = STEPS[picked.length];
    const rows = candidates.map(candidate => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'candidate';
      const label = document.createElement('span');
      label.className = 'candidate-word';
      label.textContent = candidate.word;
      const track = document.createElement('span');
      track.className = 'bar-track';
      const fill = document.createElement('span');
      fill.className = 'bar-fill';
      fill.style.width = '0%';
      track.appendChild(fill);
      const value = document.createElement('span');
      value.className = 'bar-value';
      value.textContent = '0 %';
      button.append(label, track, value);
      button.addEventListener('click', () => {
        picked.push(candidate.word);
        renderSentence();
        renderCandidates();
      });
      item.appendChild(button);
      list.appendChild(item);
      return { button, fill, value, candidate };
    });

    scan(rows);
  }

  // Le modèle évalue les candidats un par un : chaque ligne apparaît, sa barre
  // se remplit et son score monte. Le plus probable est désigné à la fin —
  // mais rien n'oblige le modèle à le prendre.
  function scan(rows) {
    if (reduced.matches) {
      rows.forEach(row => {
        row.button.classList.add('is-shown');
        row.fill.style.width = `${row.candidate.p}%`;
        row.value.textContent = `${row.candidate.p} %`;
      });
      rows[0].button.classList.add('is-top');
      return;
    }
    rows.forEach((row, index) => {
      timers.push(setTimeout(() => {
        row.button.classList.add('is-shown');
        row.fill.style.width = `${row.candidate.p}%`;
        let shown = 0;
        const climb = () => {
          shown = Math.min(row.candidate.p, shown + Math.max(1, Math.round(row.candidate.p / 14)));
          row.value.textContent = `${shown} %`;
          if (shown < row.candidate.p) timers.push(setTimeout(climb, 34));
        };
        timers.push(setTimeout(climb, 90));
      }, 260 + index * 460));
    });
    timers.push(setTimeout(() => {
      const best = rows.reduce((top, row) => (row.candidate.p > top.candidate.p ? row : top));
      best.button.classList.add('is-top');
      const tag = document.createElement('span');
      tag.className = 'candidate-tag';
      tag.textContent = 'le plus probable';
      best.button.querySelector('.candidate-word').appendChild(tag);
    }, 300 + rows.length * 460));
  }

  resetButton.addEventListener('click', () => { picked = []; renderSentence(); renderCandidates(); });

  onSlideVisit(sentence, () => { picked = []; renderSentence(); renderCandidates(); }, clearTimers);
  renderSentence();
  renderCandidates();
})();

/* ---------- Slide 15 · le biais des exemples ---------- */
(() => {
  const plot = document.getElementById('bias-plot');
  if (!plot) return;

  const CATS = [2, 2.6, 3.2];
  const SETS = {
    narrow: [8, 9, 9.6],
    wide: [4.2, 6, 8, 9.6]
  };
  const TEST = 4.5;

  const dotsLayer = document.getElementById('bias-dots');
  const linkLayer = document.getElementById('bias-link');
  const testLayer = document.getElementById('bias-test');
  const verdict = document.getElementById('bias-verdict');
  const narrowButton = document.getElementById('bias-narrow');
  const wideButton = document.getElementById('bias-wide');

  // Échelle verticale : le bas correspond aux petites tailles.
  const sy = size => 272 - (size / 11) * 244;
  const EXAMPLE_X = 202;
  const TEST_X = 104;

  testLayer.appendChild(svgNode('circle', { class: 'dot-test', cx: TEST_X, cy: sy(TEST), r: 13 }));
  testLayer.appendChild(svgNode('text', { class: 'strip-label', x: TEST_X, y: sy(TEST) - 24, 'text-anchor': 'middle' }, 'à classer'));

  function render(key) {
    const examples = [
      ...CATS.map(size => ({ size, kind: 'chat' })),
      ...SETS[key].map(size => ({ size, kind: 'chien' }))
    ];
    dotsLayer.textContent = '';
    examples.forEach(example => {
      dotsLayer.appendChild(svgNode('circle', {
        class: example.kind === 'chat' ? 'dot-cat' : 'dot-dog',
        cx: EXAMPLE_X, cy: sy(example.size), r: 12
      }));
    });

    const nearest = examples.reduce((best, item) =>
      Math.abs(item.size - TEST) < Math.abs(best.size - TEST) ? item : best);
    linkLayer.textContent = '';
    linkLayer.appendChild(svgNode('line', {
      class: 'nn-link', x1: TEST_X + 15, y1: sy(TEST), x2: EXAMPLE_X - 15, y2: sy(nearest.size)
    }));

    const correct = nearest.kind === 'chien';
    verdict.classList.toggle('is-right', correct);
    verdict.classList.toggle('is-wrong', !correct);
    verdict.textContent = correct
      ? 'L’exemple le plus proche est un chien : réponse « chien ». C’est juste.'
      : 'L’exemple le plus proche est un chat : réponse « chat ». C’est faux — elle n’avait jamais vu de petit chien.';

    narrowButton.classList.toggle('is-quiet', key !== 'narrow');
    wideButton.classList.toggle('is-quiet', key !== 'wide');
    narrowButton.setAttribute('aria-pressed', String(key === 'narrow'));
    wideButton.setAttribute('aria-pressed', String(key === 'wide'));
  }

  narrowButton.addEventListener('click', () => render('narrow'));
  wideButton.addEventListener('click', () => render('wide'));
  render('narrow');
})();

/* ---------- Slide 18 · vrai ou faux ---------- */
(() => {
  const quiz = document.getElementById('quiz');
  if (!quiz) return;

  const scoreOut = document.getElementById('quiz-score');
  let answered = 0;
  let right = 0;

  function updateScore() {
    scoreOut.innerHTML = answered === 0
      ? 'Aucune réponse pour l’instant.'
      : `<b>${right}</b> bonne${right > 1 ? 's' : ''} réponse${right > 1 ? 's' : ''} sur <b>${answered}</b>.`;
  }

  [...quiz.querySelectorAll('li')].forEach(item => {
    const feedback = item.querySelector('.quiz-feedback');
    const buttons = [...item.querySelectorAll('.quiz-answers button')];
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const correct = button.dataset.choice === item.dataset.answer;
        answered += 1;
        if (correct) right += 1;
        button.classList.add('is-chosen', correct ? 'is-right' : 'is-wrong');
        buttons.forEach(other => { other.disabled = true; });
        feedback.textContent = `${correct ? 'Exact.' : 'Non.'} ${item.dataset.because}`;
        feedback.classList.add(correct ? 'is-right' : 'is-wrong');
        updateScore();
      });
    });
  });

  updateScore();
})();

/* ---------- Slide 1 · le réseau de la couverture ---------- */
(() => {
  const svg = document.getElementById('cover-net');
  if (!svg) return;

  const LAYERS = [4, 6, 6, 3, 1];
  const COLUMNS = [44, 168, 292, 416, 516];
  const positions = LAYERS.map((count, column) =>
    Array.from({ length: count }, (_, row) => ({
      x: COLUMNS[column],
      y: 118 + (row - (count - 1) / 2) * 36
    }))
  );
  const last = positions.length - 1;

  // Le fond est peint une fois, en dégradé croissant vers la réponse. La vague
  // est un jeu de calques lumineux dont l'opacité pulse en cascade : de
  // l'opacité et rien d'autre, seule primitive que tous les moteurs animent de
  // façon fiable sur du SVG.
  positions.slice(0, -1).forEach((layer, index) => {
    const depth = index / (last - 1);
    layer.forEach(from => {
      positions[index + 1].forEach(to => {
        svg.appendChild(svgNode('line', {
          class: 'cover-link', x1: from.x, y1: from.y, x2: to.x, y2: to.y,
          stroke: `rgba(96, 165, 250, ${(0.10 + depth * 0.30).toFixed(3)})`,
          'stroke-width': (1 + depth * 0.5).toFixed(2)
        }));
      });
    });
  });
  positions.forEach((layer, index) => {
    const isOut = index === last;
    const depth = index / last;
    layer.forEach(point => {
      svg.appendChild(svgNode('circle', {
        class: 'cover-node', cx: point.x, cy: point.y, r: isOut ? 16 : 9,
        fill: isOut ? 'rgba(52, 211, 153, .22)' : `rgba(96, 165, 250, ${(0.07 + depth * 0.24).toFixed(3)})`,
        stroke: isOut ? 'rgba(110, 231, 183, .75)' : `rgba(147, 197, 253, ${(0.32 + depth * 0.36).toFixed(3)})`,
        'stroke-width': isOut ? 2.2 : 1.5
      }));
    });
  });

  positions.forEach((layer, index) => {
    const glow = svgNode('g', { class: 'cover-glow' });
    glow.style.animationDelay = `${index * 420}ms`;
    if (index < last) {
      layer.forEach(from => {
        positions[index + 1].forEach(to => {
          glow.appendChild(svgNode('line', { class: 'cover-glow-link', x1: from.x, y1: from.y, x2: to.x, y2: to.y }));
        });
      });
    }
    layer.forEach(point => {
      glow.appendChild(svgNode('circle', {
        class: index === last ? 'cover-glow-out' : 'cover-glow-node',
        cx: point.x, cy: point.y, r: index === last ? 17 : 10
      }));
    });
    svg.appendChild(glow);
  });

  svg.appendChild(svgNode('text', { class: 'cover-caption', x: 44, y: 196, 'text-anchor': 'middle' }, 'ENTRÉE'));
  svg.appendChild(svgNode('text', { class: 'cover-caption', x: 516, y: 196, 'text-anchor': 'middle' }, 'RÉPONSE'));
})();

/* ---------- Slide 5 · les quatre cas placés en carré ---------- */
(() => {
  const plots = [...document.querySelectorAll('.logic-plot')];
  if (!plots.length) return;

  // Chaque cas devient un point : l'interrupteur A donne l'abscisse, B
  // l'ordonnée. Un neurone ne sait répondre qu'avec une droite ; avec le OU
  // exclusif les deux cas allumés sont en diagonale, et aucun angle ne marche.
  const STATES = { et: [false, false, false, true], xor: [false, true, true, false] };
  const LOW = 62;
  const HIGH = 138;
  const CORNERS = [[LOW, HIGH], [HIGH, HIGH], [LOW, LOW], [HIGH, LOW]];

  plots.forEach(svg => {
    const kind = svg.dataset.logic;
    svg.append(
      svgNode('rect', { class: 'board-field', x: 30, y: 24, width: 146, height: 146, rx: 10 }),
      svgNode('text', { class: 'board-axis', x: 103, y: 192, 'text-anchor': 'middle' }, 'INTERRUPTEUR A'),
      svgNode('text', { class: 'board-axis', x: 14, y: 97, 'text-anchor': 'middle', transform: 'rotate(-90 14 97)' }, 'INTERRUPTEUR B'),
      svgNode('text', { class: 'board-tick', x: LOW, y: 182, 'text-anchor': 'middle' }, 'éteint'),
      svgNode('text', { class: 'board-tick', x: HIGH, y: 182, 'text-anchor': 'middle' }, 'allumé'),
      svgNode('text', { class: 'board-tick', x: 26, y: HIGH + 4, 'text-anchor': 'end' }, 'ét.'),
      svgNode('text', { class: 'board-tick', x: 26, y: LOW + 4, 'text-anchor': 'end' }, 'all.')
    );

    if (kind === 'et') {
      svg.appendChild(svgNode('line', { class: 'sep-good', x1: 46, y1: 46, x2: 160, y2: 160 }));
    } else {
      [-1.05, -0.5, 0, 0.5, 1.05].forEach((angle, index) => {
        const dx = Math.cos(angle) * 76;
        const dy = Math.sin(angle) * 76;
        const attempt = svgNode('line', {
          class: 'sep-fail xor-try',
          x1: (103 - dx).toFixed(1), y1: (97 - dy).toFixed(1),
          x2: (103 + dx).toFixed(1), y2: (97 + dy).toFixed(1)
        });
        attempt.style.animationDelay = `${index * 620}ms`;
        svg.appendChild(attempt);
      });
    }

    STATES[kind].forEach((on, index) => {
      const [cx, cy] = CORNERS[index];
      svg.append(
        svgNode('circle', { class: `board-dot ${on ? 'is-on' : 'is-off'}`, cx, cy, r: 15 }),
        svgNode('text', { class: 'board-mark', x: cx, y: cy + 5, 'text-anchor': 'middle' }, on ? '✓' : '×')
      );
    });
  });
})();

/* ---------- Slide 3 · la grille de cellules du perceptron ---------- */
(() => {
  const svg = document.getElementById('cells');
  if (!svg) return;

  // Un « C » dessiné sur une grille de cellules, comme les 400 cellules
  // photoélectriques du Mark I. Trois liaisons sont chiffrées : c'est ce qui
  // rend concret le mot « poids ».
  const LETTER = [
    '.####.',
    '###.##',
    '##....',
    '##....',
    '###.##',
    '.####.'
  ];
  const CELL = 27;
  const X0 = 14;
  const Y0 = 62;
  const lit = [];

  LETTER.forEach((row, r) => {
    [...row].forEach((mark, c) => {
      const on = mark === '#';
      svg.appendChild(svgNode('rect', {
        class: `cell-eye${on ? ' is-on' : ''}`,
        x: X0 + c * CELL, y: Y0 + r * CELL, width: CELL - 4, height: CELL - 4, rx: 3
      }));
      if (on) lit.push({ x: X0 + c * CELL + (CELL - 4), y: Y0 + r * CELL + (CELL - 4) / 2 });
    });
  });
  svg.append(
    svgNode('text', { class: 'axis-title', x: X0, y: 50 }, 'LES CELLULES'),
    svgNode('text', { class: 'cell-hint', x: X0, y: 250 }, 'allumée = 1 · éteinte = 0')
  );

  const SUM = { x: 300, y: 148 };
  const WEIGHTS = ['× 1,2', '× 0,9', '× −0,4'];
  [lit[2], lit[Math.floor(lit.length / 2)], lit[lit.length - 3]].forEach((point, index) => {
    const wire = svgNode('path', {
      class: 'cell-wire',
      d: `M${point.x + 4},${point.y} C${point.x + 70},${point.y} ${SUM.x - 70},${SUM.y} ${SUM.x - 24},${SUM.y}`
    });
    wire.style.animationDelay = `${index * 220}ms`;
    svg.appendChild(wire);
    svg.appendChild(svgNode('text', {
      class: 'weight-label', x: 214, y: point.y + (point.y < SUM.y ? -8 : 14), 'text-anchor': 'middle'
    }, WEIGHTS[index]));
  });

  svg.append(
    svgNode('circle', { class: 'node-box node-box-accent', cx: SUM.x, cy: SUM.y, r: 30 }),
    svgNode('text', { class: 'cell-sum', x: SUM.x, y: SUM.y - 2, 'text-anchor': 'middle' }, 'Σ'),
    svgNode('text', { class: 'cell-total', x: SUM.x, y: SUM.y + 16, 'text-anchor': 'middle' }, '4,7'),
    svgNode('path', { class: 'wire', d: `M${SUM.x + 30},${SUM.y} H${SUM.x + 58}` }),
    svgNode('rect', { class: 'node-box node-box-out', x: SUM.x + 58, y: SUM.y - 34, width: 96, height: 68, rx: 13 }),
    svgNode('text', { class: 'cell-hint is-out', x: SUM.x + 74, y: SUM.y - 12 }, 'plus grand'),
    svgNode('text', { class: 'cell-hint is-out', x: SUM.x + 74, y: SUM.y + 4 }, 'que 3' + ' ' + '?'),
    svgNode('text', { class: 'cell-answer', x: SUM.x + 74, y: SUM.y + 26 }, 'oui : C')
  );
})();

/* ---------- Slide 4 · le dialogue d'ELIZA ---------- */
(() => {
  const log = document.getElementById('eliza-log');
  if (!log) return;

  const EXCHANGE = [
    { who: 'vous', text: 'Je suis triste.' },
    { who: 'eliza', text: 'Pourquoi êtes-vous triste ?' },
    { who: 'vous', text: 'À cause de l’école.' },
    { who: 'eliza', text: 'Parlez-moi de l’école.' },
    { who: 'vous', text: 'Personne ne m’écoute.' },
    { who: 'eliza', text: 'Pourquoi dites-vous que personne ne vous écoute ?' }
  ];
  let timer = 0;

  function run() {
    log.textContent = '';
    let index = 0;
    if (reduced.matches) {
      EXCHANGE.forEach(line => log.appendChild(row(line, line.text)));
      return;
    }
    const step = () => {
      if (index >= EXCHANGE.length) { timer = setTimeout(run, 3200); return; }
      const line = EXCHANGE[index];
      const node = row(line, '');
      log.appendChild(node);
      const target = node.querySelector('span');
      let cursor = 0;
      const type = () => {
        cursor += 1;
        target.textContent = line.text.slice(0, cursor);
        if (cursor < line.text.length) { timer = setTimeout(type, 34); return; }
        index += 1;
        timer = setTimeout(step, 620);
      };
      timer = setTimeout(type, 120);
    };
    timer = setTimeout(step, 300);
  }

  function row(line, text) {
    const node = document.createElement('p');
    node.className = `terminal-line is-${line.who}`;
    const tag = document.createElement('b');
    tag.textContent = line.who === 'vous' ? '>' : 'ELIZA';
    const body = document.createElement('span');
    body.textContent = text;
    node.append(tag, body);
    return node;
  }

  onSlideVisit(log, run, () => { clearTimeout(timer); });
})();

/* ---------- Slide 6 · les règles qui s'empilent ---------- */
(() => {
  const svg = document.getElementById('rules-figure');
  if (!svg) return;

  const RULES = [
    { text: 'SI fièvre > 38,5 ALORS suspecter une infection', ok: true },
    { text: 'SI gorge rouge ALORS prescrire un test', ok: true },
    { text: 'SI toux sèche ET fièvre ALORS radiographie', ok: true },
    { text: 'SI patient < 6 ans ALORS ne pas prescrire', ok: true },
    { text: 'SI fièvre > 38,5 ALORS ne rien prescrire', ok: false },
    { text: 'SI test positif ET âge < 6 ALORS prescrire', ok: false }
  ];

  RULES.forEach((rule, index) => {
    const group = svgNode('g', { class: `rule-row${rule.ok ? '' : ' is-clash'}` });
    group.style.animationDelay = `${index * 900}ms`;
    group.append(
      svgNode('rect', { class: 'rule-box', x: 20, y: 22 + index * 44, width: 420, height: 34, rx: 7 }),
      svgNode('text', { class: 'rule-text', x: 36, y: 44 + index * 44 }, rule.text)
    );
    if (!rule.ok) {
      group.appendChild(svgNode('text', { class: 'rule-flag', x: 424, y: 44 + index * 44, 'text-anchor': 'end' }, '⚠'));
    }
    svg.appendChild(group);
  });
})();

/* ---------- Slide 7 · l'erreur qui remonte ---------- */
(() => {
  const svg = document.getElementById('backprop-figure');
  if (!svg) return;

  const LAYERS = [4, 6, 5, 2];
  const COLUMNS = [78, 240, 402, 552];
  const positions = LAYERS.map((count, column) =>
    Array.from({ length: count }, (_, row) => ({
      x: COLUMNS[column],
      y: 152 + (row - (count - 1) / 2) * 33
    }))
  );

  positions.slice(0, -1).forEach((layer, index) => {
    layer.forEach(from => {
      positions[index + 1].forEach(to => {
        svg.appendChild(svgNode('line', { class: 'bp-link', x1: from.x, y1: from.y, x2: to.x, y2: to.y }));
      });
    });
  });
  positions.forEach((layer, index) => {
    layer.forEach(point => {
      svg.appendChild(svgNode('circle', {
        class: `bp-node${index === LAYERS.length - 1 ? ' is-out' : ''}`, cx: point.x, cy: point.y, r: 10
      }));
    });
  });

  // Deux vagues opposées : le signal file vers la droite, puis l'erreur revient
  // vers la gauche et chaque couche reçoit sa part.
  positions.forEach((layer, index) => {
    const forward = svgNode('g', { class: 'bp-wave' });
    forward.style.animationDelay = `${index * 300}ms`;
    layer.forEach(point => forward.appendChild(svgNode('circle', { class: 'bp-glow', cx: point.x, cy: point.y, r: 12 })));
    svg.appendChild(forward);

    const back = svgNode('g', { class: 'bp-wave' });
    back.style.animationDelay = `${2400 + (LAYERS.length - 1 - index) * 300}ms`;
    layer.forEach(point => back.appendChild(svgNode('circle', { class: 'bp-glow is-error', cx: point.x, cy: point.y, r: 12 })));
    svg.appendChild(back);
  });

  svg.append(
    svgNode('path', { class: 'bp-arrow is-forward-arrow', d: 'M78 52 H524' }),
    svgNode('path', { class: 'bp-arrowhead is-forward-arrow', d: 'M552 52 l-22 -8 v16 z' }),
    svgNode('text', { class: 'bp-caption is-forward-arrow', x: 300, y: 40, 'text-anchor': 'middle' }, 'LE SIGNAL AVANCE'),
    svgNode('path', { class: 'bp-arrow is-error', d: 'M552 252 H106' }),
    svgNode('path', { class: 'bp-arrowhead is-error', d: 'M78 252 l22 -8 v16 z' }),
    svgNode('text', { class: 'bp-caption is-error', x: 316, y: 276, 'text-anchor': 'middle' }, 'PUIS L’ERREUR REMONTE ET CORRIGE'),
    svgNode('text', { class: 'board-tick', x: 552, y: 196, 'text-anchor': 'middle' }, 'chat ou chien' + ' ' + '?')
  );
})();

/* ---------- Slide 1 · la question qui s'écrit ---------- */
(() => {
  const typed = document.getElementById('cover-typed');
  if (!typed) return;

  const QUESTIONS = [
    'Est-ce qu’elle comprend ce qu’elle dit ?',
    'Est-ce qu’elle peut se tromper ?',
    'Est-ce qu’elle apprend comme toi ?',
    'Est-ce qu’elle pense ?'
  ];
  let stop = () => {};
  onSlideVisit(typed, () => { stop = typewriter(typed, QUESTIONS, { speed: 58, erase: 30, hold: 2100 }); }, () => stop());
})();

/* ---------- Slide 10 · les trois mécanismes en mouvement ---------- */
(() => {
  const glyphs = [...document.querySelectorAll('.family-grid .family-glyph')];
  if (glyphs.length < 3) return;

  // Supervisé : la bonne réponse arrive et remplace la question.
  glyphs[0].querySelector('.glyph-mark.is-blue').classList.add('glyph-out');
  glyphs[0].querySelector('.glyph-mark.is-green').classList.add('glyph-in');

  // Non supervisé : les groupes se révèlent, puis s'effacent.
  glyphs[1].querySelectorAll('.glyph-ring').forEach(ring => ring.classList.add('glyph-in'));

  // Renforcement : l'agent va chercher la récompense, qui s'allume.
  const agent = glyphs[2].querySelector('.glyph-agent');
  const arrived = agent.cloneNode(false);
  arrived.setAttribute('cx', '92');
  arrived.setAttribute('cy', '32');
  arrived.classList.add('glyph-in');
  agent.classList.add('glyph-out');
  agent.parentNode.insertBefore(arrived, agent.nextSibling);
  glyphs[2].querySelector('.glyph-star').classList.add('glyph-in');
})();

/* ---------- Slide 18 · l'attention ---------- */
(() => {
  const row = document.getElementById('attention-words');
  if (!row) return;

  const svg = document.getElementById('attention-arcs');
  const status = document.getElementById('attention-status');
  const WORDS = ['Le', 'chat', 'dormait', 'sur', 'le', 'canapé', 'quand', 'la', 'porte', 'a', 'claqué', ':', 'il', 's’est', 'réveillé'];
  // Poids d'illustration : ils disent où le sens va se chercher, pas ce qu'un
  // modèle réel calculerait exactement.
  const ATTENTION = {
    1: { 0: 46, 2: 32, 5: 22 },
    2: { 1: 58, 5: 22, 3: 12, 0: 8 },
    5: { 2: 34, 3: 32, 1: 24, 4: 10 },
    8: { 10: 44, 6: 22, 7: 20, 1: 14 },
    10: { 8: 68, 6: 12, 7: 12, 1: 8 },
    12: { 1: 62, 8: 16, 5: 12, 2: 10 },
    14: { 12: 34, 1: 28, 2: 22, 10: 16 }
  };
  const buttons = [];

  WORDS.forEach((word, index) => {
    const clickable = Object.prototype.hasOwnProperty.call(ATTENTION, index);
    const node = document.createElement(clickable ? 'button' : 'span');
    node.className = 'word';
    node.textContent = word;
    if (clickable) {
      node.type = 'button';
      node.setAttribute('aria-label', `Voir où le mot « ${word} » regarde`);
      node.addEventListener('click', () => select(index));
    }
    row.appendChild(node);
    buttons.push(node);
  });

  function clear() {
    svg.textContent = '';
    buttons.forEach(node => {
      node.classList.remove('is-source');
      node.style.backgroundColor = '';
    });
  }

  function select(source) {
    clear();
    const weights = ATTENTION[source];
    const stage = svg.parentElement.getBoundingClientRect();
    const height = svg.getBoundingClientRect().height;
    svg.setAttribute('viewBox', `0 0 ${Math.round(stage.width)} ${Math.round(height)}`);
    const centre = node => {
      const box = node.getBoundingClientRect();
      return box.left - stage.left + box.width / 2;
    };
    const sourceX = centre(buttons[source]);
    buttons[source].classList.add('is-source');

    const entries = Object.entries(weights).sort((a, b) => b[1] - a[1]);
    entries.forEach(([target, weight]) => {
      const targetX = centre(buttons[target]);
      // Plus le mot regardé est loin, plus l'arc monte : la portée se voit.
      const lift = Math.min(height - 8, 26 + Math.abs(sourceX - targetX) * 0.11);
      svg.appendChild(svgNode('path', {
        class: 'att-arc',
        d: `M${sourceX},${height - 4} C${sourceX},${height - lift} ${targetX},${height - lift} ${targetX},${height - 4}`,
        'stroke-width': (weight / 100 * 9 + 1).toFixed(1),
        opacity: (0.35 + weight / 160).toFixed(2)
      }));
      buttons[target].style.backgroundColor = `rgba(96, 165, 250, ${(weight / 100 * 0.55).toFixed(3)})`;
    });

    const [best, bestWeight] = entries[0];
    status.innerHTML = `«&#8239;${WORDS[source]}&#8239;» regarde surtout <b>«&#8239;${WORDS[best]}&#8239;»</b> (${bestWeight}&#8239;%), puis ${entries.slice(1).map(([index, value]) => `«&#8239;${WORDS[index]}&#8239;» (${value}&#8239;%)`).join(', ')}.`;
  }

  // On arrive sur un exemple déjà tracé : une bande vide donnerait l'impression
  // qu'il manque quelque chose. « il » est le cas le plus parlant.
  let armed = true;
  document.addEventListener('presentation:build', event => {
    if (event.detail.slide !== row.closest('.slide')) { armed = true; return; }
    if (armed) { armed = false; select(12); }
  });
  window.addEventListener('resize', () => {
    const source = buttons.findIndex(node => node.classList.contains('is-source'));
    if (source >= 0) select(source);
  });

  if (row.closest('.slide').classList.contains('active')) select(12);
})();

/* ---------- Slide 19 · la phrase qui se construit mot à mot ---------- */
(() => {
  const line = document.getElementById('gen-line');
  if (!line) return;

  const WORDS = ['Un', 'modèle', 'de', 'langage', 'écrit', 'chaque', 'mot', 'en', 'regardant', 'tous', 'les', 'précédents.'];
  let timer = 0;

  function run() {
    let index = 0;
    line.textContent = '';
    if (reduced.matches) { line.textContent = WORDS.join(' '); return; }
    const step = () => {
      if (index < WORDS.length) {
        const word = document.createElement('span');
        word.className = 'gen-word';
        word.textContent = `${WORDS[index]} `;
        line.appendChild(word);
        index += 1;
        timer = setTimeout(step, 250);
      } else {
        timer = setTimeout(run, 2600);
      }
    };
    timer = setTimeout(step, 260);
  }

  onSlideVisit(line, run, () => { clearTimeout(timer); });
})();

/* ---------- Slide 20 · le harnais ---------- */
(() => {
  const svg = document.getElementById('harness');
  if (!svg) return;

  const MODULES = [
    { build: 4, x: 36, y: 14, title: 'La consigne', sub: 'ce qu’on lui dit d’être et de faire' },
    { build: 5, x: 36, y: 138, title: 'Les outils', sub: 'chercher, calculer, lire un fichier' },
    { build: 6, x: 744, y: 14, title: 'La mémoire', sub: 'ce qui a été dit avant' },
    { build: 7, x: 744, y: 138, title: 'Les garde-fous', sub: 'ce qu’il doit refuser de faire' }
  ];
  const CORE = { x: 396, y: 66, w: 288, h: 100 };

  const core = svgNode('g');
  core.append(
    svgNode('rect', { class: 'harness-core', x: CORE.x, y: CORE.y, width: CORE.w, height: CORE.h, rx: 18 }),
    svgNode('text', { class: 'harness-core-title', x: CORE.x + CORE.w / 2, y: CORE.y + 46, 'text-anchor': 'middle' }, 'Le modèle'),
    svgNode('text', { class: 'harness-core-sub', x: CORE.x + CORE.w / 2, y: CORE.y + 70, 'text-anchor': 'middle' }, 'IL DEVINE LE MOT SUIVANT'),
    svgNode('text', { class: 'harness-core-sub', x: CORE.x + CORE.w / 2, y: CORE.y + 88, 'text-anchor': 'middle' }, 'ET RIEN D’AUTRE')
  );
  svg.appendChild(core);

  MODULES.forEach(module => {
    const group = buildGroup(module.build);
    const left = module.x < 400;
    const width = 300;
    const height = 80;
    group.append(
      svgNode('rect', { class: 'harness-box', x: module.x, y: module.y, width, height, rx: 14 }),
      svgNode('text', { class: 'harness-title', x: module.x + 24, y: module.y + 34 }, module.title),
      svgNode('text', { class: 'harness-sub', x: module.x + 24, y: module.y + 57 }, module.sub)
    );
    const from = left ? module.x + width : module.x;
    const to = left ? CORE.x : CORE.x + CORE.w;
    const midY = module.y + height / 2;
    const coreY = CORE.y + (module.y < 100 ? 32 : CORE.h - 32);
    group.appendChild(svgNode('path', {
      class: 'harness-tie',
      d: `M${from},${midY} C${(from + to) / 2},${midY} ${(from + to) / 2},${coreY} ${to},${coreY}`
    }));
    svg.appendChild(group);
  });
})();

/* ---------- Slide 21 · la boucle de l'agent ---------- */
(() => {
  const svg = document.getElementById('agent-loop');
  if (!svg) return;

  const STEPS = [
    { title: 'Observer', sub: 'lire l’état actuel' },
    { title: 'Décider', sub: 'choisir l’action suivante' },
    { title: 'Agir', sub: 'exécuter pour de vrai' },
    { title: 'Vérifier', sub: 'regarder le résultat' }
  ];
  const CX = 235;
  const CY = 172;
  const R = 104;
  // Les libellés sortent du cercle du côté de leur nœud : centrés, ils
  // chevauchaient l'anneau et les nœuds voisins.
  const PLACES = [
    { anchor: 'middle', dx: 0, dy: -32, gap: 17 },
    { anchor: 'start', dx: 28, dy: -4, gap: 17 },
    { anchor: 'middle', dx: 0, dy: 38, gap: 17 },
    { anchor: 'end', dx: -28, dy: -4, gap: 17 }
  ];

  svg.appendChild(svgNode('circle', { class: 'loop-ring', cx: CX, cy: CY, r: R }));
  STEPS.forEach((step, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    const x = CX + R * Math.cos(angle);
    const y = CY + R * Math.sin(angle);
    const place = PLACES[index];
    svg.append(
      svgNode('circle', { class: 'loop-node', cx: x, cy: y, r: 15 }),
      svgNode('text', { class: 'loop-label', x: x + place.dx, y: y + place.dy, 'text-anchor': place.anchor }, step.title),
      svgNode('text', { class: 'loop-sub', x: x + place.dx, y: y + place.dy + place.gap, 'text-anchor': place.anchor }, step.sub)
    );
  });

  // La circulation est montrée par une ronde de points qui s'allument en
  // cascade : aucune trajectoire calculée, donc rien qui dépende du moteur.
  const BEADS = 16;
  for (let index = 0; index < BEADS; index += 1) {
    const angle = -Math.PI / 2 + (index / BEADS) * Math.PI * 2;
    const bead = svgNode('circle', {
      class: 'loop-bead', cx: (CX + R * Math.cos(angle)).toFixed(1), cy: (CY + R * Math.sin(angle)).toFixed(1), r: 4.5
    });
    bead.style.animationDelay = `${index * (2600 / BEADS)}ms`;
    svg.appendChild(bead);
  }
})();

/* ---------- Slide 22 · deux réponses, une seule vitesse ---------- */
(() => {
  const quotes = [...document.querySelectorAll('.answer blockquote[data-type]')];
  if (!quotes.length) return;

  let timer = 0;

  function run() {
    const texts = quotes.map(node => node.dataset.type);
    quotes.forEach(node => { node.textContent = ''; });
    if (reduced.matches) { quotes.forEach((node, i) => { node.textContent = texts[i]; }); return; }
    let cursor = 0;
    const longest = Math.max(...texts.map(text => text.length));
    const step = () => {
      cursor += 1;
      // Les deux se remplissent au même rythme : c'est le propos de la slide.
      quotes.forEach((node, index) => { node.textContent = texts[index].slice(0, cursor); });
      if (cursor < longest) timer = setTimeout(step, 42);
      else timer = setTimeout(run, 4200);
    };
    timer = setTimeout(step, 400);
  }

  onSlideVisit(quotes[0], run, () => { clearTimeout(timer); });
})();

/* ---------- Slide 24 · la scène et les nombres ---------- */
(() => {
  const svg = document.getElementById('scene-figure');
  if (!svg) return;

  svg.append(
    svgNode('line', { class: 'scene-floor', x1: 12, y1: 116, x2: 288, y2: 116 }),
    svgNode('rect', { class: 'scene-sofa', x: 40, y: 62, width: 200, height: 54, rx: 12 }),
    svgNode('rect', { class: 'scene-sofa', x: 40, y: 40, width: 200, height: 30, rx: 10 }),
    svgNode('rect', { class: 'scene-sofa', x: 30, y: 52, width: 20, height: 62, rx: 8 }),
    svgNode('rect', { class: 'scene-sofa', x: 230, y: 52, width: 20, height: 62, rx: 8 }),
    svgNode('ellipse', { class: 'scene-cat', cx: 140, cy: 74, rx: 38, ry: 14 }),
    svgNode('circle', { class: 'scene-cat', cx: 176, cy: 66, r: 12 }),
    svgNode('path', { class: 'scene-cat', d: 'M168 58 l-3 -11 9 6z M184 58 l3 -11 -9 6z' }),
    svgNode('path', { class: 'scene-cat', d: 'M102 74 c-14 0 -18 -12 -8 -16 4 -2 6 2 4 5 -2 4 2 6 6 5z' }),
    svgNode('text', { class: 'scene-zzz', x: 198, y: 40 }, 'z z z')
  );

  const strip = document.getElementById('number-strip');
  // Ce que la machine reçoit vraiment : un identifiant par jeton, rien de plus.
  [4812, 219, 6704, 88, 4812, 9931, 74, 512, 3308, 61, 7742, 15, 402, 1188, 6650]
    .forEach((value, index) => {
      const chip = document.createElement('span');
      chip.className = 'number-chip';
      chip.textContent = value;
      chip.style.animationDelay = `${index * 45}ms`;
      strip.appendChild(chip);
    });
})();

/* ---------- Slide 25 · les trois usages du tapis ---------- */
(() => {
  const belts = [...document.querySelectorAll('.belt')];
  if (!belts.length) return;

  const BELT_Y = 96;
  const FLOOR = 118;

  // Deux poses réellement différentes, alternées en opacité : appui écarté
  // puis jambe levée. Les mirroir l'une de l'autre ne suffisaient pas — les
  // mêmes segments échangés donnent exactement le même dessin, donc aucun
  // mouvement visible. Ce sont les jambes qui portent la marche ; les bras
  // ne font qu'accompagner.
  const HEAD_Y = 22;
  const NECK_Y = 35;
  const HIP_Y = 66;
  const FOOT_Y = 98;
  const SHOULDER_Y = 45;

  function limb(from, to) {
    return svgNode('path', { class: 'belt-person', d: `M${from[0]},${from[1]} L${to[0]},${to[1]}` });
  }

  function arm(from, to) {
    return svgNode('path', { class: 'belt-arm', d: `M${from[0]},${from[1]} L${to[0]},${to[1]}` });
  }

  function person(kind) {
    const walker = svgNode('g', { class: 'belt-walker' });
    const x = 150;
    // Tout va vers la gauche, traits du tapis comme personnages : les décalages
    // horizontaux sont comptés négativement, ce qui retourne la silhouette d'un
    // bloc — buste penché, jambe avant et bras avant du bon côté.
    const dir = -1;
    const lean = (kind === 'entrainement' ? 5 : kind === 'actif' ? 3 : 0) * dir;
    // Le bassin suit le buste : sans cela, les jambes restaient centrées sur
    // l'axe pendant que la tête et le torse partaient de côté, et l'ensemble
    // paraissait désarticulé.
    const hx = x + lean * 0.5;
    const hip = [hx, HIP_Y];
    const shoulder = [hx + lean * 0.55, SHOULDER_Y];
    walker.append(
      svgNode('circle', { class: 'belt-head', cx: hx + lean * 1.1, cy: HEAD_Y, r: 9.5 }),
      limb([hx + lean * 0.85, NECK_Y], hip)
    );

    if (kind === 'passif') {
      // Debout, immobile, bras le long du corps : le tapis fait le trajet.
      walker.append(
        limb(hip, [hx - 6, FOOT_Y]),
        limb(hip, [hx + 7, FOOT_Y]),
        arm(shoulder, [hx - 7, HIP_Y + 2]),
        arm(shoulder, [hx + 8, HIP_Y + 2])
      );
      return walker;
    }

    const stride = (kind === 'entrainement' ? 25 : 17) * dir;
    const reach = (kind === 'entrainement' ? 18 : 12) * dir;
    const swing = Math.round(stride * 0.55);

    // Quatre temps. Le pied posé recule par rapport au corps d'une image à
    // l'autre — c'est le corps qui avance — et le pied libre se lève puis
    // repart vers l'avant.
    const pose = (css, front, back, armWay) => {
      const legs = svgNode('g', { class: css });
      legs.append(limb(hip, front), limb(hip, back));
      legs.append(
        arm(shoulder, [hx - reach * armWay * 0.5, HIP_Y + 2]),
        arm(shoulder, [hx + reach * armWay * 0.5, HIP_Y - 2])
      );
      return legs;
    };

    walker.append(
      pose('belt-step-1', [hx + stride, FOOT_Y], [hx - stride, FOOT_Y], -1),
      pose('belt-step-2', [hx, FOOT_Y], [hx + swing, FOOT_Y - 12], -0.4),
      pose('belt-step-3', [hx - stride, FOOT_Y], [hx + stride, FOOT_Y], 1),
      pose('belt-step-4', [hx + swing, FOOT_Y - 12], [hx, FOOT_Y], 0.4)
    );
    return walker;
  }

  belts.forEach(svg => {
    const kind = svg.dataset.belt;
    const gym = kind === 'entrainement';

    if (gym) {
      // Une machine de salle de sport : un tablier court, une console, une
      // rampe. Elle ne transporte personne.
      svg.append(
        svgNode('line', { class: 'belt-frame', x1: 40, y1: FLOOR, x2: 272, y2: FLOOR }),
        svgNode('rect', { class: 'belt-deck', x: 96, y: BELT_Y - 6, width: 150, height: 16, rx: 6 }),
        // Le mât porte la console, centrée sur lui, et une barre d'appui à
        // hauteur de main. Auparavant la barre passait à hauteur de tête et
        // traversait le cou du personnage.
        svgNode('path', { class: 'belt-rail', d: `M104,${BELT_Y - 6} L104,50` }),
        svgNode('path', { class: 'belt-rail', d: 'M104,60 L128,60' }),
        svgNode('rect', { class: 'belt-console', x: 91, y: 26, width: 26, height: 24, rx: 4 }),
        svgNode('line', { class: 'belt-band is-train', x1: 102, y1: BELT_Y + 2, x2: 240, y2: BELT_Y + 2 })
      );
    } else {
      svg.append(
        svgNode('line', { class: 'belt-frame', x1: 24, y1: FLOOR, x2: 276, y2: FLOOR }),
        svgNode('circle', { class: 'belt-roller', cx: 40, cy: BELT_Y, r: 11 }),
        svgNode('circle', { class: 'belt-roller', cx: 260, cy: BELT_Y, r: 11 }),
        svgNode('line', { class: `belt-band is-${kind}`, x1: 40, y1: BELT_Y, x2: 260, y2: BELT_Y })
      );
    }

    const walker = person(kind);
    walker.classList.add(`is-${kind}`);
    svg.appendChild(walker);

    const NOTES = {
      passif: 'IL AVANCE SANS MARCHER',
      actif: 'ELLE MARCHE, ET VA PLUS LOIN',
      entrainement: 'ELLE COURT, ET RESTE SUR PLACE'
    };
    svg.appendChild(svgNode('text', {
      class: 'belt-note', x: 150, y: FLOOR + 14, 'text-anchor': 'middle'
    }, NOTES[kind]));
  });
})();

/* ---------- Slide 22 · l'agent qui délègue ---------- */
(() => {
  const svg = document.getElementById('subagents');
  if (!svg) return;

  const MAIN = { x: 30, y: 108, w: 176, h: 84 };
  const SUBS = [
    { y: 32, label: 'sous-agent 1', task: 'dossier A' },
    { y: 120, label: 'sous-agent 2', task: 'dossier B' },
    { y: 208, label: 'sous-agent 3', task: 'dossier C' }
  ];

  svg.append(
    svgNode('rect', { class: 'harness-core', x: MAIN.x, y: MAIN.y, width: MAIN.w, height: MAIN.h, rx: 16 }),
    svgNode('text', { class: 'harness-core-title', x: MAIN.x + MAIN.w / 2, y: MAIN.y + 36, 'text-anchor': 'middle' }, 'Agent principal'),
    svgNode('text', { class: 'harness-core-sub', x: MAIN.x + MAIN.w / 2, y: MAIN.y + 58, 'text-anchor': 'middle' }, 'IL DÉCOUPE ET ASSEMBLE')
  );

  // Aller et retour : la tâche part vers le sous-agent, le résumé revient. Les
  // trois branches s'allument en cascade puis reviennent ensemble — c'est le
  // parallélisme qu'on veut faire voir.
  SUBS.forEach((sub, index) => {
    const group = svgNode('g');
    const boxX = 356;
    const midY = sub.y + 32;
    group.append(
      svgNode('path', {
        class: 'sub-out', d: `M${MAIN.x + MAIN.w},${MAIN.y + 30} C288,${MAIN.y + 30} 300,${midY} ${boxX},${midY}`
      }),
      svgNode('path', {
        class: 'sub-back', d: `M${boxX},${midY + 14} C300,${midY + 14} 288,${MAIN.y + 62} ${MAIN.x + MAIN.w},${MAIN.y + 62}`
      }),
      svgNode('rect', { class: 'sub-box', x: boxX, y: sub.y, width: 176, height: 64, rx: 12 }),
      svgNode('text', { class: 'harness-title', x: boxX + 20, y: sub.y + 27 }, sub.label),
      svgNode('text', { class: 'harness-sub', x: boxX + 20, y: sub.y + 48 }, sub.task)
    );
    group.querySelectorAll('.sub-out, .sub-back, .sub-box').forEach(node => {
      node.style.animationDelay = `${index * 260}ms`;
    });
    svg.appendChild(group);
  });

  svg.append(
    svgNode('text', { class: 'sub-caption is-out', x: 282, y: 96, 'text-anchor': 'middle' }, 'LA TÂCHE PART'),
    svgNode('text', { class: 'sub-caption is-back', x: 282, y: 214, 'text-anchor': 'middle' }, 'LE RÉSUMÉ REVIENT')
  );
})();

/* ---------- Slide · ce que consomme un centre de données ---------- */
(() => {
  const svg = document.getElementById('energy-figure');
  if (!svg) return;

  const GROUND = 268;
  const HALL = { x: 186, y: 116, w: 254, h: GROUND - 116 };

  // Deux barres ne disaient rien. On dessine l'objet réel : un bâtiment, ce qui
  // y entre (électricité, eau, requêtes) et ce qui en sort (chaleur, vapeur).
  svg.append(
    svgNode('line', { class: 'dc-ground', x1: 12, y1: GROUND, x2: 608, y2: GROUND }),
    svgNode('rect', { class: 'dc-hall', x: HALL.x, y: HALL.y, width: HALL.w, height: HALL.h, rx: 10 }),
    svgNode('text', { class: 'dc-label', x: HALL.x + HALL.w / 2, y: HALL.y - 12, 'text-anchor': 'middle' }, 'CENTRE DE DONNÉES')
  );

  // Les baies, avec leurs voyants qui clignotent en désordre.
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const x = HALL.x + 16 + col * 46;
      const y = HALL.y + 18 + row * 44;
      svg.appendChild(svgNode('rect', { class: 'dc-rack', x, y, width: 36, height: 32, rx: 4 }));
      [0, 1].forEach(slot => {
        const led = svgNode('circle', { class: 'dc-led', cx: x + 9 + slot * 18, cy: y + 24, r: 2.6 });
        led.style.animationDelay = `${Math.round(Math.random() * 1400)}ms`;
        svg.appendChild(led);
      });
    }
  }

  // Le pylône et l'arrivée d'électricité.
  svg.append(
    svgNode('path', { class: 'dc-pylon', d: `M56,${GROUND} L74,124 M104,${GROUND} L86,124 M74,124 L86,124 M64,224 L96,224 M69,176 L91,176 M40,132 L120,132` }),
    svgNode('path', { class: 'dc-power', d: `M120,132 C150,132 156,150 ${HALL.x},150` }),
    svgNode('text', { class: 'dc-flow is-power', x: 80, y: 114, 'text-anchor': 'middle' }, 'ÉLECTRICITÉ')
  );

  // La tour de refroidissement et sa vapeur.
  svg.append(
    svgNode('path', { class: 'dc-tower', d: `M486,${GROUND} L494,196 L562,196 L570,${GROUND} Z` }),
    svgNode('path', { class: 'dc-water', d: `M${HALL.x + HALL.w},214 C462,214 470,206 494,206` }),
    svgNode('text', { class: 'dc-flow is-water', x: 528, y: 186, 'text-anchor': 'middle' }, 'EAU')
  );
  [0, 1, 2, 3].forEach(index => {
    const puff = svgNode('ellipse', { class: 'dc-vapour', cx: 512 + index * 12, cy: 190, rx: 15, ry: 9 });
    puff.style.animationDelay = `${index * 700}ms`;
    svg.appendChild(puff);
  });

  // La chaleur qui s'échappe du toit.
  [0, 1, 2].forEach(index => {
    const wave = svgNode('path', {
      class: 'dc-heat',
      d: `M${HALL.x + 60 + index * 68},${HALL.y - 6} c6,-14 -6,-22 0,-36 c6,-14 -6,-20 0,-32`
    });
    wave.style.animationDelay = `${index * 620}ms`;
    svg.appendChild(wave);
  });

  // Les requêtes qui arrivent, une par une, sans jamais s'arrêter.
  svg.appendChild(svgNode('text', { class: 'dc-flow is-ask', x: 84, y: GROUND + 24, 'text-anchor': 'middle' }, 'TES REQUÊTES'));
  for (let index = 0; index < 9; index += 1) {
    const dot = svgNode('circle', { class: 'dc-ask', cx: 132 + index * 6.4, cy: GROUND - 14, r: 3.4 });
    dot.style.animationDelay = `${index * 190}ms`;
    svg.appendChild(dot);
  }
})();

/* ---------- Slide 28 · trier les craintes ---------- */
(() => {
  const list = document.getElementById('fears');
  if (!list) return;

  const scoreOut = document.getElementById('fear-score');
  const NAMES = { now: 'Déjà là', debate: 'En débat', later: 'Pas pour demain' };
  let answered = 0;
  let right = 0;

  function updateScore() {
    scoreOut.innerHTML = answered === 0
      ? 'Cinq craintes à classer.'
      : `<b>${right}</b> bien classée${right > 1 ? 's' : ''} sur <b>${answered}</b>.`;
  }

  [...list.querySelectorAll('li')].forEach(item => {
    const feedback = item.querySelector('.fear-feedback');
    const buttons = [...item.querySelectorAll('.fear-answers button')];
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const correct = button.dataset.choice === item.dataset.answer;
        answered += 1;
        if (correct) right += 1;
        buttons.forEach(other => {
          other.disabled = true;
          if (other.dataset.choice === item.dataset.answer) other.classList.add('is-answer');
        });
        button.classList.add('is-chosen', correct ? 'is-right' : 'is-wrong');
        feedback.textContent = correct
          ? item.dataset.because
          : `Plutôt « ${NAMES[item.dataset.answer]} ». ${item.dataset.because}`;
        feedback.classList.add(correct ? 'is-right' : 'is-wrong');
        updateScore();
      });
    });
  });

  updateScore();
})();

/* ---------- Slide 20 · la diffusion ---------- */
(() => {
  const svg = document.getElementById('diffusion');
  if (!svg) return;

  const CELL = 10;
  const COLS = 30;
  const ROWS = 30;

  // Le dessin visé : une tête de chat, testée cellule par cellule. Les cellules
  // qui tombent dedans deviennent l'image, les autres s'effacent — c'est ce
  // qu'on voit quand un modèle de diffusion débruite.
  const HEAD = { x: 150, y: 168, r: 76 };
  const EARS = [
    [[86, 118], [104, 46], [140, 96]],
    [[214, 118], [196, 46], [160, 96]]
  ];
  const EYES = [{ x: 122, y: 152, r: 13 }, { x: 178, y: 152, r: 13 }];
  const NOSE = [[150, 178], [140, 194], [160, 194]];

  const inCircle = (px, py, c) => (px - c.x) ** 2 + (py - c.y) ** 2 <= c.r ** 2;
  const inTriangle = (px, py, [[ax, ay], [bx, by], [cx, cy]]) => {
    const sign = (x1, y1, x2, y2, x3, y3) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
    const d1 = sign(px, py, ax, ay, bx, by);
    const d2 = sign(px, py, bx, by, cx, cy);
    const d3 = sign(px, py, cx, cy, ax, ay);
    const neg = d1 < 0 || d2 < 0 || d3 < 0;
    const pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  };

  const isShape = (px, py) => {
    if (EYES.some(eye => inCircle(px, py, eye))) return false;
    if (inTriangle(px, py, NOSE)) return false;
    return inCircle(px, py, HEAD) || EARS.some(ear => inTriangle(px, py, ear));
  };

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const px = col * CELL + CELL / 2;
      const py = row * CELL + CELL / 2;
      const shape = isShape(px, py);
      const cell = svgNode('rect', {
        class: `dif-cell${shape ? ' is-shape' : ''}`,
        x: col * CELL, y: row * CELL, width: CELL - 0.6, height: CELL - 0.6
      });
      // Chaque cellule part d'un grain aléatoire et se résout avec un léger
      // décalage : c'est ce qui donne l'impression de neige qui se dissipe.
      cell.style.setProperty('--grain', (0.12 + Math.random() * 0.6).toFixed(2));
      cell.style.animationDelay = `${Math.round(Math.random() * 700)}ms`;
      svg.appendChild(cell);
    }
  }
})();

/* ---------- Slide 16 · la convolution, pour de vrai ---------- */
(() => {
  const svg = document.getElementById('convo');
  if (!svg) return;

  // Une image 12x12 : un carré plein et un trait diagonal, pour que les
  // filtres ne répondent pas tous pareil.
  const SIZE = 12;
  const IMAGE = Array.from({ length: SIZE }, (_, row) =>
    Array.from({ length: SIZE }, (_, col) => {
      const carre = row >= 2 && row <= 7 && col >= 2 && col <= 6;
      const diagonale = Math.abs((row - 4) - (col - 6)) <= 0 && col >= 7;
      return carre || diagonale ? 1 : 0;
    })
  );

  // Trois filtres réels : bords verticaux, bords horizontaux, contours.
  const FILTERS = [
    { name: 'bords verticaux', k: [[1, 0, -1], [1, 0, -1], [1, 0, -1]], norm: 3,
      says: 'Il répond fort là où l’image change brusquement <b>de gauche à droite</b> : les bords verticaux ressortent.' },
    { name: 'bords horizontaux', k: [[1, 1, 1], [0, 0, 0], [-1, -1, -1]], norm: 3,
      says: 'Le même calcul, mais <b>de haut en bas</b> : cette fois ce sont les bords horizontaux qui s’allument.' },
    { name: 'contours', k: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]], norm: 4,
      says: 'Celui-ci réagit dès que le voisinage n’est pas uniforme : <b>tout le contour</b> apparaît, dans les deux sens.' }
  ];

  const OUT = SIZE - 2;
  const CELL = 17;
  const IN_X = 10;
  const OUT_X = 316;
  const TOP = 44;

  const kernelBox = document.getElementById('kernel');
  const kernelText = document.getElementById('kernel-text');
  const status = document.getElementById('convo-status');
  const runButton = document.getElementById('convo-run');
  const stepButton = document.getElementById('convo-step');
  const nextButton = document.getElementById('convo-next');

  let filter = 0;
  let cursor = 0;
  let timer = 0;

  svg.append(
    svgNode('text', { class: 'axis-title', x: IN_X, y: 30 }, 'L’IMAGE'),
    svgNode('text', { class: 'axis-title', x: OUT_X, y: 30 }, 'LA CARTE PRODUITE'),
    svgNode('path', { class: 'wire', d: `M${IN_X + SIZE * CELL + 16},${TOP + 100} H${OUT_X - 16}` })
  );

  const inCells = [];
  IMAGE.forEach((line, row) => {
    line.forEach((value, col) => {
      const cell = svgNode('rect', {
        class: `cv-in${value ? ' is-on' : ''}`,
        x: IN_X + col * CELL, y: TOP + row * CELL, width: CELL - 1.5, height: CELL - 1.5, rx: 2
      });
      svg.appendChild(cell);
      inCells.push(cell);
    });
  });

  const window3 = svgNode('rect', { class: 'cv-window', x: IN_X, y: TOP, width: CELL * 3 - 1.5, height: CELL * 3 - 1.5, rx: 3 });
  svg.appendChild(window3);

  const outCells = [];
  for (let row = 0; row < OUT; row += 1) {
    for (let col = 0; col < OUT; col += 1) {
      const cell = svgNode('rect', {
        class: 'cv-out', x: OUT_X + col * CELL, y: TOP + row * CELL,
        width: CELL - 1.5, height: CELL - 1.5, rx: 2, opacity: 0
      });
      svg.appendChild(cell);
      outCells.push(cell);
    }
  }

  function convolve(row, col) {
    const k = FILTERS[filter].k;
    let sum = 0;
    for (let dy = 0; dy < 3; dy += 1) {
      for (let dx = 0; dx < 3; dx += 1) sum += IMAGE[row + dy][col + dx] * k[dy][dx];
    }
    return sum / FILTERS[filter].norm;
  }

  function drawKernel() {
    kernelBox.textContent = '';
    FILTERS[filter].k.forEach(line => line.forEach(value => {
      const cell = document.createElement('span');
      cell.className = `kernel-cell${value > 0 ? ' is-plus' : value < 0 ? ' is-minus' : ''}`;
      cell.textContent = value;
      kernelBox.appendChild(cell);
    }));
    kernelText.textContent = `Filtre « ${FILTERS[filter].name} », neuf coefficients : ${FILTERS[filter].k.flat().join(', ')}.`;
  }

  function place(index) {
    const row = Math.floor(index / OUT);
    const col = index % OUT;
    window3.setAttribute('x', IN_X + col * CELL);
    window3.setAttribute('y', TOP + row * CELL);
    const value = convolve(row, col);
    const cell = outCells[index];
    cell.setAttribute('opacity', Math.min(1, Math.abs(value) * 1.15 + 0.06).toFixed(3));
    cell.classList.toggle('is-strong', Math.abs(value) > 0.5);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = 0;
    runButton.innerHTML = '<i class="fa-solid fa-bolt" aria-hidden="true"></i>Passer le filtre';
    runButton.classList.remove('is-running');
  }

  function step() {
    if (cursor >= OUT * OUT) { stop(); done(); return; }
    place(cursor);
    cursor += 1;
    status.classList.remove('is-good');
    status.innerHTML = `Position <b>${cursor}</b> sur ${OUT * OUT}. À chaque case, neuf multiplications et une addition.`;
  }

  function done() {
    status.classList.add('is-good');
    status.innerHTML = FILTERS[filter].says;
  }

  function reset() {
    stop();
    cursor = 0;
    outCells.forEach(cell => { cell.setAttribute('opacity', 0); cell.classList.remove('is-strong'); });
    window3.setAttribute('x', IN_X);
    window3.setAttribute('y', TOP);
    drawKernel();
    status.classList.remove('is-good');
    status.innerHTML = `Filtre « <b>${FILTERS[filter].name}</b> ». La carte est vide : lance le filtre.`;
  }

  runButton.addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (cursor >= OUT * OUT) reset();
    runButton.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i>Pause';
    runButton.classList.add('is-running');
    step();
    timer = setInterval(step, 34);
  });
  stepButton.addEventListener('click', () => { stop(); step(); if (cursor >= OUT * OUT) done(); });
  nextButton.addEventListener('click', () => { filter = (filter + 1) % FILTERS.length; reset(); });
  document.addEventListener('presentation:build', event => {
    if (event.detail.slide !== svg.closest('.slide')) stop();
  });
  reset();
})();

/* ---------- Slide 22 · la chaîne d'un modèle d'images ---------- */
(() => {
  const svg = document.getElementById('sd-chain');
  if (!svg) return;

  // Quatre pièces alignées. Le petit tableau au centre est l'espace latent : il
  // se débruite pendant que l'image finale, à droite, se révèle avec lui — la
  // taille des deux grilles porte le propos.
  const box = (x, y, w, h, title, sub) => {
    const group = svgNode('g');
    group.append(
      svgNode('rect', { class: 'sd-box', x, y, width: w, height: h, rx: 12 }),
      svgNode('text', { class: 'sd-title', x: x + w / 2, y: y + 26, 'text-anchor': 'middle' }, title)
    );
    if (sub) group.appendChild(svgNode('text', { class: 'sd-sub', x: x + w / 2, y: y + 46, 'text-anchor': 'middle' }, sub));
    return group;
  };

  const arrow = (x1, x2, y) => {
    const group = svgNode('g');
    group.append(
      svgNode('path', { class: 'sd-arrow', d: `M${x1},${y} H${x2 - 12}` }),
      svgNode('path', { class: 'sd-head', d: `M${x2},${y} l-12,-6 v12 z` })
    );
    return group;
  };

  // 1 · la phrase
  svg.append(
    box(14, 84, 176, 66, 'Ta phrase', null),
    svgNode('text', { class: 'sd-quote', x: 102, y: 128, 'text-anchor': 'middle' }, '« un chat roux »'),
    svgNode('text', { class: 'sd-step', x: 102, y: 72 }, '1'),
    arrow(196, 236, 117)
  );

  // 2 · l'encodeur et les nombres qu'il produit
  svg.append(box(238, 84, 168, 66, 'Encodeur', 'la phrase en nombres'), svgNode('text', { class: 'sd-step', x: 322, y: 72 }, '2'));
  [0, 1, 2, 3, 4, 5].forEach(index => {
    const chip = svgNode('rect', { class: 'sd-num', x: 252 + index * 24, y: 158, width: 19, height: 15, rx: 3 });
    chip.style.animationDelay = `${index * 90}ms`;
    svg.appendChild(chip);
  });
  svg.append(
    arrow(412, 452, 117),
    // La phrase oriente chaque étape du débruitage : c'est le guidage.
    svgNode('path', { class: 'sd-guide', d: 'M322,178 C322,214 470,214 528,196' }),
    svgNode('path', { class: 'sd-head is-guide', d: 'M534,190 l-4,13 -9,-8 z' }),
    svgNode('text', { class: 'sd-guide-label', x: 404, y: 228, 'text-anchor': 'middle' }, 'ELLE ORIENTE CHAQUE ÉTAPE')
  );

  // 3 · l'espace latent, petit, où tout le calcul se fait
  const LAT = { x: 470, y: 60, cell: 14, n: 8 };
  svg.append(
    svgNode('text', { class: 'sd-title', x: LAT.x + 56, y: 44, 'text-anchor': 'middle' }, 'Espace latent'),
    svgNode('text', { class: 'sd-sub', x: LAT.x + 56, y: 190, 'text-anchor': 'middle' }, '64 cases'),
    svgNode('text', { class: 'sd-step', x: LAT.x + 56, y: 26 }, '3')
  );
  const latentShape = (row, col) => {
    const cx = col - 3.5;
    const cy = row - 4;
    return cx * cx + cy * cy < 8.2 || (row < 3 && Math.abs(cx) > 1.6 && Math.abs(cx) < 3.4);
  };
  for (let row = 0; row < LAT.n; row += 1) {
    for (let col = 0; col < LAT.n; col += 1) {
      const cell = svgNode('rect', {
        class: `sd-lat${latentShape(row, col) ? ' is-shape' : ''}`,
        x: LAT.x + col * LAT.cell, y: LAT.y + row * LAT.cell,
        width: LAT.cell - 1.5, height: LAT.cell - 1.5, rx: 2
      });
      cell.style.setProperty('--grain', (0.14 + Math.random() * 0.55).toFixed(2));
      cell.style.animationDelay = `${Math.round(Math.random() * 420)}ms`;
      svg.appendChild(cell);
    }
  }

  // 4 · le décodeur et l'image, bien plus grande
  svg.append(arrow(596, 636, 117), box(638, 84, 150, 66, 'Décodeur', 'il déplie en pixels'), svgNode('text', { class: 'sd-step', x: 713, y: 72 }, '4'), arrow(794, 834, 117));

  const IMG = { x: 840, y: 34, cell: 10, n: 18 };
  svg.append(
    svgNode('text', { class: 'sd-title', x: IMG.x + 90, y: 24, 'text-anchor': 'middle' }, 'L’image'),
    svgNode('text', { class: 'sd-sub', x: IMG.x + 90, y: 232, 'text-anchor': 'middle' }, 'des millions de pixels')
  );
  const imageShape = (row, col) => {
    const cx = col - 8.5;
    const cy = row - 10;
    if (cx * cx / 42 + cy * cy / 34 > 1.6) {
      return row < 6 && Math.abs(cx) > 3.4 && Math.abs(cx) < 7 && (Math.abs(cx) - 3.4) * 1.6 > (5 - row);
    }
    const eye = (Math.abs(Math.abs(cx) - 3.4) < 1.4 && Math.abs(cy + 1.6) < 1.4);
    const nose = Math.abs(cx) < 1.2 && Math.abs(cy - 2) < 1.4;
    return !(eye || nose);
  };
  for (let row = 0; row < IMG.n; row += 1) {
    for (let col = 0; col < IMG.n; col += 1) {
      const cell = svgNode('rect', {
        class: `sd-pix${imageShape(row, col) ? ' is-shape' : ''}`,
        x: IMG.x + col * IMG.cell, y: IMG.y + row * IMG.cell,
        width: IMG.cell - 1, height: IMG.cell - 1, rx: 1.5
      });
      cell.style.setProperty('--grain', (0.1 + Math.random() * 0.5).toFixed(2));
      cell.style.animationDelay = `${Math.round(Math.random() * 500)}ms`;
      svg.appendChild(cell);
    }
  }
})();

document.dispatchEvent(new Event('presentation:refresh'));
