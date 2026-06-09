const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const formCadastro = document.getElementById('form-novo-veiculo'); 

// Feedback visual do nome do arquivo selecionado
const inputFoto = document.getElementById('fotoVeiculo');
if (inputFoto) {
    inputFoto.addEventListener('change', function() {
        const spanNome = document.getElementById('nome-arquivo');
        spanNome.innerText = this.files.length > 0 ? this.files[0].name : "Carregar imagem do veículo";
    });
}

if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const placa = document.querySelector('[name="placa"]').value;
        const valorData = document.querySelector('[name="dtUltimaRevisao"]').value;
        const fotoInput = document.getElementById('fotoVeiculo');
        
        let urlPublicaFoto = null;

        try {
            // 1. LÓGICA DE UPLOAD DA FOTO (Se houver arquivo selecionado)
            if (fotoInput.files.length > 0) {
                const arquivo = fotoInput.files[0];
                const extensao = arquivo.name.split('.').pop();
                // Nome único: placa + timestamp para evitar duplicados
                const nomeArquivo = `${placa}_${Date.now()}.${extensao}`;

                const { data: uploadData, error: uploadError } = await _supabase
                    .storage
                    .from('veiculos') // Nome do seu bucket
                    .upload(nomeArquivo, arquivo);

                if (uploadError) throw uploadError;

                // 2. PEGAR A URL PÚBLICA DA FOTO
                const { data: publicUrlData } = _supabase
                    .storage
                    .from('veiculos')
                    .getPublicUrl(nomeArquivo);

                urlPublicaFoto = publicUrlData.publicUrl;
            }

            // 3. SALVAR DADOS NA TABELA 'VEICULO'
            const novoVeiculo = {
                tipo_veiculo: document.querySelector('input[name="tipo_veiculo"]:checked').value,
                placa: placa,
                marca: document.querySelector('[name="marca"]').value,
                modelo: document.querySelector('[name="modelo"]').value,
                ano: parseInt(document.querySelector('[name="ano"]').value) || null,
                cargaMax: document.querySelector('[name="cargaMax"]').value,
                km_atual: parseInt(document.querySelector('[name="km_atual"]').value) || 0,
                dtUltimaRevisao: valorData === "" ? null : valorData,
                status_veiculo: 'Disponível',
                fotoVeiculo: urlPublicaFoto // Agora salvamos a URL completa!
            };

            const { data: veiculoCriado, error: erroVeiculo } = await _supabase
                .from('veiculo')
                .insert([novoVeiculo])
                .select()
                .single();

                if (erroVeiculo) throw erroVeiculo;

            const idGerado = veiculoCriado.id_veiculo;

            // 4. SALVAR DADOS DO PROPRIETÁRIO
            const dadosProprietario = {
                nome_prop: document.querySelector('[name="nome_proprietario"]').value,
                telefone_prop: document.querySelector('[name="tel_proprietario"]').value,
                email_prop: document.querySelector('[name="email_proprietario"]').value,
                id_veiculo: idGerado 
            };

            const { error: erroProp } = await _supabase
                .from('propietario_veiculo')
                .insert([dadosProprietario]);

            if (erroProp) throw erroProp;

            mostrarAlerta('Veículo, Proprietário e Foto salvos com sucesso!', 'success');
            window.location.href = 'veiculos.html';

        } catch (error) {
            console.error('Erro detalhado:', error);
            mostrarAlerta('Erro no processo: ' + error.message, 'error');
        }
    });
}