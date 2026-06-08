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
