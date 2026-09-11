import type { DoodleTheme } from './doodle-theme';
// Indices refer to the renderer's ordered pen strokes, not arbitrary DOM selectors.
export function animateDoodle(group: SVGGElement, theme: DoodleTheme, originalLighthouse: boolean) {
  const paths = Array.from(group.children) as SVGPathElement[];
  const last = paths.length - 1;
  const selected: Record<DoodleTheme, number[]> = {
    bird: [0,1,2], flower: paths.map((_,i)=>i).filter(i=>i<last-1), kite: [0,1], teacup: paths.map((_,i)=>i).filter(i=>i>=3),
    lighthouse: originalLighthouse ? [9,10,11] : [3], door: [6], lantern: [6], pier: [8,9,10],
    tree: [1], mushroom: [1,2,3,4], mountain: [1], moon: [1,2,3], umbrella: [1,2,3,4],
    balloon: [0,1,2], book: [4], key: [1], clock: [1], bicycle: [0,1], cat: [0], fish: [2,3],
  };
  const kind: Record<DoodleTheme, string> = {
    bird:'bob', flower:'sway', kite:'sway', teacup:'rise', lighthouse:'wave', door:'glow', lantern:'flame', pier:'wave',
    tree:'sway', mushroom:'glow', mountain:'glow', moon:'glow', umbrella:'rain', balloon:'bob', book:'sway', key:'glow',
    clock:'tick', bicycle:'wheel', cat:'tail', fish:'rise',
  };
  // Connected strokes share a pivot so petals, kite strings and balloon knots
  // stay attached while the scene changes pose.
  const connected = ['bird', 'flower', 'kite', 'balloon'].includes(theme);
  let sharedMotion: SVGGElement | undefined;
  for (const index of selected[theme]) {
    let path = paths[index];
    if (!path) continue;
    // Isolate the clock hands from its dial, and the cat's tail from its body.
    if (theme === 'clock' || theme === 'cat') {
      const parts = (path.getAttribute('d') || '').split(/(?=M )/).filter(Boolean);
      const moving = parts.splice(theme === 'clock' ? 0 : 1, 1)[0];
      const detail = path.cloneNode() as SVGPathElement;
      detail.setAttribute('d', moving);
      path.setAttribute('d', parts.join(' '));
      path.after(detail); path = detail;
    }
    if (connected && sharedMotion) { sharedMotion.append(path); continue; }
    const motion = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    if (connected) sharedMotion = motion;
    motion.setAttribute('class', `scene-motion motion-${kind[theme]}`);
    if (theme === 'clock') motion.style.transformOrigin = '86px 65px';
    if (theme === 'cat') motion.style.transformOrigin = '110px 104px';
    path.before(motion); motion.append(path);
    if (theme === 'bicycle') {
      // A spoke makes the otherwise circular wheel's small rotation perceptible.
      const spoke = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const x = index === 0 ? 49 : 129;
      spoke.setAttribute('d', `M ${x-12} 87 h 24 M ${x} 75 v 24`);
      spoke.setAttribute('opacity', '.4'); spoke.setAttribute('stroke-width', '1');
      motion.append(spoke); motion.style.transformOrigin = `${x}px 87px`;
    }
  }
}
