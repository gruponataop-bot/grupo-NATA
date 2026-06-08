document.addEventListener("DOMContentLoaded", () => {
    carregarUsuarioLogado();
});

async function carregarUsuarioLogado() {
    const nomeElemento = document.getElementById('nome-usuario');
    if (!nomeElemento) return;

    const nomeUsuario = localStorage.getItem('usuarioLogadoNome');
    nomeElemento.innerText = nomeUsuario || 'Visitante';
}
