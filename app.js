// Interações simples: abas, conta da contribuição, conversa do celular e botão final.
(() => {
  // Abas com teclado. Sem JS, todos os painéis ficam visíveis.
  document.querySelectorAll('[data-abas]').forEach((lista) => {
    const abas = [...lista.querySelectorAll('[role="tab"]')];
    const painel = (aba) => document.getElementById(aba.getAttribute('aria-controls'));
    const selecionar = (alvo, focar) => {
      abas.forEach((aba) => {
        const ativa = aba === alvo;
        aba.setAttribute('aria-selected', String(ativa));
        aba.tabIndex = ativa ? 0 : -1;
        painel(aba).hidden = !ativa;
      });
      if (focar) alvo.focus();
    };
    abas.forEach((aba, i) => {
      aba.addEventListener('click', () => selecionar(aba));
      aba.addEventListener('keydown', (e) => {
        const destino = {
          ArrowRight: abas[(i + 1) % abas.length],
          ArrowLeft: abas[(i - 1 + abas.length) % abas.length],
          Home: abas[0],
          End: abas[abas.length - 1],
        }[e.key];
        if (destino) { e.preventDefault(); selecionar(destino, true); }
      });
    });
    selecionar(abas[0]);
  });

  // Conta da contribuição.
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const valor = (id, minimo = 0) => {
    const n = Number(document.getElementById(id).value);
    return Number.isFinite(n) ? Math.max(n, minimo) : minimo;
  };
  const escrever = (id, n) => { document.getElementById(id).textContent = brl.format(n); };
  const calcular = () => {
    const livro = valor('c-livro');
    const materiais = valor('c-materiais');
    const pessoas = Math.max(Math.floor(valor('c-pessoas', 1)), 1);
    const reserva = (livro + materiais) * 0.1;
    const total = livro + materiais + reserva;
    escrever('r-livro', livro);
    escrever('r-materiais', materiais);
    escrever('r-reserva', reserva);
    escrever('r-total', total);
    escrever('r-cota', total / pessoas);
  };
  document.getElementById('conta').addEventListener('input', calcular);
  calcular();

  // Os balões do celular aparecem um a um quando ele entra na tela.
  const celular = document.getElementById('celular');
  celular.classList.add('anima');
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting) { celular.classList.add('visto'); obs.disconnect(); }
  }, { threshold: .35 }).observe(celular);

  // Botão final: ainda não existe link do grupo.
  document.getElementById('entrar').addEventListener('click', () => {
    document.getElementById('retorno').textContent = 'Falta só o link do grupo pra este botão abrir ele.';
  });
})();
