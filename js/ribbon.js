/* Ruban ambré du hero : variante d'alvatech.fr (alvatech/public/js/ribbon.js), un seul ruban,
   plus étroit et plus lent, qui traverse le bas du hero. Dépend de three.js r128 (js/vendor/).
   Mouvement perpétuel sans saut : sinusoïdes du temps, repères par transport parallèle, horloge
   par accumulation. Sans WebGL : classe no-gl sur le hero (repli CSS). */
(function () {
  var hero = document.getElementById('hero');
  var canvas = document.getElementById('ribbon');
  if (!hero || !canvas) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.THREE) { hero.classList.add('no-gl'); return; }
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { hero.classList.add('no-gl'); return; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  // Mappage tonal : les reflets blanchissent au lieu de saturer en orange.
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  // Lumière douce : la face tournée vers la lampe affiche l'ambre du logo (#D97706), le reste
  // s'assombrit un peu ; un vernis léger ajoute les reflets. Pas de dégradé vers le jaune.
  // Lumière ciel/sol : le dessus des plis est éclairé, le dessous s'assombrit vers le brun,
  // c'est ce contraste qui fait lire la matière. Pas de lumière ambiante uniforme.
  var sky = new THREE.HemisphereLight(0xffffff, 0x6b3300, 0.5); sky.position.set(0.3, 1, 0.5); scene.add(sky);
  var key = new THREE.DirectionalLight(0xffffff, 0.45); key.position.set(-4, 6, 8); scene.add(key);
  var warm = new THREE.DirectionalLight(0xffc98a, 0.2); warm.position.set(8, 2, 5); scene.add(warm);
  // Lampe près de la caméra : le vernis la reflète en point chaud sur les bombés.
  var gloss = new THREE.DirectionalLight(0xffffff, 0.35); gloss.position.set(2, 4, 14); scene.add(gloss);

  // Reflets continus du vernis : petit studio (fond sombre, deux boîtes à lumière chaudes) converti
  // une fois en carte d'environnement. Sans lui, le vernis ne reflète que les lampes, par éclairs.
  function studio() {
    var env = new THREE.Scene(); env.background = new THREE.Color(0x1a1d22);
    var white = new THREE.MeshBasicMaterial({ color: 0xffe2bc, side: THREE.DoubleSide });
    var top = new THREE.Mesh(new THREE.PlaneGeometry(18, 2.5), white); top.position.set(0, 9, 5); top.lookAt(0, 0, 0); env.add(top);
    var side = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 12), white); side.position.set(-10, 1, 6); side.lookAt(0, 0, 0); env.add(side);
    var pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(env, 0.04).texture; pm.dispose(); return tex;
  }
  var envTex = studio();
  function satin(hex) {
    return new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex).convertSRGBToLinear(), metalness: 0, roughness: 0.3,
      clearcoat: 1, clearcoatRoughness: 0.1, envMap: envTex, envMapIntensity: 0.35, vertexColors: true, side: THREE.DoubleSide });
  }
  // Base un peu plus foncée que l'ambre du logo : après éclairage et mappage tonal, la face
  // éclairée ressort à #D97706 (mesuré sur capture), les ombres vers #9A4D00.
  var amber = satin(0xd06a00);
  var v = new THREE.Vector3(), off = new THREE.Vector3();
  // Repères le long de la courbe par transport parallèle depuis une normale de référence fixe :
  // les repères de Frenet de three.js choisissent leur normale initiale selon la tangente et
  // peuvent basculer d'un coup quand la courbe bouge.
  var fN = [], fB = [], UP = new THREE.Vector3(0, 1, 0), tg = new THREE.Vector3();
  function frames(curve, N) {
    for (var i = 0; i <= N; i++) {
      if (!fN[i]) { fN[i] = new THREE.Vector3(); fB[i] = new THREE.Vector3(); }
      curve.getTangentAt(i / N, tg);
      if (i === 0) { fN[0].crossVectors(tg, UP).normalize(); }
      else { fN[i].copy(fN[i - 1]).addScaledVector(tg, -fN[i - 1].dot(tg)).normalize(); }
      fB[i].crossVectors(tg, fN[i]);
    }
  }
  function ribbon(points, width, phase, twist, mat) {
    var N = 260, W = 12;
    var base = points.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });
    var pts = base.map(function (q) { return q.clone(); });
    var curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array((N + 1) * (W + 1) * 3), col = new Float32Array((N + 1) * (W + 1) * 3), idx = [];
    for (var i = 0; i < N; i++) for (var j = 0; j < W; j++) { var a = i * (W + 1) + j, b = a + W + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    geo.setIndex(idx);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Mesh(geo, mat));
    return function (t) {
      for (var k = 0; k < pts.length; k++) {
        pts[k].x = base[k].x + Math.sin(t * 0.2 + k * 1.7 + phase) * 0.4;
        pts[k].y = base[k].y + Math.sin(t * 0.28 + k * 1.1 + phase) * 0.5;
        pts[k].z = base[k].z + Math.cos(t * 0.24 + k * 0.9 + phase) * 0.6;
      }
      curve.needsUpdate = true;
      frames(curve, N);
      for (var i = 0; i <= N; i++) {
        var u = i / N;
        curve.getPointAt(u, v);
        var tw = u * Math.PI * twist + t * 0.22 + phase;
        var n = fN[i], bn = fB[i];
        var cs = Math.cos(tw), sn = Math.sin(tw);
        // Bandes d'ombre liées à la torsion : la face qui se détourne s'assombrit, la face qui
        // revient reprend la couleur pleine. C'est ce qui donne le rendu métallique.
        var f = 0.55 + 0.45 * (0.5 + 0.5 * cs);
        for (var j = 0; j <= W; j++) {
          var sgn = (j / W - 0.5) * width;
          off.set(n.x * cs + bn.x * sn, n.y * cs + bn.y * sn, n.z * cs + bn.z * sn).multiplyScalar(sgn);
          var o = (i * (W + 1) + j) * 3;
          pos[o] = v.x + off.x; pos[o + 1] = v.y + off.y; pos[o + 2] = v.z + off.z;
          col[o] = f; col[o + 1] = f; col[o + 2] = f;
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.computeVertexNormals();
    };
  }
  var builders = [
    ribbon([[-14, -4.2, -4], [-7, -3.0, -2], [-1, -3.6, 0.5], [4, -1.2, 1.8], [9, -2.4, 0.5], [14, -0.6, -3]], 2.6, 0.7, 1.3, amber)
  ];
  function build(t) { for (var i = 0; i < builders.length; i++) builders[i](t); }

  function resize() {
    var w = hero.clientWidth, h = hero.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    var narrow = w < 700;
    camera.position.z = narrow ? 20 : 16;
    scene.position.set(narrow ? 0.5 : 0, narrow ? -0.4 : -0.6, 0);
    scene.rotation.z = narrow ? -0.25 : 0;
    if (reduce) { build(0); renderer.render(scene, camera); }
  }
  resize();
  window.addEventListener('resize', resize);

  // Horloge par accumulation : un onglet mis en pause ou un hero sorti de l'écran ne fait pas
  // sauter le mouvement, il reprend où il s'était arrêté. Une seule boucle à la fois.
  var visible = true, running = false, t = 0, last = 0;
  function start() { if (running || reduce) return; running = true; last = 0; requestAnimationFrame(frame); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: 0.02 }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) start(); });
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    if (last) t += Math.min((now - last) / 1000, 0.05);
    last = now;
    build(t);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  build(0); renderer.render(scene, camera);
  start();
})();
