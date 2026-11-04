// Campo de letras: brilhos suaves revelam as palavras do clube, e o toque embaralha.
(() => {
  const tela = document.getElementById('palavras-tela');
  if (!tela) return;
  const ctx = tela.getContext('2d');
  if (!ctx) return;

  const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PALAVRAS = ['LIVRO', 'TRECHO', 'PROJETO', 'RASCUNHO', 'ENCONTRO', 'VOTO', 'ÁUDIO', 'CHECK-IN', 'EXPOSIÇÃO', 'JOGO', 'FESTA', 'CAIXA', 'LEITURA', 'CONVERSA', 'PÁGINA', 'GRUPO'];
  const BAGUNCA = 'ABCDEFGHIJLMNOPQRSTUVXZ#*+?!&%';
  const CORES = ['rgba(255,227,154,.55)', '#FFE39A', '#FFFFFF'];

  let L = 0, A = 0, tam = 14, cw = 8, ch = 16, cols = 0, rows = 0, linhas = [];
  const toque = { x: -999, y: -999, forca: 0 };

  const preparar = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    L = tela.clientWidth;
    A = tela.clientHeight;
    if (!L || !A) return;
    tela.width = L * dpr;
    tela.height = A * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tam = L < 700 ? 13 : 15;
    ctx.font = `700 ${tam}px "Courier Prime", ui-monospace, Consolas, monospace`;
    ctx.textBaseline = 'top';
    cw = ctx.measureText('M').width;
    ch = tam * 1.28;
    cols = Math.ceil(L / cw);
    rows = Math.ceil(A / ch);
    linhas = [];
    for (let r = 0; r < rows; r++) {
      let s = '';
      let i = (r * 7) % PALAVRAS.length;
      while (s.length < cols + 12) { s += PALAVRAS[i % PALAVRAS.length] + ' '; i += 3; }
      linhas.push(s.slice((r * 5) % 11));
    }
  };

  const pintar = (t) => {
    if (!L) return;
    ctx.clearRect(0, 0, L, A);
    // Três brilhos passeando.
    const manchas = [
      [L * (.5 + .36 * Math.sin(t * .23)), A * (.5 + .34 * Math.cos(t * .31)), Math.max(L, A) * .3],
      [L * (.5 + .4 * Math.cos(t * .17 + 2)), A * (.5 + .4 * Math.sin(t * .27 + 1)), Math.max(L, A) * .24],
      [L * (.5 + .3 * Math.sin(t * .13 + 4)), A * (.5 + .3 * Math.sin(t * .19 + 3)), Math.max(L, A) * .2],
    ];
    const baldes = [[], [], []];
    for (let r = 0; r < rows; r++) {
      const y = r * ch;
      const linha = linhas[r];
      for (let c = 0; c < cols; c++) {
        const letra = linha[c];
        if (!letra || letra === ' ') continue;
        const x = c * cw;
        let b = 0;
        for (const [mx, my, mr] of manchas) {
          const dx = x - mx, dy = y - my;
          b += Math.exp(-(dx * dx + dy * dy) / (mr * mr));
        }
        const tx = x - toque.x, ty = y - toque.y;
        const perto = toque.forca * Math.exp(-(tx * tx + ty * ty) / 12000);
        b += perto * 1.1;
        if (b < .26) continue;
        const nivel = b > .95 ? 2 : b > .55 ? 1 : 0;
        const embaralha = perto > .12 && Math.random() < perto;
        baldes[nivel].push(embaralha ? BAGUNCA[Math.floor(Math.random() * BAGUNCA.length)] : letra, x, y);
      }
    }
    baldes.forEach((b, n) => {
      ctx.fillStyle = CORES[n];
      for (let i = 0; i < b.length; i += 3) ctx.fillText(b[i], b[i + 1], b[i + 2]);
    });
  };

  const secao = tela.parentElement;
  secao.addEventListener('pointermove', (e) => {
    const r = tela.getBoundingClientRect();
    toque.x = e.clientX - r.left;
    toque.y = e.clientY - r.top;
    toque.forca = 1;
    if (parado) pintar(0);
  }, { passive: true });
  secao.addEventListener('pointerleave', () => { toque.forca = 0; if (parado) pintar(0); });

  let visivel = false;
  let ultimo = 0;
  const laco = (agora) => {
    if (!visivel) return;
    requestAnimationFrame(laco);
    if (agora - ultimo < 33) return;
    ultimo = agora;
    if (toque.forca > 0) toque.forca = Math.max(toque.forca - .012, 0);
    pintar(agora / 1000);
  };

  new IntersectionObserver(([e]) => {
    const era = visivel;
    visivel = e.isIntersecting;
    if (visivel && !era && !parado) requestAnimationFrame(laco);
  }).observe(secao);

  const iniciar = () => { preparar(); pintar(6); };
  let espera;
  addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(iniciar, 150); });
  iniciar();
  document.fonts?.load('700 15px "Courier Prime"').then(iniciar).catch(() => {});
})();
