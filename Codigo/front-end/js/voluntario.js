// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let voluntariosData = []; 
let voluntariosFiltrados = []; // NOVA VARIÁVEL: Guarda o resultado das pesquisas
let paginaAtual = 1;
const itensPorPagina = 5; 
let idVoluntarioEditando = null; 

function getStatusBadge(status) {
    if (!status) return `<span class="badge badge--encerrado">Desconhecido</span>`;

    const s = status.toLowerCase();
    let classeBadge = "badge--encerrado";

    if (s === "ativo") {
        classeBadge = "badge--ativo";
    } else if (s === "inativo") {
        classeBadge = "badge--suspenso";
    }

    // ✅ Padroniza exibição
    const texto = s.charAt(0).toUpperCase() + s.slice(1);

    return `<span class="badge ${classeBadge}">${texto}</span>`;
}
document.addEventListener("DOMContentLoaded", () => {
    // 1. Carrega a tabela se ela existir na tela
    if (document.getElementById("tabela-voluntarios-body")) {
        carregarVoluntarios();
        
        // 👉 ESCUTADORES DA PESQUISA E FILTRO
        const inputPesquisa = document.getElementById("pesquisa-nome");
        if (inputPesquisa) inputPesquisa.addEventListener("input", aplicarFiltros);

        const selectFiltro = document.getElementById("filtro-status");
        if (selectFiltro) selectFiltro.addEventListener("change", aplicarFiltros);
    }
    // 2. Escuta o formulário de CADASTRO
    const formCadastro = document.getElementById("form-cadastro-voluntario");
    if (formCadastro) {
        formCadastro.addEventListener("submit", cadastrarVoluntario);
    }
    // 3. Escuta o formulário de EDIÇÃO 
    const formEditar = document.getElementById("form-editar-voluntario");
    if (formEditar) {
        formEditar.addEventListener("submit", salvarEdicao);
    }
});

// ==========================================
// BUSCAR DADOS
// ==========================================
async function carregarVoluntarios() {
    try {
        const resposta = await fetch('https://grupo-nata.onrender.com/api/voluntarios');
        if (resposta.ok) {
            const dados = await resposta.json();

            // ✅ NORMALIZAÇÃO DOS DADOS
            voluntariosData = dados.map(vol => ({
                ...vol,
                nome: vol.nome || "",
                email: vol.email || "",
                telefone: vol.telefone || "",
                cpf: vol.cpf || "",
                endereco: vol.endereco || "",
                status: (vol.status || "").toLowerCase(),
                habilidades: vol.habilidades || "",
                diasDisponiveis: vol.diasDisponiveis || "",
                turnosDisponiveis: vol.turnosDisponiveis || "",
                projetos: vol.projetos || []
            }));

            voluntariosFiltrados = [...voluntariosData];
            renderizarTabela();
        } else {
            console.error("Erro do servidor:", resposta.status);
        }
    } catch (erro) {
        console.error("Erro de conexão:", erro);
    }
}

// ==========================================
// FUNÇÃO NOVA: APLICAR FILTROS
// ==========================================
function aplicarFiltros() {
    const termoPesquisa = document.getElementById("pesquisa-nome").value.toLowerCase();
    const statusFiltro = document.getElementById("filtro-status").value.toLowerCase();

    voluntariosFiltrados = voluntariosData.filter(vol => {
        const nome = (vol.nome || "").toLowerCase();
        const status = (vol.status || "").toLowerCase();

        const matchNome = nome.includes(termoPesquisa);
        const matchStatus = statusFiltro === "" || status === statusFiltro;

        return matchNome && matchStatus;
    });

    paginaAtual = 1;
    renderizarTabela();
}

// ==========================================
// DESENHAR TABELA
// ==========================================
function renderizarTabela() {
    const tbody = document.getElementById("tabela-voluntarios-body");
    if(!tbody) return; 

    tbody.innerHTML = ""; 
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    
    // Usa a lista filtrada (se a pesquisa estiver funcionando) ou a lista normal
    const listaRenderizar = voluntariosFiltrados;
    const voluntariospaginados = listaRenderizar.slice(inicio, fim);

    voluntariospaginados.forEach(vol => {
        const tr = document.createElement("tr");
        
        const habilidadesStr = vol.habilidades || "-";
        const diasStr = vol.diasDisponiveis || "-";
        const turnosStr = vol.turnosDisponiveis || "-";
        const statusComBadge = getStatusBadge(vol.status);
        // 👇 A MÁGICA DOS PROJETOS AQUI 👇
        let projetosStr = "-";
        if (Array.isArray(vol.projetos) && vol.projetos.length > 0) {
        projetosStr = vol.projetos.map(p => p.nome || "").join(', ');
}

        tr.innerHTML = `
            <td>${vol.nome}</td>
            <td>${vol.telefone ? mascaraTelefone(vol.telefone) : "-"}</td>
            <td>${habilidadesStr.substring(0, 30)}</td>
            <td>${diasStr}</td> 
            <td>${turnosStr}</td> 
            <td>${projetosStr}</td> 
            <td>${statusComBadge}</td> 
            
            <td class="acoes-icones">
                <i class="action-btn" onclick="abrirModalVisualizar(${vol.id})" title="Visualizar">Ver</i>
                <i class="action-btn" onclick="abrirModalEditar(${vol.id})" title="Editar">Editar</i>
                <i class="action-btn" onclick="abrirModalVincularProjeto(${vol.id})" title="Vincular Projetos">Vincular</i>
                <i class="action-btn action-btn-danger" style="color: #dc3545;" onclick="deletarVoluntario(${vol.id})" title="Excluir">Excluir</i>
            </td>
        `;
        tbody.appendChild(tr);
    });
    renderizarPaginacao();
}

// ==========================================
// PAGINAÇÃO E MODAIS BÁSICOS
// ==========================================
function renderizarPaginacao() {
    // 👉 USA O TAMANHO DA LISTA FILTRADA PARA A MATEMÁTICA DA PÁGINA
    const totalItens = voluntariosFiltrados.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);
    const infoSpan = document.getElementById('info-paginacao');
    const controlesDiv = document.getElementById('controles-paginacao');
    if(!infoSpan || !controlesDiv) return;

    const itemInicial = totalItens === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
    const itemFinal = Math.min(paginaAtual * itensPorPagina, totalItens);
    infoSpan.innerText = `Mostrando ${itemInicial} - ${itemFinal} de ${totalItens} voluntários`;
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
    const totalPaginas = Math.ceil(voluntariosFiltrados.length / itensPorPagina);
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        paginaAtual = novaPagina;
        renderizarTabela(); 
    }
}

function abrirModal(idModal) {
    document.getElementById("modal-overlay").classList.add("mostrar-modal");
    document.getElementById(idModal).classList.add("mostrar-modal");
}

function fecharModais() {
    document.getElementById("modal-overlay").classList.remove("mostrar-modal");
    document.querySelectorAll(".modal-caixa").forEach(modal => modal.classList.remove("mostrar-modal"));
}

// ==========================================
// ABRIR MODAL DE VISUALIZAÇÃO
// ==========================================
function abrirModalVisualizar(id) {
    const vol = voluntariosData.find(v => v.id === id);
    if (!vol) return;

    // 1. Preenche os dados pessoais
    document.getElementById("view-nome").value = vol.nome || "";
    document.getElementById("view-email").value = vol.email || "";
    document.getElementById("view-telefone").value = vol.telefone ? mascaraTelefone(vol.telefone) : "";
    document.getElementById("view-nascimento").value = vol.dataNascimento || "";
    document.getElementById("view-outras-habilidades").value = vol.outrasHabilidades || "";
    document.getElementById("view-obs-disponibilidade").value = vol.observacoesDisponibilidade || "";
    document.getElementById("view-cpf").value = vol.cpf ? mascaraCPF(vol.cpf) : "";
    document.getElementById("view-endereco").value = vol.endereco || "";


    // 2. Preenche Habilidades
    const listaHabilidadesDiv = document.getElementById("view-habilidades-lista");
    listaHabilidadesDiv.innerHTML = ""; 
    
    if (vol.habilidades) {
        const habs = vol.habilidades.split(", ");
        habs.forEach(h => { listaHabilidadesDiv.innerHTML += `<p>• ${h}</p>`; });
    } else {
        listaHabilidadesDiv.innerHTML = `<p>Nenhuma informada</p>`;
    }

    // 3. Preenche Disponibilidade
    const listaDisponibilidadeDiv = document.getElementById("view-disponibilidade-lista");
    listaDisponibilidadeDiv.innerHTML = ""; 

    if (vol.diasDisponiveis || vol.turnosDisponiveis) {
        if (vol.diasDisponiveis) {
            listaDisponibilidadeDiv.innerHTML += `<p><strong>Dias:</strong> ${vol.diasDisponiveis}</p>`;
        }
        if (vol.turnosDisponiveis) {
            listaDisponibilidadeDiv.innerHTML += `<p><strong>Turnos:</strong> ${vol.turnosDisponiveis}</p>`;
        }
    } else {
        listaDisponibilidadeDiv.innerHTML = `<p>Nenhuma informada</p>`;
    }

    // 4. 👉 A NOVIDADE: Preenche os Projetos Vinculados
    const listaProjetosDiv = document.getElementById("view-projetos-lista");
    listaProjetosDiv.innerHTML = ""; 

    if (vol.projetos && vol.projetos.length > 0) {
        vol.projetos.forEach(projeto => {
            listaProjetosDiv.innerHTML += `<p>• ${projeto.nome}</p>`; // Assumindo que a variável no seu backend se chama 'nome'
        });
    } else {
        listaProjetosDiv.innerHTML = `<p>Nenhum projeto vinculado ainda.</p>`;
    }

    abrirModal("modal-visualizar");
}

// ==========================================
// CADASTRAR NOVO VOLUNTÁRIO (POST)
// ==========================================
async function cadastrarVoluntario(event) {
    console.log("ENVIANDO...");
    event.preventDefault(); // Impede a página de recarregar

    // Pega os inputs de CPF e E-mail
    const inputCpf = document.querySelector('input[name="cpf"]');
    const inputEmail = document.querySelector('input[name="email"]');
    const endereco = document.querySelector('input[name="endereco"]').value;
    const cpfValor = inputCpf ? inputCpf.value : "";
    const emailValor = inputEmail ? inputEmail.value : "";

    // Validações
    if (!isCPFValido(cpfValor)) {
        mostrarAlerta("Erro: O CPF informado é inválido. Verifique os números.", "error");
        if(inputCpf) inputCpf.focus();
        return; 
    }

    if (!isEmailValido(emailValor)) {
        mostrarAlerta("Erro: O formato do e-mail é inválido.", "error");
        if(inputEmail) inputEmail.focus();
        return; 
    }

    // Pega os outros dados do formulário
    const nome = document.querySelector('input[name="nome"]').value;
    const telefone = document.querySelector('input[name="telefone"]').value;
    const dataNascimento = document.querySelector('input[name="data_nascimento"]').value;
    
    // Status (agora pegando do select ou radio do cadastro)
    const status = document.querySelector('input[name="status"]:checked')?.value || "Ativo";

    // Pega Habilidades marcadas
    const checkboxesHab = document.querySelectorAll('input[name="habilidades"]:checked');
    const habilidadesMarcadas = Array.from(checkboxesHab).map(cb => cb.value).join(', ');
    const outrasHabilidades = document.getElementById("outras_habilidades")?.value || "";

    // Pega Disponibilidade marcada
    const checkboxesDisp = document.querySelectorAll('input[name="disponibilidade"]:checked');
    let diasSet = new Set();
    let turnosSet = new Set();

    checkboxesDisp.forEach(cb => {
        if (cb.value && cb.value.includes("-")) {
            const partes = cb.value.split("-");
            diasSet.add(partes[0]);
            turnosSet.add(partes[1]);
        }
    });

    const diasMarcados = Array.from(diasSet).join(', ');
    const turnosMarcados = Array.from(turnosSet).join(', ');
    const obsDisponibilidade = document.getElementById("obs_disponibilidade")?.value || "";

    // Monta o objeto para enviar ao Java (AQUI ESTAVA O ERRO DO EMAIL)
    const novoVoluntario = {
    nome: nome,
    cpf: cpfValor,
    email: emailValor,
    telefone: telefone,
    dataNascimento: dataNascimento,
    habilidades: habilidadesMarcadas,
    diasDisponiveis: diasMarcados,
    turnosDisponiveis: turnosMarcados,
    outrasHabilidades: outrasHabilidades,
    observacoesDisponibilidade: obsDisponibilidade,
    status: status.toLowerCase(),
    endereco: endereco // ✅ AQUI
};
    
    try {
        // AQUI CORRIGIMOS O "URL_DO_SEU_BACKEND_AQUI"
        const resposta = await fetch('https://grupo-nata.onrender.com/api/voluntarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoVoluntario)
        });

        if (resposta.ok) {
            redirecionarComAlerta("voluntarios.html", "Voluntário cadastrado com sucesso!", "success");
        } else {
            const erroTexto = await resposta.text();
    mostrarAlerta(`Erro do servidor: ${erroTexto}`, "error");
    console.error("Status do erro:", resposta.status);
        }
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
        mostrarAlerta("Erro de conexão com o servidor Java.", "error");
    }
}

// ==========================================
// ABRIR MODAL DE EDIÇÃO E PREENCHER DADOS
// ==========================================
function abrirModalEditar(id) {
    const vol = voluntariosData.find(v => v.id === id);
    if (!vol) return;
    
    document.getElementById("form-editar-voluntario").reset();
    idVoluntarioEditando = vol.id; 

    document.getElementById("edit-nome").value = vol.nome || "";
    document.getElementById("edit-email").value = vol.email || "";
    document.getElementById("edit-telefone").value = vol.telefone ? mascaraTelefone(vol.telefone) : "";
    document.getElementById("edit-nascimento").value = vol.dataNascimento || "";
    document.getElementById("edit-outras-habilidades").value = vol.outrasHabilidades || "";
    document.getElementById("edit-cpf").value = vol.cpf ? mascaraCPF(vol.cpf) : "";
    document.getElementById("edit-endereco").value = vol.endereco || "";
    
    const selectStatus = document.getElementById("edit-status");
    if (selectStatus && vol.status) {
        // Formata a string para garantir que bata com as <option> (ex: "ativo" vira "Ativo")
        const statusFormatado = vol.status.charAt(0).toUpperCase() + vol.status.slice(1).toLowerCase();
        
        // Verifica se a opção existe no select antes de atribuir
        const opcaoExiste = Array.from(selectStatus.options).some(opt => opt.value === statusFormatado);
        if (opcaoExiste) {
            selectStatus.value = statusFormatado;
        }
    }

    if(document.getElementById("edit-obs-disponibilidade")) {
        document.getElementById("edit-obs-disponibilidade").value = vol.observacoesDisponibilidade || "";
    }

    // --- Lógica das Habilidades ---
    const checkboxesHab = document.querySelectorAll('input[name="edit-habilidade"]');
    checkboxesHab.forEach(cb => cb.checked = false); 
    if (vol.habilidades) {
        const habs = vol.habilidades.split(", ");
        checkboxesHab.forEach(cb => {
            if (habs.includes(cb.value)) cb.checked = true;
        });
    }

    // --- Lógica da Disponibilidade ---
    const checkboxesDisp = document.querySelectorAll('input[name="edit-disponibilidade"]');
    checkboxesDisp.forEach(cb => cb.checked = false); 
    
    if (vol.diasDisponiveis && vol.turnosDisponiveis) {
        const dias = vol.diasDisponiveis.split(", ");
        const turnos = vol.turnosDisponiveis.split(", ");

        checkboxesDisp.forEach(cb => {
            if (cb.value.includes("-")) {
                const partes = cb.value.split("-");
                if (dias.includes(partes[0]) && turnos.includes(partes[1])) {
                    cb.checked = true;
                }
            }
        });
    }

    abrirModal("modal-editar");
}

// ==========================================
// SALVAR A EDIÇÃO (PUT NO BANCO)
// ==========================================
async function salvarEdicao(event) {
    event.preventDefault(); 
    console.log("1. Tentando salvar edição...");

    try {
        if (!idVoluntarioEditando) {
            mostrarAlerta("Erro: O sistema perdeu o ID. Tente fechar e abrir o modal de novo.", "error");
            return;
        }
        
        const id = idVoluntarioEditando;

        const nome = document.getElementById("edit-nome").value;
        const email = document.getElementById("edit-email").value;
        const telefone = document.getElementById("edit-telefone").value;
        const dataNascimento = document.getElementById("edit-nascimento").value;
        const outrasHabilidades = document.getElementById("edit-outras-habilidades").value;
        const cpf = document.getElementById("edit-cpf").value;
        const endereco = document.getElementById("edit-endereco").value;
        
        // 👇 1. PEGA O VALOR DO NOVO SELECT DE STATUS 👇
        const status = document.getElementById("edit-status").value.toLowerCase();
        
        let obsDisponibilidade = "";
        const obsField = document.getElementById("edit-obs-disponibilidade");
        if(obsField) obsDisponibilidade = obsField.value;

        const checkboxesHab = document.querySelectorAll('input[name="edit-habilidade"]:checked');
        const habilidadesMarcadas = Array.from(checkboxesHab).map(cb => cb.value).join(', ');

        const checkboxesDisp = document.querySelectorAll('input[name="edit-disponibilidade"]:checked');
        let diasSet = new Set();
        let turnosSet = new Set();

        checkboxesDisp.forEach(cb => {
            if (cb.value && cb.value.includes("-")) {
                const partes = cb.value.split("-");
                diasSet.add(partes[0]);
                turnosSet.add(partes[1]);
            }
        });

        const diasMarcados = Array.from(diasSet).join(', ');
        const turnosMarcados = Array.from(turnosSet).join(', ');

        // 👇 2. INCLUI O STATUS NO OBJETO ENVIADO AO BANCO 👇
        const voluntarioAtualizado = {
            nome: nome,
            email: email,
            telefone: telefone,
            dataNascimento: dataNascimento,
            habilidades: habilidadesMarcadas,
            diasDisponiveis: diasMarcados,
            turnosDisponiveis: turnosMarcados,
            outrasHabilidades: outrasHabilidades,
            observacoesDisponibilidade: obsDisponibilidade,
            status: status,
            cpf: cpf,
            endereco: endereco
        };
        
        const resposta = await fetch(`https://grupo-nata.onrender.com/api/voluntarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(voluntarioAtualizado)
        });

        if (resposta.ok) {
            mostrarAlerta("Voluntário atualizado com sucesso!", "success");
            fecharModais(); 
            carregarVoluntarios(); 
        } else {
            mostrarAlerta("Erro do Java ao atualizar voluntário.", "error");
        }
    } catch (erro) {
        console.error("Erro completo:", erro);
        mostrarAlerta("Erro de conexão. O Java está rodando?", "error");
    }
}
// ==========================================
// DELETAR VOLUNTÁRIO (DELETE NO BANCO)
// ==========================================
async function deletarVoluntario(id) {
    // A trava de segurança para não apagar sem querer!
    const confirmar = confirm("Tem certeza que deseja apagar este voluntário? Essa ação não pode ser desfeita.");
    if (!confirmar) return;

    try {
        const resposta = await fetch(`https://grupo-nata.onrender.com/api/voluntarios/${id}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            mostrarAlerta("Voluntário deletado com sucesso!", "success");
            carregarVoluntarios(); // Atualiza a tabela tirando o deletado
        } else {
            mostrarAlerta("Erro do Java ao tentar deletar o voluntário.", "error");
        }
    } catch (erro) {
        console.error("Erro completo:", erro);
        mostrarAlerta("Erro de conexão. O Java está rodando?", "error");
    }
}

// ==========================================
// ABRIR MODAL DE PROJETOS (BUSCA NO BANCO)
// ==========================================
async function abrirModalVincularProjeto(idVoluntario) {
    const vol = voluntariosData.find(v => v.id === idVoluntario);
    if (!vol) return;

    document.getElementById("config-voluntario-id").value = vol.id;
    document.getElementById("config-nome").value = vol.nome;

    const containerProjetos = document.getElementById("container-projetos-dinamicos");
    containerProjetos.innerHTML = "<p>Carregando projetos...</p>";
    
    abrirModal("modal-config");

    try {
        // Busca a lista de Projetos Reais do seu Banco de Dados
        // (Verifique se a rota do seu Controller de projetos é essa mesma)
        const resposta = await fetch('https://grupo-nata.onrender.com/api/projetos');
        const projetos = await resposta.json();

        containerProjetos.innerHTML = ""; 

        projetos.forEach(projeto => {
            // OBS: Aqui você precisará adicionar depois a lógica para dar "checked"
            // nos projetos que o voluntário já participa, caso ele já tenha vínculos!
            containerProjetos.innerHTML += `
                <label>
                    <input type="checkbox" name="projeto-selecionado" value="${projeto.id}"> 
                    ${projeto.nome}
                </label>
            `;
        });
    } catch (erro) {
        console.error("Erro ao buscar projetos:", erro);
        containerProjetos.innerHTML = "<p>Erro ao carregar projetos do banco de dados.</p>";
    }
}

// ==========================================
// SALVAR VÍNCULO DE PROJETOS (POST NO JAVA)
// ==========================================
async function salvarVinculoProjetos() {
    const idVoluntario = document.getElementById("config-voluntario-id").value;
    
    // Pega os IDs de todos os projetos que você marcou na tela
    const checkboxesProjetos = document.querySelectorAll('input[name="projeto-selecionado"]:checked');
    
    // Transforma em uma lista de números (ex: [1, 4, 5])
    const idsProjetosMarcados = Array.from(checkboxesProjetos).map(cb => parseInt(cb.value));

    try {
        // Manda a lista de IDs para a rota nova que criamos no Java
        const resposta = await fetch(`https://grupo-nata.onrender.com/api/voluntarios/${idVoluntario}/projetos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(idsProjetosMarcados)
        });

        if (resposta.ok) {
            mostrarAlerta("Projetos vinculados com sucesso!", "success");
            fecharModais();
            carregarVoluntarios(); // Recarrega a tabela por garantia
        } else {
            mostrarAlerta("Erro do Java ao tentar vincular os projetos.", "error");
        }
    } catch (erro) {
        console.error("Erro completo:", erro);
        mostrarAlerta("Erro de conexão. O servidor Java está rodando?", "error");
    }
}


// 2. VALIDADOR MATEMÁTICO DE CPF
function isCPFValido(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Tira os pontos e traços
    
    // Verifica se tem 11 dígitos ou se é uma sequência repetida (ex: 111.111.111-11)
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    // Valida o primeiro dígito verificador
    for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    // Valida o segundo dígito verificador
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true; // Se passou por tudo, o CPF é real!
}

// 3. VALIDADOR DE E-MAIL
function isEmailValido(email) {
    // Verifica se tem o formato texto@texto.texto
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
