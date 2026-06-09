const url_base = 'https://grupo-nata.onrender.com'; 

async function carregarTabelaFuncionarios() {
    try {
        const response = await fetch(url_base+'/api/funcionarios');
        
        if (!response.ok) {
            throw new Error("Erro ao buscar dados do servidor");
        }

        const funcionarios = await response.json();
        const tbody = document.getElementById('tabela-funcionarios-body');

        tbody.innerHTML = "";

        funcionarios.forEach(func => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${func.nome_funcionario}</td>
                <td>${func.cpf}</td>
                <td>${func.email}</td>
                <td>${func.cargo}</td>
                <td>${func.telefone}</td>
                <td>${func.id_funcionario}</td>
                <td class="acoes-icones">
                    <button class="action-btn btn-edit" title="Editar">Editar</button>
                    <button class="action-btn btn-excluir" style="color: #dc3545;" title="Excluir">Excluir</button>
                </td>
            `;

            tr.querySelector('.btn-edit').addEventListener('click', () => abrirModalEdicao(func));
            tr.querySelector('.btn-excluir').addEventListener('click', () => abrirModalExcluir(func));
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro ao carregar tabela:", error);
        alert("Não foi possível carregar a lista de funcionários.");
    }
}

function abrirModalExcluir(funcionario) {
    const modal = document.getElementById('modalExcluir');
    
    document.getElementById('nome-excluir-exibicao').textContent = funcionario.nome_funcionario;
    document.getElementById('id-excluir-oculto').value = funcionario.id_funcionario;
    
    modal.showModal();
}

async function executarExclusao() {
    const id = document.getElementById('id-excluir-oculto').value;

    try {
        const response = await fetch(`http://127.0.0.1:8080/api/funcionarios/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Funcionário removido com sucesso!");
            document.getElementById('modalExcluir').close();
            carregarTabelaFuncionarios(); 
        } 
        else if (response.status === 409) {
            // Este é o caso específico da chave estrangeira (projeto vinculado)
            alert("Atenção: Este funcionário ainda está listado como responsável por algum projeto e por isto sua exclusão não é possível.");
            document.getElementById('modalExcluir').close();
        } 
        else {
            const msgErro = await response.text();
            alert("Erro: " + (msgErro || "Não foi possível excluir o funcionário."));
        }
    } catch (error) {
        console.error("Erro na requisição DELETE:", error);
        alert("Erro de conexão com o servidor.");
    }
}

function abrirModalEdicao(funcionario) {
    let modal = document.getElementById('modalEdicao');
    
    document.getElementById('edit-id').value = funcionario.id_funcionario;
    document.getElementById('edit-nome').value = funcionario.nome_funcionario;
    document.getElementById('edit-cpf').value = funcionario.cpf;
    document.getElementById('edit-telefone').value = funcionario.telefone;
    document.getElementById('edit-email').value = funcionario.email;
    document.getElementById('edit-cargo').value = funcionario.cargo;
    document.getElementById('edit-senha').value = funcionario.senha;

    modal.showModal();
}

async function editarParticipante(event) {
    event.preventDefault();

    const id = document.getElementById('edit-id').value;
    
    const dadosAtualizados = {
        id_funcionario: document.getElementById('edit-id').value,
        nome_funcionario: document.getElementById('edit-nome').value,
        cpf: document.getElementById('edit-cpf').value,
        telefone: document.getElementById('edit-telefone').value,
        email: document.getElementById('edit-email').value,
        cargo: document.getElementById('edit-cargo').value,
        senha: document.getElementById('edit-senha').value
    };

    try {
        const response = await fetch(url_base + `/api/funcionarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });

        if (response.ok) {
            alert("Funcionário atualizado com sucesso!");
            document.getElementById('modalEdicao').close();
            carregarTabelaFuncionarios(); 
        } else {
            alert("Erro ao atualizar funcionário.");
        }
    } catch (error) {
        console.error("Erro no PUT:", error);
    }
}

window.onload = carregarTabelaFuncionarios;