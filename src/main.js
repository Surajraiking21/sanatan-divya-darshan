import * as THREE from 'three';
import './style.css';

const places=[
 {id:'vaikuntha',title:'Vaikuntha Lok',subtitle:'Vishnu tradition',icon:'🪷',text:'Vaikuntha is described in Vaishnava traditions as the divine abode associated with Bhagavan Vishnu and Lakshmi. Descriptions vary across texts and sampradayas.'},
 {id:'kailasa',title:'Kailasa',subtitle:'Shiva tradition',icon:'🔱',text:'Kailasa is revered in Shaiva traditions as the sacred mountain associated with Bhagavan Shiva and Parvati. Traditional descriptions and theological interpretations vary by source.'},
 {id:'brahmaloka',title:'Brahmaloka',subtitle:'Brahma tradition',icon:'🕉️',text:'Brahmaloka is described in Hindu philosophical and scriptural traditions in different ways, including as a high spiritual realm associated with Brahma.'},
 {id:'ayodhya',title:'Ayodhya Dham',subtitle:'Rama tradition',icon:'🏹',text:'Ayodhya is a major sacred city associated with Bhagavan Rama. The app will expand this section with temples, pilgrimage places, traditions and textual sources.'}
];

const app=document.querySelector('#app');
let scene, camera, renderer, raf;

function setup3D(){
 const canvas=document.querySelector('#scene');
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.setSize(innerWidth,innerHeight);
 scene=new THREE.Scene();
 camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,100);
 camera.position.z=5;
 scene.add(new THREE.AmbientLight(0xffffff,.7));
 const light=new THREE.PointLight(0xffd58a,2,20); light.position.set(2,2,4); scene.add(light);
 const gem=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,2),new THREE.MeshStandardMaterial({color:0xf0b95a,emissive:0x4a2100,metalness:.45,roughness:.25,wireframe:false}));
 scene.add(gem);
 const stars=new THREE.BufferGeometry(), count=900, pos=new Float32Array(count*3);
 for(let i=0;i<count*3;i++) pos[i]=(Math.random()-.5)*28;
 stars.setAttribute('position',new THREE.BufferAttribute(pos,3));
 scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xffffff,size:.025})));
 const animate=()=>{gem.rotation.x+=.002;gem.rotation.y+=.004;renderer.render(scene,camera);raf=requestAnimationFrame(animate)};
 animate();
 addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
}

function renderHome(){
 app.innerHTML=`
 <main class="screen">
   <canvas id="scene"></canvas>
   <section class="hero">
    <div class="om">ॐ</div><h1>Sanatan Divya Darshan</h1>
    <p>एक immersive आध्यात्मिक यात्रा</p>
   </section>
   <section class="cards">${places.map(p=>`<button class="card" data-id="${p.id}"><span>${p.icon}</span><b>${p.title}</b><small>${p.subtitle}</small></button>`).join('')}</section>
 </main>`;
 setup3D();
 document.querySelectorAll('.card').forEach(b=>b.onclick=()=>navigate('place',b.dataset.id));
}

function renderPlace(id){
 const p=places.find(x=>x.id===id)||places[0];
 app.innerHTML=`
 <main class="detail">
  <button class="back" id="back">← वापस</button>
  <div class="divine-icon">${p.icon}</div>
  <h1>${p.title}</h1><p class="subtitle">${p.subtitle}</p>
  <article><h2>दिव्य परिचय</h2><p>${p.text}</p><p>यह प्रारम्भिक content layer है। आगे इसमें संबंधित ग्रंथ, श्लोक, मंदिर, दर्शन, इतिहास, परंपराएँ, मानचित्र और 3D scenes जोड़े जाएंगे।</p></article>
 </main>`;
 document.querySelector('#back').onclick=()=>history.back();
}

function navigate(view,id){
 history.pushState({view,id},'',view==='home'?'#home':`#${view}/${id}`);
 renderState();
}
function renderState(){
 const s=history.state;
 if(s?.view==='place') renderPlace(s.id); else renderHome();
}
if(!history.state){history.replaceState({view:'home'},'',location.hash||'#home')}
addEventListener('popstate',renderState);
renderState();
