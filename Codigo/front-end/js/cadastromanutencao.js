const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const formManutencao = document.getElementById('form-nova-manutencao');
let listaVeiculosCache = []; 

document.addEventListener('DOMContentLoaded', () => {
    carregarVeiculos();
});

async function carregarVeiculos() {
    const select = document.getElementById('select-veiculo');
    try {
        const { data, error } = await _supabase
            .from('veiculo')
            .select('id_veiculo, placa, modelo');

        if (error) throw error;

        listaVeiculosCache = data; 

        select.innerHTML = '<option value="">Selecione um veículo</option>';
        data.forEach(v => {
            select.innerHTML += `<option value="${v.id_veiculo}">${v.placa} - ${v.modelo}</option>`;
        });
    } catch (error) {
        console.error('Erro ao carregar veículos:', error);
    }
}

if (formManutencao) {
    formManutencao.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Captura a data do formulário
        const dataInput = document.querySelector('[name="data"]').value;
        
        // Lógica de Validação de Data
        const dataSelecionada = new Date(dataInput);
        const dataHoje = new Date();
        
        // Compara apenas os dias
        dataHoje.setHours(0, 0, 0, 0);

        // Data selecionada para o timezone correto
        const dataSelecionadaAjustada = new Date(dataSelecionada.getTime() + dataSelecionada.getTimezoneOffset() * 60000);
        dataSelecionadaAjustada.setHours(0, 0, 0, 0);

        if (dataSelecionadaAjustada < dataHoje) {
            mostrarAlerta('A data da manutenção não pode ser anterior à data atual.', 'error');
            return; // Interrompe o envio
        }

        const idSelecionado = document.querySelector('[name="id_veiculo"]').value;
        const veiculoEncontrado = listaVeiculosCache.find(v => v.id_veiculo == idSelecionado);

        const dados = {
            id_veiculo: parseInt(idSelecionado),
            placa: veiculoEncontrado ? veiculoEncontrado.placa : null,
            tipo: document.querySelector('[name="tipo"]').value,
            servico: document.querySelector('[name="servico"]').value,
            data: dataInput,
            local: document.querySelector('[name="local"]').value,
            custo: parseFloat(document.querySelector('[name="custo"]').value) || 0,
            status: 'Pendente'
        };

        try {
            const { error } = await _supabase
                .from('manutencao')
                .insert([dados]);

            if (error) throw error;

            mostrarAlerta('Manutenção registrada com sucesso!', 'success');
            window.location.href = 'manutencao.html';
        } catch (error) {
            console.error('Erro detalhado:', error);
            mostrarAlerta('Erro ao salvar: ' + error.message, 'error');
        }
    });
}