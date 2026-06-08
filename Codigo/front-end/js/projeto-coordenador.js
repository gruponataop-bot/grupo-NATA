// ==============================================
// CONFIGURAÇÃO SUPABASE E APIS
// ==============================================
const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const API_URL_PROJETOS = 'http://localhost:8080/api/projetos';

let _supabase = null;
let listaProjetosDoCoordenador = [];
let projetoSelecionadoEmEdicao = null;

function getSupabase() {
    if (!_supabase) _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return _supabase;
}

// ==============================================
// INICIALIZAÇÃO
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    const nomeLocal = localStorage.getItem('usuarioLogadoNome') || 'Coordenador';
    const nomeTopbar = document.getElementById('nome-usuario');
    if (nomeTopbar) nomeTopbar.innerText = nomeLocal;

    carregarProjetosDoCoordenador();
});

// ==============================================
// BUSCAR E RENDERIZAR PROJETOS
// ==============================================
async function carregarProjetosDoCoordenador() {
    const idLogado = localStorage.getItem('usuarioLogadoId');
    const nomeLogado = localStorage.getItem('usuarioLogadoNome') || '';
    if (!idLogado) {
        document.getElementById('listaProjetosCoordenador').innerHTML = 
            '<div class="empty-inline">Efetue o login novamente para carregar seus dados.</div>';
        return;
    }

    try {
        const res = await fetch(API_URL_PROJETOS);
        if (!res.ok) throw new Error('Falha na resposta da API');
        
        const projetos = await res.json();
        listaProjetosDoCoordenador = projetos
            .filter(projeto => projetoPertenceAoCoordenador(projeto, idLogado, nomeLogado))
            .map(normalizarProjeto);
        
        renderizarListaLateral();
    } catch (err) {
        console.error('Erro ao carregar projetos do coordenador:', err);
        document.getElementById('listaProjetosCoordenador').innerHTML = 
            '<div class="empty-inline">Não foi possível conectar com o servidor.</div>';
    }
}

function projetoPertenceAoCoordenador(projeto, idLogado, nomeLogado) {
    const responsavel = projeto.funcionarioResponsavel || {};
    const idResponsavel = Number(responsavel.id_funcionario || responsavel.idFuncionario || responsavel.id);
    const idCoordenador = Number(idLogado);
    if (idCoordenador && idResponsavel && idCoordenador === idResponsavel) return true;

    const nomeResponsavel = normalizarTexto(responsavel.nome_funcionario || responsavel.nomeFuncionario || responsavel.nome);
    return nomeResponsavel && nomeResponsavel === normalizarTexto(nomeLogado);
}

function normalizarProjeto(projeto = {}) {
    return {
        ...projeto,
        id: projeto.id || projeto.id_projeto || projeto.idProjeto
    };
}

function renderizarListaLateral() {
    const container = document.getElementById('listaProjetosCoordenador');
    const totalEl = document.getElementById('totalProjetos');
    
    if (totalEl) {
        totalEl.textContent = `${listaProjetosDoCoordenador.length} ${listaProjetosDoCoordenador.length === 1 ? 'projeto encontrado' : 'projetos encontrados'}`;
    }

    if (!listaProjetosDoCoordenador.length) {
        container.innerHTML = '<div class="empty-inline">Nenhum projeto associado ao seu perfil.</div>';
        return;
    }

    container.innerHTML = listaProjetosDoCoordenador.map(p => `
        <button class="project-card${projetoSelecionadoEmEdicao?.id === p.id ? ' is-active' : ''}" type="button" onclick="carregarFormularioProjeto(${p.id})">
            <span class="project-icon"><i class="ph ph-folder-open"></i></span>
            <span>
                <strong>${escaparCaracteresHtml(p.nome || 'Projeto sem nome')}</strong>
                <span>${escaparCaracteresHtml(p.tipo || '—')} · ${escaparCaracteresHtml(p.status || '—')}</span>
            </span>
        </button>
    `).join('');
}

// ==============================================
// PREENCHER FORMULÁRIO
// ==============================================
function carregarFormularioProjeto(idProjeto) {
    projetoSelecionadoEmEdicao = listaProjetosDoCoordenador.find(p => p.id === idProjeto);
    if (!projetoSelecionadoEmEdicao) return;

    renderizarListaLateral();
    esconderMensagemFeedback();

    document.getElementById('estadoSemProjeto').style.display = 'none';
    document.getElementById('areaEdicao').style.display = 'block';

    document.getElementById('formId').value = projetoSelecionadoEmEdicao.id;
    document.getElementById('formNome').value = projetoSelecionadoEmEdicao.nome || '';
    document.getElementById('formDescricao').value = projetoSelecionadoEmEdicao.descricao || '';
    document.getElementById('formTipo').value = projetoSelecionadoEmEdicao.tipo || 'Social';
    document.getElementById('formPublicoAlvo').value = projetoSelecionadoEmEdicao.publicoAlvo || 'Comunidade';
    document.getElementById('formStatus').value = projetoSelecionadoEmEdicao.status || 'Ativo';
    document.getElementById('formDataInicio').value = projetoSelecionadoEmEdicao.dataInicio || '';
    document.getElementById('formDataFim').value = projetoSelecionadoEmEdicao.dataFim || '';
    preencherHorariosProjeto(projetoSelecionadoEmEdicao.horarios || '');
    document.getElementById('formTermoResponsabilidade').value = projetoSelecionadoEmEdicao.termoResponsabilidade || '';

    document.getElementById('projetoNomeTitulo').textContent = projetoSelecionadoEmEdicao.nome;
    document.getElementById('projetoDetalhesSubtitulo').textContent = `${projetoSelecionadoEmEdicao.tipo} · ${projetoSelecionadoEmEdicao.publicoAlvo}`;

    const preview = document.getElementById('imagePreview');
    if (projetoSelecionadoEmEdicao.imagemUrl) {
        preview.style.backgroundImage = `url('${projetoSelecionadoEmEdicao.imagemUrl}')`;
    } else {
        preview.style.backgroundImage = '';
    }

    // Comportamento Responsivo: Rola para o formulário no Mobile
    if (window.innerWidth <= 768) {
        document.getElementById('painelFormularioProjeto').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

function previewImagemProjeto(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = e => {
        document.getElementById('imagePreview').style.backgroundImage = `url('${e.target.result}')`;
    };
    leitor.readAsDataURL(arquivo);
}

// ==============================================
// SALVAR DADOS E UPLOAD (PUT)
// ==============================================
async function salvarAlteracoesProjeto() {
    if (!projetoSelecionadoEmEdicao) return;

    const nome = document.getElementById('formNome').value.trim();
    const tipo = document.getElementById('formTipo').value;
    const publicoAlvo = document.getElementById('formPublicoAlvo').value;
    const dataInicio = document.getElementById('formDataInicio').value;

    if (!nome || !tipo || !publicoAlvo || !dataInicio) {
        exibirMensagemFeedback('Preencha os campos obrigatórios: Nome, Tipo, Público-alvo e Data de Início.', true);
        return;
    }

    let imagemUrl = projetoSelecionadoEmEdicao.imagemUrl || null;
    const arquivoImagem = document.getElementById('formImagem').files[0];

    if (arquivoImagem) {
        try {
            const extensao = arquivoImagem.name.split('.').pop();
            const nomeDoArquivoSupabase = `projeto_${Date.now()}.${extensao}`;
            
            const { error: erroUpload } = await getSupabase().storage
                .from('projetos')
                .upload(nomeDoArquivoSupabase, arquivoImagem);
                
            if (erroUpload) throw erroUpload;
            
            const { data: linkPublico } = getSupabase().storage
                .from('projetos')
                .getPublicUrl(nomeDoArquivoSupabase);
                
            imagemUrl = linkPublico.publicUrl;
        } catch (err) {
            exibirMensagemFeedback('Falha no upload da imagem para o Supabase.', true);
            console.error('[Upload erro]', err);
            return;
        }
    }

    const payloadCompleto = {
        ...projetoSelecionadoEmEdicao,
        nome,
        descricao: document.getElementById('formDescricao').value.trim(),
        tipo,
        publicoAlvo,
        dataInicio,
        dataFim: document.getElementById('formDataFim').value || null,
        horarios: obterHorariosProjetoSelecionados(),
        termoResponsabilidade: document.getElementById('formTermoResponsabilidade').value.trim(),
        status: document.getElementById('formStatus').value,
        imagemUrl
    };

    try {
        const res = await fetch(`${API_URL_PROJETOS}/${projetoSelecionadoEmEdicao.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadCompleto)
        });

        if (!res.ok) throw new Error('Falha ao atualizar dados via API');

        Object.assign(projetoSelecionadoEmEdicao, payloadCompleto);
        
        document.getElementById('projetoNomeTitulo').textContent = projetoSelecionadoEmEdicao.nome;
        document.getElementById('projetoDetalhesSubtitulo').textContent = `${projetoSelecionadoEmEdicao.tipo} · ${projetoSelecionadoEmEdicao.publicoAlvo}`;
        
        renderizarListaLateral();
        esconderMensagemFeedback();

        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta('Projeto atualizado com sucesso!', 'success');
        }
    } catch (err) {
        exibirMensagemFeedback('Não foi possível gravar as modificações.', true);
        console.error(err);
    }
}

// ==============================================
// UTILITÁRIOS
// ==============================================
function exibirMensagemFeedback(msg, isError = false) {
    const el = document.getElementById('feedbackEdicao');
    el.textContent = msg;
    if (isError) {
        el.classList.add('is-error');
    } else {
        el.classList.remove('is-error');
    }
    el.style.display = 'block';
}

function esconderMensagemFeedback() {
    const el = document.getElementById('feedbackEdicao');
    el.textContent = '';
    el.classList.remove('is-error');
    el.style.display = 'none';
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

function normalizarTexto(valor) {
    return String(valor || '').trim().toLowerCase();
}

function escaparCaracteresHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));
}
