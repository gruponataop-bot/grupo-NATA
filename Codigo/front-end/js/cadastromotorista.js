// Configurações do Supabase (Garanta que as constantes estão com os valores corretos)
const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const formCadastro = document.getElementById('form-novo-motorista');

if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Captura os valores usando o atributo 'name' do HTML
        const novoMotorista = {
            nome_motorista: document.querySelector('[name="nome_motorista"]').value,
            telefone_motorista: document.querySelector('[name="tel_rep"]').value,
            email_motorista: document.querySelector('[name="email_rep"]').value,
            cpf_motorista: document.querySelector('[name="cpf_motorista"]').value,
            cep_motorista: document.querySelector('[name="cep"]').value,
            rua_motorista: document.querySelector('[name="rua"]').value,
            numeroResidencia_motorista: document.querySelector('[name="numero"]').value,
            bairro_motorista: document.querySelector('[name="bairro"]').value,
            cidade_motorista: document.querySelector('[name="cidade"]').value,
            complemento: document.querySelector('[name="complemento"]').value,

            // Converte o valor do radio para booleano (true/false) para o banco
            cnh_a: document.querySelector('input[name="cnh_a"]').checked,
            cnh_b: document.querySelector('input[name="cnh_b"]').checked,
            cnh_c: document.querySelector('input[name="cnh_c"]').checked
        };

        try {
            // PUSH para a tabela: motorista; obtem o ID gerado
            const { data: motoristaCriado, error: erroMot } = await _supabase
                .from('motorista')
                .insert([novoMotorista])
                .select()
                .single();

            if (erroMot) throw erroMot;

            const idMotorista = motoristaCriado.id_motorista;

            // Capturar Checkboxes de Disponibilidade
            const selecionados = document.querySelectorAll('input[name="disp"]:checked');
            const listaDisponibilidade = Array.from(selecionados).map(cb => {
                const [dia, turno] = cb.value.split('-');
                return {
                    id_motorista: idMotorista, 
                    dia_da_semana: dia,
                    turno: turno
                };
            });

            // PUSH para a tabela de disponibilidade (apenas se houver seleções)
            if (listaDisponibilidade.length > 0) {
                const { error: erroDisp } = await _supabase
                    .from('disponibilidade_motorista')
                    .insert(listaDisponibilidade);

                if (erroDisp) throw erroDisp;
            }

            redirecionarComAlerta('motoristas.html', 'Motorista e disponibilidade salvos com sucesso!', 'success');

        } catch (error) {
            console.error('Erro:', error);
            mostrarAlerta('Erro ao salvar: ' + error.message, 'error');
        }
    });
}