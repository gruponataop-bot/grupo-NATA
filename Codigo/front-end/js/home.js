const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
let _supabase = null;
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

const fallbackProjects = [
  {
    nome: "Troca de habilidades",
    descricao: "Encontros para compartilhar conhecimentos, fortalecer vinculos e aprender em comunidade.",
    tipo: "Educacional",
    publicoAlvo: "Comunidade",
    status: "Ativo"
  },
  {
    nome: "Nutricao solidaria",
    descricao: "Apoio nutricional e acompanhamento para familias atendidas pelos projetos sociais.",
    tipo: "Social",
    publicoAlvo: "Ambos",
    status: "Ativo"
  },
  {
    nome: "Centro da juventude",
    descricao: "Atividades de convivencia, cultura e desenvolvimento para criancas e jovens.",
    tipo: "Social",
    publicoAlvo: "Residente",
    status: "Ativo"
  }
];

document.addEventListener("DOMContentLoaded", () => {
  carregarProjetosHome();
  carregarContatoHome();
  configurarModal();
});

async function carregarProjetosHome() {
  const statusEl = document.getElementById("projectsStatus");

  try {
    const config = await carregarConfigHome();
    const response = await fetch(PROJECTS_API_URL);
    if (!response.ok) throw new Error("Nao foi possivel buscar projetos.");

    const projetos = await response.json();
    const projetosAtivos = filtrarProjetosHome(projetos, config.projectIds);

    renderizarProjetos(projetosAtivos.length ? projetosAtivos : fallbackProjects);
    statusEl.textContent = projetosAtivos.length
      ? "Projetos selecionados pela administracao."
      : "Nenhum projeto cadastrado ainda. Veja exemplos de apresentacao.";
  } catch (error) {
    renderizarProjetos(fallbackProjects);
    statusEl.textContent = "Servidor indisponivel agora. Exibindo exemplos para manter a pagina completa.";
  }
}

function renderizarProjetos(projetos) {
  const container = document.getElementById("homeProjects");
  container.innerHTML = "";

  projetos.forEach((projeto) => {
    const card = document.createElement("article");
    card.className = "project-card";

    if (projeto.imagemUrl) {
      const image = document.createElement("div");
      image.className = "project-card__image project-card__image--filled";
      image.style.backgroundImage = `url("${projeto.imagemUrl}")`;
      card.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "project-card__body";

    const tag = document.createElement("span");
    tag.className = "project-tag";
    tag.textContent = projeto.tipo || "Projeto";

    const title = document.createElement("h3");
    title.textContent = projeto.nome || "Projeto NATA";

    const description = document.createElement("p");
    description.textContent = projeto.descricao || "Projeto social cadastrado no sistema NATA.";

    const meta = document.createElement("span");
    meta.className = "project-meta";
    meta.textContent = `${projeto.status || "Ativo"} | ${projeto.publicoAlvo || "Comunidade"}`;

    const button = document.createElement("button");
    button.className = "btn btn-light project-card__button";
    button.type = "button";
    button.textContent = "Saiba mais";
    button.addEventListener("click", () => abrirModalProjeto(projeto));

    body.append(tag, title, description, meta, button);
    card.appendChild(body);
    container.appendChild(card);
  });
}

async function carregarContatoHome() {
  const config = await carregarConfigHome();
  const contato = { ...defaultHomeConfig.contact, ...(config.contact || {}) };

  atualizarTexto("home-contact-phone", contato.phone);
  atualizarTexto("home-contact-email", contato.email);
  atualizarTexto("home-contact-address", contato.address);
  atualizarTexto("home-contact-social", contato.social);
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

function filtrarProjetosHome(projetos, projectIds) {
  const ativos = projetos.filter((projeto) => normalizarTexto(projeto.status) !== "encerrado");
  const idsSelecionados = new Set((projectIds || []).map(String));

  if (!idsSelecionados.size) return ativos.slice(0, 3);

  return ativos.filter((projeto) => idsSelecionados.has(String(idProjeto(projeto))));
}

function idProjeto(projeto) {
  return projeto?.id ?? projeto?.id_projeto ?? projeto?.idProjeto;
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

function atualizarTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor || "";
}

function configurarModal() {
  document.querySelectorAll("[data-close-project-modal]").forEach((element) => {
    element.addEventListener("click", fecharModalProjeto);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") fecharModalProjeto();
  });
}

function abrirModalProjeto(projeto) {
  const modal = document.getElementById("projectModal");
  const image = document.getElementById("modalProjectImage");

  document.getElementById("modalProjectTitle").textContent = projeto.nome || "Projeto NATA";
  document.getElementById("modalProjectDescription").textContent =
    projeto.descricao || "Projeto social cadastrado no sistema NATA.";
  document.getElementById("modalProjectType").textContent = projeto.tipo || "Projeto";
  document.getElementById("modalProjectStatus").textContent = projeto.status || "Ativo";
  document.getElementById("modalProjectAudience").textContent = projeto.publicoAlvo || "Comunidade";

  if (projeto.imagemUrl) {
    image.style.display = "block";
    image.style.backgroundImage = `url("${projeto.imagemUrl}")`;
  } else {
    image.style.display = "none";
    image.style.backgroundImage = "";
  }

  modal.hidden = false;
  document.body.classList.add("modal-open");
}

function fecharModalProjeto() {
  const modal = document.getElementById("projectModal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function normalizarTexto(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
