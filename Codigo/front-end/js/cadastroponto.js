// Configurações do Supabase (Garanta que as constantes estão com os valores corretos)
const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const formCadastro = document.getElementById('form-novo-ponto');

if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const botaoSalvar = formCadastro.querySelector('button[type="submit"]');
        const textoBotaoOriginal = botaoSalvar.innerHTML;
        botaoSalvar.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Buscando coordenadas...';
        botaoSalvar.disabled = true;

        const rua = document.querySelector('[name="rua"]').value;
        const numero = document.querySelector('[name="numero"]').value;
        const bairro = document.querySelector('[name="bairro"]').value;
        const cidade = document.querySelector('[name="cidade"]').value;

        // Chama o arquivo de geocodificação para obter as coordenadas
        const coordenadas = await obterCoordenadas(rua, numero, bairro, cidade);

        if (coordenadas.latitude === null) {
            mostrarAlerta('Endereço não encontrado no GPS! Verifique o nome da rua e a cidade.', 'warning');
            botaoSalvar.innerHTML = textoBotaoOriginal;
            botaoSalvar.disabled = false;
            return; 
        }
        
        // Captura os valores usando o atributo 'name' do HTML
        const novoPonto = {
            nome_ponto: document.querySelector('[name="nome_ponto"]').value,
            cep: document.querySelector('[name="cep"]').value,
            rua: document.querySelector('[name="rua"]').value,
            numero: document.querySelector('[name="numero"]').value,
            bairro: document.querySelector('[name="bairro"]').value,
            cidade: document.querySelector('[name="cidade"]').value,
            complemento: document.querySelector('[name="complemento"]').value,
            nome_representante: document.querySelector('[name="nome_rep"]').value,
            telefone_representante: document.querySelector('[name="tel_rep"]').value,
            email_representante: document.querySelector('[name="email_rep"]').value,
            // Converte o valor do radio para booleano (true/false) para o banco
            isPontoColeta: document.querySelector('input[name="ponto_coleta"]:checked').value === 'sim',
            isPontoEntrega: document.querySelector('input[name="ponto_entrega"]:checked').value === 'sim',
            // coordenadas
            latitude: coordenadas.latitude,
            longitude: coordenadas.longitude
        };

        try {
            const { error } = await _supabase.from('ponto').insert([novoPonto]);
            if (error) throw error;
            mostrarAlerta('Ponto cadastrado com sucesso!');
            window.location.href = 'pontos.html'; 
        } catch (error) {
            console.error('Erro detalhado:', error);
            mostrarAlerta('Erro ao salvar no banco: ' + error.message);
            botaoSalvar.innerHTML = textoBotaoOriginal;
            botaoSalvar.disabled = false;
        }
    });
}