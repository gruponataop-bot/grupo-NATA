const API_PROJETOS_PROF = 'https://grupo-nata.onrender.com/api/projetos';
const API_FUNCIONARIOS_PROF = 'https://grupo-nata.onrender.com/api/funcionarios';

let coordenadorLogado = {};
let projetosProfessor = [];
let projetoSelecionado = null;
let participantesChamada = [];
let presencasDoDia = {};

// =========================================================
// MOCK DE LOGIN (Remover quando a tela de login estiver pronta)
// =========================================================
function simularLogin() {
    return;
    // Só injeta se não tiver ninguém logado ainda
    if (!localStorage.getItem('usuarioLogadoId')) {
        return;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const cargoLogado = (localStorage.getItem('usuarioLogadoCargo') || '').toLowerCase();
    if (!cargoLogado) {
        window.location.href = 'login.html';
        return;
    }
    if (!cargoLogado.includes('coordenador')) {
        window.location.href = 'dashboard.html';
        return;
    }

    const inputDataChamada = document.getElementById('dataChamada');
    if (inputDataChamada) {
        inputDataChamada.value = hojeISO();
        inputDataChamada.addEventListener('change', () => {
            if (projetoSelecionado) carregarChamadaProjeto(projetoSelecionado.id);
        });
    }

    carregarDadosCoordenador();
});

async function carregarDadosCoordenador() {
    const dadosLocais = lerProfessorLocalStorage();
    const idLogado = dadosLocais.id;
    const listaProjetosEl = document.getElementById('listaProjetosCoordenador');

    if (!idLogado) {
        coordenadorLogado = dadosLocais;
        sincronizarDadosLocaisCoordenador();
        renderizarPerfil();
        if (listaProjetosEl) listaProjetosEl.innerHTML =
            '<div class="empty-inline">Faca login novamente para carregar os dados do coordenador.</div>';
        return;
    }

    try {
        const resposta = await fetch(`${API_FUNCIONARIOS_PROF}/${idLogado}`);
        
        if (!resposta.ok) {
            throw new Error(`Erro na requisição: Status ${resposta.status}`);
        }
        
        coordenadorLogado = normalizarFuncionario(await resposta.json());
        
        // Garante que o cargo seja exibido como Coordenador na interface
        if (!coordenadorLogado.cargo) {
            coordenadorLogado.cargo = 'Coordenador Voluntário';
        }

        sincronizarDadosLocaisCoordenador();

        // Desenha os dados do Carlos na tela (Nome, CPF, Email, Telefone)
        renderizarPerfil();

        projetosProfessor = await carregarProjetosCoordenador();
        renderizarProjetos();

    } catch (erro) {
        console.error("Erro ao carregar o coordenador do banco:", erro);
        
        // Feedback visual caso o banco esteja desligado ou a rota dê erro
        const nomeEl = document.getElementById('coordenadorNome');
        if (nomeEl) nomeEl.textContent = "Erro ao carregar";
        if (listaProjetosEl) listaProjetosEl.innerHTML =
            `<div class="empty-inline">Não foi possível conectar ao banco de dados para carregar o perfil do ID ${idLogado}.</div>`;
    }
}

async function carregarDadosProfessor() {
    return carregarDadosCoordenador();
}

function lerProfessorLocalStorage() {
    return {
        id: localStorage.getItem('usuarioLogadoId') || '',
        nome: localStorage.getItem('usuarioLogadoNome') || 'Professor',
        cargo: localStorage.getItem('usuarioLogadoCargo') || 'Professor',
        email: localStorage.getItem('usuarioLogadoEmail') || '',
        cpf: localStorage.getItem('usuarioLogadoCpf') || '',
        telefone: localStorage.getItem('usuarioLogadoTelefone') || '',
        endereco: localStorage.getItem('usuarioLogadoEndereco') || ''
    };
}

async function completarDadosProfessor() {
    if (coordenadorLogado.email && coordenadorLogado.telefone && coordenadorLogado.cpf) return;
    const resposta = await fetch(API_FUNCIONARIOS_PROF);
    if (!resposta.ok) return;

    const funcionarios = await resposta.json();
    const idLocal = Number(coordenadorLogado.id);
    const nomeLocal = normalizarTexto(coordenadorLogado.nome);
    const encontrado = funcionarios.find(f => {
        const idFuncionario = Number(f.id_funcionario || f.idFuncionario || f.id);
        return (idLocal && idFuncionario === idLocal) ||
            normalizarTexto(f.nome_funcionario || f.nomeFuncionario || f.nome) === nomeLocal;
    });

    if (!encontrado) return;
    coordenadorLogado = {
        id: encontrado.id_funcionario || encontrado.idFuncionario || encontrado.id || coordenadorLogado.id,
        nome: encontrado.nome_funcionario || encontrado.nomeFuncionario || encontrado.nome || coordenadorLogado.nome,
        cargo: encontrado.cargo || coordenadorLogado.cargo,
        email: encontrado.email || coordenadorLogado.email,
        cpf: encontrado.cpf || coordenadorLogado.cpf,
        telefone: encontrado.telefone || coordenadorLogado.telefone
    };
}

async function carregarProjetosProfessor() {
    const resposta = await fetch(API_PROJETOS_PROF);
    if (!resposta.ok) return [];

    const projetos = await resposta.json();
    return projetos.filter(projetoPertenceAoProfessor);
}

async function carregarProjetosCoordenador() {
    const resposta = await fetch(API_PROJETOS_PROF);
    if (!resposta.ok) return [];

    const projetos = await resposta.json();
    return projetos
        .filter(projetoPertenceAoProfessor)
        .map(normalizarProjeto);
}

function normalizarFuncionario(funcionario = {}) {
    return {
        id: funcionario.id_funcionario || funcionario.idFuncionario || funcionario.id || '',
        nome: funcionario.nome_funcionario || funcionario.nomeFuncionario || funcionario.nome || '',
        cargo: funcionario.cargo || '',
        email: funcionario.email || '',
        cpf: funcionario.cpf || '',
        telefone: funcionario.telefone || '',
        senha: funcionario.senha || '',
        endereco: localStorage.getItem('usuarioLogadoEndereco') || '',
        habilidades: localStorage.getItem('usuarioLogadoHabilidades') || '',
        disponibilidades: localStorage.getItem('usuarioLogadoDisponibilidades') || '',
        diasDisponiveis: localStorage.getItem('usuarioLogadoDiasDisponiveis') || '',
        turnosDisponiveis: localStorage.getItem('usuarioLogadoTurnosDisponiveis') || ''
    };
}

function normalizarVoluntario(voluntario = {}) {
    return {
        id: voluntario.id || '',
        nome: voluntario.nome || '',
        cargo: voluntario.cargo || 'Coordenador Voluntario',
        email: voluntario.email || '',
        cpf: voluntario.cpf || '',
        telefone: voluntario.telefone || '',
        dataNascimento: voluntario.dataNascimento || '',
        endereco: voluntario.endereco || '',
        habilidades: voluntario.habilidades || '',
        outrasHabilidades: voluntario.outrasHabilidades || '',
        observacoesDisponibilidade: voluntario.observacoesDisponibilidade || '',
        status: voluntario.status || '',
        disponibilidades: voluntario.disponibilidades || '',
        diasDisponiveis: voluntario.diasDisponiveis || '',
        turnosDisponiveis: voluntario.turnosDisponiveis || '',
        projetos: voluntario.projetos || []
    };
}

function sincronizarDadosLocaisCoordenador() {
    localStorage.setItem('usuarioLogadoId', coordenadorLogado.id || '');
    localStorage.setItem('usuarioLogadoNome', coordenadorLogado.nome || 'Coordenador');
    localStorage.setItem('usuarioLogadoCargo', coordenadorLogado.cargo || 'Coordenador');
    localStorage.setItem('usuarioLogadoEmail', coordenadorLogado.email || '');
    localStorage.setItem('usuarioLogadoTelefone', coordenadorLogado.telefone || '');
    localStorage.setItem('usuarioLogadoCpf', coordenadorLogado.cpf || '');
    localStorage.setItem('usuarioLogadoEndereco', coordenadorLogado.endereco || '');
    localStorage.setItem('usuarioLogadoHabilidades', coordenadorLogado.habilidades || '');
    localStorage.setItem('usuarioLogadoDisponibilidades', coordenadorLogado.disponibilidades || '');
    localStorage.setItem('usuarioLogadoDiasDisponiveis', coordenadorLogado.diasDisponiveis || '');
    localStorage.setItem('usuarioLogadoTurnosDisponiveis', coordenadorLogado.turnosDisponiveis || '');

    const nomeTopbar = document.getElementById('nome-usuario');
    if (nomeTopbar) nomeTopbar.innerText = coordenadorLogado.nome || 'Coordenador';
}

function renderizarPerfil() {
    const nomeEl = document.getElementById('coordenadorNome');
    if (nomeEl) nomeEl.textContent = coordenadorLogado.nome || 'Coordenador';

    const cargoEl = document.getElementById('coordenadorCargo');
    if (cargoEl) cargoEl.textContent = coordenadorLogado.cargo || 'Coordenador Voluntário';

    const emailEl = document.getElementById('coordenadorEmail');
    if (emailEl) emailEl.textContent = coordenadorLogado.email || '-';

    const telEl = document.getElementById('coordenadorTelefone');
    if (telEl) telEl.textContent = coordenadorLogado.telefone || '-';

    const cpfEl = document.getElementById('coordenadorCpf');
    if (cpfEl) cpfEl.textContent = coordenadorLogado.cpf || '-';

    const enderecoEl = document.getElementById('coordenadorEndereco');
    if (enderecoEl) enderecoEl.textContent = coordenadorLogado.endereco || '-';

    const iniciaisEl = document.getElementById('coordenadorIniciais');
    if (iniciaisEl) iniciaisEl.textContent = iniciais(coordenadorLogado.nome);

    renderizarVisualizacaoExtra();
}

function projetoPertenceAoProfessor(projeto) {
    const responsavel = projeto.funcionarioResponsavel || {};
    const idResponsavel = Number(responsavel.id_funcionario || responsavel.idFuncionario || responsavel.id);
    const idProfessor = Number(coordenadorLogado.id);
    if (idProfessor && idResponsavel && idProfessor === idResponsavel) return true;

    const nomeResponsavel = normalizarTexto(responsavel.nome_funcionario || responsavel.nomeFuncionario || responsavel.nome);
    return nomeResponsavel && nomeResponsavel === normalizarTexto(coordenadorLogado.nome);
}

function normalizarProjeto(projeto = {}) {
    return {
        ...projeto,
        id: projeto.id || projeto.id_projeto || projeto.idProjeto
    };
}

function renderizarProjetos() {
    const total = projetosProfessor ? projetosProfessor.length : 0;
    
    // Atualiza o contador de projetos se o elemento existir
    const totalEl = document.getElementById('totalProjetos');
    if (totalEl) {
        totalEl.textContent = `${total} ${total === 1 ? 'projeto encontrado' : 'projetos encontrados'}`;
    }
    
    const container = document.getElementById('listaProjetosCoordenador');
    if (!container) return; // Impede a quebra se o container mudar de nome no HTML

    if (!total) {
        container.innerHTML = '<div class="empty-inline">Nenhum projeto associado a este coordenador.</div>';
        limparSelecao();
        return;
    }

    container.innerHTML = projetosProfessor.map(p => `
        <button class="project-card${projetoSelecionado?.id === p.id ? ' is-active' : ''}" type="button" onclick="selecionarProjeto(${p.id})">
            <span class="project-icon"><i class="ph ph-folder-open"></i></span>
            <span>
                <strong>${escaparHtml(p.nome || 'Projeto sem nome')}</strong>
                <span>${escaparHtml(p.tipo || 'Tipo não informado')} · ${escaparHtml(p.status || 'Sem status')}</span>
            </span>
        </button>
    `).join('');

}

function selecionarProjeto(idProjeto) {
    projetoSelecionado = projetosProfessor.find(p => p.id === idProjeto);
    if (!projetoSelecionado) return;
    renderizarProjetos();
    document.getElementById('estadoSemProjeto').style.display = 'none';
    document.getElementById('areaChamada').style.display = 'block';
    document.getElementById('projetoSelecionadoNome').textContent = projetoSelecionado.nome || 'Projeto';
    document.getElementById('projetoSelecionadoDetalhes').textContent =
        `${projetoSelecionado.tipo || 'Tipo não informado'} · ${projetoSelecionado.publicoAlvo || 'Público não informado'}`;
    
    // Carrega a listagem e históricos de presença da API
    carregarChamadaProjeto(idProjeto);

    // MOVE O FOCO PARA A CHAMADA SE FOR MOBILE
    if (window.innerWidth <= 768) {
        const areaChamadaContainer = document.getElementById('areaChamada');
        if (areaChamadaContainer) {
            areaChamadaContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }
}

async function carregarChamadaProjeto(idProjeto) {
    esconderFeedback();
    try {
        const data = obterDataChamada();
        const [participantesResp, presencasResp] = await Promise.all([
            fetch(`${API_PROJETOS_PROF}/${idProjeto}/participantes`),
            fetch(`${API_PROJETOS_PROF}/${idProjeto}/presencas?data=${data}`)
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
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta('Não foi possível carregar a chamada deste projeto.', 'error');
        } else {
            exibirFeedback('Não foi possível carregar a chamada deste projeto.', true);
        }
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
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta('Não há participantes para salvar nesta chamada.', 'error');
        } else {
            exibirFeedback('Não há participantes para salvar nesta chamada.', true);
        }
        return;
    }

    const payload = linhas.map(linha => ({
        idProjeto: projetoSelecionado.id,
        idParticipante: Number(linha.dataset.participanteId),
        dataChamada: data,
        presente: linha.querySelector('input[type="checkbox"]').checked,
        observacao: linha.querySelector('input[type="text"]').value.trim() || null,
        registradoPor: coordenadorLogado.id ? Number(coordenadorLogado.id) : null
    }));

    try {
        const resposta = await fetch(`${API_PROJETOS_PROF}/${projetoSelecionado.id}/presencas`, {
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

        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta('Chamada salva com sucesso!', 'success');
        } else {
            exibirFeedback('Chamada salva com sucesso.');
        }

        await carregarChamadaProjeto(projetoSelecionado.id);
    } catch (erro) {
        console.error(erro);

        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta(erro.message || 'Não foi possível salvar a chamada.', 'error');
        } else {
            exibirFeedback(erro.message || 'Não foi possível salvar a chamada.', true);
        }
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

function iniciais(nome) {
    const partes = String(nome || 'Professor').trim().split(/\s+/).slice(0, 2);
    return partes.map(p => p[0]).join('').toUpperCase() || 'PF';
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


// =========================================================
// LÓGICA DO MODAL DE EDIÇÃO DE PERFIL DO COORDENADOR/VOLUNTÁRIO
// =========================================================

// Ajuste rigoroso dos dias começando por Segunda-feira
const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const turnosDisp = ['Manhã', 'Tarde', 'Noite'];

function inicializarTabelaDisponibilidade() {
    const tbody = document.getElementById('corpoDisponibilidade');
    if (!tbody) return;
    
    tbody.innerHTML = diasSemana.map(dia => `
        <tr>
            <td>${dia}</td>
            ${turnosDisp.map(turno => `
                <td><input type="checkbox" class="check-disp" data-dia="${dia}" data-turno="${turno}"></td>
            `).join('')}
        </tr>
    `).join('');
}

function chaveDisponibilidade(dia, turno) {
    return `${dia}|${turno}`;
}

function removerAcentos(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function normalizarDiaDisponibilidade(valor) {
    const texto = removerAcentos(valor);
    if (texto.startsWith('seg')) return diasSemana[0];
    if (texto.startsWith('ter')) return diasSemana[1];
    if (texto.startsWith('qua')) return diasSemana[2];
    if (texto.startsWith('qui')) return diasSemana[3];
    if (texto.startsWith('sex')) return diasSemana[4];
    if (texto.startsWith('sab')) return diasSemana[5];
    if (texto.startsWith('dom')) return diasSemana[6];
    return String(valor || '').trim();
}

function normalizarTurnoDisponibilidade(valor) {
    const texto = removerAcentos(valor);
    if (texto.startsWith('man')) return turnosDisp[0];
    if (texto.startsWith('tar')) return turnosDisp[1];
    if (texto.startsWith('noi')) return turnosDisp[2];
    return String(valor || '').trim();
}

function normalizarListaSeparada(valor) {
    return String(valor || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}

function obterDisponibilidadesSalvas() {
    const disponibilidades = normalizarListaSeparada(coordenadorLogado.disponibilidades);
    if (disponibilidades.length) {
        const paresSalvos = new Set();
        disponibilidades.forEach(item => {
            const partes = item.includes('|') ? item.split('|') : item.split('-');
            if (partes.length < 2) return;

            const turno = normalizarTurnoDisponibilidade(partes.pop());
            const dia = normalizarDiaDisponibilidade(partes.join('-'));
            paresSalvos.add(chaveDisponibilidade(dia, turno));
        });

        if (paresSalvos.size) return paresSalvos;
    }

    const diasSalvos = normalizarListaSeparada(coordenadorLogado.diasDisponiveis);
    const turnosSalvos = normalizarListaSeparada(coordenadorLogado.turnosDisponiveis);
    const paresLegados = new Set();

    diasSalvos.forEach(dia => {
        turnosSalvos.forEach(turno => paresLegados.add(chaveDisponibilidade(dia, turno)));
    });

    return paresLegados;
}

function mascaraCPFCoordenador(input) {
    input.value = input.value
        .replace(/\D/g, '')
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function abrirModalPerfil() {
    document.getElementById('editNome').value = coordenadorLogado.nome || '';
    document.getElementById('editEmail').value = coordenadorLogado.email || '';
    document.getElementById('editTelefone').value = coordenadorLogado.telefone || '';
    const inputCpf = document.getElementById('editCpf');
    inputCpf.removeAttribute('readonly');
    inputCpf.removeAttribute('title');
    inputCpf.setAttribute('maxlength', '14');
    inputCpf.setAttribute('placeholder', '000.000.000-00');
    inputCpf.oninput = () => mascaraCPFCoordenador(inputCpf);
    inputCpf.value = coordenadorLogado.cpf || '';
    document.getElementById('editEndereco').value = coordenadorLogado.endereco || '';

    const habilidadesSalvas = coordenadorLogado.habilidades ? coordenadorLogado.habilidades.split(',').map(h => h.trim()) : [];
    document.querySelectorAll('#containerHabilidades input[type="checkbox"]').forEach(chk => {
        chk.checked = habilidadesSalvas.includes(chk.value);
    });

    inicializarTabelaDisponibilidade();
    const disponibilidadesSalvas = obterDisponibilidadesSalvas();

    document.querySelectorAll('.check-disp').forEach(chk => {
        const dia = chk.getAttribute('data-dia');
        const turno = chk.getAttribute('data-turno');
        chk.checked = disponibilidadesSalvas.has(chaveDisponibilidade(dia, turno));
    });

    const overlay = document.getElementById('modalEdicaoPerfil');
    const caixa = overlay.querySelector('.modal-caixa');
    overlay.classList.add('mostrar-modal');
    caixa.classList.add('mostrar-modal');
}

function fecharModalPerfil() {
    const overlay = document.getElementById('modalEdicaoPerfil');
    const caixa = overlay.querySelector('.modal-caixa');
    overlay.classList.remove('mostrar-modal');
    caixa.classList.remove('mostrar-modal');
}

document.addEventListener('click', function(evento) {
    const overlay = document.getElementById('modalEdicaoPerfil');
    // Se o elemento clicado for exatamente o fundo escuro, fecha o modal
    if (evento.target === overlay) {
        fecharModalPerfil();
    }
});

async function salvarEdicaoPerfil() {
    const nomeAtualizado = document.getElementById('editNome').value.trim();
    const emailAtualizado = document.getElementById('editEmail').value.trim();
    const telefoneAtualizado = document.getElementById('editTelefone').value.trim();
    const cpfAtualizado = document.getElementById('editCpf').value.trim();
    const enderecoAtualizado = document.getElementById('editEndereco').value.trim();
    
    const habilidadesSelecionadas = Array.from(document.querySelectorAll('#containerHabilidades input[type="checkbox"]:checked'))
                                         .map(chk => chk.value)
                                         .join(', ');

    const diasSet = new Set();
    const turnosSet = new Set();
    const disponibilidadesSelecionadas = [];

    document.querySelectorAll('.check-disp:checked').forEach(chk => {
        const dia = chk.getAttribute('data-dia');
        const turno = chk.getAttribute('data-turno');
        diasSet.add(dia);
        turnosSet.add(turno);
        disponibilidadesSelecionadas.push(chaveDisponibilidade(dia, turno));
    });

    const payload = {
        nome: nomeAtualizado,
        email: emailAtualizado,
        telefone: telefoneAtualizado,
        dataNascimento: coordenadorLogado.dataNascimento || null,
        cpf: cpfAtualizado,
        endereco: enderecoAtualizado,
        habilidades: habilidadesSelecionadas,
        outrasHabilidades: coordenadorLogado.outrasHabilidades || '',
        observacoesDisponibilidade: coordenadorLogado.observacoesDisponibilidade || '',
        status: coordenadorLogado.status || 'ativo',
        disponibilidades: disponibilidadesSelecionadas.join(', '),
        diasDisponiveis: Array.from(diasSet).join(', '),
        turnosDisponiveis: Array.from(turnosSet).join(', ')
    };

    try {
        // Variável atualizada para coordenadorLogado
        const idVoluntario = coordenadorLogado.id || localStorage.getItem('usuarioLogadoId');
        const resposta = await fetch(`${API_FUNCIONARIOS_PROF}/${idVoluntario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_funcionario: Number(idVoluntario),
                nome_funcionario: nomeAtualizado,
                cpf: cpfAtualizado,
                telefone: telefoneAtualizado,
                email: emailAtualizado,
                cargo: coordenadorLogado.cargo || 'Coordenador',
                senha: coordenadorLogado.senha || ''
            })
        });

        if (!resposta.ok) throw new Error('Falha ao atualizar o perfil no banco de dados.');

        coordenadorLogado.nome = nomeAtualizado;
        coordenadorLogado.email = emailAtualizado;
        coordenadorLogado.telefone = telefoneAtualizado;
        coordenadorLogado.cpf = cpfAtualizado;
        coordenadorLogado.endereco = enderecoAtualizado;
        coordenadorLogado.habilidades = habilidadesSelecionadas;
        coordenadorLogado.disponibilidades = payload.disponibilidades;
        coordenadorLogado.diasDisponiveis = payload.diasDisponiveis;
        coordenadorLogado.turnosDisponiveis = payload.turnosDisponiveis;

        localStorage.setItem('usuarioLogadoNome', nomeAtualizado);
        localStorage.setItem('usuarioLogadoEmail', emailAtualizado);
        localStorage.setItem('usuarioLogadoTelefone', telefoneAtualizado);
        localStorage.setItem('usuarioLogadoCpf', cpfAtualizado);
        localStorage.setItem('usuarioLogadoEndereco', enderecoAtualizado);
        localStorage.setItem('usuarioLogadoHabilidades', habilidadesSelecionadas);
        localStorage.setItem('usuarioLogadoDisponibilidades', payload.disponibilidades);
        localStorage.setItem('usuarioLogadoDiasDisponiveis', payload.diasDisponiveis);
        localStorage.setItem('usuarioLogadoTurnosDisponiveis', payload.turnosDisponiveis);

        renderizarPerfil();
        fecharModalPerfil();
        mostrarAlerta('Perfil atualizado com sucesso!', 'success');

    } catch (erro) {
        console.error(erro);
        mostrarAlerta('Não foi possível salvar as alterações.', 'error');
    }
}


function abrirModalEdicaoProjeto() {
    if (!projetoSelecionado) return;
    
    // Preenche os campos do modal com os dados do projeto atual
    document.getElementById('formProjetoNome').value = projetoSelecionado.nome || '';
    document.getElementById('formProjetoDescricao').value = projetoSelecionado.descricao || '';
    document.getElementById('formProjetoTipo').value = projetoSelecionado.tipo || 'Social';
    document.getElementById('formProjetoPublicoAlvo').value = projetoSelecionado.publicoAlvo || 'Comunidade';
    document.getElementById('formProjetoDataInicio').value = projetoSelecionado.dataInicio || '';
    document.getElementById('formProjetoDataFim').value = projetoSelecionado.dataFim || '';

    const modal = document.getElementById('modalFormProjeto');
    modal.style.display = 'flex'; // Exibe o modal
}

function fecharModalEdicaoProjeto() {
    document.getElementById('modalFormProjeto').style.display = 'none';
}

async function salvarEdicaoProjeto() {
    if (!projetoSelecionado) return;

    // Preserva a estrutura atual e sobrescreve com os dados atualizados
    const payload = {
        ...projetoSelecionado,
        nome: document.getElementById('formProjetoNome').value.trim(),
        descricao: document.getElementById('formProjetoDescricao').value.trim(),
        tipo: document.getElementById('formProjetoTipo').value,
        publicoAlvo: document.getElementById('formProjetoPublicoAlvo').value,
        dataInicio: document.getElementById('formProjetoDataInicio').value,
        dataFim: document.getElementById('formProjetoDataFim').value || null
    };

    try {
        const resposta = await fetch(`${API_PROJETOS_PROF}/${projetoSelecionado.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!resposta.ok) {
            throw new Error('Falha ao atualizar o projeto no servidor.');
        }

        // Atualiza a referência em memória local
        Object.assign(projetoSelecionado, payload);

        // Atualiza a visualização da tela dinamicamente
        document.getElementById('projetoSelecionadoNome').textContent = projetoSelecionado.nome;
        document.getElementById('projetoSelecionadoDetalhes').textContent = 
            `${projetoSelecionado.tipo} · ${projetoSelecionado.publicoAlvo}`;

        // Atualiza o menu lateral de projetos
        renderizarProjetos();
        
        fecharModalEdicaoProjeto();

        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta('Projeto atualizado com sucesso!', 'success');
        }
    } catch (erro) {
        console.error(erro);
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta('Não foi possível salvar as alterações do projeto.', 'error');
        }
    }
}

// =========================================================
// RENDERIZAÇÃO DA VISUALIZAÇÃO EXTRA (PERFIL)
// =========================================================
function renderizarVisualizacaoExtra() {
    // 1. Renderizar Habilidades (Tags visuais)
    const habContainer = document.getElementById('visualizacaoHabilidades');
    if (habContainer) {
        const habilidades = coordenadorLogado.habilidades 
            ? coordenadorLogado.habilidades.split(',').map(h => h.trim()).filter(Boolean) 
            : [];
            
        if (habilidades.length === 0) {
            habContainer.innerHTML = '<span style="color: var(--prof-muted); font-size: 14px;">Nenhuma habilidade registrada.</span>';
        } else {
            habContainer.innerHTML = habilidades.map(h => 
                `<span style="display: inline-flex; align-items: center; padding: 6px 14px; background: #fff7f2; border: 1px solid #f7ece6; border-radius: 20px; font-size: 13px; font-weight: 500; color: var(--prof-brand);">${h}</span>`
            ).join('');
        }
    }

    // 2. Renderizar Tabela de Disponibilidade (Apenas Leitura)
    const tbody = document.getElementById('tabelaVisualizacaoDisponibilidade');
    if (tbody) {
        // Aproveita a lógica que você já criou para o modal de edição
        const disponibilidadesSalvas = obterDisponibilidadesSalvas();
        const diasSemanaList = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
        const turnosList = ['Manhã', 'Tarde', 'Noite'];

        tbody.innerHTML = diasSemanaList.map(dia => {
            const celulasTurnos = turnosList.map(turno => {
                const temDisponibilidade = disponibilidadesSalvas.has(chaveDisponibilidade(dia, turno));
                
                // Se tem disponibilidade, mostra um Check verde. Se não, um traço cinza.
                const icone = temDisponibilidade 
                    ? `<i class="ph-fill ph-check-circle" style="color: var(--prof-success); font-size: 24px;"></i>` 
                    : `<span style="color: #e8e6e1; font-size: 18px; font-weight: bold;">-</span>`;
                    
                return `<td style="padding: 14px; border-bottom: 1px solid var(--prof-border);">${icone}</td>`;
            }).join('');

            return `
                <tr>
                    <td style="padding: 14px; text-align: left; border-bottom: 1px solid var(--prof-border); font-weight: 600; color: var(--prof-text);">${dia}</td>
                    ${celulasTurnos}
                </tr>
            `;
        }).join('');
    }
}
