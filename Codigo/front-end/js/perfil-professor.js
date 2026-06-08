const API_FUNCIONARIOS_PROF = 'http://localhost:8080/api/funcionarios';

let funcionarioProfessor = null;

document.addEventListener('DOMContentLoaded', () => {
    const cargoLogado = (localStorage.getItem('usuarioLogadoCargo') || '').toLowerCase();
    if (cargoLogado === 'administrativo') {
        window.location.href = 'perfil-administrativo.html';
        return;
    }
    if (cargoLogado && cargoLogado !== 'professor') {
        window.location.href = 'dashboard.html';
        return;
    }
    if (!cargoLogado) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('formPerfilProfessor').addEventListener('submit', salvarPerfilProfessor);
    document.getElementById('professorTelefone').addEventListener('input', event => {
        event.target.value = formatarTelefoneBR(event.target.value);
    });
    document.getElementById('professorCpf').addEventListener('input', event => {
        event.target.value = formatarCpf(event.target.value);
    });
    carregarPerfilProfessor();
});

async function carregarPerfilProfessor() {
    esconderFeedback();
    try {
        const id = localStorage.getItem('usuarioLogadoId');
        let funcionario = null;

        if (id) {
            const resposta = await fetch(`${API_FUNCIONARIOS_PROF}/${id}`);
            if (resposta.ok) funcionario = await resposta.json();
        }

        if (!funcionario) {
            const resposta = await fetch(API_FUNCIONARIOS_PROF);
            if (!resposta.ok) throw new Error('Erro ao buscar funcionários.');
            const lista = await resposta.json();
            const email = normalizar(localStorage.getItem('usuarioLogadoEmail'));
            const nome = normalizar(localStorage.getItem('usuarioLogadoNome'));
            funcionario = lista.find(f =>
                normalizar(f.email) === email ||
                normalizar(f.nome_funcionario || f.nomeFuncionario || f.nome) === nome
            );
        }

        if (!funcionario || normalizar(funcionario.cargo) !== 'professor') {
            throw new Error('Funcionário professor não encontrado para este login.');
        }

        funcionarioProfessor = funcionario;
        preencherFormulario(funcionario);
    } catch (erro) {
        console.error(erro);
        exibirFeedback(erro.message || 'Não foi possível carregar seu perfil.', true);
    }
}

function preencherFormulario(funcionario) {
    const id = funcionario.id_funcionario || funcionario.idFuncionario || funcionario.id || '';
    const nome = funcionario.nome_funcionario || funcionario.nomeFuncionario || funcionario.nome || '';

    document.getElementById('professorId').value = id;
    document.getElementById('professorCargo').value = funcionario.cargo || 'Professor';
    document.getElementById('professorSenha').value = funcionario.senha || '';
    document.getElementById('professorNome').value = nome;
    document.getElementById('professorCpf').value = funcionario.cpf || '';
    document.getElementById('professorTelefone').value = funcionario.telefone || '';
    document.getElementById('professorEmail').value = funcionario.email || '';

    document.getElementById('professorNomeResumo').textContent = nome || 'Funcionário';
    document.getElementById('professorCargoResumo').textContent = funcionario.cargo || 'Professor';
    document.getElementById('professorIniciais').textContent = iniciais(nome);
}

async function salvarPerfilProfessor(event) {
    event.preventDefault();
    esconderFeedback();

    const id = document.getElementById('professorId').value;
    if (!id) {
        exibirFeedback('Não foi possível identificar o funcionário logado.', true);
        return;
    }

    const payload = {
        id_funcionario: Number(id),
        nome_funcionario: document.getElementById('professorNome').value.trim(),
        cpf: document.getElementById('professorCpf').value.trim(),
        telefone: document.getElementById('professorTelefone').value.trim(),
        email: document.getElementById('professorEmail').value.trim(),
        cargo: document.getElementById('professorCargo').value || 'Professor',
        senha: document.getElementById('professorSenha').value || funcionarioProfessor?.senha || ''
    };

    if (!payload.nome_funcionario || !payload.cpf || !payload.telefone || !payload.email) {
        exibirFeedback('Preencha todos os campos antes de salvar.', true);
        return;
    }

    try {
        const resposta = await fetch(`${API_FUNCIONARIOS_PROF}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!resposta.ok) throw new Error('Erro ao atualizar funcionário.');
        const atualizado = await resposta.json();

        localStorage.setItem('usuarioLogadoNome', atualizado.nome_funcionario || payload.nome_funcionario);
        localStorage.setItem('usuarioLogadoCargo', atualizado.cargo || payload.cargo);
        localStorage.setItem('usuarioLogadoId', atualizado.id_funcionario || id);
        localStorage.setItem('usuarioLogadoEmail', atualizado.email || payload.email);
        localStorage.setItem('usuarioLogadoCpf', atualizado.cpf || payload.cpf);
        localStorage.setItem('usuarioLogadoTelefone', atualizado.telefone || payload.telefone);

        funcionarioProfessor = atualizado;
        preencherFormulario(atualizado);
        const nomeTopbar = document.getElementById('nome-usuario');
        if (nomeTopbar) nomeTopbar.innerText = atualizado.nome_funcionario || payload.nome_funcionario;
        exibirFeedback('Perfil atualizado com sucesso.');
    } catch (erro) {
        console.error(erro);
        exibirFeedback('Não foi possível salvar suas alterações.', true);
    }
}

function exibirFeedback(mensagem, erro = false) {
    const el = document.getElementById('perfilProfessorFeedback');
    el.textContent = mensagem;
    el.classList.toggle('is-error', erro);
    el.style.display = 'block';
}

function esconderFeedback() {
    const el = document.getElementById('perfilProfessorFeedback');
    el.textContent = '';
    el.classList.remove('is-error');
    el.style.display = 'none';
}

function normalizar(valor) {
    return String(valor || '').trim().toLowerCase();
}

function iniciais(nome) {
    const partes = String(nome || 'Professor').trim().split(/\s+/).slice(0, 2);
    return partes.map(p => p[0]).join('').toUpperCase() || 'PR';
}

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

function formatarCpf(valor) {
    const d = String(valor).replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
