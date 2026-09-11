import { animateDoodle } from './doodle-motion';
import { drawExtra } from './doodle-extras';
// Geometry varies with the postcard ID, never on reload.
import { seedHash, type DoodleTheme } from './doodle-theme';
export function postcardDoodle(seed: string, theme: DoodleTheme): SVGSVGElement {
  let state = seedHash(seed) || 1;
  const random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 180 130');
  svg.setAttribute('class', 'postcard-doodle');
  svg.setAttribute('role', 'img');
  const title = document.createElementNS(ns, 'title');
  title.textContent = { tree: 'An ink sketch of a tree', mushroom: 'An ink sketch of a mushroom', mountain: 'An ink sketch of a mountain', moon: 'An ink sketch of a moon', umbrella: 'An ink sketch of a umbrella', balloon: 'An ink sketch of a balloon', book: 'An ink sketch of a book', key: 'An ink sketch of a key', clock: 'An ink sketch of a clock', bicycle: 'An ink sketch of a bicycle', cat: 'An ink sketch of a cat', fish: 'An ink sketch of a fish',  bird: 'An ink sketch of a little bird', flower: 'An ink sketch of a flower', kite: 'An ink sketch of a kite in the breeze', teacup: 'An ink sketch of a steaming teacup', lighthouse: 'A little ink sketch of a lighthouse by the sea', door: 'A little ink sketch of an open door', lantern: 'A little ink sketch of a glowing lantern', pier: 'A little ink sketch of a sailboat beside a pier' }[theme];
  svg.append(title);
  const group = document.createElementNS(ns, 'g');
  group.setAttribute('fill', 'none');
  group.setAttribute('stroke', 'currentColor');
  group.setAttribute('stroke-linecap', 'round');
  group.setAttribute('stroke-linejoin', 'round');
  svg.append(group);
  const path = (d: string, faint = false) => {
    const line = document.createElementNS(ns, 'path');
    line.setAttribute('d', d);
    line.setAttribute('stroke-width', String(1.1 + random() * .5));
    line.setAttribute('opacity', faint ? '.45' : String(.72 + random() * .23));
    group.append(line);
  };
  const wobble = (n: number) => +(n + (random() - .5) * 2).toFixed(2);
  const lean = random() * 4 - 2;
  group.setAttribute('transform', `rotate(${lean} 90 80)`);
  const finish = () => { animateDoodle(group, theme, seed === '2026-09-11-2e8f9e6d-c805-4d12-aca9-9530e9d5a51c'); return svg; };
  if (drawExtra(theme, path, random)) return finish();
  if (theme === 'bird') {
    const round = 8 + random() * 12;
    path(`M 55 73 Q 68 ${94+round} 99 86 Q 114 77 104 60 Q 103 43 89 48 Q 80 48 79 64 L 52 58 L 60 72 Z`);
    path('M 105 58 L 116 63 L 106 67 M 96 56 l 1 0');
    path(`M 73 74 Q 86 ${89+random()*5} 96 72 M 80 94 L 78 106 M 91 94 L 93 105`);
    path('M 43 109 Q 81 102 127 108 M 114 106 Q 111 94 118 92 Q 125 98 118 105');
    return finish();
  }
  if (theme === 'flower') {
    const petals = 5 + Math.floor(random()*4);
    const radius = 12 + random()*6;
    const center = 76 + random()*15;
    for(let i=0;i<petals;i++) {
      const angle=i*Math.PI*2/petals;
      const x=center+Math.cos(angle)*radius, y=48+Math.sin(angle)*radius;
      path(`M ${center} 48 Q ${x+Math.sin(angle)*9} ${y-Math.cos(angle)*9} ${center+Math.cos(angle)*radius*1.6} ${48+Math.sin(angle)*radius*1.6} Q ${x-Math.sin(angle)*9} ${y+Math.cos(angle)*9} ${center} 48`);
    }
    path(`M ${center} 54 Q 78 84 86 109 M 83 91 Q 62 91 65 77 Q 78 78 83 91 M 83 82 Q 100 80 103 66 Q 86 66 83 82`);
    path('M 65 113 Q 84 109 105 113',true);
    return finish();
  }
  if (theme === 'kite') {
    const x=82+random()*10, width=23+random()*9;
    path(`M ${x} 18 L ${x+width} 46 L ${x+3} 79 L ${x-width} 45 Z M ${x} 18 L ${x+3} 79 M ${x-width} 45 L ${x+width} 46`);
    path(`M ${x+3} 79 C 117 99 64 97 75 117 M 90 91 l -8 -3 l 2 8 l 6 -5 l 7 5 l 0 -7 Z`);
    path('M 40 35 q 10 -4 18 -1 M 119 79 q 12 -4 23 -1',true);
    return finish();
  }
  if (theme === 'teacup') {
    const width=40+random()*15;
    path(`M 58 61 Q ${58+width/2} 55 ${58+width} 61 L ${54+width} 89 Q 83 104 63 89 Z`);
    path(`M ${58+width} 65 C ${83+width} 57 ${83+width} 87 ${55+width} 85 M 59 63 Q 82 68 ${57+width} 63`);
    path('M 47 101 Q 83 111 126 100 M 54 105 Q 87 118 119 105');
    for(let i=0;i<2+Math.floor(random()*2);i++) path(`M ${72+i*13} 48 q -8 -7 0 -14 q 6 -6 0 -12`,true);
    return finish();
  }
  // A distinct coastal composition for later lighthouse notes; retain the original sketch.
  if (theme === 'lighthouse' && seed !== '2026-09-11-2e8f9e6d-c805-4d12-aca9-9530e9d5a51c') {
    const height = 38+random()*16;
    path(`M 50 84 L 57 ${84-height} L 76 ${84-height} L 85 84 M 53 ${84-height} L 80 ${84-height} M 57 ${84-height-3} L 57 ${84-height-13} L 75 ${84-height-13} L 75 ${84-height-3} M 52 ${84-height-13} L 65 ${84-height-23} L 81 ${84-height-13} Z`);
    path(`M 64 ${84-height-12} L 64 ${84-height-4} M 59 84 L 60 73 Q 65 69 69 73 L 70 84 M 56 63 L 79 66`);
    path('M 32 88 Q 62 80 89 88 L 97 96 L 88 104 L 100 115 M 39 94 l 12 3 l -6 8 M 60 98 l 12 -3');
    path('M 108 105 q 7 -3 14 0 t 14 0 M 101 116 q 7 -3 14 0 t 14 0',true);
    path('M 111 40 q 4 -6 10 -1 q 5 -6 10 0');
    path(`M 87 ${84-height-7} L 128 ${84-height-14}`,true);
    return finish();
  }
  if (theme === 'door') {
    path(`M 58 104 Q ${wobble(59)} 68 58 30 Q 81 ${wobble(27)} 106 29 L 106 102`);
    path('M 63 100 L 64 35 L 100 34 L 101 101');
    path(`M 65 35 L ${wobble(88)} 46 L 87 111 L 64 100 Z`);
    path('M 69 44 L 82 51 L 82 69 L 69 64 Z M 69 73 L 81 77 L 81 98 L 69 93 Z');
    path('M 81 73 q 2 -2 2 1 q -1 2 -2 -1');
    path('M 51 105 Q 67 103 77 109 M 92 107 L 114 105');
    path('M 108 74 L 125 67 M 111 86 L 135 86 M 110 95 L 125 104', true);
    path(`M 40 108 Q ${wobble(38)} 98 35 96 M 40 108 Q 43 96 47 97`);
    return finish();
  }
  if (theme === 'lantern') {
    path(`M 73 35 C 63 ${wobble(12)} 99 10 96 35`);
    path('M 70 38 Q 84 33 100 38 L 105 44 Q 86 48 65 44 Z');
    path(`M 68 48 L ${wobble(72)} 98 Q 87 102 99 98 L 103 48`);
    path('M 75 51 L 78 94 M 96 51 L 94 94', true);
    path('M 68 101 Q 84 105 103 101 L 106 107 Q 88 111 65 107 Z');
    path('M 81 94 L 81 78 L 89 78 L 90 94 M 85 78 L 85 73');
    path(`M 85 72 C 75 68 86 61 ${wobble(86)} 56 C 93 66 92 72 85 72 Z`);
    path('M 55 59 L 44 54 M 53 77 L 36 78 M 57 95 L 47 102', true);
    path('M 114 58 L 124 51 M 117 76 L 135 73 M 112 93 L 124 102', true);
    path('M 61 117 Q 85 114 111 117', true);
    return finish();
  }
  if (theme === 'pier') {
    path(`M 35 83 Q 54 ${wobble(80)} 76 83 L 74 89 L 35 89`);
    path('M 42 89 L 43 108 M 47 90 L 47 104 M 66 89 L 67 106 M 70 90 L 71 103');
    path('M 43 81 L 44 69 M 68 81 L 68 66 M 44 71 Q 56 78 68 69');
    path(`M 85 87 Q 109 ${wobble(91)} 140 86 L 131 101 Q 110 105 96 100 Z`);
    path(`M 111 86 Q ${wobble(112)} 59 111 33 L 113 33`);
    path('M 107 42 Q 95 61 88 78 L 107 77 Z');
    path(`M 117 46 Q ${wobble(132)} 65 137 79 L 117 79 Z`);
    path('M 113 34 L 124 37 L 113 40');
    for (let i = 0; i < 3; i++) {
      const x = 49 + random() * 15 + i * 8;
      path(`M ${x} ${109+i*6} q 7 -3 14 0 t 14 0 m 8 0 q 7 -3 14 0 t 14 0`, i === 2);
    }
    path('M 53 42 q 5 -5 10 0 q 5 -6 10 -2');
    return finish();
  }
  // Tapered tower, lantern room, and a slightly crooked roof.
  path(`M 65 98 Q ${wobble(69)} 73 74 45 M 94 45 Q ${wobble(98)} 76 102 99`);
  path('M 70 45 Q 84 46 98 44 M 73 42 L 74 30 L 94 29 L 95 42');
  path(`M 70 30 Q 78 24 ${wobble(84)} 20 Q 91 25 98 29`);
  path('M 84 19 L 84 15 M 84 31 L 84 40');
  path('M 74 59 Q 85 64 96 62 M 71 75 Q 87 81 99 78');
  path('M 79 98 L 80 88 Q 86 84 89 88 L 90 98');
  path('M 58 101 Q 78 97 105 101 L 112 106');
  // Short light strokes, with lots of empty paper around them.
  path(`M 65 35 L ${wobble(51)} ${wobble(32)}`, true);
  path(`M 102 35 L ${wobble(119)} ${wobble(31)}`, true);
  for (let row = 0; row < 3; row++) {
    const y = 108 + row * 6;
    const start = 35 + random() * 16 + row * 7;
    path(`M ${start} ${y} q 8 -3 15 0 t 15 0 m 9 0 q 8 -3 15 0 t 15 0`, row === 2);
  }
  const birdX = 119 + random() * 13;
  path(`M ${birdX} 55 q 5 -5 10 0 q 5 -6 10 -2`);
  return finish();
}
