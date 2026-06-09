// ==============================================
// SUPABASE (lazy singleton — same pattern as projetos.js)
// ==============================================
const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
let _supabase = null;
function getSupabase() {
    if (!_supabase) _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return _supabase;
}

// ==============================================
// CONSTANTS
// ==============================================
const API_URL = 'https://grupo-nata.onrender.com/api/lancamentos';
const SUPABASE_BUCKET = 'financeiro';
const ITENS_POR_PAGINA = 15;

// ==============================================
// STATE
// ==============================================
let lancamentos = [];
let lancamentosFiltrados = [];
let paginaAtual = 1;
let filtroTipoAtual = '';
let modoTodos = false;
let idParaDeletar = null;
let comprovanteArquivo = null;

// ==============================================
// CATEGORIES MAP
// ==============================================
const CATEGORIAS = {
    ENTRADA: [
        { value: 'VENDA_PRODUTO', label: 'Venda de Produto' },
        { value: 'DOACAO',        label: 'Doação' },
        { value: 'COLETA_OLEO',   label: 'Coleta de Óleo' },
        { value: 'OUTRO',         label: 'Outro' },
    ],
    SAIDA: [
        { value: 'ALIMENTACAO', label: 'Alimentação' },
        { value: 'MANUTENCAO',  label: 'Manutenção' },
        { value: 'UTILITIES',   label: 'Água / Luz / Internet' },
        { value: 'MATERIAL',    label: 'Material' },
        { value: 'TRANSPORTE',  label: 'Transporte' },
        { value: 'SALARIO',     label: 'Salário' },
        { value: 'OUTRO',       label: 'Outro' },
    ]
};

// ==============================================
// INICIALIZAÇÃO
// ==============================================
async function inicializar() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth(); // 0-based

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const toISO = d => d.toISOString().split('T')[0];

    document.getElementById('filtroDataInicio').value = toISO(primeiroDia);
    document.getElementById('filtroDataFim').value = toISO(ultimoDia);

    await Promise.all([carregarLancamentos(), carregarResumo()]);
}

// ==============================================
// CARREGAR LANÇAMENTOS
// ==============================================
async function carregarLancamentos() {
    try {
        let url = API_URL;

        if (!modoTodos) {
            const inicio = document.getElementById('filtroDataInicio').value;
            const fim = document.getElementById('filtroDataFim').value;
            const params = new URLSearchParams();
            if (inicio) params.append('dataInicio', inicio);
            if (fim) params.append('dataFim', fim);
            const qs = params.toString();
            if (qs) url += '?' + qs;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao buscar lançamentos');
        lancamentos = await res.json();

        renderizarTabela();
    } catch (err) {
        exibirErroGlobal(err.message);
    }
}

// ==============================================
// CARREGAR RESUMO
// ==============================================
async function carregarResumo() {
    try {
        let url = `${API_URL}/resumo`;

        if (!modoTodos) {
            const inicio = document.getElementById('filtroDataInicio').value;
            const fim = document.getElementById('filtroDataFim').value;
            const params = new URLSearchParams();
            if (inicio) params.append('dataInicio', inicio);
            if (fim) params.append('dataFim', fim);
            const qs = params.toString();
            if (qs) url += '?' + qs;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao buscar resumo');
        const dados = await res.json();

        animarContador(document.getElementById('totalEntradas'), dados.totalEntradas ?? 0);
        animarContador(document.getElementById('totalSaidas'), dados.totalSaidas ?? 0);

        const saldoVal = dados.saldo ?? 0;
        const saldoEl = document.getElementById('saldo');
        saldoEl.classList.remove('positivo', 'negativo');
        if (saldoVal > 0) saldoEl.classList.add('positivo');
        else if (saldoVal < 0) saldoEl.classList.add('negativo');
        animarContador(saldoEl, saldoVal);

        // Período label
        const inicio = document.getElementById('filtroDataInicio').value;
        const fim = document.getElementById('filtroDataFim').value;
        const periodoEl = document.getElementById('periodoLabel');
        if (modoTodos) {
            periodoEl.textContent = 'Todos os períodos';
        } else if (inicio && fim) {
            periodoEl.textContent = `${formatarData(inicio)} – ${formatarData(fim)}`;
        } else {
            periodoEl.textContent = '';
        }
    } catch (err) {
        exibirErroGlobal(err.message);
    }
}

// ==============================================
// FILTRAR (datas changed)
// ==============================================
async function filtrar() {
    modoTodos = false;
    await Promise.all([carregarLancamentos(), carregarResumo()]);
}

// ==============================================
// SET FILTRO TIPO (in-memory, no new fetch)
// ==============================================
function setFiltroTipo(tipo) {
    filtroTipoAtual = tipo;

    // Update active tab UI
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.classList.remove('filter-tab--active');
    });
    const tabIndex = tipo === '' ? 0 : tipo === 'ENTRADA' ? 1 : 2;
    const tabs = document.querySelectorAll('.filter-tab');
    if (tabs[tabIndex]) tabs[tabIndex].classList.add('filter-tab--active');

    paginaAtual = 1;
    renderizarTabela();
}

// ==============================================
// VER TODOS
// ==============================================
async function verTodos() {
    modoTodos = true;
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    await Promise.all([carregarLancamentos(), carregarResumo()]);
}

// ==============================================
// VOLTAR MÊS ATUAL
// ==============================================
async function voltarMesAtual() {
    modoTodos = false;
    await inicializar();
}

// ==============================================
// RENDERIZAR TABELA
// ==============================================
function renderizarTabela() {
    // Apply type filter in memory
    if (filtroTipoAtual !== '') {
        lancamentosFiltrados = lancamentos.filter(l => l.tipo === filtroTipoAtual);
    } else {
        lancamentosFiltrados = [...lancamentos];
    }

    const tbody = document.getElementById('bodyLancamentos');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';

    if (lancamentosFiltrados.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('paginacao').innerHTML = '';
        return;
    }
    emptyState.style.display = 'none';

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const slice = lancamentosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);

    slice.forEach(item => {
        const tipo = item.tipo || '';
        const tipoLower = tipo.toLowerCase();

        const comprovanteCell = item.comprovanteUrl
            ? `<button class="comprovante-btn" data-tooltip="Ver comprovante" onclick="window.open('${item.comprovanteUrl}', '_blank')">📎</button>`
            : '—';

        const sinal = tipo === 'ENTRADA' ? '+' : '−';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatarData(item.data)}</td>
            <td>
                <span class="tipo-indicator tipo-indicator--${tipoLower}"></span>${item.descricao || '—'}
            </td>
            <td><span class="categoria-badge">${labelCategoria(item.categoria)}</span></td>
            <td>${labelFormaPagamento(item.formaPagamento)}</td>
            <td>${item.destinatario || '—'}</td>
            <td>${comprovanteCell}</td>
            <td><span class="valor-cell valor-cell--${tipoLower}">${sinal} ${formatarMoeda(item.valor)}</span></td>
            <td>
                <div class="actions">
                    <button class="action-btn" onclick="abrirModalVer(${item.id})">Ver</button>
                    <button class="action-btn" onclick="abrirModalEdicao(${item.id})">Editar</button>
                    <button class="action-btn action-btn--danger" onclick="abrirModalDeletar(${item.id})">Excluir</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderizarPaginacao();
}

// ==============================================
// PAGINAÇÃO
// ==============================================
function renderizarPaginacao() {
    const totalPaginas = Math.ceil(lancamentosFiltrados.length / ITENS_POR_PAGINA);
    const container = document.getElementById('paginacao');
    container.innerHTML = '';
    if (totalPaginas <= 1) return;

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === paginaAtual ? ' page-btn--active' : '');
        btn.textContent = i;
        btn.onclick = () => { paginaAtual = i; renderizarTabela(); };
        container.appendChild(btn);
    }
}

// ==============================================
// MODAL LANÇAMENTO — abrir (criar)
// ==============================================
function abrirModalLancamento(tipo) {
    // Clear form
    document.getElementById('formId').value = '';
    document.getElementById('formTipo').value = tipo;
    document.getElementById('formDescricao').value = '';
    document.getElementById('formValor').value = '';
    document.getElementById('formData').value = new Date().toISOString().split('T')[0];
    document.getElementById('formFormaPagamento').value = '';
    document.getElementById('formDestinatario').value = '';
    document.getElementById('formObservacoes').value = '';

    // Modal title
    document.getElementById('modalTitulo').textContent =
        tipo === 'ENTRADA' ? '↑ Nova Entrada' : '↓ Nova Saída';

    // Populate categories
    const selectCat = document.getElementById('formCategoria');
    selectCat.innerHTML = '<option value="">Selecione</option>';
    (CATEGORIAS[tipo] || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.value;
        opt.textContent = c.label;
        selectCat.appendChild(opt);
    });

    // Show/hide destinatário
    document.getElementById('wrapDestinatario').style.display =
        tipo === 'SAIDA' ? 'block' : 'none';

    // Reset comprovante
    comprovanteArquivo = null;
    document.getElementById('comprovanteNome').textContent = '📎 Clique para anexar comprovante';
    document.getElementById('comprovanteUploadArea').classList.remove('has-file');
    document.getElementById('formComprovante').value = '';

    ocultarErro();
    document.getElementById('modalLancamento').style.display = 'flex';
}

// ==============================================
// MODAL LANÇAMENTO — abrir (editar)
// ==============================================
function abrirModalEdicao(id) {
    const item = lancamentos.find(l => l.id === id);
    if (!item) return;

    const tipo = item.tipo || 'ENTRADA';

    document.getElementById('formId').value = item.id;
    document.getElementById('formTipo').value = tipo;
    document.getElementById('formDescricao').value = item.descricao || '';
    document.getElementById('formValor').value = item.valor ?? '';
    document.getElementById('formData').value = item.data || '';
    document.getElementById('formFormaPagamento').value = item.formaPagamento || '';
    document.getElementById('formDestinatario').value = item.destinatario || '';
    document.getElementById('formObservacoes').value = item.observacoes || '';

    // Modal title
    document.getElementById('modalTitulo').textContent = 'Editar Lançamento';

    // Populate categories
    const selectCat = document.getElementById('formCategoria');
    selectCat.innerHTML = '<option value="">Selecione</option>';
    (CATEGORIAS[tipo] || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.value;
        opt.textContent = c.label;
        selectCat.appendChild(opt);
    });
    selectCat.value = item.categoria || '';

    // Show/hide destinatário
    document.getElementById('wrapDestinatario').style.display =
        tipo === 'SAIDA' ? 'block' : 'none';

    // Comprovante existente
    comprovanteArquivo = null;
    document.getElementById('formComprovante').value = '';
    if (item.comprovanteUrl) {
        document.getElementById('comprovanteNome').textContent = 'Comprovante existente';
        document.getElementById('comprovanteUploadArea').classList.add('has-file');
    } else {
        document.getElementById('comprovanteNome').textContent = '📎 Clique para anexar comprovante';
        document.getElementById('comprovanteUploadArea').classList.remove('has-file');
    }

    ocultarErro();
    document.getElementById('modalLancamento').style.display = 'flex';
}

// ==============================================
// MODAL LANÇAMENTO — fechar
// ==============================================
function fecharModal() {
    document.getElementById('modalLancamento').style.display = 'none';
    comprovanteArquivo = null;
}

// ==============================================
// SALVAR LANÇAMENTO (POST / PUT)
// ==============================================
async function salvarLancamento() {
    const id = document.getElementById('formId').value;
    const tipo = document.getElementById('formTipo').value;
    const descricao = document.getElementById('formDescricao').value.trim();
    const valorRaw = document.getElementById('formValor').value;
    const valor = parseFloat(valorRaw);
    const data = document.getElementById('formData').value;
    const categoria = document.getElementById('formCategoria').value;
    const formaPagamento = document.getElementById('formFormaPagamento').value;
    const destinatario = document.getElementById('formDestinatario').value.trim();
    const observacoes = document.getElementById('formObservacoes').value.trim();

    // Validações
    if (!descricao) {
        exibirErro('Descrição obrigatória.');
        return;
    }
    if (isNaN(valor) || valor <= 0) {
        exibirErro('Informe um valor válido maior que zero.');
        return;
    }
    if (!data) {
        exibirErro('Data obrigatória.');
        return;
    }
    if (!categoria) {
        exibirErro('Categoria obrigatória.');
        return;
    }
    if (tipo === 'SAIDA' && !destinatario) {
        exibirErro('Destinatário obrigatório para saídas.');
        return;
    }

    // Upload do comprovante (se selecionado)
    let comprovanteUrl = null;

    // Preservar URL existente em edição (se não foi trocado o arquivo)
    if (!comprovanteArquivo && id) {
        const itemExistente = lancamentos.find(l => l.id == id);
        if (itemExistente) comprovanteUrl = itemExistente.comprovanteUrl || null;
    }

    if (comprovanteArquivo) {
        try {
            const ext = comprovanteArquivo.name.split('.').pop();
            const nomeArquivo = `comp_${Date.now()}.${ext}`;
            const { error: uploadError } = await getSupabase().storage
                .from(SUPABASE_BUCKET)
                .upload(nomeArquivo, comprovanteArquivo);
            if (uploadError) throw uploadError;
            const { data: urlData } = getSupabase().storage
                .from(SUPABASE_BUCKET)
                .getPublicUrl(nomeArquivo);
            comprovanteUrl = urlData.publicUrl;
        } catch (err) {
            if (err.message && err.message.includes('Bucket')) {
                exibirErro(`Bucket "${SUPABASE_BUCKET}" não encontrado. Crie-o em Supabase Storage → New bucket → nome: ${SUPABASE_BUCKET} → Public.`);
            } else {
                exibirErro('Erro ao enviar comprovante: ' + err.message);
            }
            return;
        }
    }

    const body = {
        tipo,
        descricao,
        valor,
        data,
        categoria,
        formaPagamento: formaPagamento || null,
        destinatario: destinatario || null,
        observacoes: observacoes || null,
        comprovanteUrl
    };

    try {
        const url = id ? `${API_URL}/${id}` : API_URL;
        const metodo = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            let msg = 'Não foi possível salvar o lançamento.';
            try {
                const corpo = await res.json();
                msg = corpo.erro || msg;
            } catch (_) {}
            throw new Error(msg);
        }

        fecharModal();
        await Promise.all([carregarLancamentos(), carregarResumo()]);
    } catch (err) {
        exibirErro(err.message || 'Não foi possível salvar o lançamento. Verifique se o servidor está rodando.');
        console.error(err);
    }
}

// ==============================================
// COMPROVANTE SELECT
// ==============================================
function handleComprovanteSelect(event) {
    comprovanteArquivo = event.target.files[0];
    if (comprovanteArquivo) {
        document.getElementById('comprovanteNome').textContent = comprovanteArquivo.name;
        document.getElementById('comprovanteUploadArea').classList.add('has-file');
    }
}

// ==============================================
// MODAL VER (read-only)
// ==============================================
function abrirModalVer(id) {
    const item = lancamentos.find(l => l.id === id);
    if (!item) return;

    const tipo = item.tipo || '';
    const tipoLower = tipo.toLowerCase();

    let html = `
        <div class="lancamento-tipo-badge lancamento-tipo-badge--${tipoLower}">
            ${tipo === 'ENTRADA' ? '↑ Entrada' : '↓ Saída'}
        </div>
        <div class="lancamento-valor-display lancamento-valor-display--${tipoLower}">
            ${formatarMoeda(item.valor)}
        </div>
        <div class="detail-grid">
            <div class="detail-item detail-item--full">
                <span class="detail-label">Descrição</span>
                <span class="detail-value">${item.descricao || '—'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Data</span>
                <span class="detail-value">${formatarData(item.data)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Categoria</span>
                <span class="detail-value">${labelCategoria(item.categoria)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Forma de Pagamento</span>
                <span class="detail-value">${labelFormaPagamento(item.formaPagamento)}</span>
            </div>
    `;

    if (tipo === 'SAIDA') {
        html += `
            <div class="detail-item">
                <span class="detail-label">Destinatário</span>
                <span class="detail-value">${item.destinatario || '—'}</span>
            </div>
        `;
    }

    if (item.observacoes) {
        html += `
            <div class="detail-item detail-item--full">
                <span class="detail-label">Observações</span>
                <span class="detail-value">${item.observacoes}</span>
            </div>
        `;
    }

    if (item.comprovanteUrl) {
        html += `
            <div class="detail-item detail-item--full">
                <span class="detail-label">Comprovante</span>
                <span class="detail-value">
                    <a href="${item.comprovanteUrl}" target="_blank" rel="noopener noreferrer">Ver comprovante 📎</a>
                </span>
            </div>
        `;
    }

    html += `</div>`;

    document.getElementById('modalVerConteudo').innerHTML = html;
    document.getElementById('modalVer').style.display = 'flex';
}

function fecharModalVer() {
    document.getElementById('modalVer').style.display = 'none';
}

// ==============================================
// MODAL DELETAR
// ==============================================
function abrirModalDeletar(id) {
    idParaDeletar = id;
    document.getElementById('modalDeletar').style.display = 'flex';
}

function fecharModalDeletar() {
    idParaDeletar = null;
    document.getElementById('modalDeletar').style.display = 'none';
}

async function confirmarDeletar() {
    if (!idParaDeletar) return;
    try {
        await fetch(`${API_URL}/${idParaDeletar}`, { method: 'DELETE' });
        fecharModalDeletar();
        await Promise.all([carregarLancamentos(), carregarResumo()]);
    } catch (err) {
        exibirErroGlobal(err.message);
    }
}

// ==============================================
// FORMATTERS
// ==============================================
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);
}

function animarContador(elemento, valorFinal, duracao = 700) {
    const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const inicio = performance.now();
    const valorNum = Number(valorFinal) || 0;

    function passo(agora) {
        const t = Math.min((agora - inicio) / duracao, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        elemento.textContent = fmt.format(valorNum * eased);
        if (t < 1) requestAnimationFrame(passo);
        else elemento.textContent = fmt.format(valorNum);
    }

    requestAnimationFrame(passo);
}

function formatarData(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = String(dateStr).split('-');
    return `${d}/${m}/${y}`;
}

function labelCategoria(value) {
    const all = [...CATEGORIAS.ENTRADA, ...CATEGORIAS.SAIDA];
    return all.find(c => c.value === value)?.label || value || '—';
}

function labelFormaPagamento(value) {
    const map = {
        DINHEIRO: 'Dinheiro',
        PIX: 'Pix',
        TRANSFERENCIA: 'Transferência',
        BOLETO: 'Boleto'
    };
    return map[value] || value || '—';
}

// ==============================================
// ERROR HELPERS
// ==============================================
function exibirErro(msg) {
    const el = document.getElementById('formErro');
    if (el) {
        el.textContent = msg;
        el.classList.add('visivel');
    }
}

function ocultarErro() {
    const el = document.getElementById('formErro');
    if (el) {
        el.textContent = '';
        el.classList.remove('visivel');
    }
}

function exibirErroGlobal(msg) {
    console.error('[Financeiro]', msg);
}

// ==============================================
// ENTRY POINT
// ==============================================
document.addEventListener('DOMContentLoaded', inicializar);
