// Remove tudo o que não for número e aplica a máscara de Telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
const mascaraTelefone = (valor) => {
    if (!valor) return "";
    valor = valor.replace(/\D/g, ""); 
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2"); 
    valor = valor.replace(/(\d)(\d{4})$/, "$1-$2");    
    return valor;
};

// Remove tudo o que não for número e aplica a máscara de CEP: XXXXX-XXX
const mascaraCEP = (valor) => {
    if (!valor) return "";
    valor = valor.replace(/\D/g, ""); 
    valor = valor.replace(/^(\d{5})(\d)/, "$1-$2"); 
    return valor.substring(0, 9); 
};

// Remove tudo o que não for número e aplica a máscara de CPF: XXX.XXX.XXX-XX
const mascaraCPF = (valor) => {
    if (!valor) return "";
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return valor.substring(0, 14); 
};

// Remove tudo o que não for número e aplica a máscara de CNPJ: XX.XXX.XXX/XXXX-XX
const mascaraCNPJ = (valor) => {
    if (!valor) return "";
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
    valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
    return valor.substring(0, 18);
};

// Função que encontra os inputs no ecrã e aplica os eventos
const aplicarMascaras = () => {
    // 1. Aplica nos campos de TELEFONE
    const inputsTelefone = document.querySelectorAll('input[name="tel_rep"], input[name="telefone"], input[name="tel_proprietario"], #editar-telefone, #edit-telefone, #edit-telefoneEmergencia');
    inputsTelefone.forEach(input => {
        input.setAttribute('maxlength', '15'); 
        input.addEventListener('input', (e) => {
            e.target.value = mascaraTelefone(e.target.value);
        });
    });

    // 2. Aplica nos campos de CEP
    const inputsCEP = document.querySelectorAll('input[name="cep"], #editar-cep');
    inputsCEP.forEach(input => {
        input.setAttribute('maxlength', '9'); 
        input.addEventListener('input', (e) => {
            e.target.value = mascaraCEP(e.target.value);
        });
    });

    // 3. Aplica nos campos de CPF
    const inputsCPF = document.querySelectorAll('input[name="cpf"], #editar-cpf, #edit-cpf, #cad-cpf');
    inputsCPF.forEach(input => {
        input.setAttribute('maxlength', '14'); 
        input.addEventListener('input', (e) => {
            e.target.value = mascaraCPF(e.target.value);
        });
    });

    // 4. Aplica nos campos de CNPJ
    const inputsCNPJ = document.querySelectorAll('input[name="cnpj"], #editar-cnpj');
    inputsCNPJ.forEach(input => {
        input.setAttribute('maxlength', '18'); 
        input.addEventListener('input', (e) => {
            e.target.value = mascaraCNPJ(e.target.value);
        });
    });
};

// Garante que o script só vai correr depois de todo o HTML da página carregar
document.addEventListener('DOMContentLoaded', aplicarMascaras);