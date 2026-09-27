import * as THREE from 'three';
import './style.css';
import {sections,detail} from './content.js';

const app=document.querySelector('#app');
let scene,camera,renderer,raf;
const icons={loka:'🌌',deities:'🪔',tirtha:'🛕',vrata:'📿',texts:'📜',dharma:'☸️'};

function setup3D(mode='home'){
 const canvas=document.querySelector('#scene'); if(!canvas)return;
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight);
 scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,100); camera.position.z=5;
 scene.add(new THREE.AmbientLight(0xffffff,.8));
 const light=new THREE.PointLight(mode==='loka'?0xb58cff:0xffd58a,2.5,30); light.position.set(2,3,5); scene.add(light);
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(mode==='loka'?1.25:1.05,3),new THREE.MeshStandardMaterial({color:mode==='loka'?0x8e73ff:0xf0b95a,emissive:mode==='loka'?0x25124a:0x4a2100,metalness:.5,roughness:.22}));
 scene.add(core);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.7,.018,12,128),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.4}));
 ring.rotation.x=Math.PI/2; scene.add(ring);
 const stars=new THREE.BufferGeometry(),count=1200,pos=new Float32Array(count*3);
 for(let i=0;i<count*3;i++)pos[i]=(Math.random()-.5)*32;
 stars.setAttribute('position',new THREE.BufferAttribute(pos,3));
 scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xffffff,size:.022})));
 cancelAnimationFrame(raf);
 const animate=()=>{core.rotation.x+=.002;core.rotation.y+=.004;ring.rotation.z+=.0015;renderer.render(scene,camera);raf=requestAnimationFrame(animate)};animate();
}
addEventListener('resize',()=>{if(renderer&&camera){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}});

function renderHome(){
 app.innerHTML=`<main class="screen"><canvas id="scene"></canvas><section class="hero"><div class="om">ॐ</div><h1>Sanatan Divya Darshan</h1><p>सनातन परंपराओं की immersive digital यात्रा</p><div class="search-wrap"><input id="search" class="search" placeholder="🔎 लोक, भगवान, तीर्थ, पर्व या ग्रंथ खोजें..." autocomplete="off"/></div></section><section class="catalog">${sections.map(s=>`<button class="category" data-section="${s.id}"><span>${icons[s.id]}</span><b>${s.title}</b><small>${s.items.length} विषय • ज्ञान • दर्शन • परंपरा</small></button>`).join('')}</section><section id="search-results" class="search-results"></section><p class="note">यह ज्ञानकोश अलग-अलग ग्रंथों, संप्रदायों और क्षेत्रीय परंपराओं के मतभेदों को अलग-अलग दिखाने के लिए बनाया जा रहा है। धार्मिक/पारंपरिक दावों को जहाँ संभव हो, संबंधित ग्रंथ, संप्रदाय और क्षेत्रीय संदर्भ के साथ अलग-अलग दिखाया जाएगा।</p></main>`;
 setup3D();
 document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>navigate('section',b.dataset.section));
 const search=document.querySelector('#search');
 const results=document.querySelector('#search-results');
 search.oninput=()=>{
   const q=search.value.trim().toLowerCase();
   if(!q){results.innerHTML='';return}
   const matches=[];
   for(const s of sections) for(const x of s.items)
     if((x[1]+' '+x[2]+' '+s.title).toLowerCase().includes(q)) matches.push({s,x});
   results.innerHTML=matches.slice(0,30).map(({s,x})=>`<button class="search-item" data-id="${x[0]}"><b>${x[1]}</b><small>${s.title} • ${x[2]}</small></button>`).join('') || '<p class="no-results">कोई विषय नहीं मिला।</p>';
   results.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>navigate('detail',b.dataset.id));
 };
}
function renderSection(id){
 const s=sections.find(x=>x.id===id)||sections[0];
 app.innerHTML=`<main class="detail"><button class="back" id="back">← वापस</button><div class="section-icon">${icons[s.id]}</div><h1>${s.title}</h1><div class="list">${s.items.map(x=>`<button class="item" data-id="${x[0]}"><span>${icons[s.id]}</span><div><b>${x[1]}</b><small>${x[2]}</small></div><strong>›</strong></button>`).join('')}</div></main>`;
 document.querySelector('#back').onclick=()=>history.back();
 document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>navigate('detail',b.dataset.id));
}
function renderDetail(id){
 const p=detail(id)||detail('vishnu');
 app.innerHTML=`<main class="detail"><button class="back" id="back">← वापस</button><canvas id="scene"></canvas><div class="detail-content"><div class="section-icon">✨</div><h1>${p.title}</h1><p class="subtitle">${p.section}</p><article><h2>दिव्य परिचय</h2><p>${p.summary}</p><h2>विस्तृत ज्ञान</h2><p>इस विषय के लिए ऐप में क्रमशः स्रोत-आधारित इतिहास, संबंधित ग्रंथ, प्रमुख कथाएँ, उपासना-परंपराएँ, प्रतीक, मंत्र/स्तोत्र जहाँ उपयुक्त हों, प्रमुख मंदिर और तीर्थ, पर्व-व्रत, क्षेत्रीय विविधताएँ तथा immersive 3D दृश्य जोड़े जाएंगे।</p><h2>परंपरा में विविधता</h2><p>जहाँ अलग-अलग ग्रंथ, संप्रदाय या क्षेत्र अलग विवरण देते हैं, उन्हें एक ही तथ्य की तरह मिलाने के बजाय अलग-अलग परंपराओं के रूप में प्रस्तुत किया जाएगा।</p></article></div></main>`;
 setup3D(p.section==='सभी लोक'?'loka':'detail');
 document.querySelector('#back').onclick=()=>history.back();
}
function navigate(view,id){history.pushState({view,id},'',`#${view}/${id}`);renderState()}
function renderState(){const s=history.state;if(s?.view==='section')renderSection(s.id);else if(s?.view==='detail')renderDetail(s.id);else renderHome()}
if(!history.state)history.replaceState({view:'home'},'','#home');
addEventListener('popstate',renderState);renderState();

// Native Android back-button support: preserve the app navigation stack.
// On the home screen we stay in the app instead of unexpectedly closing it.
async function setupNativeBackButton(){
  try{
    const {App}=await import('@capacitor/app');
    await App.addListener('backButton',()=>{
      if(history.state?.view && history.state.view!=='home') history.back();
    });
  }catch{}
}
setupNativeBackButton();
