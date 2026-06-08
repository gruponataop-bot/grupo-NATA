// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let participantesData = [];
let participantesFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 5;
let idParticipanteEditando = null;
let idParticipanteProjetos = null;
let projetosDisponiveis = [];
let projetosVinculadosOriginais = new Set();

document.addEventListener("DOMContentLoaded", () => {
    // 1. Carrega a tabela (se estiver na página de listagem)
    if (document.getElementById("tabela-participantes-body")) {
        carregarParticipantes();
        const inputPesquisa = document.getElementById("pesquisa-nome");
        if (inputPesquisa) inputPesquisa.addEventListener("input", aplicarFiltros);
    }

    if (document.getElementById("projeto-selecionado")) {
        carregarProjetosCadastroParticipante();
    }

    // 2. Formulário de Cadastro (se estiver na página de cadastro)
    const formCadastro = document.querySelector(".form-cadastro");
    if (formCadastro) {
        formCadastro.addEventListener("submit", cadastrarParticipante);
    }

    // 3. Formulário de Edição (dentro do modal)
    const formEditar = document.getElementById("form-editar-participante");
    if (formEditar) {
        formEditar.addEventListener("submit", salvarEdicao);
    }
});




// ==========================================
// BUSCAR DADOS (GET)
// ==========================================
async function carregarParticipantes() {
    try {
        const resposta = await fetch('http://localhost:8080/api/participantes');
        if (resposta.ok) {
            participantesData = await resposta.json();
            participantesFiltrados = [...participantesData];
            renderizarTabela();
        }
    } catch (erro) {
        console.error("Erro ao conectar com a API:", erro);
    }
}

// ==========================================
// FILTROS
// ==========================================
function aplicarFiltros() {
    const termoPesquisa = document.getElementById("pesquisa-nome").value.toLowerCase();

    participantesFiltrados = participantesData.filter(part => {
        return part.nome.toLowerCase().includes(termoPesquisa);
    });

    paginaAtual = 1;
    renderizarTabela();
}

// ==========================================
// DESENHAR TABELA
// ==========================================
function renderizarTabela() {
    const tbody = document.getElementById("tabela-participantes-body");
    if (!tbody) return;

    tbody.innerHTML = "";
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const paginados = participantesFiltrados.slice(inicio, fim);

    paginados.forEach(part => {
        const tr = document.createElement("tr");
        const statusComBadge = getStatusBadge(part.status);
        tr.innerHTML = `
            <td>${part.nome}</td>
            <td>${part.serie || "-"}</td>
            <td>${part.escola || "-"}</td>
            <td>${part.nomeResponsavel || "-"}</td> 
            <td>${part.telefoneResponsavel || "-"}</td> 
            <td>${statusComBadge}</td>
            <td class="acoes-icones">
                <i class="action-btn" onclick="abrirModalVisualizar(${part.id})" title="Visualizar">Ver</i>
                <i class="action-btn" onclick="abrirModalEditar(${part.id})" title="Editar">Editar</i>
                <i class="action-btn" onclick="abrirModalProjetosParticipante(${part.id})" title="Projetos">Projetos</i>
                <i class="action-btn action-btn-danger" style="color: #dc3545;" onclick="deletarParticipante(${part.id})" title="Excluir">Excluir</i>
            </td>
        `;
        tbody.appendChild(tr);
    });
    renderizarPaginacao();
}

// ==========================================
// VISUALIZAR (MODAL DETALHADO)
// ==========================================
function abrirModalVisualizar(id) {
    const part = participantesData.find(p => p.id === id);
    if (!part) return;

    document.getElementById("view-nome").value = part.nome || "";
    document.getElementById("view-nascimento").value = part.dataNascimento || "";
    document.getElementById("view-serie").value = part.serie || "";
    document.getElementById("view-escola").value = part.escola || "";
    document.getElementById("view-responsavel").value = part.nomeResponsavel || "";
    document.getElementById("view-telefone").value = part.telefoneResponsavel || "";
    document.getElementById("view-necessidades").value = part.necessidadesEspeciais || "Nenhuma";

    // Exemplo de como mostrar horários selecionados
    const listaHorarios = document.getElementById("view-horarios-lista");
    listaHorarios.innerHTML = part.horariosSelecionados ? `<p>${part.horariosSelecionados}</p>` : "<p>Não informado</p>";

    abrirModal("modal-visualizar");
}

// ==========================================
// EDITAR (PREENCHER MODAL)
// ==========================================
function abrirModalEditar(id) {
    const part = participantesData.find(p => p.id === id);
    if (!part) return;

    idParticipanteEditando = part.id;

    document.getElementById("edit-nome").value = part.nome || "";
    document.getElementById("edit-nascimento").value = part.dataNascimento || "";
    document.getElementById("edit-serie").value = part.serie || "";
    document.getElementById("edit-escola").value = part.escola || "";
    document.getElementById("edit-responsavel").value = part.nomeResponsavel || "";
    document.getElementById("edit-telefone").value = part.telefoneResponsavel || "";
    document.getElementById("edit-endereco").value = part.endereco || "";
    document.getElementById("edit-necessidades").value = part.necessidadesEspeciais || "";

    const statusCerto = part.status || "ativo";
    document.querySelector(`input[name="edit-status"][value="${statusCerto}"]`).checked = true;

    abrirModal("modal-editar");
}

// ==========================================
// CADASTRAR NOVO (POST)
// ==========================================
async function cadastrarParticipante(event) {
    event.preventDefault();

    // Pega o Status (Ativo/Inativo) 
    const statusRadio = document.querySelector('input[name="status"]:checked');
    const statusFinal = statusRadio ? statusRadio.value : "ativo";

    // Lógica da Necessidade Especial
    const temNecessidade = document.querySelector('input[name="tem_necessidade"]:checked').value;
    const detalhe = document.getElementById("necessidades-detalhe").value;
    const necessidadeFinal = (temNecessidade === "Sim") ? detalhe : "Não possui";

    // Lógica para pegar os Horários (Checkboxes)
    const checkboxes = document.querySelectorAll('input[name="horario"]:checked');
    const horáriosSelecionados = Array.from(checkboxes).map(cb => cb.value).join(", ");

    const projetoSelecionado = document.getElementById("projeto-selecionado");
    const idProjetoSelecionado = projetoSelecionado.value;
    const novoParticipante = {
        projeto: projetoSelecionado.options[projetoSelecionado.selectedIndex]?.textContent || "",
        nome: document.getElementById("nome-aluno").value,
        dataNascimento: document.getElementById("data-nascimento").value,
        serie: document.getElementById("serie-escolar").value,
        escola: document.getElementById("nome-escola").value,
        status: statusFinal,
        necessidadesEspeciais: necessidadeFinal,
        nomeResponsavel: document.getElementById("nome-responsavel").value,
        parentesco: document.getElementById("parentesco-responsavel").value,
        telefoneResponsavel: document.getElementById("telefone-responsavel").value,
        endereco: document.getElementById("endereco-pais").value,
        horariosSelecionados: horáriosSelecionados
    };

    try {
        const resposta = await fetch('http://localhost:8080/api/participantes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoParticipante)
        });

        if (resposta.ok) {
            const participanteCriado = await resposta.json();
            if (idProjetoSelecionado) {
                await vincularParticipanteAoProjeto(idProjetoSelecionado, participanteCriado.id);
            }
            mostrarAlerta("Participante cadastrado com sucesso!");
            window.location.href = "participantes.html";
        } else {
            mostrarAlerta("Erro ao cadastrar. Verifique o console.");
        }
    } catch (erro) {
        console.error("Erro:", erro);
    }
}
// ==========================================
// DELETAR PARTICIPANTE (DELETE NO BANCO)
// ==========================================
async function deletarParticipante(id) {
    // A trava de segurança para não apagar sem querer!
    const confirmar = confirm("Tem certeza que deseja apagar este participante? Essa ação não pode ser desfeita.");
    if (!confirmar) return;

    try {
        const resposta = await fetch(`http://localhost:8080/api/participantes/${id}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            mostrarAlerta("Participante deletado com sucesso!");
            carregarParticipantes(); // Atualiza a tabela tirando o deletado
        } else {
            mostrarAlerta("Erro do Java ao tentar deletar o participante.");
        }
    } catch (erro) {
        console.error("Erro completo:", erro);
        mostrarAlerta("Erro de conexão. O Java está rodando?");
    }
}

// ==========================================
// SALVAR EDIÇÃO (PUT)
// ==========================================
async function salvarEdicao(event) {
    event.preventDefault();
    if (!idParticipanteEditando) return;


    const statusRadio = document.querySelector('input[name="edit-status"]:checked');
    const statusFinal = statusRadio ? statusRadio.value : "ativo";

    const participanteAtualizado = {
        nome: document.getElementById("edit-nome").value,
        dataNascimento: document.getElementById("edit-nascimento").value,
        serie: document.getElementById("edit-serie").value,
        escola: document.getElementById("edit-escola").value,
        status: statusFinal,
        nomeResponsavel: document.getElementById("edit-responsavel").value,
        telefoneResponsavel: document.getElementById("edit-telefone").value,
        endereco: document.getElementById("edit-endereco").value,
        necessidadesEspeciais: document.getElementById("edit-necessidades").value,

    };

    try {
        const resposta = await fetch(`http://localhost:8080/api/participantes/${idParticipanteEditando}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(participanteAtualizado)
        });

        if (resposta.ok) {
            mostrarAlerta("Dados do aluno atualizados!");
            fecharModais();
            carregarParticipantes();
        }
    } catch (erro) {
        mostrarAlerta("Erro ao conectar com o servidor.");
    }
}

// Funções de suporte (Paginacao e Modal)
function abrirModal(id) {
    document.getElementById("modal-overlay").classList.add("mostrar-modal");
    document.getElementById(id).classList.add("mostrar-modal");
}

function fecharModais() {
    document.getElementById("modal-overlay").classList.remove("mostrar-modal");
    document.querySelectorAll(".modal-caixa").forEach(m => m.classList.remove("mostrar-modal"));
}

function renderizarPaginacao() {
    // 👉 USA O TAMANHO DA LISTA FILTRADA PARA A MATEMÁTICA DA PÁGINA
    const totalItens = participantesFiltrados.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);
    const infoSpan = document.getElementById('info-paginacao');
    const controlesDiv = document.getElementById('controles-paginacao');
    if (!infoSpan || !controlesDiv) return;

    const itemInicial = totalItens === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
    const itemFinal = Math.min(paginaAtual * itensPorPagina, totalItens);
    infoSpan.innerText = `Mostrando ${itemInicial} - ${itemFinal} de ${totalItens} participantes`;
    controlesDiv.innerHTML = '';

    if (totalItens === 0) return;

    const btnAnterior = document.createElement('button');
    btnAnterior.className = `btn-pagina ${paginaAtual === 1 ? 'disable' : ''}`;
    btnAnterior.innerHTML = '<i class="ph ph-caret-left"></i> Anterior';
    btnAnterior.disabled = paginaAtual === 1;
    btnAnterior.onclick = () => mudarPagina(paginaAtual - 1);
    controlesDiv.appendChild(btnAnterior);

    for (let i = 1; i <= totalPaginas; i++) {
        const btnNumero = document.createElement('button');
        btnNumero.className = `btn-pagina ${i === paginaAtual ? 'ativa' : ''}`;
        btnNumero.innerText = i;
        btnNumero.onclick = () => mudarPagina(i);
        controlesDiv.appendChild(btnNumero);
    }

    const btnProximo = document.createElement('button');
    btnProximo.className = `btn-pagina ${paginaAtual === totalPaginas ? 'disable' : ''}`;
    btnProximo.innerHTML = 'Próximo <i class="ph ph-caret-right"></i>';
    btnProximo.disabled = paginaAtual === totalPaginas;
    btnProximo.onclick = () => mudarPagina(paginaAtual + 1);
    controlesDiv.appendChild(btnProximo);
}

function mudarPagina(novaPagina) {
    const totalPaginas = Math.ceil(participantesFiltrados.length / itensPorPagina);
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        paginaAtual = novaPagina;
        renderizarTabela();
    }
}



function ajustarCamposPorProjeto() {
    const selectProjetoAtual = document.getElementById("projeto-selecionado");
    const containerHorariosAtual = document.getElementById("container-horarios");
    const termoAceiteAtual = document.getElementById("termo-aceite");
    if (!selectProjetoAtual || !containerHorariosAtual || !termoAceiteAtual) return;

    const optionSelecionada = selectProjetoAtual.options[selectProjetoAtual.selectedIndex];
    const projetoSelecionadoAtual = projetosDisponiveis.find(projeto => Number(projeto.id) === Number(selectProjetoAtual.value));
    const horariosInfo = document.getElementById("projeto-horarios-info");
    const horariosTexto = document.getElementById("projeto-horarios-texto");

    if (horariosInfo && horariosTexto) {
        const horariosProjeto = projetoSelecionadoAtual?.horarios || "";
        horariosInfo.style.display = horariosProjeto ? "block" : "none";
        horariosTexto.textContent = formatarHorariosProjeto(horariosProjeto);
    }
    renderizarHorariosParticipante(projetoSelecionadoAtual?.horarios || "");

    const textoProjeto = removerAcentos(`${optionSelecionada?.dataset?.nome || optionSelecionada?.textContent || ""} ${optionSelecionada?.dataset?.tipo || ""}`);
    const textoTermoDinamico = termoAceiteAtual.parentElement.querySelector('span');
    const textoTermoProjeto = document.getElementById("termo-projeto-texto");
    const termoProjeto = projetoSelecionadoAtual?.termoResponsabilidade?.trim();
    const textoCheckboxFixo = "Estou de acordo com as condicoes do projeto selecionado e autorizo a participacao do(a) meu(minha) filho(a). Autorizo tambem o uso da imagem do aluno para fins de divulgacao do projeto.";
    const temHorariosProjeto = Boolean(projetoSelecionadoAtual?.horarios);

    if (termoProjeto) {
        containerHorariosAtual.style.display = temHorariosProjeto ? "grid" : "none";
        if (textoTermoProjeto) {
            textoTermoProjeto.textContent = termoProjeto;
            textoTermoProjeto.style.display = "block";
        }
    } else if (textoProjeto.includes("reforco")) {
        containerHorariosAtual.style.display = temHorariosProjeto ? "grid" : "none";
        if (textoTermoProjeto) {
            textoTermoProjeto.textContent = "Termo de responsabilidade nao cadastrado para este projeto.";
            textoTermoProjeto.style.display = "block";
        }
    } else {
        containerHorariosAtual.style.display = temHorariosProjeto ? "grid" : "none";
        if (textoTermoProjeto) {
            textoTermoProjeto.textContent = "Termo de responsabilidade nao cadastrado para este projeto.";
            textoTermoProjeto.style.display = "block";
        }
    }
    textoTermoDinamico.innerText = textoCheckboxFixo;
    return;

    const projeto = document.getElementById("projeto-selecionado").value;
    const containerHorarios = document.getElementById("container-horarios");
    const textoTermo = document.getElementById("termo-aceite").parentElement.querySelector('span'); // Pega o texto do lado do checkbox

    // Trecho sobre uso de imagem que o cliente pediu
    const trechoImagem = " Autorizo também o uso da imagem do aluno para fins de divulgação do projeto.";

    if (projeto === "reforco") {
        containerHorarios.style.display = "grid"; // Mostra os horários
        textoTermo.innerText = "Estou de acordo com as condições do REFORÇO ESCOLAR e autorizo a participação do meu filho." + trechoImagem;
    }
    else if (projeto === "natinha") {
        containerHorarios.style.display = "none"; // ESCONDE os horários (sem precisar de CSS novo)
        textoTermo.innerText = "Estou ciente das normas da NATINHA e autorizo o uso da imagem." + trechoImagem;
    }
    else if (projeto === "futebol") {
        containerHorarios.style.display = "none"; // ESCONDE os horários
        textoTermo.innerText = "Estou ciente dos riscos da prática de FUTEBOL e autorizo a participação e uso de imagem." + trechoImagem;
    }
}


function getStatusBadge(status) {
    if (!status) return `<span class="badge badge--ativo">Ativo</span>`;

    const s = status.toLowerCase();
    let classeBadge = "badge--encerrado"; // Padrão cinza

    if (s === "ativo") {
        classeBadge = "badge--ativo"; // Verde
    } else if (s === "inativo") {
        classeBadge = "badge--suspenso"; // Vermelho/Laranja
    }

    // Deixa a primeira letra maiúscula (ex: ativo -> Ativo)
    const texto = s.charAt(0).toUpperCase() + s.slice(1);

    return `<span class="badge ${classeBadge}">${texto}</span>`;
}

async function carregarProjetos() {
    const resposta = await fetch('http://localhost:8080/api/projetos');
    if (!resposta.ok) throw new Error('Erro ao carregar projetos.');
    return resposta.json();
}

async function carregarProjetosCadastroParticipante() {
    const select = document.getElementById("projeto-selecionado");
    if (!select) return;

    select.innerHTML = '<option value="">Carregando projetos...</option>';

    try {
        const projetos = await carregarProjetos();
        projetosDisponiveis = projetos.map(normalizarProjeto);

        if (!projetosDisponiveis.length) {
            select.innerHTML = '<option value="">Nenhum projeto cadastrado</option>';
            ajustarCamposPorProjeto();
            return;
        }

        select.innerHTML = '<option value="">Selecione um projeto...</option>' + projetosDisponiveis.map(projeto => (
            `<option value="${projeto.id}" data-nome="${escaparHtml(projeto.nome)}" data-tipo="${escaparHtml(projeto.tipo)}">${escaparHtml(projeto.nome)}</option>`
        )).join('');
        ajustarCamposPorProjeto();
    } catch (erro) {
        console.error("Erro ao carregar projetos:", erro);
        select.innerHTML = '<option value="">Não foi possível carregar os projetos</option>';
    }
}

async function abrirModalProjetosParticipante(id) {
    const participante = participantesData.find(p => p.id === id);
    if (!participante) return;

    idParticipanteProjetos = id;
    projetosVinculadosOriginais = new Set();

    const subtitulo = document.getElementById("projetos-participante-subtitulo");
    const lista = document.getElementById("lista-projetos-participante");
    const feedback = document.getElementById("feedback-projetos-participante");

    if (subtitulo) subtitulo.textContent = `Projetos vinculados a ${participante.nome || "participante"}`;
    if (feedback) {
        feedback.textContent = "";
        feedback.style.display = "none";
    }
    lista.innerHTML = '<p style="color:#8a8178;font-size:14px;">Carregando projetos...</p>';
    abrirModal("modal-projetos-participante");

    try {
        const projetos = (await carregarProjetos()).map(normalizarProjeto);
        projetosDisponiveis = projetos;

        const vinculosPorProjeto = await Promise.all(projetos.map(async projeto => {
            try {
                const resposta = await fetch(`http://localhost:8080/api/projetos/${projeto.id}/participantes`);
                if (!resposta.ok) return { projetoId: projeto.id, vinculado: false };
                const participantes = await resposta.json();
                return {
                    projetoId: projeto.id,
                    vinculado: participantes.some(item => Number(item.idParticipante) === Number(id))
                };
            } catch (_) {
                return { projetoId: projeto.id, vinculado: false };
            }
        }));

        vinculosPorProjeto
            .filter(item => item.vinculado)
            .forEach(item => projetosVinculadosOriginais.add(Number(item.projetoId)));

        renderizarProjetosParticipante();
    } catch (erro) {
        console.error("Erro ao carregar projetos do participante:", erro);
        lista.innerHTML = '<p style="color:#b42318;font-size:14px;">Não foi possível carregar os projetos cadastrados.</p>';
    }
}

function renderizarProjetosParticipante() {
    const lista = document.getElementById("lista-projetos-participante");
    if (!lista) return;

    if (!projetosDisponiveis.length) {
        lista.innerHTML = '<p style="color:#8a8178;font-size:14px;">Nenhum projeto cadastrado no sistema.</p>';
        return;
    }

    lista.innerHTML = projetosDisponiveis.map(projeto => {
        const idProjeto = Number(projeto.id);
        const checked = projetosVinculadosOriginais.has(idProjeto) ? "checked" : "";
        const detalhes = [projeto.tipo, projeto.status].filter(Boolean).join(" · ");
        const horarios = projeto.horarios
            ? `<small style="display:block;color:#5f574f;font-size:12px;margin-top:6px;white-space:pre-line;"><strong>Horarios:</strong> ${escaparHtml(projeto.horarios)}</small>`
            : "";
        const termo = projeto.termoResponsabilidade
            ? `<small style="display:block;color:#5f574f;font-size:12px;margin-top:6px;white-space:pre-line;"><strong>Termo:</strong> ${escaparHtml(projeto.termoResponsabilidade)}</small>`
            : "";
        return `
            <label style="display:flex;align-items:flex-start;gap:10px;border:1px solid #ece7df;border-radius:8px;padding:12px;cursor:pointer;">
                <input type="checkbox" class="check-projeto-participante" value="${idProjeto}" ${checked} style="margin-top:3px;">
                <span>
                    <strong style="display:block;color:#2f2a25;font-size:14px;">${escaparHtml(projeto.nome || "Projeto sem nome")}</strong>
                    <small style="display:block;color:#8a8178;font-size:12px;margin-top:2px;">${escaparHtml(detalhes || "Sem detalhes")}</small>
                    ${horarios}
                    ${termo}
                </span>
            </label>
        `;
    }).join("");
}

async function salvarProjetosParticipante() {
    if (!idParticipanteProjetos) return;

    const feedback = document.getElementById("feedback-projetos-participante");
    const selecionados = new Set(
        Array.from(document.querySelectorAll(".check-projeto-participante:checked"))
            .map(input => Number(input.value))
    );

    const paraVincular = [...selecionados].filter(idProjeto => !projetosVinculadosOriginais.has(idProjeto));
    const paraDesvincular = [...projetosVinculadosOriginais].filter(idProjeto => !selecionados.has(idProjeto));

    try {
        await Promise.all([
            ...paraVincular.map(idProjeto => vincularParticipanteAoProjeto(idProjeto, idParticipanteProjetos)),
            ...paraDesvincular.map(idProjeto => desvincularParticipanteDoProjeto(idProjeto, idParticipanteProjetos))
        ]);

        if (feedback) {
            feedback.textContent = "Vínculos atualizados com sucesso.";
            feedback.classList.remove("is-error");
            feedback.style.display = "block";
        }

        projetosVinculadosOriginais = selecionados;
        setTimeout(() => fecharModais(), 600);
    } catch (erro) {
        console.error("Erro ao salvar vínculos:", erro);
        if (feedback) {
            feedback.textContent = erro.message || "Não foi possível salvar os vínculos.";
            feedback.classList.add("is-error");
            feedback.style.display = "block";
        }
    }
}

async function vincularParticipanteAoProjeto(idProjeto, idParticipante) {
    const resposta = await fetch(`http://localhost:8080/api/projetos/${idProjeto}/participantes/${idParticipante}`, {
        method: 'POST'
    });

    if (!resposta.ok) {
        let mensagem = "Não foi possível vincular participante ao projeto.";
        try {
            const corpo = await resposta.json();
            mensagem = corpo.erro || mensagem;
        } catch (_) {}
        throw new Error(mensagem);
    }
}

async function desvincularParticipanteDoProjeto(idProjeto, idParticipante) {
    const resposta = await fetch(`http://localhost:8080/api/projetos/${idProjeto}/participantes/${idParticipante}`, {
        method: 'DELETE'
    });

    if (!resposta.ok && resposta.status !== 404) {
        throw new Error("Não foi possível remover o vínculo do projeto.");
    }
}

function normalizarProjeto(projeto = {}) {
    return {
        ...projeto,
        id: projeto.id || projeto.id_projeto || projeto.idProjeto
    };
}

function renderizarHorariosParticipante(horarios) {
    const container = document.getElementById("container-horarios");
    if (!container) return;

    const valores = String(horarios || '').split(',').map(item => item.trim()).filter(Boolean);
    if (!valores.length) {
        container.innerHTML = '<p style="font-size:14px;color:#78716c;margin:0;">Nenhum horário cadastrado para este projeto.</p>';
        return;
    }

    const turnos = ['Manha', 'Tarde', 'Noite'];
    container.innerHTML = turnos.map(turno => {
        const itensTurno = valores.filter(valor => valor.endsWith(`-${turno}`));
        if (!itensTurno.length) return '';

        return `
            <div class="opcoes-horario">
                <p style="font-size:13px; font-weight:600; color:var(--cp-text); margin:0 0 10px;">${formatarTurno(turno)}:</p>
                ${itensTurno.map(valor => `
                    <label style="display:flex;align-items:center;gap:7px;font-size:14px;cursor:pointer;margin-bottom:6px;">
                        <input type="checkbox" name="horario" value="${valor}"> ${formatarHorarioProjeto(valor)}
                    </label>
                `).join('')}
            </div>
        `;
    }).join('');
}

function formatarHorariosProjeto(horarios) {
    const valores = String(horarios || '').split(',').map(item => item.trim()).filter(Boolean);
    return valores.map(formatarHorarioProjeto).join('\n');
}

function formatarHorarioProjeto(valor) {
    const [dia, turno] = String(valor || '').split('-');
    const dias = {
        Seg: 'Segunda-feira',
        Ter: 'Terça-feira',
        Qua: 'Quarta-feira',
        Qui: 'Quinta-feira',
        Sex: 'Sexta-feira',
        Sab: 'Sábado',
        Dom: 'Domingo'
    };
    return `${dias[dia] || dia} - ${formatarTurno(turno)}`;
}

function formatarTurno(turno) {
    if (turno === 'Manha') return 'Manhã';
    return turno || '';
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

function removerAcentos(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
