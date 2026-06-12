/**
 * Sidebar única para todas as páginas em /pages/.
 * Rotas relativas à pasta pages/; dashboard aponta para ../index.html
 * Marque o item ativo com <body data-nav-active="projetos"> (ver chaves em aplicarItemAtivo).
 */
const SIDEBAR_HTML = `
<aside class="sidebar-flutuante">
    <div class="sidebar-logo">
        <img src="../img/logo_2-bg.png" alt="Logotipo NATA" style="height: 60px; width: auto; display: block; margin: 0 auto;">
    </div>

    <nav class="sidebar-nav">
        <ul class="nav-list">
            <li class="nav-item">
                <a href="dashboard.html" class="nav-link" data-nav="dashboard">
                    <div class="link-conteudo">
                        <i class="ph-fill ph-house-line"></i> Dashboard
                    </div>
                </a>
            </li>

            <li class="nav-item">
                <a href="#" class="nav-link">
                    <div class="link-conteudo">
                        <i class="ph-fill ph-handshake"></i> Acolhimento & Social
                    </div>
                    <i class="ph-thin ph-caret-down"></i>
                </a>
                <ul class="submenu">
                    <li>
                        <a href="residentes.html" class="submenu-link" data-nav="residentes">
                            <i class="ph-fill ph-user"></i> Residentes
                        </a>
                    </li>
                    <li>
                        <a href="participantes.html" class="submenu-link" data-nav="participantes">
                            <i class="ph-fill ph-users-three"></i> Participantes
                        </a>
                    </li>
                    <li>
                        <a href="voluntarios.html" class="submenu-link" data-nav="voluntarios">
                            <i class="ph-fill ph-handshake"></i> Voluntários
                        </a>
                    </li>
                    <li>
                        <a href="projetos.html" class="submenu-link" data-nav="projetos">
                            <i class="ph-fill ph-folder"></i> Projetos Sociais
                        </a>
                    </li>
                    <li>
                        <a href="relatorios-observacoes.html" class="submenu-link" data-nav="observacoes">
                            <i class="ph-fill ph-clipboard-text"></i> Relatórios de Observações
                        </a>
                    </li>
                </ul>
            </li>

            <li class="nav-item">
                <a href="#" class="nav-link">
                    <div class="link-conteudo">
                        <i class="ph-fill ph-heart"></i> Captação & Parcerias
                    </div>
                    <i class="ph-thin ph-caret-down"></i>
                </a>
                <ul class="submenu">
                    <li>
                        <a href="comprovantes.html" class="submenu-link" data-nav="comprovantes">
                            <i class="ph-fill ph-file-text"></i> Comprovantes
                        </a>
                    </li>
                    <li>
                        <a href="parceiros.html" class="submenu-link" data-nav="parceiros">
                            <i class="ph-fill ph-handshake"></i> Parceiros
                        </a>
                    </li>
                </ul>
            </li>

            <li class="nav-item">
                <a href="#" class="nav-link">
                    <div class="link-conteudo">
                        <i class="ph-fill ph-truck"></i> Logística
                    </div>
                    <i class="ph-thin ph-caret-down"></i>
                </a>
                <ul class="submenu">
                    <li>
                        <a href="veiculos.html" class="submenu-link" data-nav="veiculos">
                            <i class="ph-fill ph-steering-wheel"></i> Veículos
                        </a>
                    </li>
                    <li>
                        <a href="manutencao.html" class="submenu-link" data-nav="manutencao">
                            <i class="ph-fill ph-screwdriver"></i> Manutenção
                        </a>
                    </li>
                    <li>
                        <a href="motoristas.html" class="submenu-link" data-nav="motoristas">
                            <i class="ph-fill ph-identification-card"></i> Motorista
                        </a>
                    </li>
                    <li>
                        <a href="pontos.html" class="submenu-link" data-nav="pontos">
                            <i class="ph-fill ph-map-pin-area"></i> Pontos Coleta &amp; Entrega
                        </a>
                    </li>
                    <li>
                        <a href="rotas.html" class="submenu-link" data-nav="rotas">
                            <i class="ph-fill ph-path"></i> Rotas
                        </a>
                    </li>
                </ul>
            </li>

            <li class="nav-item">
                <a href="#" class="nav-link">
                    <div class="link-conteudo">
                        <i class="ph-fill ph-gear"></i> Administração
                    </div>
                    <i class="ph-thin ph-caret-down"></i>
                </a>
                <ul class="submenu">
                    <li>
                        <a href="financeiro.html" class="submenu-link" data-nav="financeiro">
                            <i class="ph-fill ph-currency-circle-dollar"></i> Financeiro
                        </a>
                    </li>
                    <li>
                        <a href="funcionarios.html" class="submenu-link" data-nav="funcionarios">
                            <i class="ph-fill ph-users"></i> Funcionários
                        </a>
                    </li>
                    <li>
                        <a href="estoque.html" class="submenu-link" data-nav="estoque">
                            <i class="ph-fill ph-package"></i> Estoque
                        </a>
                    </li>
                    <li>
                        <a href="admin-index.html" class="submenu-link" data-nav="admin-index">
                            <i class="ph-fill ph-browser"></i> Pagina inicial
                        </a>
                    </li>
                    <li>
                        <a href="perfil-administrativo.html" class="submenu-link" data-nav="perfil">
                            <i class="ph-fill ph-identification-badge"></i> Meu Perfil
                        </a>
                    </li>
                </ul>
            </li>
        </ul>
    </nav>

    <div class="sidebar-footer">
        <a href="#" id="btn-sair" class="nav-link">
            <div class="link-conteudo">
                <i class="ph ph-sign-out"></i> Sair
            </div>
        </a>
    </div>
</aside>
`.trim();

function aplicarItemAtivo(container) {
    const active = document.body.dataset.navActive;
    if (!active) return;

    const el = container.querySelector(`[data-nav="${active}"]`);
    if (!el) return;

    el.classList.add("link-sub-ativo");

    const submenu = el.closest(".submenu");
    if (submenu) {
        const navItem = submenu.closest(".nav-item");

        if (navItem && window.innerWidth > 768) {
            navItem.classList.add("menu-aberto");
        }
    }
}

function anexarComportamentoSubmenu(container) {
    const linksPrincipais = container.querySelectorAll(".sidebar-nav .nav-link");

    linksPrincipais.forEach((link) => {
        link.addEventListener("click", function (evento) {
            const submenu = this.nextElementSibling;

            if (submenu && submenu.classList.contains("submenu")) {
                evento.preventDefault();

                const itemPai = this.parentElement;
                const jaEstavaAberto = itemPai.classList.contains("menu-aberto");

                // Fecha todos os menus abertos primeiro
                container.querySelectorAll(".nav-item.menu-aberto").forEach((item) => {
                    item.classList.remove("menu-aberto");
                });

                // Se o menu clicado não estava aberto, nós o abrimos agora
                if (!jaEstavaAberto) {
                    itemPai.classList.add("menu-aberto");
                }
            }
        });
    });

    const linksSubmenu = container.querySelectorAll(".submenu-link");
    linksSubmenu.forEach((link) => {
        link.addEventListener("click", () => {
            // Remove a classe 'menu-aberto' para recolher a gaveta no mobile
            container.querySelectorAll(".nav-item.menu-aberto").forEach((item) => {
                item.classList.remove("menu-aberto");
            });
        });
    });

    container.querySelectorAll(".submenu-link-placeholder").forEach((a) => {
        a.addEventListener("click", (e) => e.preventDefault());
    });
}

function anexarComportamentoSair(container) {
    const btnSair = container.querySelector("#btn-sair");

    if (btnSair) {
        btnSair.addEventListener("click", function (evento) {
            evento.preventDefault(); // Evita que a página pisque ao clicar no "#"

            // 1. Limpa os dados do usuário logado
            localStorage.removeItem('usuarioLogadoNome');
            localStorage.removeItem('usuarioLogadoCargo');

            // 2. Redireciona para a tela de login
            // Atenção: Ajuste o caminho abaixo conforme o nome do seu arquivo de login.
            // Se as páginas estão dentro da pasta /pages/ e o login na raiz, use '../index.html'
            window.location.href = 'login.html';
        });
    }
}

function initSidebar() {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    container.innerHTML = SIDEBAR_HTML;
    aplicarItemAtivo(container);
    anexarComportamentoSubmenu(container);
    anexarComportamentoSair(container);
}

document.addEventListener("DOMContentLoaded", initSidebar);
