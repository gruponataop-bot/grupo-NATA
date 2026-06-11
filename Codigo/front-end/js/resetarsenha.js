const url_base = 'https://grupo-nata.onrender.com'; 

document.addEventListener('DOMContentLoaded', () => {
  // Captura o token da URL
  const token = new URLSearchParams(window.location.search).get('token');

  console.log('Token recebido:', token);

  // Só considera inválido se for null ou vazio
  if (token === null || token.trim() === '') {
    alert('Link inválido ou expirado.');
    return;
  }

  const formRedefinir = document.getElementById('redefinirSenhaForm');

  if (formRedefinir) {
    formRedefinir.addEventListener('submit', async (e) => {
      e.preventDefault();

      const novaSenha = document.getElementById('novaSenha').value;
      const confirmarSenha = document.getElementById('confirmarSenha').value;

      if (novaSenha.length < 8) {
        alert('A senha deve ter pelo menos 8 caracteres.');
        return;
      }

      if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem.');
        return;
      }

      try {
        const resposta = await fetch(
          url_base+'/api/auth/redefinir-senha',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              token: token,
              novaSenha: novaSenha
            })
          }
        );

        const mensagem = await resposta.text();

        if (resposta.ok) {
          alert('Senha redefinida com sucesso!');
          window.location.href = 'login.html';
        } else {
          alert(mensagem || 'Não foi possível redefinir a senha.');
        }
      } catch (erro) {
        console.error(erro);
        alert('Erro ao conectar com o servidor.');
      }
    });
  }
// 1. Olhinho da Nova Senha
  const toggleNovaSenha = document.getElementById('toggleNovaSenha');
  const novaSenhaInput = document.getElementById('novaSenha');

  if (toggleNovaSenha && novaSenhaInput) {
    toggleNovaSenha.addEventListener('click', function () {
      const mostrando = novaSenhaInput.type === 'text';
      novaSenhaInput.type = mostrando ? 'password' : 'text';
      toggleNovaSenha.classList.toggle('active', !mostrando);
      toggleNovaSenha.setAttribute('aria-pressed', String(!mostrando));
    });
  }

  // 2. Olhinho da Confirmação de Senha
  const toggleConfirmarSenha = document.getElementById('toggleConfirmarSenha');
  const confirmarSenhaInput = document.getElementById('confirmarSenha');

  if (toggleConfirmarSenha && confirmarSenhaInput) {
    toggleConfirmarSenha.addEventListener('click', function () {
      const mostrando = confirmarSenhaInput.type === 'text';
      confirmarSenhaInput.type = mostrando ? 'password' : 'text';
      toggleConfirmarSenha.classList.toggle('active', !mostrando);
      toggleConfirmarSenha.setAttribute('aria-pressed', String(!mostrando));
    });
  }

  // === MENU MOBILE (Caso queira que funcione nessa tela também) ===
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      menuToggle.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });
  }
});



