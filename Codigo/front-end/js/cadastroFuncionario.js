const url_base = "https://grupo-nata.onrender.com";

//post basico
async function cadastrarFuncionario(event) {
    event.preventDefault();

    const botaoSalvar = document.querySelector('.cp-btn-submit');
    const textoBotaoOriginal = botaoSalvar.innerHTML;
    botaoSalvar.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Cadastrando e enviando e-mail...';
    botaoSalvar.disabled = true;

    // A senha temporaria e gerada com seguranca pelo back-end.
    const dadosFuncionario = {
        nome_funcionario: document.getElementById('nome-funcionario').value,
        cpf: document.getElementById('cpf-funcionario').value,
        telefone: document.getElementById('telefone-funcionario').value,
        email: document.getElementById('email-funcionario').value,
        cargo: document.getElementById('cargo-funcionario').value
    };

    try {
        const response = await fetch(url_base+'/api/funcionarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosFuncionario)
        });

        if (response.ok) {
            const resultado = await response.json();
            const emailEnviado = resultado.emailAceitoPeloProvedor === true;

            if (emailEnviado) {
                const idEmail = resultado.emailMessageId ? ` ID: ${resultado.emailMessageId}.` : '';
                redirecionarComAlerta(
                    'funcionarios.html',
                    `Funcionario cadastrado e e-mail enviado com sucesso.`, //.${idEmail}
                    'success'
                );
            } else {
                const detalhe = resultado.erroEmail ? ` Motivo: ${resultado.erroEmail}` : '';
                mostrarAlerta(`Funcionario cadastrado, mas o Brevo rejeitou o envio.${detalhe}`, 'error');
            }
        } else {
            const erro = await response.text();
            mostrarAlerta("Erro ao cadastrar: " + erro, 'error');
        }
    } catch (error) {
        console.error("Erro na conexão:", error);
        mostrarAlerta("Não foi possível conectar ao servidor.", 'error');
    } finally {
        botaoSalvar.innerHTML = textoBotaoOriginal;
        botaoSalvar.disabled = false;
    }
}

//formatação do campo de cpf
const inputCpf = document.getElementById('cpf-funcionario');

if (inputCpf) inputCpf.addEventListener('input', (e) => {
    let value = e.target.value;

    // Remove tudo o que não for número
    value = value.replace(/\D/g, "");

    // Aplica a formatação progressivamente
    value = value.replace(/^(\d{3})(\d)/, "$1.$2");
    value = value.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

    // Limita a 14 caracteres (000.000.000-00)
    e.target.value = value.slice(0, 14);
});

//formatação do campo de telefone
const inputTel = document.getElementById('telefone-funcionario');

if (inputTel) inputTel.addEventListener('input', (e) => {
    let value = e.target.value;

    // Remove qualquer caractere que não seja número
    value = value.replace(/\D/g, "");

    // (00) 00000-0000
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2"); // Coloca parênteses no DDD
    value = value.replace(/(\d{5})(\d)/, "$1-$2");    // Coloca o hífen após o 5º dígito

    // Aplica o valor formatado de volta no campo
    e.target.value = value;
});
