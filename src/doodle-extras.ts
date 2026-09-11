type Pen = (d: string, faint?: boolean) => void;
export function drawExtra(theme: string, path: Pen, random: () => number): boolean {
  const n = (low: number, high: number) => +(low + random() * (high - low)).toFixed(2);
  const oval = (x: number, y: number, rx: number, ry: number) => path(`M ${x-rx} ${y} a ${rx} ${ry} 0 1 0 ${rx*2} 0 a ${rx} ${ry} 0 1 0 ${-rx*2} 0`);
  switch (theme) {
    case 'tree': {
      const crown = n(22,34), x=n(76,90);
      path(`M ${x-4} 109 L ${x-2} 66 M ${x+5} 109 L ${x+3} 61 M ${x} 84 l -14 -13 M ${x+2} 76 l 12 -13`);
      if(random()<.5) path(`M ${x} 20 l ${crown} 34 l -12 0 l 20 26 Q ${x} 92 ${x-crown-8} 80 l 18 -26 l -12 0 Z`);
      else path(`M ${x-20} 81 C ${x-crown-24} 76 ${x-crown-12} 49 ${x-22} 47 C ${x-27} 17 ${x+12} 11 ${x+20} 36 C ${x+49} 28 ${x+53} 64 ${x+32} 67 C ${x+35} 86 ${x+10} 93 ${x+5} 79`);
      path(`M ${x-26} 114 Q ${x} 109 ${x+30} 114`,true); break;
    }
    case 'mushroom': {
      const w=n(28,42), h=n(30,49);
      path(`M ${85-w} 69 Q 83 ${69-h} ${85+w} 69 Q 85 82 ${85-w} 69 Z M 78 77 Q 79 92 71 109 Q 85 116 99 108 Q 91 92 93 76`);
      for(let i=0;i<4;i++) oval(n(68,101),n(54,66),n(2,4),n(2,3));
      path('M 50 112 l -3 -7 M 54 113 l 4 -10 M 112 110 l 4 -6',true); break;
    }
    case 'mountain': {
      const peak=n(24,40);
      path(`M 31 106 L 76 ${peak} L 126 105 M 94 58 L 114 37 L 151 106 M 59 58 l 12 7 l 7 -11 l 10 9 l 5 -4 M 47 106 Q 86 103 139 108`);
      oval(n(116,137),n(20,28),n(6,10),n(6,10)); break;
    }
    case 'moon': {
      const x=n(72,90), r=n(28,37);
      path(`M ${x+10} ${65-r} C ${x-r-26} ${56-r} ${x-r-21} ${78+r} ${x+15} ${65+r} C ${x-19} ${65+r-2} ${x-29} ${65-r+8} ${x+10} ${65-r} Z`);
      for(let i=0;i<3;i++){const sx=n(113,145),sy=n(27,101);path(`M ${sx-3} ${sy} h 6 M ${sx} ${sy-4} v 8`,true);} break;
    }
    case 'umbrella': {
      const top=n(23,37), w=n(32,44);
      path(`M ${85-w} 66 Q 84 ${top-26} ${85+w} 66 q -11 -9 -${w/2} 0 q -11 -9 -${w/2} 0 q -11 -9 -${w/2} 0 q -11 -9 -${w/2} 0 M 85 ${top} Q 65 45 ${85-w/2} 66 M 85 ${top} Q 104 46 ${85+w/2} 66 M 85 66 L 85 103 C 85 120 66 117 69 105`);
      for(let i=0;i<4;i++){const x=n(37,140);path(`M ${x} ${n(77,91)} l -2 7`,true);} break;
    }
    case 'balloon': {
      const x=n(75,95),rx=n(20,30),ry=n(26,34);
      oval(x,48,rx,ry);path(`M ${x-3} ${48+ry} l -3 6 l 12 0 l -5 -6 M ${x} ${54+ry} C ${x-20} 100 ${x+20} 102 ${x-4} 122`);
      if(random()<.5) path(`M ${x-4} ${22} Q ${x-20} 46 ${x-5} ${48+ry}`,true);
      else path(`M ${x-rx+5} 43 Q ${x} 53 ${x+rx-5} 43`,true); break;
    }
    case 'book': {
      const left=n(34,45),top=n(35,47);
      path(`M 85 50 Q 62 ${top-9} ${left} ${top} L ${left} 99 Q 66 91 85 105 Q 106 92 133 100 L 133 ${top} Q 109 ${top-8} 85 50 L 85 105 M ${left-5} ${top+6} L ${left-5} 106 Q 62 99 85 112 Q 112 102 139 108 L 139 ${top+6}`);
      for(let i=0;i<3;i++)path(`M 49 ${57+i*11} q 14 -2 26 4 M 96 ${60+i*11} q 14 -5 26 -4`,true);
      path(`M ${n(106,117)} 43 v 28 l -4 -4 l -4 4 v -27`);break;
    }
    case 'key': {
      const x=n(53,66),y=n(46,57),r=n(15,21);
      oval(x,y,r,r);oval(x,y,r*.38,r*.38);
      path(`M ${x+12} ${y+13} L 117 106 L 126 97 L 119 90 L 114 95 L 108 89 L 114 83 L ${x+17} ${y+7}`);break;
    }
    case 'clock': {
      const r=n(28,35);oval(86,65,r,r);
      const hand=n(66,105);path(`M 86 42 L 86 65 L ${hand} 76 M 86 ${65-r+5} v 4 M 86 ${65+r-5} v -4 M ${86-r+5} 65 h 4 M ${86+r-5} 65 h -4 M 66 96 l -7 12 M 107 94 l 8 12`);
      path('M 59 36 Q 44 29 57 21 Q 68 17 73 26 M 99 25 Q 111 13 120 26 Q 126 35 113 37 M 81 24 h 10');break;
    }
    case 'bicycle': {
      const r=n(18,23);oval(49,87,r,r);oval(129,87,r,r);
      path('M 49 87 L 69 52 L 91 87 Z M 69 52 L 117 52 L 91 87 M 129 87 L 115 40 L 125 35 M 69 52 L 65 42 M 58 42 h 17 M 87 87 l 9 4 l 7 0');
      if(random()<.5)path('M 117 48 l 20 -3 l -1 16 l -15 2 Z');break;
    }
    case 'cat': {
      const tail=n(126,146);
      path(`M 65 105 Q 55 90 67 67 L 63 38 L 77 48 Q 89 44 98 49 L 112 38 L 108 68 Q 122 91 110 105 Z M 110 104 C ${tail} 117 ${tail+10} 74 ${tail-5} 81 C ${tail-15} 85 ${tail-10} 100 112 94`);
      path('M 76 61 l 3 0 M 96 61 l 3 0 M 85 70 l 5 0 l -2 3 Z M 65 71 l -16 -3 M 66 76 l -17 3 M 106 71 l 14 -3 M 106 76 l 14 3 M 81 88 l -1 16 M 95 88 l 1 16');break;
    }
    case 'fish': {
      const h=n(18,29);
      path(`M 46 67 Q 76 ${67-h-17} 113 62 L 137 44 L 134 87 L 113 72 Q 73 ${67+h+13} 46 67 Z M 68 51 Q 79 68 67 84 M 81 51 l 9 -15 l 13 17 M 82 83 l 14 11 l 3 -13`);
      oval(60,64,1.5,1.5);oval(33,48,n(3,5),n(3,5));oval(40,30,3,3);break;
    }
    default: return false;
  }
  return true;
}
