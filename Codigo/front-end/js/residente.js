// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let residentesData = [];
let residentesFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 5;
let idResidenteEditando = null;

// ==========================================
// INIT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("tabela-residentes-body")) {
        carregarResidentes();
        if (document.getElementById("edit-projeto")) {
            carregarProjetos("edit-projeto");
        }

        const inputPesquisa = document.getElementById("pesquisa-nome");
        if (inputPesquisa) inputPesquisa.addEventListener("input", aplicarFiltros);

        const selectFiltro = document.getElementById("filtro-status");
        if (selectFiltro) selectFiltro.addEventListener("change", aplicarFiltros);
    }

    if (document.getElementById("projeto")) {
        carregarProjetos("projeto");
    }

    const formCadastro = document.getElementById("form-cadastro-residente");
    if (formCadastro) {
        formCadastro.addEventListener("submit", cadastrarResidente);
    }

    const formEditar = document.getElementById("form-editar-residente");
    if (formEditar) {
        formEditar.addEventListener("submit", salvarEdicao);
    }
});

// ==========================================
// BADGE STATUS
// ==========================================
function getStatusBadge(status) {
    if (!status) return `<span class="badge badge--encerrado">Desconhecido</span>`;

    const s = status.toLowerCase();
    let classe = "badge--encerrado";

    if (s === "ativo") classe = "badge--ativo";
    if (s === "inativo") classe = "badge--suspenso";

    return `<span class="badge ${classe}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
}

// ==========================================
// BUSCAR RESIDENTES
// ==========================================
async function carregarResidentes() {
    try {
        const res = await fetch("https://grupo-nata.onrender.com/api/residentes");
        const dados = await res.json();

        residentesData = dados.map(r => ({
            ...r,
            nome: r.nome || "",
            telefone: r.telefone || "",
            email: r.email || "",
            cpf: r.cpf || "",
            endereco: r.endereco || "",
            status: (r.status || "").toLowerCase(),
            projeto: r.projeto || "-"
        }));

        residentesFiltrados = [...residentesData];
        renderizarTabela();

    } catch (e) {
        mostarAlerta("Erro ao carregar residentes.", "error");
        console.error("Erro:", e);
    }
}

// ==========================================
// FILTROS
// ==========================================
function aplicarFiltros() {
    const termo = document.getElementById("pesquisa-nome").value.toLowerCase();
    const status = document.getElementById("filtro-status").value.toLowerCase();

    residentesFiltrados = residentesData.filter(r => {
        return (
            r.nome.toLowerCase().includes(termo) &&
            (status === "" || r.status === status)
        );
    });

    paginaAtual = 1;
    renderizarTabela();
}

// ==========================================
// TABELA
// ==========================================
function renderizarTabela() {
    const tbody = document.getElementById("tabela-residentes-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const lista = residentesFiltrados.slice(inicio, inicio + itensPorPagina);

    lista.forEach(r => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${r.nome}</td>
            <td>${r.telefone || "-"}</td>
            <td>${r.projeto || "-"}</td>
            <td>${getStatusBadge(r.status)}</td>

            <td class="acoes-icones">
                <i class="action-btn" onclick="abrirModalVisualizar(${r.id})" title="Visualizar">Ver</i>
                <i class="action-btn" onclick="abrirModalEditar(${r.id})" title="Editar">Editar</i>
                <i class="action-btn action-btn-danger" style="color: #dc3545;" onclick="deletarResidente(${r.id})" title="Excluir">Excluir</i>
            </td>
        `;

        tbody.appendChild(tr);
    });

    renderizarPaginacao();
}

// ==========================================
// PAGINAÇÃO
// ==========================================
function renderizarPaginacao() {
    const total = residentesFiltrados.length;
    const totalPaginas = Math.ceil(total / itensPorPagina);

    const info = document.getElementById("info-paginacao");
    const controles = document.getElementById("controles-paginacao");

    if (!info || !controles) return;

    const ini = total === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
    const fim = Math.min(paginaAtual * itensPorPagina, total);

    info.innerText = `Mostrando ${ini} - ${fim} de ${total}`;

    controles.innerHTML = "";

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.onclick = () => {
            paginaAtual = i;
            renderizarTabela();
        };
        controles.appendChild(btn);
    }
}

// ==========================================
// CADASTRAR
// ==========================================
async function cadastrarResidente(e) {
   
    e.preventDefault();
    const selectProjeto = document.getElementById("projeto");
    const projetoSelecionado = selectProjeto?.selectedOptions[0];
    const idProjeto = selectProjeto?.value || "";
    const nomeProjeto = projetoSelecionado?.dataset.nome || "";

    const residente = {
        nome: document.getElementById("nome").value,
        cpf: document.getElementById("cpf").value,
        dataNascimento: document.getElementById("dataNascimento").value,
        telefone: document.getElementById("telefone").value,
        email: document.getElementById("email").value,
        endereco: document.getElementById("endereco").value,
        necessidadesEspeciais: document.getElementById("necessidadesEspeciais").value,
        contatoEmergencia: document.getElementById("contatoEmergencia").value,
        parentesco: document.getElementById("parentesco").value,
        telefoneEmergencia: document.getElementById("telefoneEmergencia").value,
        status: document.querySelector('input[name="status"]:checked').value,
        projeto: nomeProjeto
    };

    try {
        const res = await fetch("https://grupo-nata.onrender.com/api/residentes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(residente)
        });

        if (res.ok) {
            const residenteSalvo = await res.json();
            if (idProjeto && residenteSalvo.id) {
                const vinculo = await fetch(`https://grupo-nata.onrender.com/api/projetos/${idProjeto}/residentes/${residenteSalvo.id}`, {
                    method: "POST"
                });
                if (!vinculo.ok) {
                    mostarAlerta("Residente cadastrado, mas houve erro ao vincular ao projeto.", "error");
                    return;
                }
            }
            mostarAlerta("Cadastrado!", "success");
            window.location.href = "residentes.html";
        } else {
            mostarAlerta("Erro ao cadastrar", "error");
        }

    } catch (e) {
        console.error(e);
    }
}

// ==========================================
// ABRIR MODAL EDITAR
// ==========================================
function abrirModalEditar(id) {
    const r = residentesData.find(x => x.id === id);
    if (!r) return;

    idResidenteEditando = id;

    // Preenche os campos de texto, data e select
    document.getElementById("edit-id").value = r.id || "";
    document.getElementById("edit-nome").value = r.nome || "";
    document.getElementById("edit-cpf").value = r.cpf || "";
    document.getElementById("edit-dataNascimento").value = r.dataNascimento || "";
    document.getElementById("edit-telefone").value = r.telefone || "";
    document.getElementById("edit-email").value = r.email || "";
    document.getElementById("edit-endereco").value = r.endereco || "";
    document.getElementById("edit-necessidades").value = r.necessidadesEspeciais || "";
    document.getElementById("edit-contatoEmergencia").value = r.contatoEmergencia || "";
    document.getElementById("edit-parentesco").value = r.parentesco || "";
    document.getElementById("edit-telefoneEmergencia").value = r.telefoneEmergencia || "";
    
    // Se você carrega os projetos dinamicamente no select de edição, 
    // certifique-se de que a tag <option> com o valor já exista.
    const selectProjeto = document.getElementById("edit-projeto");
    if (selectProjeto) {
        carregarProjetos("edit-projeto", r.projeto || "");
    }

    // Preenche o Radio Button de Status
    const statusRadios = document.getElementsByName("edit-status");
    if (statusRadios && r.status) {
        for (let i = 0; i < statusRadios.length; i++) {
            if (statusRadios[i].value === r.status.toLowerCase()) {
                statusRadios[i].checked = true;
            }
        }
    }

    abrirModal("modal-editar");
}

// ==========================================
// SALVAR EDIÇÃO
// ==========================================
async function salvarEdicao(e) {
    e.preventDefault();

    // Pega qual radio button de status está selecionado
    const statusSelecionado = document.querySelector('input[name="edit-status"]:checked');
    const selectProjeto = document.getElementById("edit-projeto");
    const projetoSelecionado = selectProjeto?.selectedOptions[0];
    const nomeProjeto = projetoSelecionado?.dataset.nome || "";

    // Monta o objeto completo igual ao do Cadastro
    const residenteAtualizado = {
        nome: document.getElementById("edit-nome").value,
        cpf: document.getElementById("edit-cpf").value,
        dataNascimento: document.getElementById("edit-dataNascimento").value,
        telefone: document.getElementById("edit-telefone").value,
        email: document.getElementById("edit-email").value,
        endereco: document.getElementById("edit-endereco").value,
        necessidadesEspeciais: document.getElementById("edit-necessidades").value,
        contatoEmergencia: document.getElementById("edit-contatoEmergencia").value,
        parentesco: document.getElementById("edit-parentesco").value,
        telefoneEmergencia: document.getElementById("edit-telefoneEmergencia").value,
        status: statusSelecionado ? statusSelecionado.value : "ativo",
        projeto: nomeProjeto
    };

    try {
        const res = await fetch(`https://grupo-nata.onrender.com/api/residentes/${idResidenteEditando}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(residenteAtualizado)
        });

        if (res.ok) {
            mostarAlerta("Residente atualizado com sucesso!", "success");
            fecharModais();
            carregarResidentes(); // Recarrega a tabela sem precisar dar F5 na página
        } else {
            mostarAlerta("Erro ao atualizar residente.", "error");
        }
    } catch (e) {
        console.error("Erro na requisição PUT:", e);
        mostarAlerta("Erro de conexão ao tentar atualizar.", "error");
    }
}
// ==========================================
// DELETE
// ==========================================
async function deletarResidente(id) {
    if (!confirm("Deseja excluir?")) return;

    await fetch(`https://grupo-nata.onrender.com/api/residentes/${id}`, {
        method: "DELETE"
    });

    carregarResidentes();
}

// ==========================================
// MODAIS
// ==========================================
function abrirModal(id) {
    document.getElementById("modal-overlay").classList.add("mostrar-modal");
    document.getElementById(id).classList.add("mostrar-modal");
}

function fecharModais() {
    document.getElementById("modal-overlay").classList.remove("mostrar-modal");
    document.querySelectorAll(".modal-caixa").forEach(m => m.classList.remove("mostrar-modal"));
}

async function carregarProjetos(selectId = "projeto", projetoSelecionado = "") {
    try {
        const select = document.getElementById(selectId);

        // 🔥 ESSA LINHA RESOLVE O ERRO
        if (!select) return;

        const res = await fetch("https://grupo-nata.onrender.com/api/projetos");
        const projetos = await res.json();

        select.innerHTML = '<option value="">Selecione um projeto</option>';

        projetos.forEach(p => {
            const option = document.createElement("option");
            option.value = p.id;
            option.dataset.nome = p.nome;
            option.textContent = p.nome;
            if (projetoSelecionado && p.nome === projetoSelecionado) {
                option.selected = true;
            }
            select.appendChild(option);
        });

    } catch (erro) {
        console.error("Erro ao buscar projetos:", erro);
    }
}
// ==========================================
// VISUALIZAR
// ==========================================
function abrirModalVisualizar(id) {
    const r = residentesData.find(x => x.id === id);
    if (!r) return;

    // Preenche os campos do HTML com os dados do residente
    if (document.getElementById("view-projeto")) document.getElementById("view-projeto").value = r.projeto || "Nenhum";
    if (document.getElementById("view-status")) document.getElementById("view-status").value = r.status || "";
    if (document.getElementById("view-nome")) document.getElementById("view-nome").value = r.nome || "";
    if (document.getElementById("view-cpf")) document.getElementById("view-cpf").value = r.cpf || "";
    if (document.getElementById("view-nascimento")) document.getElementById("view-nascimento").value = r.dataNascimento || "";
    if (document.getElementById("view-telefone")) document.getElementById("view-telefone").value = r.telefone || "";
    if (document.getElementById("view-email")) document.getElementById("view-email").value = r.email || "";
    if (document.getElementById("view-endereco")) document.getElementById("view-endereco").value = r.endereco || "";
    if (document.getElementById("view-necessidades")) document.getElementById("view-necessidades").value = r.necessidadesEspeciais || "Nenhuma";
    if (document.getElementById("view-contatoEmergencia")) document.getElementById("view-contatoEmergencia").value = r.contatoEmergencia || "";
    if (document.getElementById("view-parentesco")) document.getElementById("view-parentesco").value = r.parentesco || "";
    if (document.getElementById("view-telefoneEmergencia")) document.getElementById("view-telefoneEmergencia").value = r.telefoneEmergencia || "";

    abrirModal("modal-visualizar");
}
