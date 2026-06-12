/**
 * Sidebar e Bottom Navigation para Coordenadores, Voluntários e Professores.
 * Marque o item ativo com <body data-nav-active="perfil">, data-nav-active="projetos" ou data-nav-active="gerencia"
 */
function montarSidebarVoluntariosHtml() {
    const cargoLogado = (localStorage.getItem('usuarioLogadoCargo') || '').trim().toLowerCase();
    const isProfessor = cargoLogado === 'professor';
    const perfilHref = isProfessor ? 'perfil-professor.html' : 'perfil-coordenador.html';
    const presencaHref = isProfessor ? 'presenca-professor.html' : 'presenca-coordenador.html';
    const projetosHref = isProfessor ? 'projetos-professor.html' : 'projeto-coordenador.html';
    
    // Mantém as abas corretas para a navegação do coordenador
    let itensMenuHtml = `
        <li class="nav-item">
            <a href="${perfilHref}" class="nav-link" data-nav="perfil">
                <div class="link-conteudo">
                    <i class="ph-fill ph-identification-badge"></i> <span>Perfil</span>
                </div>
            </a>
        </li>
        <li class="nav-item">
            <a href="${presencaHref}" class="nav-link" data-nav="presenca">
                <div class="link-conteudo">
                    <i class="ph-fill ph-check-square-offset"></i> <span>Presença</span>
                </div>
            </a>
        </li>
        <li class="nav-item">
            <a href="${projetosHref}" class="nav-link" data-nav="projetos">
                <div class="link-conteudo">
                    <i class="ph-fill ph-folder-open"></i> <span>Projetos</span>
                </div>
            </a>
        </li>
        <li class="nav-item mobile-only-exit">
            <a href="#" id="btn-sair-voluntario-mobile" class="nav-link">
                <div class="link-conteudo">
                    <i class="ph ph-sign-out"></i> <span>Sair</span>
                </div>
            </a>
        </li>
    `;

    return `
        <aside class="sidebar-flutuante">
            <div class="sidebar-logo">
                <img src="../img/logo_2-bg.png" alt="Logotipo NATA" style="height: 60px; width: auto; display: block; margin: 0 auto;">
            </div>

            <nav class="sidebar-nav">
                <ul class="nav-list">
                    ${itensMenuHtml}
                </ul>
            </nav>

            <div class="sidebar-footer">
                <a href="#" id="btn-sair-voluntario" class="nav-link">
                    <div class="link-conteudo">
                        <i class="ph ph-sign-out"></i> <span>Sair</span>
                    </div>
                </a>
            </div>
        </aside>
        `.trim();
}

function aplicarItemAtivo(container) {
    const active = document.body.dataset.navActive;
    if (!active) return;

    const el = container.querySelector(`[data-nav="${active}"]`);
    if (!el) return;

    // Em telas grandes usamos a classe link-sub-ativo, no mobile usamos o item-ativo
    el.classList.add("link-sub-ativo");
    el.closest('.nav-item')?.classList.add("item-ativo");
}

function anexarComportamentoSair(container) {
    const btnSair = container.querySelectorAll("#btn-sair-voluntario");
    
    btnSair.forEach(btn => {
        btn.addEventListener("click", function (evento) {
            evento.preventDefault(); 
            localStorage.removeItem('usuarioLogadoId');
            localStorage.removeItem('usuarioLogadoNome');
            localStorage.removeItem('usuarioLogadoCargo');
            localStorage.removeItem('usuarioLogadoEmail');
            localStorage.removeItem('usuarioLogadoCpf');
            localStorage.removeItem('usuarioLogadoTelefone');
            localStorage.removeItem('usuarioLogadoEndereco');
            
            window.location.href = 'login.html'; 
        });
    });
}

function initSidebarVoluntarios() {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    container.innerHTML = montarSidebarVoluntariosHtml();
    aplicarItemAtivo(container);
    anexarComportamentoSair(container);
}

document.addEventListener("DOMContentLoaded", initSidebarVoluntarios);