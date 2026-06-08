const form = document.getElementById('loginForm');

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  const usuario = document.getElementById('usuario').value.trim(); // Este será o e-mail
  const senha = document.getElementById('senha').value.trim();
  const tipo = document.getElementById('tipoUsuario').value; // Este será o cargo

  if (!usuario || !senha || !tipo) {
    mostrarAlerta('Preencha todos os campos.', 'error');
    return;
  }

 try {
    const resposta = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: usuario,
        senha: senha,
        cargo: tipo
      })
    });

    if (resposta.ok) {
      const dadosFuncionario = await resposta.json();
      
      // 1. SALVANDO OS DADOS NO NAVEGADOR
      localStorage.setItem('usuarioLogadoId', dadosFuncionario.id_funcionario || dadosFuncionario.id || '');
      localStorage.setItem('usuarioLogadoNome', dadosFuncionario.nome_funcionario);
      localStorage.setItem('usuarioLogadoCargo', dadosFuncionario.cargo);
      localStorage.setItem('usuarioLogadoEmail', dadosFuncionario.email || '');
      localStorage.setItem('usuarioLogadoTelefone', dadosFuncionario.telefone || '');
      localStorage.setItem('usuarioLogadoCpf', dadosFuncionario.cpf || '');

      mostrarAlerta(`Bem-vindo, ${dadosFuncionario.nome_funcionario}!`, 'success');
      
      // 2. Redireciona de acordo com o cargo (COLOQUE SEU NOVO CÓDIGO AQUI)
      const cargoLogado = (dadosFuncionario.cargo || tipo || '').toLowerCase();
      
      if (cargoLogado === 'professor') {
        window.location.href = 'perfil-professor.html';
      } else if (cargoLogado === 'coordenador') {
        window.location.href = 'perfil-coordenador.html';
      } else if (cargoLogado === 'administrativo') {
        window.location.href = 'perfil-administrativo.html';
      } else {
        window.location.href = 'dashboard.html';
      }
      
    } else {
      const erro = await resposta.text();
      mostrarAlerta('Erro ao entrar: ' + erro, 'error');
    }

  } catch (error) {
    console.error('Erro na conexão:', error);
    mostrarAlerta('Não foi possível conectar ao servidor.', 'error');
  }
});

const toggleSenha = document.getElementById('toggleSenha');
const senhaInput = document.getElementById('senha');

toggleSenha.addEventListener('click', function () {
  const mostrando = senhaInput.type === 'text';

  senhaInput.type = mostrando ? 'password' : 'text';
  toggleSenha.classList.toggle('active', !mostrando);
  toggleSenha.setAttribute('aria-pressed', String(!mostrando));
  toggleSenha.setAttribute(
    'aria-label',
    mostrando ? 'Mostrar senha' : 'Ocultar senha'
  );
});

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobileMenu');

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', function () {
    menuToggle.classList.toggle('active');
    mobileMenu.classList.toggle('open');

    const aberto = mobileMenu.classList.contains('open');
    menuToggle.setAttribute(
      'aria-label',
      aberto ? 'Fechar menu' : 'Abrir menu'
    );
  });
}

function esqueciSenha() {
  mostrarAlerta('Redirecione para a página de recuperação de senha.', 'info');
}
