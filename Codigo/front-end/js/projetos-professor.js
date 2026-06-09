const API_PROJETOS = 'https://grupo-nata.onrender.com/api/projetos';
const API_FUNCIONARIOS = 'https://grupo-nata.onrender.com/api/funcionarios';

let professorLogado = {};
let projetosDoProfessor = [];
let projetoSelecionado = null;
let participantesChamada = [];
let presencasDoDia = {};

document.addEventListener('DOMContentLoaded', () => {
    const cargo = (localStorage.getItem('usuarioLogadoCargo') || '').toLowerCase();
    if (!cargo) {
        window.location.href = 'login.html';
        return;
    }
    if (cargo !== 'professor') {
        window.location.href = 'dashboard.html';
        return;
    }

    professorLogado = lerDadosLocais();
    sincronizarTopbar();

    const inputDataChamada = document.getElementById('dataChamada');
    if (inputDataChamada) {
        inputDataChamada.value = hojeISO();
        inputDataChamada.addEventListener('change', () => {
            if (projetoSelecionado) carregarChamadaProjeto(projetoSelecionado.id);
        });
    }

    carregarProjetosProfessor();
});

function lerDadosLocais() {
    return {
        id: localStorage.getItem('usuarioLogadoId') || '',
        nome: localStorage.getItem('usuarioLogadoNome') || 'Professor',
        cargo: localStorage.getItem('usuarioLogadoCargo') || 'Professor',
        email: localStorage.getItem('usuarioLogadoEmail') || '',
        cpf: localStorage.getItem('usuarioLogadoCpf') || '',
        telefone: localStorage.getItem('usuarioLogadoTelefone') || ''
    };
}

function sincronizarTopbar() {
    const nomeTopbar = document.getElementById('nome-usuario');
    if (nomeTopbar) nomeTopbar.innerText = professorLogado.nome || 'Professor';
}

async function garantirProfessorNoBanco() {
    const id = professorLogado.id;
    if (id) {
        const resposta = await fetch(`${API_FUNCIONARIOS}/${id}`);
        if (resposta.ok) {
            const f = await resposta.json();
            professorLogado = {
                id: f.id_funcionario || f.idFuncionario || f.id || id,
                nome: f.nome_funcionario || f.nomeFuncionario || f.nome || professorLogado.nome,
                cargo: f.cargo || professorLogado.cargo,
                email: f.email || professorLogado.email,
                cpf: f.cpf || professorLogado.cpf,
                telefone: f.telefone || professorLogado.telefone
            };
            return;
        }
    }

    const respostaLista = await fetch(API_FUNCIONARIOS);
    if (!respostaLista.ok) return;

    const lista = await respostaLista.json();
    const email = normalizarTexto(professorLogado.email);
    const nome = normalizarTexto(professorLogado.nome);
    const encontrado = lista.find(f =>
        normalizarTexto(f.email) === email ||
        normalizarTexto(f.nome_funcionario || f.nomeFuncionario || f.nome) === nome
    );

    if (encontrado) {
        professorLogado = {
            id: encontrado.id_funcionario || encontrado.idFuncionario || encontrado.id || '',
            nome: encontrado.nome_funcionario || encontrado.nomeFuncionario || encontrado.nome || '',
            cargo: encontrado.cargo || 'Professor',
            email: encontrado.email || '',
            cpf: encontrado.cpf || '',
            telefone: encontrado.telefone || ''
        };
        localStorage.setItem('usuarioLogadoId', professorLogado.id);
        localStorage.setItem('usuarioLogadoNome', professorLogado.nome);
    }
}

async function carregarProjetosProfessor() {
    const container = document.getElementById('listaProjetosProfessor');
    if (!professorLogado.id) {
        container.innerHTML = '<div class="empty-inline">Faça login novamente para carregar seus projetos.</div>';
        return;
    }

    try {
        await garantirProfessorNoBanco();
        sincronizarTopbar();

        const resposta = await fetch(API_PROJETOS);
        if (!resposta.ok) throw new Error('Erro ao buscar projetos.');

        const projetos = await resposta.json();
        projetosDoProfessor = projetos
            .filter(projetoPertenceAoProfessor)
            .map(normalizarProjeto);

        renderizarProjetos();
    } catch (erro) {
        console.error(erro);
        container.innerHTML = '<div class="empty-inline">Não foi possível carregar seus projetos.</div>';
    }
}

function projetoPertenceAoProfessor(projeto) {
    const responsavel = projeto.funcionarioResponsavel || {};
    const idResponsavel = Number(responsavel.id_funcionario || responsavel.idFuncionario || responsavel.id);
    const idProfessor = Number(professorLogado.id);
    if (idProfessor && idResponsavel && idProfessor === idResponsavel) return true;

    const nomeResponsavel = normalizarTexto(
        responsavel.nome_funcionario || responsavel.nomeFuncionario || responsavel.nome
    );
    return nomeResponsavel && nomeResponsavel === normalizarTexto(professorLogado.nome);
}

function normalizarProjeto(projeto = {}) {
    return {
        ...projeto,
        id: projeto.id || projeto.id_projeto || projeto.idProjeto
    };
}

function renderizarProjetos() {
    const total = projetosDoProfessor.length;
    const totalEl = document.getElementById('totalProjetos');
    if (totalEl) {
        totalEl.textContent = `${total} ${total === 1 ? 'projeto encontrado' : 'projetos encontrados'}`;
    }

    const container = document.getElementById('listaProjetosProfessor');
    if (!container) return;

    if (!total) {
        container.innerHTML = '<div class="empty-inline">Nenhum projeto associado a este professor.</div>';
        limparSelecao();
        return;
    }

    container.innerHTML = projetosDoProfessor.map(p => `
        <button class="project-card${projetoSelecionado?.id === p.id ? ' is-active' : ''}" type="button" onclick="selecionarProjeto(${p.id})">
            <span class="project-icon"><i class="ph ph-folder-open"></i></span>
            <span>
                <strong>${escaparHtml(p.nome || 'Projeto sem nome')}</strong>
                <span>${escaparHtml(p.tipo || 'Tipo não informado')} · ${escaparHtml(p.status || 'Sem status')}</span>
            </span>
        </button>
    `).join('');

    if (!projetoSelecionado || !projetosDoProfessor.some(p => p.id === projetoSelecionado.id)) {
        selecionarProjeto(projetosDoProfessor[0].id);
    }
}

function selecionarProjeto(idProjeto) {
    projetoSelecionado = projetosDoProfessor.find(p => p.id === idProjeto);
    if (!projetoSelecionado) return;

    renderizarProjetos();
    document.getElementById('estadoSemProjeto').style.display = 'none';
    document.getElementById('areaChamada').style.display = 'block';
    document.getElementById('projetoSelecionadoNome').textContent = projetoSelecionado.nome || 'Projeto';
    document.getElementById('projetoSelecionadoDetalhes').textContent =
        `${projetoSelecionado.tipo || 'Tipo não informado'} · ${projetoSelecionado.publicoAlvo || 'Público não informado'}`;

    carregarChamadaProjeto(idProjeto);
}

async function carregarChamadaProjeto(idProjeto) {
    esconderFeedback();
    try {
        const data = obterDataChamada();
        const [participantesResp, presencasResp] = await Promise.all([
            fetch(`${API_PROJETOS}/${idProjeto}/participantes`),
            fetch(`${API_PROJETOS}/${idProjeto}/presencas?data=${data}`)
        ]);

        if (!participantesResp.ok) throw new Error('Erro ao carregar participantes.');
        participantesChamada = await participantesResp.json();
        presencasDoDia = {};

        if (presencasResp.ok) {
            const presencas = await presencasResp.json();
            presencas.forEach(p => {
                presencasDoDia[p.idParticipante] = p;
            });
        }

        renderizarChamada();
    } catch (erro) {
        console.error(erro);
        exibirFeedback('Não foi possível carregar a chamada deste projeto.', true);
    }
}

function renderizarChamada() {
    const container = document.getElementById('listaChamada');
    if (!participantesChamada.length) {
        container.innerHTML = '<div class="empty-inline">Nenhum participante vinculado a este projeto.</div>';
        atualizarResumoPresentes();
        return;
    }

    container.innerHTML = participantesChamada.map(participante => {
        const presenca = presencasDoDia[participante.idParticipante] || {};
        return `
            <div class="attendance-row" data-participante-id="${participante.idParticipante}">
                <div class="participant-name">
                    <strong>${escaparHtml(participante.nome || 'Participante sem nome')}</strong>
                    <span>${escaparHtml(montarSubtextoParticipante(participante))}</span>
                </div>
                <label class="presence-toggle">
                    <input type="checkbox" ${presenca.presente ? 'checked' : ''} onchange="atualizarResumoPresentes()">
                    Presente
                </label>
                <input type="text" value="${escaparHtml(presenca.observacao || '')}" placeholder="Observação">
            </div>
        `;
    }).join('');
    atualizarResumoPresentes();
}

async function salvarChamada() {
    if (!projetoSelecionado) return;

    const data = obterDataChamada();
    const linhas = [...document.querySelectorAll('.attendance-row')];
    if (!linhas.length) {
        exibirFeedback('Não há participantes para salvar nesta chamada.', true);
        return;
    }

    const payload = linhas.map(linha => ({
        idProjeto: projetoSelecionado.id,
        idParticipante: Number(linha.dataset.participanteId),
        dataChamada: data,
        presente: linha.querySelector('input[type="checkbox"]').checked,
        observacao: linha.querySelector('input[type="text"]').value.trim() || null,
        registradoPor: professorLogado.id ? Number(professorLogado.id) : null
    }));

    try {
        const resposta = await fetch(`${API_PROJETOS}/${projetoSelecionado.id}/presencas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!resposta.ok) {
            let mensagem = 'Não foi possível salvar a chamada.';
            try {
                const corpo = await resposta.json();
                mensagem = corpo.erro || mensagem;
            } catch (_) {}
            throw new Error(mensagem);
        }

        exibirFeedback('Chamada salva com sucesso.');
        await carregarChamadaProjeto(projetoSelecionado.id);
    } catch (erro) {
        console.error(erro);
        exibirFeedback(erro.message || 'Não foi possível salvar a chamada.', true);
    }
}

function marcarTodos(presente) {
    document.querySelectorAll('.attendance-row input[type="checkbox"]').forEach(input => {
        input.checked = presente;
    });
    atualizarResumoPresentes();
}

function atualizarResumoPresentes() {
    const total = [...document.querySelectorAll('.attendance-row input[type="checkbox"]')]
        .filter(input => input.checked).length;
    document.getElementById('totalPresentes').textContent = total;
}

function limparSelecao() {
    projetoSelecionado = null;
    document.getElementById('estadoSemProjeto').style.display = 'flex';
    document.getElementById('areaChamada').style.display = 'none';
}

function exibirFeedback(mensagem, erro = false) {
    const el = document.getElementById('feedbackChamada');
    el.textContent = mensagem;
    el.classList.toggle('is-error', erro);
    el.style.display = 'block';
}

function esconderFeedback() {
    const el = document.getElementById('feedbackChamada');
    el.textContent = '';
    el.classList.remove('is-error');
    el.style.display = 'none';
}

function montarSubtextoParticipante(p) {
    const partes = [];
    if (p.nomeResponsavel) partes.push(`Resp: ${p.nomeResponsavel}`);
    if (p.serie) partes.push(p.serie);
    if (p.telefoneResponsavel) partes.push(p.telefoneResponsavel);
    return partes.join(' · ') || 'Sem dados complementares';
}

function hojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function obterDataChamada() {
    const input = document.getElementById('dataChamada');
    if (!input) return hojeISO();

    if (!input.value) {
        input.value = hojeISO();
    }

    return input.value;
}

function normalizarTexto(valor) {
    return String(valor || '').trim().toLowerCase();
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
