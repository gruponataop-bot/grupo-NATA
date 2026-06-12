const API_FUNCIONARIOS_PROF = 'https://grupo-nata.onrender.com/api/funcionarios';

let funcionarioProfessor = null;

document.addEventListener('DOMContentLoaded', () => {
    const cargoLogado = (localStorage.getItem('usuarioLogadoCargo') || '').toLowerCase();
    
    // Trava de segurança para garantir que apenas Professor acessa
    if (!cargoLogado.includes('professor')) {
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('editTelefone').addEventListener('input', event => {
        event.target.value = formatarTelefoneBR(event.target.value);
    });

    carregarPerfilProfessor();
});

async function carregarPerfilProfessor() {
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

        if (!funcionario || !normalizar(funcionario.cargo).includes('professor')) {
            throw new Error('Funcionário professor não encontrado para este login.');
        }

        funcionarioProfessor = funcionario;
        
        // Carrega os dados simulados do LocalStorage para Habilidades e Disponibilidade
        funcionarioProfessor.endereco = localStorage.getItem('usuarioLogadoEndereco') || '';
        funcionarioProfessor.habilidades = JSON.parse(localStorage.getItem(`hab_prof_${funcionarioProfessor.id_funcionario}`) || '[]').join(', ');
        funcionarioProfessor.disponibilidades = JSON.parse(localStorage.getItem(`disp_prof_${funcionarioProfessor.id_funcionario}`) || '[]').join(', ');

        renderizarPerfil();
    } catch (erro) {
        console.error(erro);
        mostrarAlerta(erro.message || 'Não foi possível carregar seu perfil.', 'error');
    }
}

function renderizarPerfil() {
    const nome = funcionarioProfessor.nome_funcionario || funcionarioProfessor.nomeFuncionario || funcionarioProfessor.nome || '';

    document.getElementById('professorNome').textContent = nome || 'Funcionário';
    document.getElementById('professorCargo').textContent = funcionarioProfessor.cargo || 'Professor';
    document.getElementById('professorIniciais').textContent = iniciais(nome);
    
    document.getElementById('professorEmail').textContent = funcionarioProfessor.email || '-';
    document.getElementById('professorTelefone').textContent = funcionarioProfessor.telefone || '-';
    document.getElementById('professorCpf').textContent = funcionarioProfessor.cpf || '-';
    document.getElementById('professorEndereco').textContent = funcionarioProfessor.endereco || '-';

    renderizarVisualizacaoExtra();
}

function renderizarVisualizacaoExtra() {
    // 1. Renderiza as tags visuais de Habilidades
    const habContainer = document.getElementById('visualizacaoHabilidades');
    if (habContainer) {
        const habilidades = funcionarioProfessor.habilidades 
            ? funcionarioProfessor.habilidades.split(',').map(h => h.trim()).filter(Boolean) 
            : [];
            
        if (habilidades.length === 0) {
            habContainer.innerHTML = '<span style="color: var(--prof-muted); font-size: 14px;">Nenhuma habilidade registrada.</span>';
        } else {
            habContainer.innerHTML = habilidades.map(h => 
                `<span style="display: inline-flex; align-items: center; padding: 6px 14px; background: #fff7f2; border: 1px solid #f7ece6; border-radius: 20px; font-size: 13px; font-weight: 500; color: var(--prof-brand);">${h}</span>`
            ).join('');
        }
    }

    // 2. Renderiza a tabela de Quadro de Disponibilidade
    const tbody = document.getElementById('tabelaVisualizacaoDisponibilidade');
    if (tbody) {
        const disponibilidadesSalvas = new Set(
            funcionarioProfessor.disponibilidades ? funcionarioProfessor.disponibilidades.split(',').map(h => h.trim()).filter(Boolean) : []
        );
        const diasSemanaList = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
        const turnosList = ['Manhã', 'Tarde', 'Noite'];

        tbody.innerHTML = diasSemanaList.map(dia => {
            const celulasTurnos = turnosList.map(turno => {
                const chave = `${dia}_${turno}`;
                const temDisponibilidade = disponibilidadesSalvas.has(chave);
                
                const icone = temDisponibilidade 
                    ? `<i class="ph-fill ph-check-circle" style="color: var(--prof-success); font-size: 24px;"></i>` 
                    : `<span style="color: #e8e6e1; font-size: 18px; font-weight: bold;">-</span>`;
                    
                return `<td style="padding: 14px; border-bottom: 1px solid var(--prof-border); text-align:center;">${icone}</td>`;
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

// ==========================================
// FUNÇÕES DO MODAL DE EDIÇÃO
// ==========================================
function abrirModalPerfil() {
    document.getElementById('editNome').value = funcionarioProfessor.nome_funcionario || '';
    document.getElementById('editEmail').value = funcionarioProfessor.email || '';
    document.getElementById('editTelefone').value = funcionarioProfessor.telefone || '';
    document.getElementById('editCpf').value = funcionarioProfessor.cpf || '';
    document.getElementById('editEndereco').value = funcionarioProfessor.endereco || '';

    // Marca as checkboxes de habilidades corretas
    const habilidadesSalvas = funcionarioProfessor.habilidades ? funcionarioProfessor.habilidades.split(',').map(h => h.trim()) : [];
    document.querySelectorAll('#containerHabilidades input[type="checkbox"]').forEach(chk => {
        chk.checked = habilidadesSalvas.includes(chk.value);
    });

    // Marca as checkboxes de disponibilidade corretas
    inicializarTabelaDisponibilidade();
    const disponibilidadesSalvas = new Set(
        funcionarioProfessor.disponibilidades ? funcionarioProfessor.disponibilidades.split(',').map(h => h.trim()).filter(Boolean) : []
    );
    document.querySelectorAll('.disp-checkbox').forEach(chk => {
        chk.checked = disponibilidadesSalvas.has(chk.value);
    });

    document.getElementById('modalEdicaoPerfil').classList.add('mostrar-modal');
    document.querySelector('.modal-caixa').classList.add('mostrar-modal');
}

function fecharModalPerfil() {
    document.getElementById('modalEdicaoPerfil').classList.remove('mostrar-modal');
    document.querySelector('.modal-caixa').classList.remove('mostrar-modal');
}

document.addEventListener('click', function(evento) {
    const overlay = document.getElementById('modalEdicaoPerfil');
    if (evento.target === overlay) {
        fecharModalPerfil();
    }
});

function inicializarTabelaDisponibilidade() {
    const tbody = document.getElementById('corpoDisponibilidade');
    if (!tbody) return;
    
    const diasSemanaList = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const turnosList = ['Manhã', 'Tarde', 'Noite'];

    tbody.innerHTML = diasSemanaList.map(dia => {
        const celulasTurnos = turnosList.map(turno => {
            const chave = `${dia}_${turno}`;
            return `
                <td style="text-align: center; vertical-align: middle;">
                    <label style="display: flex; justify-content: center; width: 100%; cursor: pointer;">
                        <input type="checkbox" value="${chave}" class="disp-checkbox" style="width: 18px; height: 18px; accent-color: var(--color-brand);">
                    </label>
                </td>`;
        }).join('');

        return `
            <tr>
                <td style="font-weight: 500; padding: 12px 8px;">${dia}</td>
                ${celulasTurnos}
            </tr>`;
    }).join('');
}

async function salvarEdicaoPerfil() {
    const nomeAtualizado = document.getElementById('editNome').value.trim();
    const emailAtualizado = document.getElementById('editEmail').value.trim();
    const telefoneAtualizado = document.getElementById('editTelefone').value.trim();
    const cpfAtualizado = document.getElementById('editCpf').value.trim();
    const enderecoAtualizado = document.getElementById('editEndereco').value.trim();
    
    const habilidadesSelecionadas = Array.from(document.querySelectorAll('#containerHabilidades input[type="checkbox"]:checked'))
                                         .map(chk => chk.value);

    const disponibilidadesSelecionadas = Array.from(document.querySelectorAll('.disp-checkbox:checked'))
                                              .map(chk => chk.value);

    const payload = {
        id_funcionario: Number(funcionarioProfessor.id_funcionario),
        nome_funcionario: nomeAtualizado,
        cpf: cpfAtualizado,
        telefone: telefoneAtualizado,
        email: emailAtualizado,
        cargo: funcionarioProfessor.cargo || 'Professor',
        senha: funcionarioProfessor.senha || ''
    };

    if (!payload.nome_funcionario || !payload.cpf || !payload.telefone || !payload.email) {
        mostrarAlerta('Preencha todos os campos antes de salvar.', 'warning');
        return;
    }

    try {
        const resposta = await fetch(`${API_FUNCIONARIOS_PROF}/${funcionarioProfessor.id_funcionario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!resposta.ok) throw new Error('Erro ao atualizar funcionário no banco de dados.');
        const atualizado = await resposta.json();

        // Salva os extras no LocalStorage
        localStorage.setItem(`hab_prof_${atualizado.id_funcionario}`, JSON.stringify(habilidadesSelecionadas));
        localStorage.setItem(`disp_prof_${atualizado.id_funcionario}`, JSON.stringify(disponibilidadesSelecionadas));
        localStorage.setItem('usuarioLogadoEndereco', enderecoAtualizado);
        
        // Atualiza a memória local principal
        localStorage.setItem('usuarioLogadoNome', atualizado.nome_funcionario);
        localStorage.setItem('usuarioLogadoEmail', atualizado.email);
        localStorage.setItem('usuarioLogadoTelefone', atualizado.telefone);

        // Atualiza o objeto em tempo real na tela
        funcionarioProfessor = atualizado;
        funcionarioProfessor.endereco = enderecoAtualizado;
        funcionarioProfessor.habilidades = habilidadesSelecionadas.join(', ');
        funcionarioProfessor.disponibilidades = disponibilidadesSelecionadas.join(', ');

        renderizarPerfil();
        fecharModalPerfil();
        
        const nomeTopbar = document.getElementById('nome-usuario');
        if (nomeTopbar) nomeTopbar.innerText = atualizado.nome_funcionario;

        mostrarAlerta('Perfil atualizado com sucesso!', 'success');
    } catch (erro) {
        console.error(erro);
        mostrarAlerta('Não foi possível salvar suas alterações.', 'error');
    }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================
function iniciais(nome) {
    const partes = String(nome || 'Professor').trim().split(/\s+/).slice(0, 2);
    return partes.map(p => p[0]).join('').toUpperCase() || 'PR';
}

function normalizar(valor) {
    return String(valor || '').trim().toLowerCase();
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