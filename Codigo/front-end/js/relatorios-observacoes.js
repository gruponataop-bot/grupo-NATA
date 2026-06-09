// ==============================================
// CONSTANTES DA API
// ==============================================
const API_RESIDENTES = 'https://grupo-nata.onrender.com/api/residentes';
const API_PARTICIPANTES = 'https://grupo-nata.onrender.com/api/participantes';

// ==============================================
// ESTADO
// ==============================================
let tipoVisualizacaoAtual = 'residente'; // 'residente' ou 'participante'
let listaAtual = [];
let usuarioSelecionado = null;
let idLogado = null;
let nomeLogado = 'Coordenador';

// ==============================================
// NORMALIZADORES (Padrão do Banco / Jackson)
// ==============================================
function idDoUsuario(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const raw = obj.id_residente ?? obj.idResidente ?? obj.id_participant ?? obj.idParticipant ?? obj.id;
    if (raw === undefined || raw === null || raw === '') return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
}

function nomeDoUsuario(obj) {
    if (!obj || typeof obj !== 'object') return '';
    return (obj.nome_residente ?? obj.nomeResidente ?? obj.nome_participante ?? obj.nomeParticipante ?? obj.nome) || 'Sem nome';
}

function detalhesDoUsuario(obj) {
    if (!obj || typeof obj !== 'object') return 'Sem dados complementares';
    if (tipoVisualizacaoAtual === 'residente') {
        return obj.cpf ? `CPF: ${obj.cpf}` : 'Sem dados complementares';
    } else {
        const resp = obj.nome_responsavel ?? obj.nomeResponsavel;
        return resp ? `Responsável: ${resp}` : 'Sem dados complementares';
    }
}

// ==============================================
// INICIALIZAÇÃO
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    idLogado = localStorage.getItem('usuarioLogadoId');
    nomeLogado = localStorage.getItem('usuarioLogadoNome') || 'Coordenador';
    
    const nomeTopbar = document.getElementById('nome-usuario');
    if (nomeTopbar) nomeTopbar.innerText = nomeLogado;
    
    document.getElementById('dataNovaObservacao').value = hojeISO();
    
    carregarListaUsuarios();
});

// ==============================================
// ALTERNÂNCIA DE ABAS
// ==============================================
function alternarTipoVisualizacao(tipo) {
    tipoVisualizacaoAtual = tipo;
    
    document.getElementById('btnResidentes').classList.toggle('active', tipo === 'residente');
    document.getElementById('btnParticipantes').classList.toggle('active', tipo === 'participante');
    
    limparSelecao();
    carregarListaUsuarios();
}

// ==============================================
// CARREGAR LISTA PRINCIPAL
// ==============================================
async function carregarListaUsuarios() {
    const url = tipoVisualizacaoAtual === 'residente' ? API_RESIDENTES : API_PARTICIPANTES;
    
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Erro ao buscar lista de ${tipoVisualizacaoAtual}s`);
        
        listaAtual = await res.json();
        renderizarListaUsuarios();
    } catch (erro) {
        console.error(erro);
        document.getElementById('listaUsuarios').innerHTML = 
            `<div class="empty-inline">Não foi possível carregar os ${tipoVisualizacaoAtual}s.</div>`;
        document.getElementById('totalUsuarios').textContent = '0 encontrados';
    }
}

function renderizarListaUsuarios() {
    const container = document.getElementById('listaUsuarios');
    document.getElementById('totalUsuarios').textContent = `${listaAtual.length} encontrados`;

    if (listaAtual.length === 0) {
        container.innerHTML = `<div class="empty-inline">Nenhum ${tipoVisualizacaoAtual} encontrado.</div>`;
        return;
    }

    container.innerHTML = listaAtual.map(u => {
        const id = idDoUsuario(u);
        const nome = nomeDoUsuario(u);
        const isActive = usuarioSelecionado && idDoUsuario(usuarioSelecionado) === id ? ' is-active' : '';
        const labelTipo = tipoVisualizacaoAtual === 'residente' ? 'Residente' : 'Participante';

        return `
            <button class="project-card${isActive}" type="button" onclick="selecionarUsuario(${id})">
                <span class="project-icon"><i class="ph ph-user"></i></span>
                <span>
                    <strong>${escaparHtml(nome)}</strong>
                    <span>${labelTipo}</span>
                </span>
            </button>
        `;
    }).join('');
}

// ==============================================
// SELEÇÃO E DETALHES
// ==============================================
function selecionarUsuario(id) {
    usuarioSelecionado = listaAtual.find(u => idDoUsuario(u) === id);
    if (!usuarioSelecionado) return;
    
    renderizarListaUsuarios();
    
    document.getElementById('estadoSemSelecao').style.display = 'none';
    document.getElementById('areaTrabalho').style.display = 'block';
    
    document.getElementById('labelTipoUsuario').textContent = tipoVisualizacaoAtual === 'residente' ? 'Residente' : 'Participante';
    document.getElementById('nomeUsuarioSelecionado').textContent = nomeDoUsuario(usuarioSelecionado);
    document.getElementById('detalhesUsuarioSelecionado').textContent = detalhesDoUsuario(usuarioSelecionado);
        
    document.getElementById('dataNovaObservacao').value = hojeISO();
    document.getElementById('textoNovaObservacao').value = '';
    
    carregarHistoricoObservacoes(id);

    if (window.innerWidth <= 768) {
        const areaTrabalho = document.getElementById('painelObservacoes');
        if (areaTrabalho) {
            areaTrabalho.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }
}

function limparSelecao() {
    usuarioSelecionado = null;
    document.getElementById('estadoSemSelecao').style.display = 'flex';
    document.getElementById('areaTrabalho').style.display = 'none';
}

// ==============================================
// HISTÓRICO DE OBSERVAÇÕES
// ==============================================
async function carregarHistoricoObservacoes(idUsuario) {
    const baseUrl = tipoVisualizacaoAtual === 'residente' ? API_RESIDENTES : API_PARTICIPANTES;
    
    try {
        const res = await fetch(`${baseUrl}/${idUsuario}/observacoes`);
        if (!res.ok) throw new Error('Erro ao buscar histórico');
        
        const observacoes = await res.json();
        renderizarHistorico(observacoes);
    } catch (erro) {
        console.error(erro);
        document.getElementById('listaHistorico').innerHTML = 
            '<div class="empty-inline">Não foi possível carregar o histórico. Verifique se a rota existe no backend.</div>';
    }
}

function renderizarHistorico(observacoes) {
    const container = document.getElementById('listaHistorico');
    
    if (!observacoes || observacoes.length === 0) {
        container.innerHTML = '<div class="empty-inline" style="text-align: center; color: var(--prof-muted); padding: 20px;">Nenhuma observação registrada ainda.</div>';
        return;
    }

    // Ordena da mais recente para a mais antiga (usando ID como desempate para o mesmo dia)
    const ordenadas = observacoes.sort((a, b) => {
        const dataA = new Date(a.dataRegistro || a.data_registro);
        const dataB = new Date(b.dataRegistro || b.data_registro);
        
        // Se as datas forem diferentes, ordena pela data mais recente
        if (dataB.getTime() !== dataA.getTime()) {
            return dataB - dataA;
        }
        
        // Se for no mesmo dia, o desempate é pelo ID (maior ID no topo)
        return (b.id || 0) - (a.id || 0);
    });

    container.innerHTML = ordenadas.map(obs => `
        <div class="obs-card">
            <div class="obs-header">
                <span class="obs-data">
                    <i class="ph ph-calendar-blank"></i> 
                    ${formatarDataBR(obs.dataRegistro || obs.data_registro)}
                </span>
                <span class="obs-autor">Registrado por: ${escaparHtml(obs.nomeAutor || obs.nome_autor || 'Desconhecido')}</span>
            </div>
            <p class="obs-texto">${escaparHtml(obs.texto)}</p>
        </div>
    `).join('');
}

// ==============================================
// SALVAR NOVA OBSERVAÇÃO
// ==============================================
async function salvarObservacao() {
    if (!usuarioSelecionado) return;
    
    const data = document.getElementById('dataNovaObservacao').value;
    const texto = document.getElementById('textoNovaObservacao').value.trim();
    
    if (!texto) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta('O texto da observação não pode estar vazio.', 'error');
        return;
    }

    const payload = {
        idAutor: Number(idLogado),
        nomeAutor: nomeLogado,
        dataRegistro: data,
        texto: texto
    };

    const baseUrl = tipoVisualizacaoAtual === 'residente' ? API_RESIDENTES : API_PARTICIPANTES;
    const idUrl = idDoUsuario(usuarioSelecionado);

    try {
        const res = await fetch(`${baseUrl}/${idUrl}/observacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            let msg = 'Falha ao registrar observação';
            try {
                const corpo = await res.json();
                msg = corpo.erro || msg;
            } catch (_) {}
            throw new Error(msg);
        }

        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta('Observação registrada com sucesso!', 'success');
        }
        
        document.getElementById('textoNovaObservacao').value = '';
        await carregarHistoricoObservacoes(idUrl);

    } catch (erro) {
        console.error(erro);
        if (typeof mostrarAlerta === 'function') mostrarAlerta(erro.message, 'error');
    }
}

// ==============================================
// UTILITÁRIOS
// ==============================================
function hojeISO() {
    return new Date().toISOString().split('T')[0];
}

function formatarDataBR(dataISO) {
    if (!dataISO) return '—';
    const partes = String(dataISO).split('T')[0].split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataISO;
}

function escaparHtml(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}