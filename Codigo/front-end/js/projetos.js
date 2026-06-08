// ==============================================
// SUPABASE (apenas para upload de imagem)
// ==============================================
const SUPABASE_URL = 'https://raykwpryvxfittrlkbey.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C5oimXD8Ez6Ngh_MpSg01g_9J6F4Eam';
let _supabase = null;
function getSupabase() {
    if (!_supabase) _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return _supabase;
}

// ==============================================
// CONSTANTES DA API
// ==============================================
const API_URL = 'http://localhost:8080/api/projetos';
const API_PARTICIPANTES = 'http://localhost:8080/api/participantes';
const API_FUNCIONARIOS_URL = 'http://localhost:8080/api/funcionarios';

// ==============================================
// ESTADO
// ==============================================
let projetos = [];
let projetosFiltrados = [];
let paginaAtual = 1;
const ITENS_POR_PAGINA = 10;
let idParaDeletar = null;
let projetoAtual = null;
let participantesVinculados = [];
let participanteEncontrado = null;
let contagemParticipantes = {};
let _debounceTimer = null;
/** Lista de funcionários vinda da API (cache para montar o select de responsável). */
let listaFuncionariosCache = [];

/** ID do funcionário no JSON da API (Jackson pode enviar id_funcionario ou idFuncionario). */
function idDoFuncionario(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const raw = obj.id_funcionario ?? obj.idFuncionario ?? obj.id;
    if (raw === undefined || raw === null || raw === '') return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
}

function nomeDoFuncionario(obj) {
    if (!obj || typeof obj !== 'object') return '';
    return obj.nome_funcionario || obj.nomeFuncionario || obj.nome || '';
}

// ==============================================
// INICIALIZAÇÃO
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        await carregarFuncionariosSelect();
        await carregarProjetos();
    })();
    const rpTel = document.getElementById('rpTelefone');
    if (rpTel) rpTel.addEventListener('input', () => mascararTelefoneResponsavel(rpTel));
});

// ==============================================
// CARREGAR FUNCIONÁRIOS (para o select)
// ==============================================
/** Quando o modal de projeto está aberto em edição, exclui esse projeto da checagem de “já é responsável”. */
function contextoExcluirParaSelectResponsavel() {
    const modal = document.getElementById('modalForm');
    if (!modal || modal.style.display !== 'flex') return null;
    const idStr = document.getElementById('formId').value;
    if (!idStr) return null;
    const n = parseInt(idStr, 10);
    return Number.isNaN(n) ? null : n;
}

function funcionarioJaResponsavelEmOutroProjetoAtivo(funcId, projetoIdExcluir) {
    const fid = Number(funcId);
    if (Number.isNaN(fid)) return false;
    return projetos.some(p => {
        if (projetoIdExcluir != null && Number(p.id) === Number(projetoIdExcluir)) return false;
        const st = (p.status || '').toLowerCase().trim();
        if (st !== 'ativo') return false;
        const fr = p.funcionarioResponsavel;
        const rid = idDoFuncionario(fr);
        return rid != null && rid === fid;
    });
}

function popularSelectResponsavel(projetoIdExcluir) {
    const select = document.getElementById('formResponsavel');
    if (!select) return;
    const valorSalvo = select.value;
    select.innerHTML = '';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = 'Selecione um funcionário...';
    select.appendChild(opt0);
    listaFuncionariosCache.forEach(f => {
        const id = idDoFuncionario(f);
        if (id == null) return;
        if (funcionarioJaResponsavelEmOutroProjetoAtivo(id, projetoIdExcluir)) return;
        const opt = document.createElement('option');
        opt.value = String(id);
        const nome = f.nome_funcionario ?? f.nomeFuncionario ?? f.nome;
        opt.textContent = `${nome || 'Sem nome'} (${f.cargo || 'sem cargo'})`;
        select.appendChild(opt);
    });
    if ([...select.options].some(o => o.value === valorSalvo)) {
        select.value = valorSalvo;
    } else if (valorSalvo) {
        select.value = '';
    }
}

async function carregarFuncionariosSelect() {
    try {
        const res = await fetch(API_FUNCIONARIOS_URL);
        if (!res.ok) return;
        listaFuncionariosCache = await res.json();
        popularSelectResponsavel(contextoExcluirParaSelectResponsavel());
    } catch (e) {
        console.error('Erro ao carregar funcionários:', e);
    }
}

/** Formata telefone BR: (XX) XXXX-XXXX (10 dígitos) ou (XX) XXXXX-XXXX (11, celular com 9). */
function formatarTelefoneBR(valor) {
    const d = String(valor).replace(/\D/g, '').slice(0, 11);
    if (!d) return '';
    const ddd = d.slice(0, 2);
    if (d.length <= 2) return `(${ddd}`;
    const rest = d.slice(2);
    const celular = rest[0] === '9';
    if (celular) {
        if (rest.length <= 5) return `(${ddd}) ${rest}`;
        return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    }
    if (rest.length <= 4) return `(${ddd}) ${rest}`;
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

function mascararTelefoneResponsavel(input) {
    input.value = formatarTelefoneBR(input.value);
}

// ==============================================
// CARREGAR PROJETOS
// ==============================================
async function carregarProjetos() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Erro ao buscar projetos');
        projetos = await res.json();
        projetosFiltrados = [...projetos];
        contagemParticipantes = await carregarContagemParticipantes(projetos);
        renderizarTabela();
        popularSelectResponsavel(contextoExcluirParaSelectResponsavel());
    } catch (e) {
        console.error('Erro ao carregar projetos:', e);
    }
}

// ==============================================
// CONTAGEM DE PARTICIPANTES
// ==============================================
async function carregarContagemParticipantes(lista) {
    const promises = lista.map(p =>
        fetch(`${API_URL}/${p.id}/participantes`)
            .then(r => r.json())
            .then(arr => ({ id: p.id, total: arr.length }))
            .catch(() => ({ id: p.id, total: 0 }))
    );
    const resultados = await Promise.all(promises);
    return Object.fromEntries(resultados.map(r => [r.id, r.total]));
}

// ==============================================
// FILTROS
// ==============================================
function filtrar() {
    const termo = document.getElementById('filtroNome').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const tipo = document.getElementById('filtroTipo').value;

    projetosFiltrados = projetos.filter(p => {
        const matchNome = p.nome.toLowerCase().includes(termo);
        const matchStatus = !status || p.status === status;
        const matchTipo = !tipo || p.tipo === tipo;
        return matchNome && matchStatus && matchTipo;
    });

    paginaAtual = 1;
    renderizarTabela();
}

// ==============================================
// RENDERIZAR TABELA
// ==============================================
function renderizarTabela() {
    const tbody = document.getElementById('tabelaProjetos');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';

    if (projetosFiltrados.length === 0) {
        emptyState.style.display = 'block';
        document.getElementById('paginacao').innerHTML = '';
        return;
    }
    emptyState.style.display = 'none';

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const pagina = projetosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);

    pagina.forEach(p => {
        const total = contagemParticipantes[p.id] ?? 0;
        const thumbHtml = p.imagemUrl
            ? `<div class="project-thumb" style="background-image:url('${p.imagemUrl}')"></div>`
            : `<div class="project-thumb project-thumb--empty"><i class="ph ph-image"></i></div>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="project-cell">
                    ${thumbHtml}
                    <div>
                        <div class="project-name">${p.nome}</div>
                        ${p.descricao ? `<div class="project-desc">${p.descricao}</div>` : ''}
                    </div>
                </div>
            </td>
            <td>${p.tipo || '—'}</td>
            <td>${p.publicoAlvo || '—'}</td>
            <td>${formatarData(p.dataInicio)}</td>
            <td>${p.dataFim ? formatarData(p.dataFim) : 'Contínuo'}</td>
            <td><span class="badge ${badgeClass(p.status)}">${p.status}</span></td>
            <td>${p.funcionarioResponsavel ? (nomeDoFuncionario(p.funcionarioResponsavel) || '—') : '—'}</td>
            <td><span class="participantes-count${total === 0 ? ' participantes-count--empty' : ''}">${total}</span></td>
            <td>
                <div class="actions">
                    <button class="action-btn" onclick="abrirModalVer(${p.id})">Ver</button>
                    <button class="action-btn" onclick="abrirModalEdicao(${p.id})">Editar</button>
                    <button class="action-btn action-btn--danger" onclick="abrirModalDeletar(${p.id}, '${p.nome.replace(/'/g, "\\'")}')">Excluir</button>
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
    const totalPaginas = Math.ceil(projetosFiltrados.length / ITENS_POR_PAGINA);
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
// MODAL EDIÇÃO (fechar)
// ==============================================
function fecharModalForm() {
    document.getElementById('modalForm').style.display = 'none';
}

// ==============================================
// MODAL EDIÇÃO
// ==============================================
function abrirModalEdicao(id) {
    const p = projetos.find(x => x.id === id);
    if (!p) return;

    document.getElementById('formId').value = p.id;
    popularSelectResponsavel(p.id);
    document.getElementById('formNome').value = p.nome || '';
    document.getElementById('formDescricao').value = p.descricao || '';
    document.getElementById('formTipo').value = p.tipo || '';
    document.getElementById('formPublicoAlvo').value = p.publicoAlvo || '';
    preencherHorariosProjeto(p.horarios || '');
    document.getElementById('formTermoResponsabilidade').value = p.termoResponsabilidade || '';
    document.getElementById('formDataInicio').value = p.dataInicio || '';
    document.getElementById('formDataFim').value = p.dataFim || '';
    document.getElementById('formStatus').value = p.status || 'Ativo';
    const idResp = idDoFuncionario(p.funcionarioResponsavel);
    document.getElementById('formResponsavel').value = idResp != null ? String(idResp) : '';
    document.getElementById('formImagem').value = '';

    const preview = document.getElementById('imagePreview');
    if (p.imagemUrl) {
        preview.style.backgroundImage = `url('${p.imagemUrl}')`;
        preview.classList.add('image-preview--filled');
    } else {
        preview.style.backgroundImage = '';
        preview.classList.remove('image-preview--filled');
    }

    ocultarErro();
    document.getElementById('modalFormTitulo').textContent = 'Editar Projeto';
    document.getElementById('modalForm').style.display = 'flex';
}

// ==============================================
// PREVIEW DE IMAGEM
// ==============================================
function previewImagem(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const preview = document.getElementById('imagePreview');
        preview.style.backgroundImage = `url('${e.target.result}')`;
        preview.classList.add('image-preview--filled');
    };
    reader.readAsDataURL(file);
}

// ==============================================
// SALVAR PROJETO (POST / PUT)
// ==============================================
async function salvarProjeto() {
    const id = document.getElementById('formId').value;
    const nome = document.getElementById('formNome').value.trim();
    const tipo = document.getElementById('formTipo').value;
    const publicoAlvo = document.getElementById('formPublicoAlvo').value;
    const dataInicio = document.getElementById('formDataInicio').value;

    if (!nome || !tipo || !publicoAlvo || !dataInicio) {
        exibirErro('Preencha os campos obrigatórios: Nome, Tipo, Público-alvo e Data de Início.');
        return;
    }

    // Upload de imagem se houver
    const projetoEmEdicao = id ? projetos.find(p => p.id == id) : null;
    let imagemUrl = projetoEmEdicao?.imagemUrl || null;

    const arquivoImagem = document.getElementById('formImagem').files[0];
    if (arquivoImagem) {
        try {
            const ext = arquivoImagem.name.split('.').pop();
            const nomeArquivo = `projeto_${Date.now()}.${ext}`;
            const { error: uploadError } = await getSupabase().storage
                .from('projetos')
                .upload(nomeArquivo, arquivoImagem);
            if (uploadError) throw uploadError;
            const { data: publicUrlData } = getSupabase().storage
                .from('projetos')
                .getPublicUrl(nomeArquivo);
            imagemUrl = publicUrlData.publicUrl;
        } catch (e) {
            const msg = e?.message || '';
            if (msg.includes('Bucket not found') || msg.includes('bucket') || msg.includes('not found')) {
                exibirErro('Bucket "projetos" não encontrado no Supabase Storage. Crie-o em Storage → New bucket → nome: projetos → Public.');
            } else {
                exibirErro(`Erro no upload: ${msg || 'verifique o console para detalhes.'}`);
            }
            console.error('[Upload erro]', e);
            return;
        }
    }

    const responsavelId = document.getElementById('formResponsavel').value;
    const payload = {
        nome,
        descricao: document.getElementById('formDescricao').value.trim(),
        tipo,
        publicoAlvo,
        horarios: obterHorariosProjetoSelecionados(),
        termoResponsabilidade: document.getElementById('formTermoResponsabilidade').value.trim(),
        dataInicio,
        dataFim: document.getElementById('formDataFim').value || null,
        status: document.getElementById('formStatus').value,
        imagemUrl,
        funcionarioResponsavel: responsavelId ? { id_funcionario: parseInt(responsavelId) } : null
    };

    try {
        const url = id ? `${API_URL}/${id}` : API_URL;
        const metodo = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            let msg = 'Não foi possível salvar o projeto.';
            try {
                const corpo = await res.json();
                msg = corpo.erro || msg;
            } catch (_) {}
            throw new Error(msg);
        }
        fecharModalForm();
        await carregarProjetos();
    } catch (e) {
        exibirErro(e.message || 'Não foi possível salvar o projeto. Verifique se o servidor está rodando.');
        console.error(e);
    }
}

function obterHorariosProjetoSelecionados() {
    return Array.from(document.querySelectorAll('input[name="form-horario-projeto"]:checked'))
        .map(input => input.value)
        .join(', ');
}

function preencherHorariosProjeto(horarios) {
    const selecionados = new Set(String(horarios || '').split(',').map(item => item.trim()).filter(Boolean));
    document.querySelectorAll('input[name="form-horario-projeto"]').forEach(input => {
        input.checked = selecionados.has(input.value);
    });
    const campo = document.getElementById('formHorarios');
    if (campo) campo.value = [...selecionados].join(', ');
}

// ==============================================
// MODAL VISUALIZAR
// ==============================================
async function abrirModalVer(id) {
    projetoAtual = projetos.find(x => x.id === id);
    if (!projetoAtual) return;

    document.getElementById('modalVerTitulo').textContent = projetoAtual.nome;

    document.getElementById('modalVerConteudo').innerHTML = `
        <div class="detail-grid">
            <div class="detail-item detail-item--full">
                <span class="detail-label">Nome</span>
                <span class="detail-value">${projetoAtual.nome}</span>
            </div>
            ${projetoAtual.imagemUrl ? `
            <div class="detail-item detail-item--full">
                <img src="${projetoAtual.imagemUrl}" class="detail-imagem" alt="Imagem do projeto">
            </div>` : ''}
            <div class="detail-item detail-item--full">
                <span class="detail-label">Descrição</span>
                <span class="detail-value">${projetoAtual.descricao || '—'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tipo</span>
                <span class="detail-value">${projetoAtual.tipo || '—'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Público-alvo</span>
                <span class="detail-value">${projetoAtual.publicoAlvo || '—'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Data de Início</span>
                <span class="detail-value">${formatarData(projetoAtual.dataInicio)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Data de Término</span>
                <span class="detail-value">${projetoAtual.dataFim ? formatarData(projetoAtual.dataFim) : 'Contínuo'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="badge ${badgeClass(projetoAtual.status)}">${projetoAtual.status}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Responsável</span>
                <span class="detail-value">${projetoAtual.funcionarioResponsavel ? (nomeDoFuncionario(projetoAtual.funcionarioResponsavel) || '—') : '—'}</span>
            </div>
        </div>
    `;

    trocarAba('detalhes');
    await carregarParticipantesVinculados(id);
    document.getElementById('modalVer').style.display = 'flex';
}

function fecharModalVer() {
    document.getElementById('modalVer').style.display = 'none';
    projetoAtual = null;
    participanteEncontrado = null;
    limparBuscaParticipante();
}

// ==============================================
// ABAS DO MODAL VER
// ==============================================
function trocarAba(aba) {
    const isDetalhes = aba === 'detalhes';
    document.getElementById('abaDetalhes').style.display = isDetalhes ? 'block' : 'none';
    document.getElementById('abaParticipantes').style.display = isDetalhes ? 'none' : 'block';
    document.getElementById('tabBtnDetalhes').classList.toggle('tab-btn--active', isDetalhes);
    document.getElementById('tabBtnParticipantes').classList.toggle('tab-btn--active', !isDetalhes);
}

// ==============================================
// PARTICIPANTES VINCULADOS
// ==============================================
async function carregarParticipantesVinculados(idProjeto) {
    try {
        const res = await fetch(`${API_URL}/${idProjeto}/participantes`);
        participantesVinculados = await res.json();
        document.getElementById('tabCountParticipantes').textContent = participantesVinculados.length;
        contagemParticipantes[idProjeto] = participantesVinculados.length;
        renderizarParticipantesVinculados();
    } catch (e) {
        console.error('Erro ao carregar participantes:', e);
    }
}

function renderizarParticipantesVinculados() {
    const container = document.getElementById('listaParticipantesVinculados');
    if (participantesVinculados.length === 0) {
        container.innerHTML = '<p class="participantes-empty">Nenhum participante vinculado ainda.</p>';
        return;
    }
    container.innerHTML = `
        <div class="participantes-list">
            ${participantesVinculados.map(p => `
                <div class="participante-row">
                    <div class="participante-row__info">
                        <span class="participante-row__nome">${p.nome || '—'}</span>
                        <span class="participante-row__sub">${p.nomeResponsavel ? `Resp: ${p.nomeResponsavel}` : ''}${p.serie ? ` · ${p.serie}` : ''}${p.dataVinculo ? ` · Vinculado em ${formatarData(p.dataVinculo)}` : ''}</span>
                    </div>
                    <button class="btn btn-secondary btn--sm" onclick="removerVinculo(${p.idParticipante})">Remover</button>
                </div>
            `).join('')}
        </div>
    `;
}

// ==============================================
// BUSCAR PARTICIPANTE (debounce)
// ==============================================
function buscarParticipante() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(_executarBuscaParticipante, 400);
}

async function _executarBuscaParticipante() {
    const q = document.getElementById('buscaParticipante').value.trim();
    const resultadoBusca = document.getElementById('resultadoBusca');
    const encontrado = document.getElementById('resultadoEncontrado');
    const naoEncontrado = document.getElementById('resultadoNaoEncontrado');

    if (!q) {
        resultadoBusca.style.display = 'none';
        participanteEncontrado = null;
        return;
    }

    try {
        const res = await fetch(`${API_PARTICIPANTES}/buscar?q=${encodeURIComponent(q)}`);
        const lista = await res.json();
        resultadoBusca.style.display = 'block';

        if (lista.length > 0) {
            participanteEncontrado = lista[0];
            document.getElementById('resultNome').textContent = participanteEncontrado.nome;
            document.getElementById('resultResponsavel').textContent =
                participanteEncontrado.nomeResponsavel
                    ? `Resp: ${participanteEncontrado.nomeResponsavel}`
                    : '';
            encontrado.style.display = 'flex';
            naoEncontrado.style.display = 'none';
        } else {
            participanteEncontrado = null;
            encontrado.style.display = 'none';
            naoEncontrado.style.display = 'flex';
        }
    } catch (e) {
        console.error('Erro ao buscar participante:', e);
    }
}

// ==============================================
// VINCULAR PARTICIPANTE ENCONTRADO
// ==============================================
async function vincularParticipanteEncontrado() {
    if (!participanteEncontrado || !projetoAtual) return;

    try {
        const res = await fetch(`${API_URL}/${projetoAtual.id}/participantes/${participanteEncontrado.id}`, {
            method: 'POST'
        });

        if (!res.ok) {
            const corpo = await res.json();
            mostrarFeedbackBusca(corpo.erro || 'Erro ao vincular participante.');
            return;
        }

        limparBuscaParticipante();
        await carregarParticipantesVinculados(projetoAtual.id);
    } catch (e) {
        console.error('Erro ao vincular:', e);
    }
}

function mostrarFeedbackBusca(msg) {
    document.getElementById('resultNome').textContent = msg;
    document.getElementById('resultResponsavel').textContent = '';
}

// ==============================================
// FORM CADASTRO RÁPIDO
// ==============================================
function abrirFormNovoParticipante() {
    // pré-preenche com o termo buscado se houver, senão abre em branco
    const q = document.getElementById('buscaParticipante').value.trim();
    document.getElementById('rpNome').value = q;
    document.getElementById('rpDataNasc').value = '';
    document.getElementById('rpResponsavel').value = '';
    document.getElementById('rpTelefone').value = '';
    document.getElementById('rpSerie').value = '';
    ocultarErroRapido();
    // esconde resultado de busca para não poluir
    document.getElementById('resultadoBusca').style.display = 'none';
    document.getElementById('formNovoParticipante').style.display = 'block';
}

function fecharFormNovoParticipante() {
    document.getElementById('formNovoParticipante').style.display = 'none';
    document.getElementById('rpNome').value = '';
    document.getElementById('rpDataNasc').value = '';
    document.getElementById('rpResponsavel').value = '';
    document.getElementById('rpTelefone').value = '';
    document.getElementById('rpSerie').value = '';
    ocultarErroRapido();
}

async function cadastrarEVincular() {
    const nome = document.getElementById('rpNome').value.trim();
    const dataNascimento = document.getElementById('rpDataNasc').value;
    const nomeResponsavel = document.getElementById('rpResponsavel').value.trim();
    const telefoneResponsavel = document.getElementById('rpTelefone').value.trim();
    const telDigits = telefoneResponsavel.replace(/\D/g, '');
    const serie = document.getElementById('rpSerie').value.trim();

    if (!nome) { exibirErroRapido('Preencha o nome do participante.'); return; }
    if (!dataNascimento) { exibirErroRapido('Data de nascimento inválida — verifique o dia e mês (ex: novembro tem 30 dias).'); return; }
    if (!nomeResponsavel) { exibirErroRapido('Preencha o nome do responsável.'); return; }
    if (!telefoneResponsavel) { exibirErroRapido('Preencha o telefone do responsável.'); return; }
    if (telDigits.length < 10 || telDigits.length > 11) {
        exibirErroRapido('Telefone inválido — use DDD + número (10 ou 11 dígitos).');
        return;
    }

    try {
        const resPost = await fetch(API_PARTICIPANTES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, dataNascimento, nomeResponsavel, telefoneResponsavel, serie: serie || null })
        });
        if (!resPost.ok) throw new Error('Erro ao cadastrar participante');
        const novoParticipante = await resPost.json();

        const resVinc = await fetch(`${API_URL}/${projetoAtual.id}/participantes/${novoParticipante.id}`, {
            method: 'POST'
        });
        if (!resVinc.ok) throw new Error('Erro ao vincular participante');

        fecharFormNovoParticipante();
        limparBuscaParticipante();
        await carregarParticipantesVinculados(projetoAtual.id);
    } catch (e) {
        exibirErroRapido('Erro ao salvar. Verifique o servidor.');
        console.error(e);
    }
}

// ==============================================
// REMOVER VÍNCULO
// ==============================================
async function removerVinculo(idParticipante) {
    if (!projetoAtual) return;

    const btn = event.target;
    const original = btn.textContent;
    btn.textContent = 'Confirmar?';
    btn.classList.add('btn-danger');

    const confirmar = () => {
        btn.removeEventListener('click', confirmar);
        _executarRemocao(idParticipante);
    };
    btn.addEventListener('click', confirmar);

    setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('btn-danger');
        btn.removeEventListener('click', confirmar);
    }, 3000);
}

async function _executarRemocao(idParticipante) {
    try {
        const res = await fetch(`${API_URL}/${projetoAtual.id}/participantes/${idParticipante}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Erro ao remover');
        await carregarParticipantesVinculados(projetoAtual.id);
    } catch (e) {
        console.error('Erro ao remover vínculo:', e);
    }
}

// ==============================================
// MODAL DELETAR
// ==============================================
function abrirModalDeletar(id, nome) {
    idParaDeletar = id;
    document.getElementById('nomeDeletar').textContent = nome;
    document.getElementById('modalDeletar').style.display = 'flex';
}

function fecharModalDeletar() {
    idParaDeletar = null;
    document.getElementById('modalDeletar').style.display = 'none';
}

async function confirmarDeletar() {
    if (!idParaDeletar) return;
    try {
        const res = await fetch(`${API_URL}/${idParaDeletar}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao deletar');
        fecharModalDeletar();
        await carregarProjetos();
    } catch (e) {
        console.error('Erro ao deletar projeto:', e);
    }
}

// ==============================================
// UTILITÁRIOS
// ==============================================
function limparBuscaParticipante() {
    document.getElementById('buscaParticipante').value = '';
    document.getElementById('resultadoBusca').style.display = 'none';
    document.getElementById('resultadoEncontrado').style.display = 'none';
    document.getElementById('resultadoNaoEncontrado').style.display = 'none';
    participanteEncontrado = null;
}

function formatarData(dateStr) {
    if (!dateStr) return '—';
    const [ano, mes, dia] = String(dateStr).split('-');
    return `${dia}/${mes}/${ano}`;
}

function badgeClass(status) {
    if (!status) return '';
    switch (status.toLowerCase()) {
        case 'ativo':     return 'badge--ativo';
        case 'suspenso':  return 'badge--suspenso';
        case 'encerrado': return 'badge--encerrado';
        default:          return '';
    }
}

function exibirErro(mensagem) {
    const el = document.getElementById('formErro');
    el.textContent = mensagem;
    el.classList.add('visivel');
}

function ocultarErro() {
    const el = document.getElementById('formErro');
    el.textContent = '';
    el.classList.remove('visivel');
}

function exibirErroRapido(mensagem) {
    const el = document.getElementById('formNovoParticipanteErro');
    el.textContent = mensagem;
    el.classList.add('visivel');
}

function ocultarErroRapido() {
    const el = document.getElementById('formNovoParticipanteErro');
    el.textContent = '';
    el.classList.remove('visivel');
}
