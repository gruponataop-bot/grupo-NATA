/**
 * Sistema de alertas global do NATA.
 * @param {string} mensagem - Texto do alerta.
 * @param {string} tipo - success, error ou warning.
 */
function mostrarAlerta(mensagem, tipo = 'success') {
    let container = document.getElementById('alert-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'alert-container';
        container.className = 'alert-container';
        document.body.appendChild(container);
    }

    const tipoSeguro = ['success', 'error', 'warning'].includes(tipo) ? tipo : 'success';
    const toast = document.createElement('div');
    toast.className = `alert-toast alert-${tipoSeguro}`;
    toast.setAttribute('role', 'status');

    const icones = {
        success: 'ph-check-circle',
        error: 'ph-warning-circle',
        warning: 'ph-warning'
    };

    const icone = document.createElement('i');
    icone.className = `ph ${icones[tipoSeguro]}`;
    icone.setAttribute('aria-hidden', 'true');

    const texto = document.createElement('span');
    texto.textContent = mensagem;

    toast.append(icone, texto);
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('alert-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// Salva o alerta na memória e muda de página
// ==========================================
function redirecionarComAlerta(url, mensagem, tipo = 'success') {
    // 1. Guarda a mensagem na memória do navegador
    sessionStorage.setItem('alertaPendente', JSON.stringify({ mensagem, tipo }));
    // 2. Muda de página na mesma hora
    window.location.href = url;
}

// ==========================================
// VERIFICADOR AUTOMÁTICO (Roda em todas as páginas)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Procura se tem algum alerta guardado na memória
    const alertaSalvo = sessionStorage.getItem('alertaPendente');
    
    if (alertaSalvo) {
        // 2. Transforma o texto salvo de volta em código
        const dadosAlerta = JSON.parse(alertaSalvo);
        
        // 3. Mostra o alerta na página nova
        mostrarAlerta(dadosAlerta.mensagem, dadosAlerta.tipo);
        
        // 4. Limpa a memória para o alerta não aparecer de novo ao dar F5
        sessionStorage.removeItem('alertaPendente');
    }
});