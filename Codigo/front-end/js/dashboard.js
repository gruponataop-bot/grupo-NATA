const DASHBOARD_SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const DASHBOARD_SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const dashboardSupabase = supabase.createClient(DASHBOARD_SUPABASE_URL, DASHBOARD_SUPABASE_KEY);

const DIAS_ALERTA_VALIDADE = 7;

document.addEventListener('DOMContentLoaded', () => {
  carregarDashboard();
});

async function carregarDashboard() {
  try {
    const [
      projetos,
      participantes,
      residentes,
      voluntarios,
      funcionarios,
      estoque,
      lancamentos
    ] = await Promise.all([
      buscarTabela('projetos', 'nome,status,tipo,publico_alvo'),
      buscarTabela('participantes', 'id_participant,status,projeto'),
      buscarTabela('residentes', 'id_residente,status,projeto'),
      buscarTabela('voluntarios', 'id,nome,status'),
      buscarFuncionarios(),
      buscarTabela('estoque', '*', { coluna: 'validade', ascending: true, nullsFirst: false }),
      buscarTabela('lancamentos', '*', { coluna: 'data', ascending: false })
    ]);

    const dados = montarDadosDashboard({
      projetos,
      participantes,
      residentes,
      voluntarios,
      funcionarios,
      estoque,
      lancamentos
    });

    renderizarDashboard(dados);
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error.message);
    renderizarErroDashboard();
  }
}

async function buscarTabela(tabela, colunas = '*', ordenacao = null) {
  let query = dashboardSupabase.from(tabela).select(colunas);

  if (ordenacao) {
    query = query.order(ordenacao.coluna, {
      ascending: ordenacao.ascending,
      nullsFirst: ordenacao.nullsFirst
    });
  }

  const { data, error } = await query;
  if (error) {
    console.warn(`Nao foi possivel buscar a tabela ${tabela}:`, error.message);
    return [];
  }

  return data || [];
}

async function buscarFuncionarios() {
  const funcionarios = await buscarTabela('funcionario', 'id_funcionario,cargo');
  if (funcionarios.length) return funcionarios;
  return buscarTabela('funcionarios', 'id_funcionario,cargo');
}

function montarDadosDashboard(dados) {
  const hoje = zerarHorario(new Date());
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const limiteValidade = new Date(hoje);
  limiteValidade.setDate(limiteValidade.getDate() + DIAS_ALERTA_VALIDADE);

  const projetosAtivos = dados.projetos.filter((item) => mesmoTexto(item.status, 'ativo')).length;
  const projetosSuspensos = dados.projetos.filter((item) => mesmoTexto(item.status, 'suspenso')).length;
  const projetosEncerrados = dados.projetos.filter((item) => mesmoTexto(item.status, 'encerrado')).length;

  const voluntariosAtivos = dados.voluntarios.filter((item) => mesmoTexto(item.status, 'ativo')).length;
  const voluntariosPendentes = dados.voluntarios.filter((item) => mesmoTexto(item.status, 'pendente')).length;

  const lancamentosMes = dados.lancamentos.filter((item) => {
    const data = criarDataLocal(item.data);
    return data && data >= inicioMes && data <= hoje;
  });

  const totalEntradas = somarLancamentos(dados.lancamentos, 'ENTRADA');
  const totalSaidas = somarLancamentos(dados.lancamentos, 'SAIDA');
  const entradasMes = somarLancamentos(lancamentosMes, 'ENTRADA');
  const saidasMes = somarLancamentos(lancamentosMes, 'SAIDA');

  const alertasEstoque = gerarAlertasEstoque(dados.estoque, hoje, limiteValidade);
  const estoqueCritico = dados.estoque
    .filter((item) => itemEhCritico(item, hoje, limiteValidade))
    .sort((a, b) => ordenarPorValidade(a.validade, b.validade))
    .slice(0, 5);

  return {
    totais: {
      projetosAtivos,
      participantes: dados.participantes.length,
      residentes: dados.residentes.length,
      voluntariosAtivos,
      funcionarios: dados.funcionarios.length,
      itensEstoque: dados.estoque.length
    },
    financeiro: {
      saldo: totalEntradas - totalSaidas,
      entradasMes,
      saidasMes,
      lancamentosRecentes: dados.lancamentos.slice(0, 5)
    },
    projetos: {
      ativos: projetosAtivos,
      suspensos: projetosSuspensos,
      encerrados: projetosEncerrados,
      voluntariosPendentes
    },
    estoque: {
      esgotados: alertasEstoque.resumo.esgotados,
      limiteMinimo: alertasEstoque.resumo.minimo,
      vencidos: alertasEstoque.resumo.vencidos,
      vencendo: alertasEstoque.resumo.vencendo,
      criticos: estoqueCritico
    },
    alertas: alertasEstoque.lista.slice(0, 8)
  };
}

function gerarAlertasEstoque(itens, hoje = zerarHorario(new Date()), limiteValidade = null) {
  const limite = limiteValidade || (() => {
    const data = new Date(hoje);
    data.setDate(data.getDate() + DIAS_ALERTA_VALIDADE);
    return data;
  })();

  const resumo = {
    esgotados: 0,
    minimo: 0,
    vencidos: 0,
    vencendo: 0
  };

  const lista = [];

  itens.forEach((item) => {
    const quantidade = Number(item.quantidade) || 0;
    const estoqueMinimo = Number(item.estoque_minimo ?? item.estoqueMinimo ?? 5);
    const validade = criarDataLocal(item.validade);
    const quantidadeFormatada = `${quantidade} ${item.unidade || 'un'}`;

    if (quantidade <= 0) {
      resumo.esgotados += 1;
      lista.push(criarAlerta(item, 'Esgotado', 'danger', 'ph-x-circle', `Quantidade atual: ${quantidadeFormatada}. Reposicao urgente.`));
    } else if (quantidade <= estoqueMinimo) {
      resumo.minimo += 1;
      lista.push(criarAlerta(item, 'Limite minimo', 'warning', 'ph-warning-circle', `Quantidade atual: ${quantidadeFormatada}. Minimo definido: ${estoqueMinimo}.`));
    }

    if (!validade) return;

    if (validade < hoje) {
      resumo.vencidos += 1;
      lista.push(criarAlerta(item, 'Validade vencida', 'danger', 'ph-calendar-x', `Venceu em ${formatarData(validade)}.`));
    } else if (validade <= limite) {
      resumo.vencendo += 1;
      lista.push(criarAlerta(item, 'Vence em breve', 'warning', 'ph-calendar-warning', `Validade em ${formatarData(validade)}.`));
    }
  });

  return { resumo, lista };
}

function criarAlerta(item, tipo, prioridade, icone, descricao) {
  return {
    area: 'Estoque',
    titulo: item.nome || 'Item sem nome',
    categoria: item.categoria || 'Sem categoria',
    tipo,
    prioridade,
    icone,
    descricao
  };
}

function renderizarDashboard(dados) {
  const totais = dados.totais;
  const financeiro = dados.financeiro;
  const projetos = dados.projetos;
  const estoque = dados.estoque;

  atualizarTexto('total-projetos-ativos', totais.projetosAtivos);
  atualizarTexto('total-pessoas-atendidas', totais.participantes + totais.residentes);
  atualizarTexto('total-voluntarios-ativos', totais.voluntariosAtivos);
  atualizarTexto('saldo-atual', formatarMoeda(financeiro.saldo));

  atualizarTexto('total-participantes', totais.participantes);
  atualizarTexto('total-residentes', totais.residentes);
  atualizarTexto('total-funcionarios', totais.funcionarios);
  atualizarTexto('total-itens-estoque', totais.itensEstoque);

  atualizarTexto('financeiro-entradas', formatarMoeda(financeiro.entradasMes));
  atualizarTexto('financeiro-saidas', formatarMoeda(financeiro.saidasMes));
  atualizarTexto('projetos-ativos', projetos.ativos);
  atualizarTexto('projetos-suspensos', projetos.suspensos);
  atualizarTexto('projetos-encerrados', projetos.encerrados);
  atualizarTexto('voluntarios-pendentes', projetos.voluntariosPendentes);

  atualizarTexto('estoque-esgotados', estoque.esgotados);
  atualizarTexto('estoque-minimo', estoque.limiteMinimo);
  atualizarTexto('estoque-vencidos', estoque.vencidos);
  atualizarTexto('estoque-vencendo', estoque.vencendo);

  renderizarAlertasGerais(dados.alertas);
  renderizarLancamentos(financeiro.lancamentosRecentes);
  renderizarEstoqueCritico(estoque.criticos);
}

function renderizarAlertasGerais(alertas) {
  const container = document.getElementById('lista-alertas-gerais');
  container.innerHTML = '';

  if (!alertas.length) {
    renderizarMensagem(container, 'Tudo certo: nenhum alerta prioritario no momento.');
    atualizarTexto('dashboard-status', 'Nenhum alerta ativo no momento.');
    return;
  }

  atualizarTexto('dashboard-status', `${alertas.length} alerta(s) prioritario(s) encontrado(s).`);

  alertas.forEach((alerta) => {
    const item = document.createElement('article');
    item.className = 'alert-item';

    const icon = document.createElement('div');
    icon.className = `alert-icon alert-icon--${alerta.prioridade}`;
    icon.innerHTML = `<i class="ph ${alerta.icone}"></i>`;

    const content = document.createElement('div');
    content.className = 'alert-content';

    const title = document.createElement('strong');
    title.textContent = alerta.titulo;

    const description = document.createElement('span');
    description.textContent = `${alerta.area} | ${alerta.categoria} | ${alerta.descricao}`;

    const badge = document.createElement('span');
    badge.className = `alert-badge alert-badge--${alerta.prioridade}`;
    badge.textContent = alerta.tipo;

    content.append(title, description);
    item.append(icon, content, badge);
    container.appendChild(item);
  });
}

function renderizarLancamentos(lancamentos) {
  const container = document.getElementById('lista-lancamentos-recentes');
  container.innerHTML = '';

  if (!lancamentos.length) {
    renderizarMensagem(container, 'Nenhum lancamento financeiro cadastrado.');
    return;
  }

  lancamentos.forEach((lancamento) => {
    const tipo = String(lancamento.tipo || '').toUpperCase();
    const badgeClass = tipo === 'ENTRADA' ? 'badge--ativo' : 'badge--pendente';

    const item = document.createElement('div');
    item.className = 'dashboard-list-item';
    item.innerHTML = `
      <div>
        <strong>${lancamento.descricao || 'Lancamento'}</strong>
        <span>${formatarData(lancamento.data)} | ${lancamento.categoria || 'Sem categoria'}</span>
      </div>
      <div class="dashboard-list-item__meta">
        <span class="badge ${badgeClass}">${tipo || 'TIPO'}</span>
        <strong>${formatarMoeda(lancamento.valor || 0)}</strong>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderizarEstoqueCritico(itens) {
  const container = document.getElementById('lista-estoque-critico');
  container.innerHTML = '';

  if (!itens.length) {
    renderizarMensagem(container, 'Nenhum item crítico no estoque.');
    return;
  }

  // Pegamos a data atual idêntica à lógica do dashboard para descobrir o tipo do alerta
  const hoje = zerarHorario(new Date());
  const limiteValidade = new Date(hoje);
  limiteValidade.setDate(limiteValidade.getDate() + DIAS_ALERTA_VALIDADE);

  itens.forEach((item) => {
    const quantidade = Number(item.quantidade) || 0;
    const estoqueMinimo = Number(item.estoque_minimo ?? item.estoqueMinimo ?? 5);
    const validade = criarDataLocal(item.validade);
    const quantidadeFormatada = `${quantidade} ${item.unidade || 'un'}`;

    // Descobre dinamicamente a prioridade, o tipo e o ícone baseado no estado do item
    let tipo = 'Normal';
    let prioridade = 'warning';
    let icone = 'ph-warning-circle';
    let descricaoStatus = '';

    if (quantidade <= 0) {
      tipo = 'Esgotado';
      prioridade = 'danger';
      icone = 'ph-x-circle';
      descricaoStatus = `Quantidade atual: ${quantidadeFormatada}. Reposição urgente.`;
    } else if (quantidade <= estoqueMinimo) {
      tipo = 'Limite mínimo';
      prioridade = 'warning';
      icone = 'ph-warning-circle';
      descricaoStatus = `Quantidade atual: ${quantidadeFormatada}. Mínimo definido: ${estoqueMinimo}.`;
    }

    // Validação extra se o motivo do item ser crítico for a validade
    if (validade) {
      if (validade < hoje) {
        tipo = 'Vencido';
        prioridade = 'danger';
        icone = 'ph-calendar-x';
        descricaoStatus = `Venceu em ${formatarData(validade)}.`;
      } else if (validade <= limiteValidade) {
        tipo = 'Vence em breve';
        prioridade = 'warning';
        icone = 'ph-calendar-warning';
        descricaoStatus = `Validade em ${formatarData(validade)}.`;
      }
    }

    // Montando a mesma estrutura CSS que você usou na lista de alertas gerais
    const elemento = document.createElement('article');
    elemento.className = 'alert-item';

    const iconDiv = document.createElement('div');
    iconDiv.className = `alert-icon alert-icon--${prioridade}`;
    iconDiv.innerHTML = `<i class="ph ${icone}"></i>`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'alert-content';

    const title = document.createElement('strong');
    title.textContent = item.nome || 'Item sem nome';

    const description = document.createElement('span');
    description.textContent = `${item.categoria || 'Sem categoria'} | ${descricaoStatus}`;

    const badge = document.createElement('span');
    badge.className = `alert-badge alert-badge--${prioridade}`;
    badge.textContent = tipo;

    contentDiv.append(title, description);
    elemento.append(iconDiv, contentDiv, badge);
    container.appendChild(elemento);
  });
}

function renderizarMensagem(container, mensagem) {
  const empty = document.createElement('div');
  empty.className = 'alert-empty';
  empty.textContent = mensagem;
  container.appendChild(empty);
}

function renderizarErroDashboard() {
  atualizarTexto('dashboard-status', 'Nao foi possivel carregar os dados do Supabase.');
  document.querySelectorAll('[data-dashboard-value]').forEach((elemento) => {
    elemento.textContent = elemento.id.includes('saldo') || elemento.id.includes('financeiro') ? 'R$ 0,00' : '0';
  });

  renderizarMensagem(document.getElementById('lista-alertas-gerais'), 'Verifique a conexao com o Supabase e os nomes das tabelas.');
  renderizarMensagem(document.getElementById('lista-lancamentos-recentes'), 'Sem dados financeiros para exibir.');
  renderizarMensagem(document.getElementById('lista-estoque-critico'), 'Sem dados de estoque para exibir.');
}

function itemEhCritico(item, hoje, limiteValidade) {
  const quantidade = Number(item.quantidade) || 0;
  const estoqueMinimo = Number(item.estoque_minimo ?? item.estoqueMinimo ?? 5);
  const validade = criarDataLocal(item.validade);

  return quantidade <= estoqueMinimo || (validade && validade <= limiteValidade);
}

function somarLancamentos(lancamentos, tipo) {
  return lancamentos
    .filter((item) => String(item.tipo || '').toUpperCase() === tipo)
    .reduce((total, item) => total + (Number(item.valor) || 0), 0);
}

function ordenarPorValidade(a, b) {
  const dataA = criarDataLocal(a);
  const dataB = criarDataLocal(b);

  if (!dataA && !dataB) return 0;
  if (!dataA) return 1;
  if (!dataB) return -1;

  return dataA - dataB;
}

function mesmoTexto(valor, esperado) {
  return String(valor || '').trim().toLowerCase() === esperado;
}

function atualizarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function criarDataLocal(valor) {
  if (!valor) return null;

  const partes = String(valor).split('-').map(Number);
  if (partes.length === 3 && partes.every(Boolean)) {
    return zerarHorario(new Date(partes[0], partes[1] - 1, partes[2]));
  }

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : zerarHorario(data);
}

function zerarHorario(data) {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function formatarData(valor) {
  const data = valor instanceof Date ? valor : criarDataLocal(valor);
  return data ? data.toLocaleDateString('pt-BR') : 'Sem data';
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}
