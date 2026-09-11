import './style.css';
import { createStamp, disposeStamps } from './stamp';
import { parsePostcard, inlineTokens } from '../scripts/postcard.mjs';

const sources = import.meta.glob('../postcards/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const cards: { id: string; title: string; date: string; sender: string; created: string; reference: string; body: string }[] = [];
let invalid = 0;
for (const [path, source] of Object.entries(sources)) {
  try {
    cards.push({ ...parsePostcard(source), id: path.split('/').pop()!.replace(/\.md$/, '') });
  } catch { invalid++; }
}
cards.sort((a, b) => (b.created || b.date).localeCompare(a.created || a.date) || b.id.localeCompare(a.id));
const index = document.querySelector<HTMLOListElement>('#index')!;
const letter = document.querySelector<HTMLElement>('#letter')!;
const grid = document.querySelector<HTMLElement>('#drawing-grid')!;
const reading = document.querySelector<HTMLElement>('.reading-layout')!;
const listButton = document.querySelector<HTMLButtonElement>('#list-view')!;
const gridButton = document.querySelector<HTMLButtonElement>('#grid-view')!;
const introductionButton = document.querySelector<HTMLButtonElement>('#toggle-introduction')!;
const introduction = document.querySelector<HTMLElement>('#introduction')!;
const collection = document.querySelector<HTMLElement>('.collection')!;
function setIntroductionVisible(visible: boolean) {
  introduction.hidden = !visible;
  collection.classList.toggle('introduction-hidden', !visible);
  introductionButton.setAttribute('aria-expanded', String(visible));
  const label = visible ? 'Hide introduction' : 'Show introduction';
  introductionButton.setAttribute('aria-label', label);
  introductionButton.title = label;
  introductionButton.textContent = visible ? 'Hide intro' : 'Show intro';
}
try { setIntroductionVisible(localStorage.getItem('postcards:introduction-hidden') !== 'true'); } catch { /* Storage is optional. */ }
let introductionAnimating = false;
introductionButton.addEventListener('click', async () => {
  if (introductionAnimating) return;
  const visible = introduction.hidden;
  const persist = () => { try { localStorage.setItem('postcards:introduction-hidden', String(!visible)); } catch { /* Optional preference. */ } };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setIntroductionVisible(visible); persist(); return; }
  introductionAnimating = true;
  introductionButton.setAttribute('aria-busy', 'true');
  const animations: Animation[] = [];
  const animate = (element: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions) => {
    const animation = element.animate(frames, options); animations.push(animation); return animation.finished.catch(() => {});
  };
  try {
    // Only the introduction fades; correspondence stays visible as it moves.
    await Promise.all([
      ...(!visible ? [animate(introduction, [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(-20px)' }], { duration: 160, fill: 'forwards', easing: 'ease-in' })] : []),
    ]);
    const correspondence = document.querySelector<HTMLElement>('.correspondence')!;
    const before = correspondence.getBoundingClientRect();
    setIntroductionVisible(visible);
    const after = correspondence.getBoundingClientRect();
    await Promise.all([
      animate(correspondence, [{ transform: `translate(${before.x-after.x}px, ${before.y-after.y}px)` }, { transform: 'translate(0, 0)' }], { duration: 280, easing: 'cubic-bezier(.22, 1, .36, 1)' }),
      ...(visible ? [animate(introduction, [{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 240, easing: 'ease-out' })] : []),
    ]);
    persist();
  } finally {
    animations.forEach(animation => animation.cancel());
    introductionAnimating = false;
    introductionButton.removeAttribute('aria-busy');
  }
});

let lastCard = cards[0]?.id || '';
let focusSelectedPostcard = false;
listButton.addEventListener('click', () => { location.hash = lastCard; });
gridButton.addEventListener('click', () => { location.hash = 'grid'; });
for (const card of cards) {
  const tile = document.createElement('a');
  tile.href = `#grid/${card.id}`;
  tile.className = 'drawing-tile';
  tile.setAttribute('aria-label', `${card.title} — ${card.sender}`);
  tile.title = card.title;
  tile.append(createStamp(card));

  grid.append(tile);
}
if (!cards.length) grid.textContent = 'No postcards yet. Something will arrive along the way.';
document.querySelector<HTMLAnchorElement>('.skip-link')!.addEventListener('click', event => {
  event.preventDefault();
  (location.hash === '#grid' ? grid : letter).focus();
});
document.querySelector('#count')!.textContent = cards.length ? `(${cards.length})` : '';
document.querySelector('#grid-count')!.textContent = cards.length ? `(${cards.length})` : '';
const formatDate = (date: string) => new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
for (const card of cards) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = `#${card.id}`;
  link.dataset.id = card.id;
  const title = document.createElement('span');
  title.textContent = card.title;
  const metadata = document.createElement('span');
  metadata.className = 'metadata';
  metadata.textContent = `${card.sender} · ${formatDate(card.date)}`;
  link.append(title, metadata);
  if (card.reference) {
    const reference = document.createElement('span');
    reference.className = 'metadata';
    reference.textContent = card.reference;
    link.append(reference);
  }
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (matchMedia('(max-width: 640px)').matches) {
      if (link.hash === location.hash) { letter.focus({ preventScroll: true }); letter.scrollIntoView({ block: 'start' }); }
      else focusSelectedPostcard = true;
    }
  });
  item.append(link);
  index.append(item);
}
function render() {
  const route = location.hash.slice(1);
  const gridDetail = route.startsWith('grid/');
  const id = gridDetail ? route.slice(5) : route;
  const isGrid = route === 'grid';
  const gridMode = isGrid || gridDetail;
  reading.classList.toggle('grid-detail', gridDetail);
  document.querySelector<HTMLElement>('.archive')!.hidden = gridDetail;
  grid.hidden = !isGrid;
  const gridHeader = document.querySelector<HTMLElement>('#grid-header')!;
  gridHeader.hidden = !gridMode;
  const viewSwitch = document.querySelector<HTMLElement>('.view-switch')!;
  const destination = gridMode ? gridHeader : document.querySelector<HTMLElement>('.archive')!;
  if (viewSwitch.parentElement !== destination) {
    const focused = document.activeElement;
    destination.querySelector('h2')!.after(viewSwitch);
    if (focused === listButton || focused === gridButton || focused === introductionButton) (focused as HTMLElement).focus({ preventScroll: true });
  }
  reading.hidden = isGrid;
  listButton.setAttribute('aria-pressed', String(!gridMode));
  gridButton.setAttribute('aria-pressed', String(gridMode));
  if (isGrid) { document.title = 'Postcards — Grid'; return; }
  const card = id ? cards.find(c => c.id === id) : cards[0];
  if (card) lastCard = card.id;
  disposeStamps(letter);
  letter.replaceChildren();
  letter.scrollTop = 0;

  document.querySelectorAll<HTMLAnchorElement>('#index a').forEach(a => {
    if (a.dataset.id === card?.id) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
  if (!card) {
    const message = document.createElement('p');
    message.textContent = cards.length ? 'This postcard isn’t in the collection.' : 'No postcards yet. Something will arrive along the way.';
    letter.append(message);
    if (cards.length) {
      const home = document.createElement('a'); home.href = '#'; home.textContent = 'Read the latest postcard'; letter.append(home);
    }
    document.title = 'Postcards';
    return;
  }
  document.title = `${card.title} — Postcards`;
  const date = document.createElement('p'); date.className = 'dateline';
  date.textContent = [formatDate(card.date), card.reference].filter(Boolean).join(' · ');
  const heading = document.createElement('h2'); heading.textContent = card.title;
  const stamp = createStamp(card, true);
  letter.append(stamp, heading, date);
  for (const paragraph of card.body.split(/\n\s*\n/)) {
    const p = document.createElement('p');
    for (const token of inlineTokens(paragraph.replace(/\n/g, ' '))) {
      if (token.type === 'text') p.append(document.createTextNode(token.text));
      else { const emphasis = document.createElement(token.type); emphasis.textContent = token.text; p.append(emphasis); }
    }
    letter.append(p);
  }
  const signature = document.createElement('p'); signature.className = 'signature'; signature.textContent = `Yours, ${card.sender}`; letter.append(signature);
  if (gridDetail) {
    const back = document.createElement('a');
    back.href = '#grid'; back.className = 'back-to-grid'; back.textContent = 'Back to correspondence';
    letter.append(back);
  }
}
if (invalid && import.meta.env.DEV) {
  const notice = document.createElement('p'); notice.className = 'validation-notice'; notice.textContent = `${invalid} invalid postcard file(s) hidden. Run npm run validate.`; index.after(notice);
}
let renderedRoute = location.hash.slice(1);
let activeTransition: ViewTransition | undefined;
let routeGeneration = 0;
async function changeRoute() {
  const generation = ++routeGeneration;
  if (activeTransition) {
    activeTransition.skipTransition();
    await activeTransition.finished.catch(() => {});
    if (generation !== routeGeneration) return;
  }
  const next = location.hash.slice(1);
  const listChange = !renderedRoute.startsWith('grid') && !next.startsWith('grid') && renderedRoute !== next;
  const opening = renderedRoute === 'grid' && next.startsWith('grid/');
  const closing = renderedRoute.startsWith('grid/') && next === 'grid';
  const id = opening ? next.slice(5) : renderedRoute.slice(5);
  const tile = Array.from(grid.querySelectorAll<HTMLAnchorElement>('a')).find(link => link.hash === `#grid/${id}`);
  const gridStamp = tile?.querySelector<HTMLElement>('.postcard-stamp');
  const source = opening ? gridStamp : letter.querySelector<HTMLElement>('.postcard-stamp');
  renderedRoute = next;
  const update = () => {
    render();
    if (opening || focusSelectedPostcard) letter.focus({ preventScroll: true });
    if (closing) tile?.focus({ preventScroll: true });
    if ((opening || focusSelectedPostcard) && matchMedia('(max-width: 640px)').matches) letter.scrollIntoView({ block: 'start' });
    focusSelectedPostcard = false;
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (listChange && !reduced) {
    if (document.startViewTransition) {
      letter.style.setProperty('view-transition-name', 'list-correspondence');
      const transition = document.startViewTransition(update);
      activeTransition = transition;
      void transition.finished.catch(() => {}).finally(() => {
        letter.style.removeProperty('view-transition-name');
        if (activeTransition === transition) activeTransition = undefined;
      });
    } else {
      const fade = letter.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100, fill: 'forwards' });
      await fade.finished.catch(() => {});
      fade.cancel();
      if (generation !== routeGeneration) return;
      update();
      letter.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
    }
    return;
  }

  if (!(opening || closing) || !source || !gridStamp || reduced || !document.startViewTransition) {
    update();
    if (opening && !reduced) letter.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
    return;
  }
  const outgoing = opening ? grid : letter;
  const incoming = opening ? letter : grid;
  outgoing.style.setProperty('view-transition-name', 'correspondence');
  source.style.setProperty('view-transition-name', 'selected-stamp');
  let target: HTMLElement | null | undefined;
  const transition = document.startViewTransition(() => {
    update();
    source.style.removeProperty('view-transition-name');
    target = opening ? letter.querySelector<HTMLElement>('.postcard-stamp') : gridStamp;
    target?.style.setProperty('view-transition-name', 'selected-stamp');
    outgoing.style.removeProperty('view-transition-name');
    incoming.style.setProperty('view-transition-name', 'correspondence');
  });
  activeTransition = transition;
  void transition.finished.catch(() => {}).finally(() => {
    source.style.removeProperty('view-transition-name');
    target?.style.removeProperty('view-transition-name');
    outgoing.style.removeProperty('view-transition-name');
    incoming.style.removeProperty('view-transition-name');
    if (activeTransition === transition) activeTransition = undefined;
  });
}
window.addEventListener('hashchange', changeRoute);
render();
