import { themes } from '../scripts/artwork.mjs';
import { renderArtwork,settings } from './artwork';
if(import.meta.env.DEV) {
 document.head.insertAdjacentHTML('beforeend',`<style>body{margin:20px;background:#faf8f2;color:#465b43;font:14px Georgia}main{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}figure{margin:0;background:#e5ebdf;padding:8px;border:1px solid #c4cebc}svg{width:100%;height:150px;overflow:visible}figcaption{text-align:center;color:#444;font:12px Georgia}.scene-motion{transform:none}</style>`);
 const page=Number(new URLSearchParams(location.search).get('page')||0);
 const heading=document.createElement('h1');heading.textContent=`Composition review ${page+1} / 4`;document.body.append(heading);
 const main=document.createElement('main');document.body.append(main);
 for(const theme of themes.slice(page*8,page*8+8)) for(let slot=0;slot<3;slot++) {
  const figure=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent=`${theme} / ${slot}: ${settings[theme][slot]}`;
  figure.append(renderArtwork({id:'preview-'+theme,title:theme,body:'',artwork:`v1/${theme}/${slot}`}),caption);main.append(figure);
 }
}
