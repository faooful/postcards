import { renderArtwork } from './artwork';
import { postmark } from './postmark';
import { seedHash } from './doodle-theme';

const palettes = [
  ['#e5ebdf', '#465b43'], ['#e3eaf0', '#40596e'], ['#f0e2df', '#79514f'],
  ['#f3edcf', '#6d6033'], ['#eae4ef', '#645471'], ['#f1eade', '#6c5943'],
];
let observer: IntersectionObserver | undefined;
const visible = new Set<HTMLElement>();
function updateMotion() {
  for (const stamp of visible) {
    if (!stamp.isConnected) { visible.delete(stamp); observer?.unobserve(stamp); continue; }
    stamp.classList.toggle('is-moving', !document.hidden);
  }
}
document.addEventListener('visibilitychange', updateMotion);
export function disposeStamps(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('.postcard-stamp').forEach(stamp => { observer?.unobserve(stamp); visible.delete(stamp); });
}
export function createStamp(card: {artwork?: string; id: string; title: string; sender: string; body: string}, interactive = false) {
  const stamp = document.createElement('div');
  stamp.className = 'postcard-stamp';
  const seed = seedHash(card.id);
  stamp.style.setProperty('--stamp-angle', `${(seedHash(card.id + ':paper-angle') % 601 - 300) / 100}deg`);
  stamp.style.setProperty('--stamp-skew', `${(seedHash(card.id + ':paper-skew') % 161 - 80) / 100}deg`);
  stamp.style.setProperty('--postmark-x', String(seedHash(card.id + ':postmark-x') % 1001 / 1000));
  stamp.style.setProperty('--postmark-y', String(seedHash(card.id + ':postmark-y') % 1001 / 1000));
  stamp.style.setProperty('--postmark-angle', `${seedHash(card.id + ':postmark-angle') % 25 - 12}deg`);
  const [paper, ink] = palettes[seed % palettes.length];
  stamp.style.setProperty('--stamp-paper', paper);
  stamp.style.setProperty('--stamp-ink', ink);
  stamp.style.setProperty('--scene-duration', `${5 + seed % 2001 / 1000}s`);
  stamp.style.setProperty('--scene-delay', `-${seed % 5000 / 1000}s`);
  if (interactive) { stamp.tabIndex = 0; stamp.setAttribute('role', 'img'); stamp.setAttribute('aria-label', `${card.title} — ${card.sender} postage stamp`); }
  else stamp.setAttribute('aria-hidden', 'true');
  const drawing = renderArtwork(card);
  drawing.setAttribute('aria-hidden', 'true');
  stamp.append(drawing, postmark(card.sender));
  let hoverBounds: DOMRect | undefined;
  const reset = () => {
    hoverBounds = undefined;
    stamp.classList.remove('is-tilting');
    stamp.style.removeProperty('--tilt-x'); stamp.style.removeProperty('--tilt-y');
  };
  stamp.addEventListener('pointerenter', () => { hoverBounds = stamp.getBoundingClientRect(); });
  stamp.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) { reset(); return; }
    // Use the entry bounds so the transform cannot feed back into mouse coordinates.
    const rect = hoverBounds ??= stamp.getBoundingClientRect();
    const angle = (value: number) => Math.max(-10, Math.min(10, value));
    stamp.classList.add('is-tilting');
    stamp.style.setProperty('--tilt-x', `${angle((.5 - (event.clientY-rect.top)/rect.height)*20)}deg`);
    stamp.style.setProperty('--tilt-y', `${angle(((event.clientX-rect.left)/rect.width-.5)*20)}deg`);
  });
  stamp.addEventListener('pointerleave', reset);
  stamp.addEventListener('pointercancel', reset);
  stamp.addEventListener('blur', reset);
  observer ??= new IntersectionObserver(entries => {
    for (const entry of entries) {
      const target = entry.target as HTMLElement;
      if (entry.isIntersecting) visible.add(target); else { visible.delete(target); target.classList.remove('is-moving'); }
    }
    updateMotion();
  });
  observer.observe(stamp);
  return stamp;
}
