document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:8080'
    : 'https://grupo-nata.onrender.com';

  // ==========================================
  // 1. CONTROLE DO MENU MOBILE
  // ==========================================
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });
  }

  // ==========================================
  // 2. FORMULÁRIO DE ESQUECI MINHA SENHA
  // ==========================================
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('usuario').value.trim();
      const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');

      if (!email) {
        mostrarAlerta('Por favor, informe seu e-mail.', 'error');
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        const resposta = await fetch(
          `${API_BASE_URL}/api/auth/esqueci-senha`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: controller.signal,
            body: JSON.stringify({
              email: email
            })
          }
        );
        clearTimeout(timeout);

        const mensagem = await resposta.text();

        if (resposta.ok) {
          mostrarAlerta('Um link de recuperação foi enviado para seu e-mail.', 'success');
          forgotPasswordForm.reset();
        } else {
          mostrarAlerta(mensagem || 'Não foi possível enviar o e-mail.', 'error');
        }
      } catch (erro) {
        console.error('Erro ao conectar com o servidor:', erro);
        mostrarAlerta(erro.name === 'AbortError'
          ? 'O servidor demorou para responder. Tente novamente em alguns minutos.'
          : 'Erro ao conectar com o servidor.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar e-mail de redefinição';
      }
    });
  }
});
