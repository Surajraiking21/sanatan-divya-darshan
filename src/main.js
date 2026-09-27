import * as THREE from 'three';
import './style.css';
import {sections,detail} from './content.js';
import {getDetails,getSceneMeta} from './details.js';

const app=document.querySelector('#app');
let scene,camera,renderer,raf;
let resizeHandler=null;
let pointerHandler=null;

const sacredRoutes=[
 {id:'char-dham',title:'चार धाम',icon:'🛕',items:[
  {name:'बद्रीनाथ',detailId:'badrinath'},{name:'द्वारका',detailId:'dwarka'},{name:'जगन्नाथ पुरी',detailId:'puri'},{name:'रामेश्वरम्',detailId:'jyotirlinga'}
 ],note:'चार प्रमुख धामों की परंपरा को एक यात्रा-दृश्य में देखें।',source:'परंपरा/सूची के संदर्भ अलग ग्रंथों और क्षेत्रीय परंपराओं में मिल सकते हैं।'},
 {id:'jyotirlinga-route',title:'द्वादश ज्योतिर्लिंग',icon:'🔱',items:[
  {name:'सोमनाथ'},{name:'मल्लिकार्जुन'},{name:'महाकालेश्वर'},{name:'ओंकारेश्वर'},{name:'केदारनाथ'},{name:'भीमाशंकर'},{name:'काशी विश्वनाथ'},{name:'त्र्यंबकेश्वर'},{name:'वैद्यनाथ'},{name:'नागेश्वर'},{name:'रामेश्वरम्',detailId:'jyotirlinga'},{name:'घृष्णेश्वर'}
 ],note:'ज्योतिर्लिंग परंपरा का अध्ययन और तीर्थ-मानचित्र।',source:'द्वादश ज्योतिर्लिंग की सूची को परंपरा-संदर्भ के साथ प्रस्तुत किया जाएगा।'},
 {id:'sapta-puri',title:'सप्त पुरी',icon:'🌺',items:[
  {name:'अयोध्या'},{name:'मथुरा'},{name:'माया/हरिद्वार'},{name:'काशी'},{name:'कांची'},{name:'अवंतिका/उज्जैन'},{name:'द्वारका',detailId:'dwarka'}
 ],note:'सप्त पुरी की पारंपरिक सूची को एक साथ देखें।',source:'सप्त पुरी की सूचियों में नाम/रूपांतर मिल सकते हैं; इन्हें स्रोत के साथ दिखाया जाएगा।'}
];
const icons={loka:'🌌',deities:'🪔',tirtha:'🛕',vrata:'📿',texts:'📜',dharma:'☸️',darshana:'🕉️',heritage:'🏛️'};

const sceneThemes={
  home:{color:0x8e73ff,emissive:0x25124a,light:0xb58cff,geometry:'icosa'},
  loka:{color:0x765cff,emissive:0x211047,light:0xa987ff,geometry:'sphere'},
  deity:{color:0xf0b95a,emissive:0x4a2100,light:0xffd58a,geometry:'icosa'},
  tirtha:{color:0x4da6a6,emissive:0x073333,light:0x75e6d5,geometry:'torus'},
  vrata:{color:0xff9b62,emissive:0x431708,light:0xffc27d,geometry:'sphere'},
  texts:{color:0x8eb8ff,emissive:0x10284a,light:0x9cc7ff,geometry:'box'},
  dharma:{color:0xc78cff,emissive:0x2b104a,light:0xd49cff,geometry:'icosa'},
  darshana:{color:0xffd27d,emissive:0x4a2a08,light:0xffe7a8,geometry:'torus'},
  heritage:{color:0x9bc7ff,emissive:0x102b4a,light:0xb7dcff,geometry:'box'}
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

const FAVORITES_KEY='sdd-favorites';
const RECENT_KEY='sdd-recent';
function getFavorites(){try{return JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]')}catch{return[]}}
function setFavorites(v){localStorage.setItem(FAVORITES_KEY,JSON.stringify(v))}
function getRecent(){try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')}catch{return[]}}
function remember(id){const next=[id,...getRecent().filter(x=>x!==id)].slice(0,8);localStorage.setItem(RECENT_KEY,JSON.stringify(next))}
function randomItem(){const all=sections.flatMap(s=>s.items.map(x=>({s,x})));return all[Math.floor(Math.random()*all.length)]||null}
function renderHome(){
 app.innerHTML=`<main class="screen"><canvas id="scene"></canvas><section class="hero"><div class="om">ॐ</div><h1>Sanatan Divya Darshan</h1><p>सनातन परंपराओं की immersive digital यात्रा</p><div class="search-wrap"><input id="search" class="search" placeholder="🔎 लोक, भगवान, तीर्थ, पर्व या ग्रंथ खोजें..." autocomplete="off"/></div></section><section class="catalog">${sections.map(s=>`<button class="category" data-section="${s.id}"><span>${icons[s.id]}</span><b>${s.title}</b><small>${s.items.length} विषय • ज्ञान • दर्शन • परंपरा</small></button>`).join('')}</section><section class="quick-tools"><button class="tool-card" id="daily-darshan">🌅<b>आज का दिव्य दर्शन</b><small>एक यादृच्छिक ज्ञान-दर्शन खोलें</small></button><button class="tool-card" id="favorites">❤️<b>मेरे प्रिय दर्शन</b><small>पसंद किए हुए विषय</small></button><button class="tool-card" id="recent">🕉️<b>हाल में देखे</b><small>पिछली यात्राएँ फिर खोलें</small></button><button class="tool-card" id="quiz">🧠<b>ज्ञान यात्रा क्विज़</b><small>अपना ज्ञान परखें</small></button><button class="tool-card" id="timeline">📜<b>सनातन ज्ञान-यात्रा</b><small>वेद से भक्ति परंपराओं तक</small></button></section><section id="search-results" class="search-results"></section><p class="note">यह ज्ञानकोश अलग-अलग ग्रंथों, संप्रदायों और क्षेत्रीय परंपराओं के मतभेदों को अलग-अलग दिखाने के लिए बनाया जा रहा है। धार्मिक/पारंपरिक दावों को जहाँ संभव हो, संबंधित ग्रंथ, संप्रदाय और क्षेत्रीय संदर्भ के साथ अलग-अलग दिखाया जाएगा।</p></main>`;
 setup3D();
 document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>navigate('section',b.dataset.section));
 document.querySelector('#daily-darshan').onclick=()=>navigate('detail',randomItem());
 document.querySelector('#favorites').onclick=()=>showSaved('favorites');
 document.querySelector('#recent').onclick=()=>showSaved('recent');
 document.querySelector('#quiz').onclick=()=>renderQuiz();
 document.querySelector('#timeline').onclick=()=>renderTimeline();
const sacredButton=document.querySelector('#sacred-map');
const templeButton=document.querySelector('#temple-explorer');
if(templeButton) templeButton.onclick=()=>renderTempleExplorer('dwarka');
if(sacredButton) sacredButton.onclick=()=>renderSacredMap();
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

const quizQuestions=[{q:'वैदिक साहित्य में 33 देवताओं की अवधारणा किस संदर्भ में मिलती है?',a:['वैदिक देवताओं की संख्या/वर्गीकरण','केवल 33 करोड़ मंदिर','केवल 33 अवतार'],c:0},{q:'14 लोकों की पारंपरिक व्यवस्था में कितने ऊर्ध्व और कितने अधोलोक बताए जाते हैं?',a:['7 और 7','10 और 4','5 और 9'],c:0},{q:'उपनिषदों को सामान्यतः किससे जोड़ा जाता है?',a:['वेदांत/ज्ञानकाण्ड','केवल ज्योतिष','केवल स्थापत्य'],c:0},{q:'चार धाम की सूची में कौन-सा स्थल आता है?',a:['द्वारका','केवल काशी','केवल पुष्कर'],c:0},{q:'एकादशी किस प्रकार की धार्मिक परंपरा है?',a:['व्रत/उपासना परंपरा','एक वेद','एक स्थापत्य शैली'],c:0}];
function renderQuiz(){let i=0,score=0;const draw=()=>{const x=quizQuestions[i];app.innerHTML='<main class="detail"><button class="back" id="back">← वापस</button><div class="section-icon">🧠</div><h1>ज्ञान यात्रा क्विज़</h1><p class="quiz-progress">प्रश्न '+(i+1)+' / '+quizQuestions.length+'</p><article class="quiz-card"><h2>'+x.q+'</h2><div class="quiz-options">'+x.a.map((v,n)=>'<button data-q="'+n+'">'+v+'</button>').join('')+'</div></article></main>';document.querySelector('#back').onclick=()=>history.back();document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.q)===x.c)score++;i++;if(i<quizQuestions.length)draw();else{app.innerHTML='<main class="detail"><button class="back" id="back">← वापस</button><div class="section-icon">🪷</div><h1>यात्रा पूर्ण</h1><article><h2>आपका परिणाम</h2><p>'+score+' / '+quizQuestions.length+' सही उत्तर</p><p>हर विषय के विस्तृत स्रोत और परंपरा-संदर्भ के लिए आगे दर्शन खोलें।</p></article></main>';document.querySelector('#back').onclick=()=>history.back()}})};draw()}
function renderTimeline(){const rows=[['वेद','श्रुति और वैदिक परंपरा','वेद, संहिताएँ, ब्राह्मण, आरण्यक और वैदिक पाठ की परंपराएँ।'],['उपनिषद','आत्मा, ब्रह्म और ज्ञान','उपनिषद वैदिक साहित्य के ज्ञान-केंद्रित दार्शनिक ग्रंथों के रूप में पढ़े जाते हैं।'],['इतिहास','रामायण और महाभारत','महाकाव्य/इतिहास परंपराओं में धर्म, नीति, कथा और आदर्शों के विविध आख्यान।'],['गीता','योग और जीवन-दर्शन','महाभारत के भीतर कृष्ण-अर्जुन संवाद और कर्म, ज्ञान तथा भक्ति के विमर्श।'],['पुराण','कथा, तीर्थ और देव-परंपराएँ','विभिन्न पुराणों में सृष्टि, वंश, तीर्थ, देवता और धर्म-संबंधी आख्यान।'],['दर्शन','षड्दर्शन और अन्य दार्शनिक परंपराएँ','न्याय, वैशेषिक, सांख्य, योग, मीमांसा और वेदांत सहित दार्शनिक परंपराएँ।'],['भक्ति/क्षेत्रीय परंपराएँ','मंदिर, संगीत, यात्रा और जीवित विरासत','अनेक क्षेत्रीय सम्प्रदायों, मंदिरों, उत्सवों, संगीत और लोक-परंपराओं का विस्तार।']];app.innerHTML='<main class="detail"><button class="back" id="back">← वापस</button><div class="section-icon">📜</div><h1>सनातन ज्ञान-यात्रा</h1><p class="subtitle">एक सरल अध्ययन-मानचित्र — इसे कठोर एकरेखीय इतिहास न समझें।</p><div class="timeline">'+rows.map((r,n)=>'<section class="timeline-item"><span>'+String(n+1).padStart(2,'0')+'</span><div><h2>'+r[0]+'</h2><b>'+r[1]+'</b><p>'+r[2]+'</p></div></section>').join('')+'</div></main>';document.querySelector('#back').onclick=()=>history.back()}
function renderSection(id){
 const s=sections.find(x=>x.id===id)||sections[0];
 app.innerHTML=`<main class="detail"><button class="back" id="back">← वापस</button><div class="section-icon">${icons[s.id]}</div><h1>${s.title}</h1><div class="list">${s.items.map(x=>`<button class="item" data-id="${x[0]}"><span>${icons[s.id]}</span><div><b>${x[1]}</b><small>${x[2]}</small></div><strong>›</strong></button>`).join('')}</div></main>`;
 document.querySelector('#back').onclick=()=>history.back();
 document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>navigate('detail',b.dataset.id));
}

function showSaved(kind){
 const ids=kind==='favorites'?getFavorites():getRecent();
 const title=kind==='favorites'?'❤️ मेरे प्रिय दर्शन':'🕉️ हाल में देखे';
 const items=ids.map(id=>detail(id)).filter(Boolean);
 app.innerHTML='<main class="detail"><button class="back" id="back">← वापस</button><div class="section-icon">'+(kind==='favorites'?'❤️':'🕉️')+'</div><h1>'+title+'</h1><div class="list">'+(items.length?items.map(x=>'<button class="item" data-id="'+x.id+'"><span>✨</span><div><b>'+x.title+'</b><small>'+x.section+' • '+x.summary+'</small></div><strong>›</strong></button>').join(''):'<p class="no-results">अभी यहाँ कोई दर्शन नहीं है।</p>')+'</div></main>';
 document.querySelector('#back').onclick=()=>history.back();
 document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>navigate('detail',b.dataset.id));
}

function renderDetail(id){
 remember(id);
 const p=detail(id)||detail('vishnu');
 const rich=getDetails(p.id)||{};
 const sceneMeta=getSceneMeta(p.id)||{label:'दिव्य प्रतीकात्मक दृश्य',confidence:'conceptual'};
 const overview=rich.overview||p.summary;
 const sourceList=(rich.sources||[]).map(x=>'<li>'+x+'</li>').join('')||'<li>'+p.sources+'</li>';
 const storyList=(rich.stories||[]).map(x=>'<li>'+x+'</li>').join('')||'<li>विस्तृत कथाएँ चरणबद्ध रूप से जोड़ी जाएंगी।</li>';
 const related= (rich.related||[]).map(x=>detail(x)).filter(Boolean).slice(0,6);
 const sourceLinks={
   veda:'https://vedicheritage.gov.in/',
   upanishad:'https://vedicheritage.gov.in/upanishads/',
   'brihadaranyaka-upanishad':'https://vedicheritage.gov.in/upanishads/brihadaranyakopanishad/',
   'aitareya-upanishad':'https://vedicheritage.gov.in/hi/upanishads/aitareyopanishad/',
  'brihadaranyaka-upanishad':'https://vedicheritage.gov.in/upanishads/brihadaranyakopanishad/',
  'shukla-yajurveda':'https://vedicheritage.gov.in/samhitas/yajurveda/vajasneyi-madhyandina-samhita/',
  'samaveda':'https://vedicheritage.gov.in/samhitas/samaveda-samhitas/',
  'shaunaka-samhita':'https://vedicheritage.gov.in/samhitas/atharvaveda-samhitas/shaunaka-samhita/',
  'vedic-chanting':'https://vedicheritage.gov.in/hi/introduction/prakriti-vikriti-veda-patha/'
 };
 const sourceUrl=sourceLinks[p.id]||((p.section.includes('ग्रंथ')||p.id==='vedic-chanting')?'https://vedicheritage.gov.in/':null);
const portalLink='https://vedicheritage.gov.in/introduction/';
 const sourceButton=(sourceUrl?'<a class="source-link" href="'+sourceUrl+'" target="_blank" rel="noopener noreferrer">🔎 आधिकारिक Vedic Heritage स्रोत खोलें</a>':'')+'<a class="source-link" href="'+portalLink+'" target="_blank" rel="noopener noreferrer">📚 Vedic Heritage Portal परिचय</a>';
 const sourceLabel=sourceUrl?'इस विषय का संबंधित आधिकारिक Vedic स्रोत उपलब्ध है।':'इस विषय के लिए विस्तृत प्राथमिक स्रोत चरणबद्ध रूप से जोड़े जाएंगे।';
 const mode=p.section==='सभी लोक और दिव्य धाम'?'loka':
   p.section.includes('देवी-देवता')?'deity':
   p.section.includes('तीर्थ')?'tirtha':
   p.section.includes('व्रत')?'vrata':
   p.section.includes('ग्रंथ')?'texts':
   p.section.includes('तत्त्व, योग')?'darshana':
   p.section.includes('मंदिर, कला')?'heritage':'dharma';
 app.innerHTML=`<main class="detail"><button class="back" id="back">← वापस</button><canvas id="scene"></canvas><div class="detail-content"><div class="darshan-badge">✦ स्पर्श / क्लिक करके 3D दर्शन अनुभव करें</div><div class="section-icon">✨</div><h1>${p.title}</h1><div class="detail-actions"><button id="fav-btn">🤍 प्रिय में जोड़ें</button><button id="share-btn">🔗 साझा करें</button></div><p class="subtitle">${p.section}</p><article><h2>दिव्य परिचय</h2><p>${overview}</p><div class="detail-grid"><section class="info-card"><h2>📜 प्रमुख स्रोत</h2><ul>${sourceList}</ul></section><section class="info-card"><h2>📖 प्रमुख कथाएँ</h2><ul>${storyList}</ul></section></div><h2>परंपरा / संदर्भ</h2><p>${p.tradition||'विभिन्न ग्रंथ और संप्रदाय अपने-अपने संदर्भ में इस विषय की व्याख्या करते हैं।'}</p><h2>उपासना और अनुभव</h2><p>${rich.worship||'इस विषय की उपासना और परंपराएँ क्षेत्र, संप्रदाय और मंदिर के अनुसार अलग हो सकती हैं।'}</p><section class="info-card"><h2>✨ 3D दर्शन</h2><p>${sceneMeta.label}</p><p>दृश्य की प्रकृति: ${sceneMeta.confidence === "conceptual" ? "प्रतीकात्मक/कल्पनात्मक — इसे ऐतिहासिक या शास्त्रीय वास्तु का प्रमाणित पुनर्निर्माण न समझें।" : "स्रोत-आधारित दृश्य।"}</p><p>स्पर्श/क्लिक से motion और visual response सक्रिय होता है। आगे जहाँ विश्वसनीय वास्तु/प्रतिमा-स्रोत उपलब्ध होंगे, वहाँ scene-specific hotspots और संरचनात्मक विवरण जोड़े जाएंगे।</p></section>${related.length?'<h2>🔗 संबंधित दर्शन</h2><div class="related-grid">'+related.map(x=>'<button class="search-item related-item" data-related="'+x.id+'"><b>'+x.title+'</b><small>'+x.summary+'</small></button>').join('')+'</div>':''}<h2>स्रोत-संदर्भ</h2><p>${p.sources||'प्राथमिक ग्रंथ और विश्वसनीय संस्थागत/शोध स्रोतों के आधार पर विस्तार किया जाएगा।'}</p><p class="source-status">${sourceLabel}</p>${sourceButton}<h2>परंपरा में विविधता</h2><p>जहाँ अलग-अलग ग्रंथ, संप्रदाय या क्षेत्र अलग विवरण देते हैं, उन्हें एक ही तथ्य की तरह मिलाने के बजाय अलग-अलग परंपराओं के रूप में प्रस्तुत किया जाएगा।</p></article></div></main>`;
 setup3D(mode);
 document.querySelector('#back').onclick=()=>history.back();
 document.querySelectorAll('[data-related]').forEach(b=>b.onclick=()=>navigate('detail',b.dataset.related));
}

function navigate(view,id){history.pushState({view,id},'',`#${view}/${id}`);renderState()}

function renderSacredMap(){
 destroy3D();
 app.innerHTML=`<main class="screen"><section class="hero"><div class="om">🗺️</div><h1>पवित्र भारत — Sacred Bharat</h1><p>तीर्थ और धामों की परंपराओं को स्रोत-सचेत अध्ययन यात्रा के रूप में देखें।</p></section><div class="route-grid">${sacredRoutes.map(r=>'<button class="route-card" data-route="'+r.id+'"><span>'+r.icon+'</span><b>'+r.title+'</b><small>'+r.items.map(x=>x.name).join(' · ')+'</small><em>'+r.note+'</em></button>').join('')}</div><p class="note">सूचियाँ परंपरा/ग्रंथ के अनुसार बदल सकती हैं; यह दृश्य अध्ययन-मानचित्र है, आधिकारिक धार्मिक मानचित्र नहीं।</p></main>`;
 setup3D('tirtha');
 document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>renderRoute(b.dataset.route));
}
function renderTempleExplorer(id='dwarka'){
 const p=detail(id)||detail('dwarka'); if(!p)return;
 history.pushState({view:'temple',id:p.id},'',`#temple/${p.id}`);
 destroy3D();
 const architecture=p.id==='dwarka'?'तटीय/क्षेत्रीय मंदिर-परंपरा':'मंदिर वास्तु और स्थानीय परंपरा';
 app.innerHTML=`<main class="detail"><button class="back" id="temple-back">← वापस</button><section class="detail-content"><div class="section-icon">🛕</div><h1>Temple Explorer</h1><p class="subtitle">${p.title} — ${architecture}</p><article><h2>🚪 दर्शन-क्रम</h2><div class="temple-zones"><button data-zone="entrance">🚪 प्रवेश द्वार</button><button data-zone="mandapa">🏛️ मंडप</button><button data-zone="sanctum">🪔 गर्भगृह</button><button data-zone="shikhara">🔱 शिखर/विमान</button></div><div id="zone-info" class="info-card"><h2>प्रवेश द्वार</h2><p>यह immersive conceptual layer है। वास्तविक मंदिर की संरचना को प्रमाणित पुनर्निर्माण मानने के बजाय उपलब्ध स्रोतों के अनुसार अलग-अलग architectural elements दिखाए जाएंगे।</p></div></article><article><h2>📚 स्रोत-सचेत वास्तु</h2><p>नागर, द्रविड़, वेसर और क्षेत्रीय मंदिर-परंपराओं को एक ही शैली न मानकर अलग संदर्भों में रखा जाएगा।</p></article></section></main>`;
 setup3D('tirtha');
 const info={entrance:['प्रवेश द्वार','गोपुर/द्वार या प्रवेश क्षेत्र का परिचय—वास्तविक रूप मंदिर-विशेष पर निर्भर है।'],mandapa:['मंडप','सभा/पूजा और संचरण से जुड़े मंडपों की भूमिका मंदिर-विशेष के अनुसार अलग हो सकती है।'],sanctum:['गर्भगृह','मुख्य देवता की प्रतिष्ठा वाला पवित्र आंतरिक क्षेत्र; वास्तविक प्रवेश-नियम मंदिर और परंपरा पर निर्भर हैं।'],shikhara:['शिखर/विमान','ऊर्ध्व स्थापत्य तत्व; उत्तर भारतीय नागर और दक्षिण भारतीय द्रविड़ परंपराओं में रूप अलग होते हैं।']};
 document.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>{const x=info[b.dataset.zone];document.querySelector('#zone-info').innerHTML='<h2>'+x[0]+'</h2><p>'+x[1]+'</p>'});
 document.querySelector('#temple-back').onclick=()=>history.back();
}
function renderRoute(id){const r=sacredRoutes.find(x=>x.id===id);if(!r)return;history.pushState({view:'route',id},'',`#route/${id}`);destroy3D();app.innerHTML=`<main class="detail"><button class="back" id="route-back">← वापस</button><section class="detail-content"><div class="section-icon">${r.icon}</div><h1>${r.title}</h1><p class="subtitle">${r.note}</p><article><h2>📍 यात्रा सूची</h2><div class="route-list">${r.items.map((x,i)=>'<div><span>'+(i+1)+'</span><b>'+x.name+'</b>'+(x.detailId?'<button class="route-detail" data-detail="'+x.detailId+'">विस्तृत दर्शन</button>':'')+'</div>').join('')}</div><p>${r.source}</p><p>यहाँ आगे प्रत्येक तीर्थ के लिए वास्तविक स्थान, मंदिर, परंपरा, प्रमुख ग्रंथ-संदर्भ और स्रोत-आधारित 3D hotspot जोड़े जाएंगे।</p></article></section></main>`;setup3D('tirtha');document.querySelector('#route-back').onclick=()=>history.back();document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>navigate('detail',b.dataset.detail));}
function renderState(){const s=history.state;if(s?.view==='section')renderSection(s.id);else if(s?.view==='detail')renderDetail(s.id);else if(s?.view==='route')renderRoute(s.id);else if(s?.view==='temple')renderTempleExplorer(s.id);else renderHome()}
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
