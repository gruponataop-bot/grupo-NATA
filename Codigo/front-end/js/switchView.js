// switchView.js corrigido
window.currentView = 'tabela'; 

function initViewSwitcher(callbackRedesenhar) {
    // Seleciona os botões dentro do switcher
    const botoes = document.querySelectorAll('.btn-view');
    
    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const tipo = botao.getAttribute('data-view');
            window.currentView = tipo;

            // Remove active de todos e adiciona no clicado
            botoes.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');

            // Executa a função de renderização da página (filtrarPontos ou renderizarConteudo)
            if (callbackRedesenhar) callbackRedesenhar(tipo);
        });
    });
}