const API_FUNCIONARIOS_ADMIN = 'https://grupo-nata.onrender.com/api/funcionarios';

let funcionarioAdministrativo = null;

document.addEventListener('DOMContentLoaded', () => {
    const cargoLogado = (localStorage.getItem('usuarioLogadoCargo') || '').toLowerCase();
    if (cargoLogado === 'professor') {
        window.location.href = 'perfil-professor.html';
        return;
    }
    if (cargoLogado && cargoLogado !== 'administrativo') {
        window.location.href = 'dashboard.html';
        return;
    }
    if (!cargoLogado) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('formPerfilAdmin').addEventListener('submit', salvarPerfilAdministrativo);
    document.getElementById('adminTelefone').addEventListener('input', event => {
        event.target.value = formatarTelefoneBR(event.target.value);
    });
    document.getElementById('adminCpf').addEventListener('input', event => {
        event.target.value = formatarCpf(event.target.value);
    });
    carregarPerfilAdministrativo();
});

async function carregarPerfilAdministrativo() {
    esconderFeedback();
    try {
        const id = localStorage.getItem('usuarioLogadoId');
        let funcionario = null;

        if (id) {
            const resposta = await fetch(`${API_FUNCIONARIOS_ADMIN}/${id}`);
            if (resposta.ok) funcionario = await resposta.json();
        }

        if (!funcionario) {
            const resposta = await fetch(API_FUNCIONARIOS_ADMIN);
            if (!resposta.ok) throw new Error('Erro ao buscar funcionários.');
            const lista = await resposta.json();
            const email = normalizar(localStorage.getItem('usuarioLogadoEmail'));
            const nome = normalizar(localStorage.getItem('usuarioLogadoNome'));
            funcionario = lista.find(f =>
                normalizar(f.email) === email ||
                normalizar(f.nome_funcionario || f.nomeFuncionario || f.nome) === nome
            );
        }

        if (!funcionario || normalizar(funcionario.cargo) !== 'administrativo') {
            throw new Error('Funcionário administrativo não encontrado para este login.');
        }

        funcionarioAdministrativo = funcionario;
        preencherFormulario(funcionario);
    } catch (erro) {
        console.error(erro);
        exibirFeedback(erro.message || 'Não foi possível carregar seu perfil.', true);
    }
}

function preencherFormulario(funcionario) {
    const id = funcionario.id_funcionario || funcionario.idFuncionario || funcionario.id || '';
    const nome = funcionario.nome_funcionario || funcionario.nomeFuncionario || funcionario.nome || '';

    document.getElementById('adminId').value = id;
    document.getElementById('adminCargo').value = funcionario.cargo || 'Administrativo';
    document.getElementById('adminSenha').value = funcionario.senha || '';
    document.getElementById('adminNome').value = nome;
    document.getElementById('adminCpf').value = funcionario.cpf || '';
    document.getElementById('adminTelefone').value = funcionario.telefone || '';
    document.getElementById('adminEmail').value = funcionario.email || '';

    document.getElementById('adminNomeResumo').textContent = nome || 'Funcionário';
    document.getElementById('adminCargoResumo').textContent = funcionario.cargo || 'Administrativo';
    document.getElementById('adminIniciais').textContent = iniciais(nome);
}

async function salvarPerfilAdministrativo(event) {
    event.preventDefault();
    esconderFeedback();

    const id = document.getElementById('adminId').value;
    if (!id) {
        exibirFeedback('Não foi possível identificar o funcionário logado.', true);
        return;
    }

    const payload = {
        id_funcionario: Number(id),
        nome_funcionario: document.getElementById('adminNome').value.trim(),
        cpf: document.getElementById('adminCpf').value.trim(),
        telefone: document.getElementById('adminTelefone').value.trim(),
        email: document.getElementById('adminEmail').value.trim(),
        cargo: document.getElementById('adminCargo').value || 'Administrativo',
        senha: document.getElementById('adminSenha').value || funcionarioAdministrativo?.senha || ''
    };
    
    if (!payload.nome_funcionario || !payload.cpf || !payload.telefone || !payload.email) {
        exibirFeedback('Preencha todos os campos antes de salvar.', true);
        return;
    }

    try {
        const resposta = await fetch(`${API_FUNCIONARIOS_ADMIN}/${id}`, {
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

        funcionarioAdministrativo = atualizado;
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
    const el = document.getElementById('perfilAdminFeedback');
    el.textContent = mensagem;
    el.classList.toggle('is-error', erro);
    el.style.display = 'block';
}

function esconderFeedback() {
    const el = document.getElementById('perfilAdminFeedback');
    el.textContent = '';
    el.classList.remove('is-error');
    el.style.display = 'none';
}

function normalizar(valor) {
    return String(valor || '').trim().toLowerCase();
}

function iniciais(nome) {
    const partes = String(nome || 'Administrativo').trim().split(/\s+/).slice(0, 2);
    return partes.map(p => p[0]).join('').toUpperCase() || 'AD';
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