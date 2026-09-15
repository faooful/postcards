import { renderArtwork } from './artwork';
import { postmark } from './postmark';
import { seedHash } from './doodle-theme';
import { attachStampTilt } from './stamp-tilt';

const palettes = [
  ['#e5ebdf', '#465b43'], ['#e3eaf0', '#40596e'], ['#f0e2df', '#79514f'],
  ['#f3edcf', '#6d6033'], ['#eae4ef', '#645471'], ['#f1eade', '#6c5943'],
];
let observer: IntersectionObserver | undefined;
const visible = new Set<HTMLElement>();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const cleanups = new WeakMap<HTMLElement, () => void>();
function updateMotion() {
  for (const stamp of visible) {
    if (!stamp.isConnected) { visible.delete(stamp); observer?.unobserve(stamp); continue; }
    stamp.classList.toggle('is-moving', !document.hidden && !reducedMotion.matches);
  }
}
document.addEventListener('visibilitychange', updateMotion);
reducedMotion.addEventListener('change', updateMotion);
export function disposeStamps(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('.postcard-stamp').forEach(stamp => { observer?.unobserve(stamp); visible.delete(stamp); cleanups.get(stamp)?.(); cleanups.delete(stamp); });
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
  // A small paint boundary keeps animated SVG strokes separate from the paper,
  // perforation mask and postmark. Only visible, moving drawings get a layer.
  const artwork = document.createElement('div');
  artwork.className = 'stamp-artwork';
  artwork.append(drawing);
  stamp.append(artwork, postmark(card.sender));
  cleanups.set(stamp, attachStampTilt(stamp, reducedMotion));
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
