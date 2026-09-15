import { postcardDoodle } from './doodle';
import { chooseDoodleTheme, seedHash, type DoodleTheme } from './doodle-theme';
import { validArtwork } from '../scripts/artwork.mjs';

// Each silhouette is composed with named scenery and explicit moving details.
const subjects: Record<string,string> = {
 cat:'M60 91 L59 55 L70 66 Q86 59 99 65 L110 53 L110 95 Q88 113 60 91 M70 80 l4 0 M95 80 l4 0 M81 88 l5 3 l5 -3 M107 98 Q135 103 128 83',
 bird:'M56 78 Q55 107 93 99 Q116 84 108 64 Q93 48 83 69 L53 61 Z M109 68 l14 5 l-13 5 M98 66 h1 M74 80 q13 14 24 0 M77 100 v12 M91 100 v12',
 flower:'M89 66 C48 68 49 42 75 46 C62 13 100 13 99 43 C133 21 143 60 110 60 C131 90 90 95 89 66 M93 70 Q83 92 88 111 M88 94 Q61 94 68 80 Q84 82 88 94',
 tree:'M84 110 L82 67 M94 110 L91 58 M88 87 L69 72 M89 77 L108 64 M61 75 C33 54 52 34 71 43 C65 14 103 12 109 38 C139 35 143 68 119 72 Q107 90 94 74',
 mushroom:'M48 68 Q86 4 128 68 Q89 85 48 68 Z M78 78 L70 111 Q88 121 104 110 L94 78 M70 57 a4 3 0 1 0 8 0 a4 3 0 1 0 -8 0 M97 49 a5 4 0 1 0 10 0 a5 4 0 1 0 -10 0',
 mountain:'M37 108 L83 31 L129 108 M100 65 L119 43 L147 108 M70 54 l12 10 l9 -13 M48 109 H147',
 moon:'M103 26 C37 20 36 105 105 105 C63 84 63 43 103 26 Z',
 umbrella:'M39 65 Q85 -2 132 65 Q121 56 109 65 Q97 56 85 65 Q72 56 61 65 Q50 56 39 65 M85 28 Q65 40 61 65 M85 28 Q107 42 109 65 M85 65 V103 Q85 123 70 113 L69 103',
 teacup:'M49 60 H112 L107 91 Q83 110 55 91 Z M112 66 Q144 60 127 85 L110 89 M43 104 Q88 119 131 101',
 balloon:'M86 23 C41 20 44 76 77 88 L94 88 C127 68 126 24 86 23 Z M78 88 L72 110 H98 L94 88 M72 102 H98',
 book:'M36 38 Q60 28 86 43 Q114 28 140 38 L138 107 Q111 94 86 111 Q58 96 35 106 Z M86 43 V111 M47 51 Q62 47 75 55 M47 65 Q62 60 75 68 M100 55 l24 -5 M100 70 l24 -5',
 key:'M59 44 a20 20 0 1 0 0 40 a20 20 0 1 0 0 -40 M59 55 a9 9 0 1 0 0 18 a9 9 0 1 0 0 -18 M76 77 L121 112 L130 103 L119 94 L113 100 L107 94 L113 88 L82 65',
 clock:'M86 36 a34 34 0 1 0 0 68 a34 34 0 1 0 0 -68 M62 105 l-9 12 M109 105 l9 12 M55 37 Q44 16 68 23 M105 23 Q131 19 120 39 M85 44 V70 L67 83',
 bicycle:'M48 85 a24 24 0 1 0 0 48 a24 24 0 1 0 0 -48 M131 85 a24 24 0 1 0 0 48 a24 24 0 1 0 0 -48 M48 109 L70 64 L94 109 Z M70 64 H115 L94 109 M131 109 L112 52 L128 45 M58 60 H82',
 fish:'M49 76 Q84 39 116 76 Q87 109 49 76 L32 54 V97 Z M100 71 h1 M76 59 L84 47 L92 60 M75 79 q12 0 14 10',
 lighthouse:'M65 111 L73 47 H100 L112 111 M69 72 L104 78 M71 94 L108 100 M72 43 V29 H102 V44 M66 28 L87 12 L107 28 Z M82 111 V99 Q87 92 93 99 V111',
 door:'M53 112 V28 H120 V111 M61 109 V38 L105 52 V118 Z M70 53 L96 62 V81 L70 70 Z M72 82 L95 90 V106 L72 99 Z M99 86 h1',
 lantern:'M64 48 H112 L107 108 Q88 117 69 108 Z M64 44 Q88 27 112 44 M73 32 C58 0 118 0 104 32 M83 101 V80 H95 V101 M89 77 Q74 66 89 54 Q103 70 89 77',
 pier:'M43 93 Q90 105 138 91 L129 111 Q87 124 54 108 Z M89 88 V25 L129 84 Z M83 82 H49 L82 30 Z',
 kite:'M88 21 L118 59 L87 94 L55 59 Z M88 21 L87 94 M55 59 H118 M87 94 Q119 103 87 116 M91 100 l-11 3 l8 7 Z',
 snail:'M51 92 Q53 44 89 48 C122 50 119 96 88 94 C65 94 65 65 86 65 C101 65 102 85 89 84 M38 102 Q95 111 128 97 L130 83 M128 90 L119 74 M127 85 l8 -13 M35 104 H130',
 fox:'M55 84 Q71 65 97 80 L109 57 L120 75 L139 86 L116 97 L106 91 L100 112 H91 L88 94 L68 113 H59 L65 90 Q27 119 29 76 Q42 88 55 84 M117 84 h1',
 rabbit:'M73 73 C54 17 72 15 84 64 C85 15 103 22 93 70 Q120 76 109 96 L117 108 H89 Q64 120 51 104 Q45 86 67 82 M99 81 h1 M58 100 Q76 88 81 108',
 butterfly:'M88 59 C24 3 28 87 78 79 C26 122 87 130 88 79 C131 129 156 88 99 77 C154 51 130 7 89 60 M88 52 V92 M88 56 l-9 -12 M88 56 l9 -12',
 bee:'M55 76 C53 49 121 48 121 77 C119 104 56 104 55 76 Z M76 55 V98 M93 55 V98 M82 55 C51 17 100 24 90 53 C112 17 133 46 100 57 M115 71 h1 M56 77 L44 76',
 shell:'M89 109 L38 62 C32 27 61 25 67 40 C72 16 96 17 102 39 C121 18 145 48 130 70 Z M89 109 L67 40 M89 109 L102 39 M89 109 L42 57 M89 109 L128 60',
 bridge:'M27 79 Q87 21 151 79 V105 H131 Q90 50 47 105 H27 Z M35 73 V57 M55 58 V42 M77 49 V33 M100 49 V34 M124 59 V44 M146 75 V59 M28 57 Q90 13 153 60',
 windmill:'M65 116 L78 62 H99 L111 116 Z M83 115 V96 H94 V115 M89 58 L57 20 L45 31 L81 66 L57 100 L69 109 L99 70 L135 94 L142 80 L102 57 L127 22 L114 15 Z',
 telescope:'M42 65 L117 28 L128 47 L53 83 Z M45 65 L36 68 L43 87 L55 82 M90 63 L89 81 M89 81 L64 117 M89 81 L113 117 M89 81 V117 M113 25 L130 47',
 violin:'M89 56 Q57 38 66 72 Q79 78 65 86 Q54 111 87 115 Q119 108 106 85 Q96 80 109 70 Q115 42 93 55 L96 20 H86 Z M88 30 V102 M80 90 H98 M121 22 L126 118',
 suitcase:'M47 48 H131 V111 H47 Z M74 48 V35 Q89 28 106 35 V48 M59 48 V111 M118 48 V111 M78 78 H99 V86 H78 Z',
 fountain:'M44 80 Q88 95 133 80 L121 98 H102 L107 115 H70 L76 98 H58 Z M85 84 V57 M78 58 H99 M88 54 Q85 22 61 39 M88 54 Q91 19 117 39',
};
// Three scene settings per new subject; legacy subjects keep their original as slot zero.
export const settings: Record<string,string[]> = {
 cat:['windowsill','suitcase','pond'], bird:['branch','nest','letter'], flower:['pot','boots','window'], tree:['hill','swing','bench'],
 mushroom:['grass','terrarium','stump'], mountain:['horizon','window','map'], moon:['stars','basin','rooftops'], umbrella:['rain','boots','flowerbed'],
 teacup:['table','books','picnic'], balloon:['clouds','rooftops','basket'], book:['shelf','desk','picnic'], key:['table','ribbon','letter'],
 clock:['shelf','desk','station'], bicycle:['path','fence','picnic'], fish:['pond','bowl','reeds'], lighthouse:['shore','cliff','island'],
 door:['wall','steps','garden'], lantern:['table','hook','camp'], pier:['water','harbor','reeds'], kite:['clouds','fence','workbench'],
 snail:['leaf','pot','mushroom'],fox:['den','snow','stump'],rabbit:['burrow','flowerbed','basket'],butterfly:['flowerbed','window','jar'],
 bee:['hive','flowerbed','jar'],shell:['shore','jar','letter'],bridge:['water','village','reeds'],windmill:['field','village','hill'],
 telescope:['rooftops','desk','camp'],violin:['chair','case','window'],suitcase:['station','bench','bed'],fountain:['garden','village','courtyard'],
};
const ns='http://www.w3.org/2000/svg';
export function renderArtwork(card: {id:string;title:string;body:string;artwork?:string}) {
  if(!validArtwork(card.artwork)) return postcardDoodle(card.id,chooseDoodleTheme(card));
  const [,theme,slot]=card.artwork!.split('/');
  const legacy=['lighthouse','door','lantern','pier','bird','flower','kite','teacup','tree','mushroom','mountain','moon','umbrella','balloon','book','key','clock','bicycle','cat','fish'];
  if(slot==='0' && legacy.includes(theme)) return postcardDoodle(card.id,theme as DoodleTheme);
  return composeScene(card.id,theme,Number(slot));
}
export function composeScene(seed:string,theme:string,slot:number) {
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 180 130');svg.setAttribute('class','postcard-doodle');svg.setAttribute('role','img');
  const setting=settings[theme][slot];
  const title=document.createElementNS(ns,'title');title.textContent=`An ink scene of a ${theme} — ${setting}`;svg.append(title);
  const g=document.createElementNS(ns,'g');g.setAttribute('fill','none');g.setAttribute('stroke','currentColor');g.setAttribute('stroke-width','1.4');g.setAttribute('stroke-linecap','round');g.setAttribute('stroke-linejoin','round');svg.append(g);
  const pen=(d:string,parent:SVGElement=g,faint=false)=>{const p=document.createElementNS(ns,'path');p.setAttribute('d',d);p.setAttribute('opacity',faint?'.42':'.85');parent.append(p);};
  const scenery:Record<string,string>={
    windowsill:'M25 12 H155 V112 H25 Z M90 12 V45 M25 54 H155 M18 115 H161',window:'M28 12 H150 V112 H28 Z M90 12 V106 M28 55 H150',
    suitcase:'M36 78 L29 30 H126 L135 78 M31 80 H145 V119 H31 Z M76 111 H98',pond:'M22 104 Q88 83 159 105 Q134 126 31 116 M129 93 q-12 -10 2 -14 q17 4 -2 14',
    branch:'M20 112 Q81 99 158 83 M116 96 q-2 -20 14 -18 q9 12 -14 18',nest:'M39 97 Q89 135 145 96 M41 104 L131 116 M46 114 L140 100 M56 119 L123 95',letter:'M27 77 H151 V119 H27 Z M27 77 L88 103 L151 77',
    pot:'M44 91 H130 L119 123 H57 Z M39 86 H136 V94 H39 Z',boots:'M25 86 H46 V110 H62 V120 H25 Z M113 83 H134 V109 H151 V119 H113 Z',
    hill:'M15 120 Q65 65 170 115 M118 29 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0',swing:'M108 45 V101 M141 39 V101 M99 102 H149 V108 H99 Z',bench:'M32 89 H151 V104 H32 Z M41 104 V122 M143 104 V122 M32 73 H151 V81 H32 Z',
    grass:'M27 118 l-3 -16 l8 10 l3 -19 M135 117 l6 -20 l4 12 l10 -7',terrarium:'M34 116 V47 L89 11 L147 47 V116 Z M34 47 H147 M89 11 V44',stump:'M37 98 Q89 81 139 98 V122 H37 Z M45 103 Q90 94 131 104 M53 108 v12 M122 108 v12',
    horizon:'M16 119 Q78 106 163 119',map:'M20 37 L65 26 L112 38 L160 27 V115 L112 124 L65 113 L20 124 Z M65 26 V113 M112 38 V124',stars:'M31 30 h10 M36 25 v10 M133 24 h10 M138 19 v10',
    basin:'M30 89 H151 Q140 124 91 123 Q40 125 30 89 Z M26 88 H156',rooftops:'M15 107 L43 79 L69 107 V125 M107 109 L139 81 L168 109 M125 124 v-14 h17 v14',rain:'M25 74 l-3 9 M149 80 l-3 9 M43 104 l-3 9',
    flowerbed:'M20 123 Q83 113 160 123 M31 121 V101 m-6 -3 q6 -13 12 0 q-6 11 -12 0 M146 120 V100 m-6 -3 q6 -13 12 0 q-6 11 -12 0',
    table:'M20 104 H162 M36 104 V126 M147 104 V126',books:'M28 103 H142 V111 H28 Z M37 112 H154 V122 H37 Z',picnic:'M37 87 L141 87 L165 125 H16 Z M51 87 L40 124 M95 87 V124 M129 87 L141 124 M24 112 H155',
    clouds:'M22 45 q-9 -10 3 -14 q0 -15 15 -10 q10 -5 14 8 M123 54 q-8 -12 5 -12 q7 -18 19 -6 q18 0 10 12',basket:'M42 93 H132 L124 124 H51 Z M54 93 Q83 63 121 93 M66 98 v22 M87 98 v22 M110 98 v22',
    shelf:'M22 112 H160 V120 H22 Z M31 113 V80 H42 V111 M145 111 V61 H153 V111',desk:'M20 104 H158 M33 104 V125 M142 104 V125 M128 104 V85 H148 V104',ribbon:'M89 58 Q54 49 62 28 Q92 19 93 52 Q111 12 130 30 Q145 52 95 58 M91 58 L59 89 L70 64',
    station:'M21 19 H159 V42 H21 Z M29 42 V122 M151 42 V122 M13 124 H170',path:'M18 123 Q91 89 159 122 M44 124 Q90 108 137 124',fence:'M19 90 H160 M19 107 H160 M29 73 V124 M65 73 V124 M115 73 V124 M151 73 V124',
    bowl:'M28 52 H151 C174 129 14 139 28 52 Z M32 69 H151',reeds:'M18 123 L25 71 M26 94 Q41 64 36 53 M151 123 V71 M150 92 Q131 61 138 55',shore:'M15 111 q15 -5 30 0 t30 0 t30 0 t30 0 t30 0 M29 122 q15 -5 30 0 t30 0 t30 0',
    cliff:'M14 111 L120 105 L103 118 L133 125 M124 111 h32',island:'M37 107 Q87 89 141 108 L126 116 H47 Z M15 122 q15 -4 30 0 t30 0 t30 0 t30 0',wall:'M19 26 H160 M19 59 H160 M19 90 H160 M31 26 V59 M141 59 V90',
    steps:'M48 97 H127 V106 H139 V115 H151 V125 H24 V115 H36 V106 H48 Z',garden:'M18 125 Q15 21 89 15 Q167 22 161 125 M27 125 Q22 33 89 26 Q155 35 151 125',hook:'M30 123 V20 Q80 9 100 28 M85 28 q15 0 7 14',
    camp:'M17 122 L45 66 L77 122 Z M28 121 L45 87 L59 122 M118 118 l30 -9 M123 109 l23 13',water:'M18 107 q14 -6 28 0 t28 0 t28 0 t28 0 M31 120 q14 -6 28 0 t28 0 t28 0',harbor:'M19 98 H67 V106 H19 M24 106 V125 M59 106 V125 M146 43 V94',
    workbench:'M18 102 H164 M30 102 V125 M150 102 V125 M27 93 h22 M126 94 l21 -13',leaf:'M23 109 Q61 51 153 101 Q108 140 23 109 Z M24 109 L146 103',
    mushroom:'M112 76 Q136 42 161 76 Z M133 78 V120 H144 V78',den:'M17 123 Q12 32 97 43 Q149 43 161 123 M26 122 Q41 60 103 64',snow:'M17 123 Q69 112 159 123 M34 34 h8 M38 30 v8 M131 28 h8 M135 24 v8',
    burrow:'M20 123 Q29 71 89 82 Q143 76 162 124 M35 123 Q43 93 89 96 Q129 92 145 123',jar:'M49 18 H125 V28 H132 V120 H42 V28 H49 Z M49 28 H125',hive:'M129 25 q-19 8 -20 25 h43 q-1 -20 -23 -25 M110 36 h38 M108 47 h43 M122 49 v9',
    village:'M17 122 V67 L36 51 L55 67 V123 M126 123 V60 L147 41 L167 60 V123 M29 83 h12 v17 H29 Z',field:'M17 123 Q87 109 167 123 M26 113 l-3 -19 m0 10 l-7 -4 m7 -2 l7 -5 M151 112 v-21 m0 12 l-8 -6',
    chair:'M46 90 V28 H120 V90 M42 90 H126 V104 H42 Z M49 104 V125 M119 104 V125',case:'M31 115 Q16 92 40 46 Q59 19 109 39 Q159 69 146 115 Z',bed:'M24 103 H157 V122 M24 122 V78 H46 V103 M32 93 H151 V103',courtyard:'M19 116 L164 116 M31 104 H153 M44 104 L30 128 M133 104 L151 128',
  };
  pen(scenery[setting],g,true);
  const subject=document.createElementNS(ns,'g');subject.setAttribute('data-part','subject');
  // Context changes the relationship and scale: perched above, contained within, or beside scenery.
  const contained=['jar','bowl','terrarium','window','case','map','basin'].includes(setting);
  const beside=['swing','camp','mushroom','hive','den'].includes(setting);
  const scale=contained ? .66 : beside ? .67 : .77;
  let x=beside?10:90*(1-scale), y=contained?24:20;
  if(setting==='boots' && theme==='flower') {x=-31;y=0;}
  if(setting==='hook') {x=24;y=17;}
  if(setting==='basin') y=6;
  if(['snow','den','burrow','station'].includes(setting)) y=35;
  if(theme==='tree' && setting==='bench') x=3;
  if(theme==='snail' && setting==='mushroom') y=48;
  if(theme==='umbrella') y=0;
  subject.setAttribute('transform',`translate(${x} ${y}) scale(${scale})`);g.append(subject);
  const pose = theme==='cat' && slot===1 ? 'M48 95 C40 59 105 52 124 80 Q135 112 84 113 Q48 110 48 95 M81 86 L86 67 L96 76 L111 70 L116 90 Q102 107 84 96 M91 88 l5 2 M104 88 l5 -2 M62 83 Q38 109 82 105' : theme==='cat' && slot===2 ? 'M49 105 Q37 73 66 65 L70 48 L83 60 L97 52 L99 79 Q91 90 79 88 L99 110 H64 M91 70 h2 M53 105 Q30 103 34 81' : subjects[theme];
  pen(pose,subject);
  const motion=document.createElementNS(ns,'g');motion.setAttribute('class','scene-motion motion-'+(['fish','fountain','pier','bridge'].includes(theme)?'wave':['teacup','bee','butterfly'].includes(theme)?'rise':'sway'));motion.setAttribute('data-part','living-detail');g.append(motion);
  const offset=seedHash(seed+':detail')%5;
  if(['fish','fountain','pier','bridge','shell'].includes(theme)) pen('M49 119 q9 -4 18 0 t18 0 m8 0 q9 -4 18 0',motion,true);
  else if(theme==='teacup') pen('M73 42 q-8 -8 0 -15 M89 39 q-8 -8 0 -15',motion,true);
  else if(theme==='violin') pen('M140 52 V35 l11 -3 V49 m-11 3 q-9 -5 -8 3 q6 5 8 -3 M151 49 q-9 -5 -8 3 q6 5 8 -3',motion,true);
  else if(['lighthouse','lantern'].includes(theme)) pen('M57 40 l-15 -5 M119 40 l15 -5',motion,true);
  else if(['moon','telescope','clock','key','mountain'].includes(theme)) pen('M139 38 h8 M143 34 v8 M33 30 h6 M36 27 v6',motion,true);
  else if(['cat','fox','rabbit','snail','bee','butterfly','bird'].includes(theme)) pen(`M${137+offset} 52 q4 -5 8 0 q4 -5 8 0`,motion,true);
  else if(theme==='umbrella') pen('M34 67 l-3 9 M143 73 l-3 9 M43 91 l-3 9',motion,true);
  else pen(`M${137+offset} 62 q-11 -9 -14 0 q6 10 14 0 M${137+offset} 62 l-15 9`,motion,true);
  return svg;
}
