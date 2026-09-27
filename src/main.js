import * as THREE from 'three';
import './style.css';
import {sections,detail} from './content.js';
import {getDetails,getSceneMeta} from './details.js';

const app=document.querySelector('#app');
let scene,camera,renderer,raf;
let resizeHandler=null;
let pointerHandler=null;
const icons={loka:'🌌',deities:'🪔',tirtha:'🛕',vrata:'📿',texts:'📜',dharma:'☸️'};

const sceneThemes={
  home:{color:0x8e73ff,emissive:0x25124a,light:0xb58cff,geometry:'icosa'},
  loka:{color:0x765cff,emissive:0x211047,light:0xa987ff,geometry:'sphere'},
  deity:{color:0xf0b95a,emissive:0x4a2100,light:0xffd58a,geometry:'icosa'},
  tirtha:{color:0x4da6a6,emissive:0x073333,light:0x75e6d5,geometry:'torus'},
  vrata:{color:0xff9b62,emissive:0x431708,light:0xffc27d,geometry:'sphere'},
  texts:{color:0x8eb8ff,emissive:0x10284a,light:0x9cc7ff,geometry:'box'},
  dharma:{color:0xc78cff,emissive:0x2b104a,light:0xd49cff,geometry:'icosa'}
};

function destroy3D(){
 cancelAnimationFrame(raf);
 if(resizeHandler) removeEventListener('resize',resizeHandler);
 if(pointerHandler) removeEventListener('pointermove',pointerHandler);
 if(renderer){renderer.dispose();renderer.forceContextLoss();renderer=null;}
 scene=null;camera=null;resizeHandler=null;pointerHandler=null;
}

function setup3D(mode='home'){
 destroy3D();
 const canvas=document.querySelector('#scene'); if(!canvas)return;
 const theme=sceneThemes[mode]||sceneThemes.home;
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight);
 scene=new THREE.Scene();
 camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,100);
 camera.position.z=5;
 scene.add(new THREE.AmbientLight(0xffffff,.72));
 const light=new THREE.PointLight(theme.light,2.8,30);
 light.position.set(2,3,5); scene.add(light);

 let geometry;
 if(theme.geometry==='sphere') geometry=new THREE.SphereGeometry(1.08,48,32);
 else if(theme.geometry==='torus') geometry=new THREE.TorusKnotGeometry(.82,.22,96,16);
 else if(theme.geometry==='box') geometry=new THREE.BoxGeometry(1.55,1.55,1.55);
 else geometry=new THREE.IcosahedronGeometry(mode==='loka'?1.25:1.05,3);

 const core=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({
   color:theme.color,emissive:theme.emissive,metalness:.48,roughness:.24
 }));
 scene.add(core);

 const ring=new THREE.Mesh(
   new THREE.TorusGeometry(1.72,.018,12,128),
   new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.42})
 );
 ring.rotation.x=Math.PI/2; scene.add(ring);

 const innerRing=new THREE.Mesh(
   new THREE.TorusGeometry(1.25,.012,10,96),
   new THREE.MeshBasicMaterial({color:theme.light,transparent:true,opacity:.32})
 );
 innerRing.rotation.y=Math.PI/3; scene.add(innerRing);

 const stars=new THREE.BufferGeometry(),count=1400,pos=new Float32Array(count*3);
 for(let i=0;i<count*3;i++)pos[i]=(Math.random()-.5)*32;
 stars.setAttribute('position',new THREE.BufferAttribute(pos,3));
 scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xffffff,size:.022,transparent:true,opacity:.75})));

 let targetX=0,targetY=0,pulse=1;
 pointerHandler=(e)=>{
   targetX=(e.clientX/innerWidth-.5)*.7;
   targetY=(e.clientY/innerHeight-.5)*.45;
 };
 addEventListener('pointermove',pointerHandler);

 canvas.style.pointerEvents=mode==='home'?'none':'auto';
 canvas.setAttribute('aria-label','3D दिव्य दर्शन दृश्य — स्पर्श या क्लिक करें');
 canvas.onclick=()=>{pulse=1.22};

 resizeHandler=()=>{if(renderer&&camera){
   camera.aspect=innerWidth/innerHeight;
   camera.updateProjectionMatrix();
   renderer.setSize(innerWidth,innerHeight);
 }};
 addEventListener('resize',resizeHandler);

 cancelAnimationFrame(raf);
 const animate=()=>{
   core.rotation.x+=.0025;
   core.rotation.y+=.0045;
   ring.rotation.z+=.0018;
   innerRing.rotation.x+=.0012;
   innerRing.rotation.z-=.001;
   camera.position.x+=(targetX-camera.position.x)*.035;
   camera.position.y+=(-targetY-camera.position.y)*.035;
   camera.lookAt(0,0,0);
   pulse+=(1-pulse)*.055;
   core.scale.setScalar(pulse);
   renderer.render(scene,camera);
   raf=requestAnimationFrame(animate);
 };
 animate();
}

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
     if((x[1]+' '+x[2]+' '+(x[3]||'')+' '+(x[4]||'')+' '+s.title).toLowerCase().includes(q)) matches.push({s,x});
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
 const rich=getDetails(p.id)||{};
 const sceneMeta=getSceneMeta(p.id)||{label:'दिव्य प्रतीकात्मक दृश्य',confidence:'conceptual'};
 const overview=rich.overview||p.summary;
 const sourceList=(rich.sources||[]).map(x=>'<li>'+x+'</li>').join('')||'<li>'+p.sources+'</li>';
 const storyList=(rich.stories||[]).map(x=>'<li>'+x+'</li>').join('')||'<li>विस्तृत कथाएँ चरणबद्ध रूप से जोड़ी जाएंगी।</li>';
 const related= (rich.related||[]).map(x=>detail(x)).filter(Boolean).slice(0,6);
 const mode=p.section==='सभी लोक और दिव्य धाम'?'loka':
   p.section.includes('देवी-देवता')?'deity':
   p.section.includes('तीर्थ')?'tirtha':
   p.section.includes('व्रत')?'vrata':
   p.section.includes('ग्रंथ')?'texts':'dharma';
 app.innerHTML=`<main class="detail"><button class="back" id="back">← वापस</button><canvas id="scene"></canvas><div class="detail-content"><div class="darshan-badge">✦ स्पर्श / क्लिक करके 3D दर्शन अनुभव करें</div><div class="section-icon">✨</div><h1>${p.title}</h1><p class="subtitle">${p.section}</p><article><h2>दिव्य परिचय</h2><p>${overview}</p><div class="detail-grid"><section class="info-card"><h2>📜 प्रमुख स्रोत</h2><ul>${sourceList}</ul></section><section class="info-card"><h2>📖 प्रमुख कथाएँ</h2><ul>${storyList}</ul></section></div><h2>परंपरा / संदर्भ</h2><p>${p.tradition||'विभिन्न ग्रंथ और संप्रदाय अपने-अपने संदर्भ में इस विषय की व्याख्या करते हैं।'}</p><h2>उपासना और अनुभव</h2><p>${rich.worship||'इस विषय की उपासना और परंपराएँ क्षेत्र, संप्रदाय और मंदिर के अनुसार अलग हो सकती हैं।'}</p><section class="info-card"><h2>✨ 3D दर्शन</h2><p>${sceneMeta.label}</p><p>दृश्य की प्रकृति: \${sceneMeta.confidence === "conceptual" ? "प्रतीकात्मक/कल्पनात्मक — इसे ऐतिहासिक या शास्त्रीय वास्तु का प्रमाणित पुनर्निर्माण न समझें।" : "स्रोत-आधारित दृश्य।"}</p><p>स्पर्श/क्लिक से motion और visual response सक्रिय होता है। आगे जहाँ विश्वसनीय वास्तु/प्रतिमा-स्रोत उपलब्ध होंगे, वहाँ scene-specific hotspots और संरचनात्मक विवरण जोड़े जाएंगे।</p></section>${related.length?'<h2>🔗 संबंधित दर्शन</h2><div class="related-grid">'+related.map(x=>'<button class="search-item related-item" data-related="'+x.id+'"><b>'+x.title+'</b><small>'+x.summary+'</small></button>').join('')+'</div>':''}<h2>स्रोत-संदर्भ</h2><p>${p.sources||'प्राथमिक ग्रंथ और विश्वसनीय संस्थागत/शोध स्रोतों के आधार पर विस्तार किया जाएगा।'}</p><h2>परंपरा में विविधता</h2><p>जहाँ अलग-अलग ग्रंथ, संप्रदाय या क्षेत्र अलग विवरण देते हैं, उन्हें एक ही तथ्य की तरह मिलाने के बजाय अलग-अलग परंपराओं के रूप में प्रस्तुत किया जाएगा।</p></article></div></main>`;
 setup3D(mode);
 document.querySelector('#back').onclick=()=>history.back();
 document.querySelectorAll('[data-related]').forEach(b=>b.onclick=()=>navigate('detail',b.dataset.related));
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
