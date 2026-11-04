// Livros em 3D (só CSS) que atravessam a tela.
(() => {
  const CORES = ['#FF924E', '#FFFFFF', '#E8661F', '#FFD373', '#5B2508'];
  const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const desenhos = [
    // corações em coluna
    (c) => `<path fill="${c}" d="M50 62c-9-8-18-14-17-24 1-8 12-11 17-2 5-9 16-7 17 2 1 10-8 16-17 24Zm0 50c-9-8-18-14-17-24 1-8 12-11 17-2 5-9 16-7 17 2 1 10-8 16-17 24Z"/>`,
    // brilho grande
    (c) => `<path fill="${c}" d="M50 26c4 26 12 34 38 38-26 4-34 12-38 38-4-26-12-34-38-38 26-4 34-12 38-38Z"/>`,
    // ondas
    (c) => `<path fill="${c}" d="M0 86c18-12 32 8 50 0s32-14 50-4v58H0Zm0-44c18-12 32 8 50 0s32-14 50-4v14c-18-10-32-4-50 4S18 44 0 56Z"/>`,
    // faixas com título de mentira
    (c) => `<rect fill="${c}" x="20" y="24" width="60" height="9" rx="4.500"/><rect fill="${c}" x="20" y="40" width="42" height="9" rx="4.500"/><circle fill="${c}" cx="50" cy="96" r="20"/>`,
  ];

  const capa = (cor, i) => {
    const traco = cor === '#FFFFFF' || cor === '#FFD373' ? '#FF924E' : cor === '#5B2508' ? '#FFD373' : '#FFF';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140" preserveAspectRatio="none">${desenhos[i % desenhos.length](traco)}</svg>`;
    return `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;
  };

  const criarLivro = (w, i) => {
    const cor = CORES[i % CORES.length];
    const h = w * 1.38;
    const d = w * 0.2;
    const livro = document.createElement('div');
    livro.className = 'livro';
    livro.style.cssText = `--w:${w}px;--h:${h}px;--d:${d}px;--cor:${cor}`;
    livro.innerHTML = `
      <div class="face frente" style="background-image:${capa(cor, i)}"></div>
      <div class="face verso"></div>
      <div class="face lombada"></div>
      <div class="face corte"></div>
      <div class="face topo-miolo"></div>
      <div class="face base-miolo"></div>`;
    const voo = document.createElement('div');
    voo.className = 'voo';
    voo.appendChild(livro);
    return voo;
  };

  const cenas = [];

  // direcao: 'lado' atravessa na horizontal, 'cima' cai na vertical.
  const montar = (id, itens, direcao = 'lado') => {
    const cena = document.getElementById(id);
    if (!cena) return;
    const moveis = itens.map((o, i) => {
      const el = criarLivro(o.w, o.cor ?? i);
      cena.appendChild(el);
      return { ...o, el };
    });
    const dados = { cena, moveis, direcao, visivel: true };
    cenas.push(dados);
    new IntersectionObserver(([e]) => { dados.visivel = e.isIntersecting; }, { rootMargin: '120px' }).observe(cena);
  };

  const escala = Math.min(1, Math.max(0.58, innerWidth / 1100));
  const t = (w) => Math.round(w * escala);

  montar('livros-tras', [
    { w: t(190), faixa: .16, vel: .022, fase: .08, gx: 18, gy: -24, gz: -28, cor: 0 },
    { w: t(230), faixa: .62, vel: .016, fase: .52, gx: -14, gy: 32, gz: 22, cor: 4 },
    { w: t(140), faixa: .84, vel: .028, fase: .30, gx: 24, gy: -38, gz: 14, cor: 2 },
    { w: t(120), faixa: .30, vel: .03, fase: .78, gx: -20, gy: 28, gz: -12, cor: 1 },
  ]);
  montar('livros-frente', [
    { w: t(150), faixa: .78, vel: .036, fase: .64, gx: 16, gy: 30, gz: -20, cor: 3 },
    { w: t(104), faixa: .1, vel: .044, fase: .2, gx: -18, gy: -34, gz: 26, cor: 0 },
  ]);
  montar('livros-faixa', [
    { w: t(170), faixa: .1, vel: .05, fase: 0, gx: 14, gy: -28, gz: -18, cor: 2 },
    { w: t(130), faixa: .78, vel: .058, fase: .14, gx: -16, gy: 34, gz: 16, cor: 3 },
    { w: t(210), faixa: .68, vel: .036, fase: .32, gx: 20, gy: 26, gz: -10, cor: 0 },
    { w: t(120), faixa: .06, vel: .062, fase: .5, gx: -22, gy: -30, gz: 22, cor: 4 },
    { w: t(160), faixa: .82, vel: .044, fase: .68, gx: 12, gy: -36, gz: 12, cor: 3 },
    { w: t(180), faixa: .14, vel: .04, fase: .84, gx: -14, gy: 24, gz: -24, cor: 0 },
  ]);
  montar('livros-chuva', [
    { w: t(140), faixa: .08, vel: .05, fase: 0, gx: 22, gy: -26, gz: -20, cor: 0 },
    { w: t(170), faixa: .9, vel: .04, fase: .2, gx: -16, gy: 32, gz: 18, cor: 4 },
    { w: t(110), faixa: .26, vel: .06, fase: .46, gx: 18, gy: 28, gz: 26, cor: 1 },
    { w: t(130), faixa: .74, vel: .054, fase: .66, gx: -24, gy: -24, gz: -14, cor: 2 },
    { w: t(100), faixa: .52, vel: .068, fase: .86, gx: 14, gy: 36, gz: 10, cor: 3 },
  ], 'cima');

  let rolagem = scrollY;
  addEventListener('scroll', () => { rolagem = scrollY; }, { passive: true });

  const pintar = (agora) => {
    const s = agora / 1000;
    cenas.forEach(({ cena, moveis, direcao, visivel }) => {
      if (!visivel) return;
      const L = cena.clientWidth;
      const A = cena.clientHeight;
      moveis.forEach((m) => {
        // A rolagem empurra os livros junto com o tempo.
        const andar = (m.fase + s * m.vel + rolagem * m.vel * .012) % 1;
        const curso = direcao === 'lado' ? L + m.w * 3 : A + m.w * 3.6;
        const p = andar * curso - m.w * (direcao === 'lado' ? 1.5 : 1.8);
        const onda = Math.sin(s * .7 + m.fase * 9) * 16;
        const x = direcao === 'lado' ? p : m.faixa * L - m.w / 2 + onda;
        const y = direcao === 'lado' ? m.faixa * A - m.w * .69 + onda : p;
        const giro = s * 5 + rolagem * .03;
        m.el.style.transform =
          `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) ` +
          `rotateX(${(m.gx + Math.sin(s * .5 + m.fase * 7) * 10).toFixed(1)}deg) ` +
          `rotateY(${(m.gy + Math.sin((giro + m.fase * 50) * .05) * 24).toFixed(1)}deg) ` +
          `rotateZ(${(m.gz + Math.cos(s * .4 + m.fase * 5) * 7).toFixed(1)}deg)`;
      });
    });
    if (!parado) requestAnimationFrame(pintar);
  };

  requestAnimationFrame(pintar);
})();
