document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:8080'
    : 'https://meu-projeto-backend.onrender.com';

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

      if (!email) {
        alert('Por favor, informe seu e-mail.');
        return;
      }

      try {
        const resposta = await fetch(
          `${API_BASE_URL}/api/auth/esqueci-senha`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: email
            })
          }
        );

        const mensagem = await resposta.text();

        if (resposta.ok) {
          alert('Um link de recuperação foi enviado para seu e-mail.');
          forgotPasswordForm.reset();
        } else {
          alert(mensagem || 'Não foi possível enviar o e-mail.');
        }
      } catch (erro) {
        console.error('Erro ao conectar com o servidor:', erro);
        alert('Erro ao conectar com o servidor.');
      }
    });
  }
});
