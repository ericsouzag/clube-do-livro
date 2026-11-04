// O papel do clube chato: segura, amassa em WebGL e joga no lixo.
(() => {
  const palco = document.getElementById('palco');
  const tela = document.getElementById('papel-tela');
  const alvo = document.getElementById('papel-alvo');
  const oferta = document.getElementById('oferta');
  const dica = document.getElementById('dica');
  const lixeira = document.getElementById('lixeira');
  const desamassar = document.getElementById('desamassar');
  if (!palco || !tela || !alvo) return;

  const RAZAO = 1.28; // altura / largura da folha
  const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Textura desenhada em canvas, para ser a mesma no WebGL e na versão simples.
  const desenharFolha = () => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.round(1024 * RAZAO);
    const g = c.getContext('2d');
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = '#FFE39A';
    g.lineWidth = 3;
    for (let y = 240; y < c.height; y += 111) { g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); }
    g.strokeStyle = '#FF924E';
    g.beginPath(); g.moveTo(96, 0); g.lineTo(96, c.height); g.stroke();

    g.fillStyle = '#5B2508';
    g.textBaseline = 'alphabetic';
    g.font = '700 96px "Courier Prime", Courier, monospace';
    g.fillText('Clube do livro', 132, 136);
    g.fillText('padrão e chato', 132, 226);

    g.font = '700 46px "Courier Prime", Courier, monospace';
    [
      '1. Todo mundo lê o mesmo livro.',
      '2. Metade não termina.',
      '3. Alguém pergunta:',
      '   "o que vocês acharam?"',
      '4. Silêncio constrangedor.',
      '5. Mês que vem, tudo de novo.',
    ].forEach((t, i) => g.fillText(t, 132, 240 + 111 * (i + 1) - 16));

    g.font = '400 118px "Gochi Hand", cursive';
    g.fillStyle = '#E8661F';
    g.save();
    g.translate(690, 1215);
    g.rotate(-.14);
    g.fillText('zzz...', 0, 0);
    g.restore();
    return c;
  };

  const gl = parado ? null : tela.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });

  const revelar = () => {
    oferta.classList.remove('coberta');
    dica.classList.add('fora');
    alvo.classList.add('fora');
    desamassar.hidden = false;
  };
  const cobrir = () => {
    oferta.classList.add('coberta');
    dica.classList.remove('fora');
    alvo.classList.remove('fora');
    desamassar.hidden = true;
  };

  const medir = () => {
    const r = palco.getBoundingClientRect();
    const meia = Math.min(innerWidth * .43, (r.height - 70) / (2 * RAZAO), 235);
    alvo.style.width = `${meia * 2}px`;
    alvo.style.height = `${meia * 2 * RAZAO}px`;
    return meia;
  };

  oferta.classList.add('coberta');
  document.documentElement.classList.add('js');

  // Versão simples: sem WebGL ou com movimento reduzido.
  if (!gl) {
    tela.style.display = 'none';
    let img = null;
    const montar = () => {
      const meia = medir();
      if (!img) { img = desenharFolha(); img.className = 'papel-simples'; img.setAttribute('aria-hidden', 'true'); palco.appendChild(img); }
      img.style.width = `${meia * 2}px`;
      img.style.height = `${meia * 2 * RAZAO}px`;
    };
    alvo.addEventListener('click', () => { img?.classList.add('fora'); revelar(); });
    desamassar.addEventListener('click', () => { img?.classList.remove('fora'); cobrir(); alvo.focus(); });
    addEventListener('resize', montar);
    Promise.all([document.fonts?.load('700 46px "Courier Prime"'), document.fonts?.load('400 118px "Gochi Hand"')]).finally(() => { img = null; palco.querySelector('.papel-simples')?.remove(); montar(); });
    montar();
    return;
  }

  const N = 18;
  const VS = `
    attribute vec2 aP;
    uniform float uA, uC, uS, uH0, uMeia;
    uniform vec2 uPos, uRes;
    uniform mat3 uRot;
    uniform vec4 uF[${N}];
    varying vec2 vP, vUv;
    varying vec3 vN;
    float h(vec2 p){ float s = 0.; for (int i = 0; i < ${N}; i++) s += uF[i].w * abs(dot(uF[i].xy, p) - uF[i].z); return s; }
    void main(){
      vec2 p = aP * vec2(1., uA);
      float d = h(p) - uH0;
      vec3 plano = vec3(p * (1. - .2 * uC), d * uC * 1.15);
      float r = length(p) / length(vec2(1., uA));
      float a = atan(p.y, p.x);
      float th = r * 2.95;
      vec3 nS = vec3(sin(th) * cos(a), sin(th) * sin(a), cos(th));
      vec3 bola = nS * (.46 + d * .62);
      vec3 pos = uRot * mix(plano, bola, uS);
      vN = uRot * mix(vec3(0., 0., 1.), nS, uS);
      vP = p;
      vUv = vec2(aP.x * .5 + .5, .5 - aP.y * .5);
      vec3 px = pos * uMeia;
      px.xy += uPos;
      gl_Position = vec4(px.x / (uRes.x * .5), px.y / (uRes.y * .5), -px.z / 3000., 1. - px.z / 1800.);
    }`;
  const FS = `
    precision highp float;
    uniform float uC, uS;
    uniform mat3 uRot;
    uniform vec4 uF[${N}];
    uniform sampler2D uT;
    varying vec2 vP, vUv;
    varying vec3 vN;
    void main(){
      vec2 g = vec2(0.);
      float linha = 1.;
      for (int i = 0; i < ${N}; i++) {
        float v = dot(uF[i].xy, vP) - uF[i].z;
        g += uF[i].w * sign(v) * uF[i].xy;
        linha = min(linha, abs(v));
      }
      vec3 n = normalize(vN + uRot * vec3(-g, 0.) * uC * 1.5);
      if (!gl_FrontFacing) n = -n;
      float luz = max(dot(n, normalize(vec3(-.45, .6, .72))), 0.);
      float sombra = mix(1., .6 + .52 * luz, smoothstep(0., .22, uC));
      vec3 cor = gl_FrontFacing ? texture2D(uT, vUv).rgb : vec3(1., .95, .84);
      cor *= sombra;
      cor *= 1. - (1. - smoothstep(0., .012, linha)) * .2 * uC;
      gl_FragColor = vec4(cor, 1.);
    }`;

  const compilar = (tipo, src) => {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const U = (n) => gl.getUniformLocation(prog, n);

  // Malha da folha.
  const CX = 90, CY = 116;
  const verts = new Float32Array((CX + 1) * (CY + 1) * 2);
  let k = 0;
  for (let y = 0; y <= CY; y++) for (let x = 0; x <= CX; x++) { verts[k++] = x / CX * 2 - 1; verts[k++] = y / CY * 2 - 1; }
  const idx = new Uint16Array(CX * CY * 6);
  k = 0;
  for (let y = 0; y < CY; y++) for (let x = 0; x < CX; x++) {
    const a = y * (CX + 1) + x, b = a + 1, c = a + CX + 1, d = c + 1;
    idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  const aP = gl.getAttribLocation(prog, 'aP');
  gl.enableVertexAttribArray(aP);
  gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  // Dobras: linhas retas aleatórias (com semente fixa), que dão as facetas do papel.
  let semente = 7;
  const acaso = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };
  const dobras = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const ang = acaso() * Math.PI;
    dobras[i * 4] = Math.cos(ang);
    dobras[i * 4 + 1] = Math.sin(ang);
    dobras[i * 4 + 2] = (acaso() - .5) * 1.5;
    dobras[i * 4 + 3] = (i % 2 ? -1 : 1) * (.05 + acaso() * .1);
  }
  gl.uniform4fv(U('uF[0]'), dobras);
  // Altura média, para a folha continuar centrada.
  let soma = 0;
  for (let i = 0; i < verts.length; i += 2) {
    for (let f = 0; f < N; f++) {
      soma += dobras[f * 4 + 3] * Math.abs(dobras[f * 4] * verts[i] + dobras[f * 4 + 1] * verts[i + 1] * RAZAO - dobras[f * 4 + 2]);
    }
  }
  gl.uniform1f(U('uH0'), soma / (verts.length / 2));
  gl.uniform1f(U('uA'), RAZAO);

  const textura = gl.createTexture();
  const enviarTextura = () => {
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, desenharFolha());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };
  enviarTextura();
  Promise.all([document.fonts?.load('700 46px "Courier Prime"'), document.fonts?.load('400 118px "Gochi Hand"')]).finally(() => { enviarTextura(); pedir(); });

  // Estado da animação.
  const e = {
    fase: 'plano', // plano | segurando | soltando | voando | lixo | voltando
    u: 0, alvoU: 0,
    x: 0, y: 0, ax: 0, ay: 0,
    rx: 0, ry: 0, rz: 0,
    escala: 1,
    voo: 0,
  };
  let meia = 200, W = 0, H = 0, rodando = false, anterior = 0;

  const ajustar = () => {
    meia = medir();
    const r = tela.getBoundingClientRect();
    W = r.width; H = r.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    tela.width = W * dpr; tela.height = H * dpr;
    gl.viewport(0, 0, tela.width, tela.height);
    gl.uniform2f(U('uRes'), W, H);
    pedir();
  };

  const mat = (rx, ry, rz) => {
    const [cx, sx, cy, sy, cz, sz] = [Math.cos(rx), Math.sin(rx), Math.cos(ry), Math.sin(ry), Math.cos(rz), Math.sin(rz)];
    return new Float32Array([
      cy * cz, cy * sz, -sy,
      sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy,
      cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy,
    ]);
  };

  const suave = (a, b, v) => { const t = Math.min(Math.max((v - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

  const desenhar = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (e.fase === 'lixo') return;
    gl.uniform1f(U('uC'), e.u);
    gl.uniform1f(U('uS'), suave(.42, 1, e.u));
    gl.uniform1f(U('uMeia'), meia * e.escala);
    gl.uniform2f(U('uPos'), e.x, e.y);
    gl.uniformMatrix3fv(U('uRot'), false, mat(e.rx, e.ry, e.rz));
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
  };

  const pontoLixeira = () => {
    const l = lixeira.getBoundingClientRect();
    const t = tela.getBoundingClientRect();
    return { x: l.left + l.width / 2 - t.left - W / 2, y: H / 2 - (l.top + l.height * .1 - t.top) };
  };

  const quadro = (agora) => {
    const dt = Math.min((agora - anterior) / 1000, .05);
    anterior = agora;
    let continuar = true;

    if (e.fase === 'segurando') {
      e.u = Math.min(e.u + dt / .85, 1);
      e.x += (e.ax - e.x) * .22;
      e.y += (e.ay - e.y) * .22;
      e.ry = (e.ax - e.x) * .012;
      e.rx = -(e.ay - e.y) * .012 + Math.sin(agora / 90) * .02 * e.u;
      e.rz += dt * e.u * .5;
    } else if (e.fase === 'soltando') {
      e.u = Math.max(e.u - dt / .45, 0);
      e.x *= .84; e.y *= .84; e.rx *= .84; e.ry *= .84; e.rz *= .84;
      if (e.u === 0 && Math.abs(e.x) + Math.abs(e.y) < 1) { e.x = e.y = e.rx = e.ry = e.rz = 0; e.fase = 'plano'; continuar = false; }
    } else if (e.fase === 'voando') {
      e.u = Math.min(e.u + dt / .3, 1);
      e.voo = Math.min(e.voo + dt / .85, 1);
      const p = pontoLixeira();
      const t = e.voo;
      e.x = e.ox + (p.x - e.ox) * t;
      e.y = e.oy + (p.y + 40 - e.oy) * t + Math.sin(t * Math.PI) * Math.min(H * .34, 230);
      e.escala = 1 - t * .42;
      e.rz += dt * 7;
      e.rx += dt * 5;
      if (t === 1) {
        e.fase = 'lixo';
        lixeira.classList.remove('mexe');
        void lixeira.getBoundingClientRect();
        lixeira.classList.add('mexe');
        revelar();
        continuar = false;
      }
    } else if (e.fase === 'voltando') {
      e.voo = Math.max(e.voo - dt / .7, 0);
      const p = pontoLixeira();
      const t = e.voo;
      e.x = p.x * t;
      e.y = (p.y + 40) * t + Math.sin(t * Math.PI) * Math.min(H * .34, 230);
      e.escala = 1 - t * .42;
      e.u = Math.min(t * 2, 1);
      e.rz *= .92; e.rx *= .92; e.ry *= .92;
      if (t === 0) { e.rx = e.ry = e.rz = 0; e.u = 0; e.escala = 1; e.fase = 'plano'; continuar = false; }
    } else {
      continuar = false;
    }

    desenhar();
    if (continuar) requestAnimationFrame(quadro); else rodando = false;
  };

  function pedir() {
    if (rodando) return;
    if (e.fase === 'plano' || e.fase === 'lixo') { desenhar(); return; }
    rodando = true;
    anterior = performance.now();
    requestAnimationFrame(quadro);
  }

  const jogar = () => {
    e.fase = 'voando';
    e.voo = 0;
    e.ox = e.x;
    e.oy = e.y;
    dica.classList.add('fora');
    pedir();
  };

  // Interação: segurar amassa; soltar amassado joga no lixo; um toque rápido faz tudo sozinho.
  let inicio = 0, ox = 0, oy = 0, moveu = 0;
  alvo.addEventListener('contextmenu', (ev) => ev.preventDefault());
  alvo.addEventListener('pointerdown', (ev) => {
    if (e.fase === 'voando' || e.fase === 'lixo') return;
    try { alvo.setPointerCapture(ev.pointerId); } catch { /* ponteiro já encerrado */ }
    inicio = performance.now();
    ox = ev.clientX; oy = ev.clientY; moveu = 0;
    e.ax = e.x; e.ay = e.y;
    e.fase = 'segurando';
    dica.classList.add('fora');
    pedir();
  });
  alvo.addEventListener('pointermove', (ev) => {
    if (e.fase !== 'segurando') return;
    const dx = ev.clientX - ox, dy = ev.clientY - oy;
    moveu = Math.max(moveu, Math.hypot(dx, dy));
    e.ax = dx; e.ay = -dy;
  });
  const soltar = (cancelado) => {
    if (e.fase !== 'segurando') return;
    const rapido = performance.now() - inicio < 240 && moveu < 10;
    if (!cancelado && (rapido || e.u > .5)) jogar();
    else { e.fase = 'soltando'; dica.classList.remove('fora'); pedir(); }
  };
  alvo.addEventListener('pointerup', () => soltar(false));
  alvo.addEventListener('pointercancel', () => soltar(true));
  // Teclado (Enter ou espaço): o clique sem ponteiro joga direto.
  alvo.addEventListener('click', (ev) => {
    if (ev.detail === 0 && e.fase === 'plano') { e.u = .2; jogar(); }
  });

  desamassar.addEventListener('click', () => {
    cobrir();
    e.fase = 'voltando';
    e.voo = 1;
    pedir();
    alvo.focus();
  });

  let espera;
  addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(ajustar, 120); });
  ajustar();
})();
