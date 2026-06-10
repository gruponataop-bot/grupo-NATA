const PROJECTS_API_URL = "https://grupo-nata.onrender.com/api/projetos";
const SITE_CONFIG_API_URL = "https://grupo-nata.onrender.com/api/site-config/home";
const HOME_CONFIG_STORAGE_KEY = "nataHomeConfig";

const defaultHomeConfig = {
    projectIds: [],
    contact: {
        phone: "00000000-0000",
        email: "teste@teste.com",
        address: "Comunidade NATA",
        social: "@associacao.nata"
    }
};

let projetosDisponiveis = [];
let configAtual = defaultHomeConfig;

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("adminHomeForm").addEventListener("submit", salvarConfiguracaoHome);
    document.getElementById("selectActiveProjects").addEventListener("click", marcarProjetosAtivos);

    configAtual = await carregarConfigHome();
    preencherContato(configAtual.contact);
    await carregarProjetos();
});

async function carregarProjetos() {
    const status = document.getElementById("projectsLoadStatus");

    try {
        const response = await fetch(PROJECTS_API_URL);
        if (!response.ok) throw new Error("Nao foi possivel buscar os projetos.");

        projetosDisponiveis = await response.json();
        renderizarProjetos(projetosDisponiveis, configAtual.projectIds);
        status.textContent = `${projetosDisponiveis.length} projeto(s) encontrado(s).`;
    } catch (error) {
        projetosDisponiveis = [];
        renderizarProjetos([], []);
        status.textContent = "Nao foi possivel carregar projetos. Verifique se o servidor esta rodando.";
    }
}

function renderizarProjetos(projetos, selecionados) {
    const container = document.getElementById("adminProjectList");
    const idsSelecionados = new Set((selecionados || []).map(String));
    container.innerHTML = "";

    if (!projetos.length) {
        const empty = document.createElement("div");
        empty.className = "admin-project-empty";
        empty.textContent = "Nenhum projeto disponivel para exibicao.";
        container.appendChild(empty);
        return;
    }

    projetos.forEach((projeto) => {
        const id = idProjeto(projeto);
        const label = document.createElement("label");
        label.className = "admin-project-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = id;
        checkbox.checked = idsSelecionados.has(String(id));

        const content = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = projeto.nome || "Projeto sem nome";

        const meta = document.createElement("span");
        meta.textContent = `${projeto.status || "Sem status"} | ${projeto.tipo || "Projeto"} | ${projeto.publicoAlvo || "Sem publico"}`;

        content.append(title, meta);
        label.append(checkbox, content);
        container.appendChild(label);
    });
}

function marcarProjetosAtivos() {
    document.querySelectorAll("#adminProjectList input[type='checkbox']").forEach((input) => {
        const projeto = projetosDisponiveis.find((item) => String(idProjeto(item)) === input.value);
        input.checked = normalizarTexto(projeto?.status) === "ativo";
    });
}

async function salvarConfiguracaoHome(event) {
    event.preventDefault();

    const config = {
        projectIds: Array.from(document.querySelectorAll("#adminProjectList input[type='checkbox']:checked"))
            .map((input) => input.value),
        contact: {
            phone: valorCampo("contactPhone"),
            email: valorCampo("contactEmail"),
            address: valorCampo("contactAddress"),
            social: valorCampo("contactSocial")
        }
    };

    try {
        const response = await fetch(SITE_CONFIG_API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ valor: JSON.stringify(config) })
        });

        if (!response.ok) throw new Error("Nao foi possivel salvar.");

        salvarConfigLocal(config);
        configAtual = normalizarConfigHome(config);
        mostrarAlerta("Configuracao salva. A página inicial foi atualizada com sucesso.", "success");
    } catch (error) {
        salvarConfigLocal(config);
        mostrarAlerta("Servidor indisponivel. Tente novamente mais tarde.", "error");
    }
}

async function carregarConfigHome() {
    try {
        const response = await fetch(SITE_CONFIG_API_URL);
        if (!response.ok) throw new Error("Config indisponivel.");
        const payload = await response.json();
        const config = JSON.parse(payload.valor || "{}");
        salvarConfigLocal(config);
        return normalizarConfigHome(config);
    } catch (error) {
        return normalizarConfigHome(carregarConfigLocal());
    }
}

function preencherContato(contact) {
    const contato = { ...defaultHomeConfig.contact, ...(contact || {}) };
    document.getElementById("contactPhone").value = contato.phone;
    document.getElementById("contactEmail").value = contato.email;
    document.getElementById("contactAddress").value = contato.address;
    document.getElementById("contactSocial").value = contato.social;
}


function normalizarConfigHome(config) {
    return {
        ...defaultHomeConfig,
        ...(config || {}),
        projectIds: Array.isArray(config?.projectIds) ? config.projectIds : [],
        contact: {
            ...defaultHomeConfig.contact,
            ...(config?.contact || {})
        }
    };
}

function salvarConfigLocal(config) {
    localStorage.setItem(HOME_CONFIG_STORAGE_KEY, JSON.stringify(normalizarConfigHome(config)));
}

function carregarConfigLocal() {
    try {
        return JSON.parse(localStorage.getItem(HOME_CONFIG_STORAGE_KEY) || "{}");
    } catch (error) {
        return {};
    }
}

function idProjeto(projeto) {
    return projeto?.id ?? projeto?.id_projeto ?? projeto?.idProjeto;
}

function valorCampo(id) {
    return document.getElementById(id).value.trim();
}

function normalizarTexto(valor) {
    return String(valor || "").trim().toLowerCase();
}
