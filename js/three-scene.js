// Three.js idle ball on home page only
let scene, camera, renderer, ball, raf;

export function initThreeStage(){
  const canvas = document.querySelector('#threeStage');
  if(!canvas || !window.THREE) return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 1.8, 6);
  renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };
  resize(); addEventListener('resize', resize);
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#111';
  const mat = new THREE.MeshBasicMaterial({color:ink, wireframe:true});
  ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 3), mat);
  scene.add(ball);
  for(let i=0;i<5;i++){
    const line = new THREE.Mesh(new THREE.TorusGeometry(1.5+i*.22,.006,8,120),mat);
    line.rotation.x = Math.PI/2+i*.1; line.rotation.y = i*.45;
    scene.add(line);
  }
  const animate = () => {
    raf = requestAnimationFrame(animate);
    ball.rotation.x += .006; ball.rotation.y += .009;
    renderer.render(scene, camera);
  };
  animate();
}

export function kickThreeBall(){
  if(!ball || !window.gsap) return;
  gsap.fromTo(ball.scale, {x:1.22,y:.82,z:1.22}, {x:1,y:1,z:1, duration:.55, ease:'elastic.out(1,.35)'});
}

// ── Overlay: minimal progress bar, no canvas animation ─────────────────────
let _loadingInterval = null;

export function startPencilRun(){
  const overlay = document.querySelector('#pencilOverlay');
  if(overlay) overlay.classList.add('show');
  // Animate the bar segments with staggered reveal
  const segs = document.querySelectorAll('.ld-seg');
  segs.forEach((s,i) => {
    s.style.animationDelay = `${i * 0.04}s`;
    s.classList.remove('ld-seg-active');
  });
  requestAnimationFrame(() => segs.forEach(s => s.classList.add('ld-seg-active')));
}

export function finishPencilRun(){
  const overlay = document.querySelector('#pencilOverlay');
  if(!overlay) return;
  // Show done state briefly then close
  const label = overlay.querySelector('.ld-label');
  const sub = overlay.querySelector('.ld-sub');
  if(label) label.textContent = 'Done';
  if(sub) sub.textContent = 'Results ready';
  overlay.querySelector('.ld-bar-fill')?.classList.add('ld-complete');
  setTimeout(() => {
    overlay.classList.add('ld-fade-out');
    setTimeout(() => {
      overlay.classList.remove('show', 'ld-fade-out');
      if(label) label.textContent = 'Simulating';
      if(sub) sub.textContent = '0%';
      overlay.querySelector('.ld-bar-fill')?.classList.remove('ld-complete');
    }, 500);
  }, 700);
}
