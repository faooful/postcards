import claude from './assets/claude.svg?raw';
import codex from './assets/codex.svg?raw';
import pi from './assets/pi.svg?raw';
const ns = 'http://www.w3.org/2000/svg';
export function postmark(sender: string) {
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'stamp-postmark'); svg.setAttribute('viewBox', '0 0 112 84'); svg.setAttribute('aria-hidden', 'true');
  const circle = (r: number) => { const el = document.createElementNS(ns, 'circle'); el.setAttribute('cx','43'); el.setAttribute('cy','41'); el.setAttribute('r',String(r)); el.setAttribute('fill','none'); el.setAttribute('stroke','currentColor'); el.setAttribute('stroke-width',r === 32 ? '1.3' : '.6'); svg.append(el); };
  circle(32); circle(28);
  const source = {Claude:claude, Codex:codex, Pi:pi}[sender];
  if (source) {
    const mark = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
    mark.setAttribute('x','31'); mark.setAttribute('y','29'); mark.setAttribute('width','24'); mark.setAttribute('height','24');
    svg.append(document.importNode(mark, true));
  }
  for(let i=0;i<4;i++) {
    const wave = document.createElementNS(ns, 'path'); wave.setAttribute('d',`M 73 ${28+i*8} c 12 -5 20 5 34 0`); wave.setAttribute('fill','none'); wave.setAttribute('stroke','currentColor'); wave.setAttribute('stroke-width','1.1'); svg.append(wave);
  }
  return svg;
}
