// Configurações do Supabase
const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let todosVeiculos = [];

document.addEventListener('DOMContentLoaded', () => {

    window.currentView = 'tabela';

    if (typeof initViewSwitcher === 'function') {
        initViewSwitcher((viewSelecionada) => {
            window.currentView = viewSelecionada;
            renderizarConteudo(todosVeiculos);
        });
    }

    buscarVeiculos();

    // Eventos para filtragem (ajustados para os campos de veículo)
    document.getElementById('pesquisa-veiculo').addEventListener('input', filtrarVeiculos);
    document.getElementById('filtro-carga').addEventListener('input', filtrarVeiculos);
    document.getElementById('filtro-ano').addEventListener('input', filtrarVeiculos);
    document.getElementById('filtro-data-revisao').addEventListener('change', filtrarVeiculos);
    document.querySelectorAll('.filtro-tipo').forEach(el => {
        el.addEventListener('change', filtrarVeiculos);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const btnConfirmarDelete = document.getElementById('btn-confirmar-delete');
    if (btnConfirmarDelete) {
        btnConfirmarDelete.addEventListener('click', async () => {
            const id = document.getElementById('editar-id').value;

            try {
                // A tabela propietario_veiculo deve ter delete em cascata ou ser deletada primeiro
                const { error: errP } = await supabaseClient
                    .from('propietario_veiculo')
                    .delete()
                    .eq('id_veiculo', id);

                if (errP) throw errP;

                const { error: errV } = await supabaseClient
                    .from('veiculo')
                    .delete()
                    .eq('id_veiculo', id);

                if (errV) throw errV;

                mostrarAlerta('Veículo excluído com sucesso!', 'success');
                fecharModais();
                buscarVeiculos(); // Atualiza a lista de cards

            } catch (err) {
                console.error('Erro ao excluir:', err.message);
                mostrarAlerta('Erro ao excluir o veículo. Verifique se existem manutenções vinculadas a ele.', 'error');
            }
        });
    }
});

async function buscarVeiculos() {
    try {
        const { data, error } = await supabaseClient
            .from('veiculo')
            .select(`*, propietario_veiculo (*)`);

        if (error) throw error;

        todosVeiculos = data; 
        renderizarConteudo(todosVeiculos); // Chama a função mestre

    } catch (error) {
        console.error('Erro:', error);
    }
}

function renderizarConteudo(lista) {
    const container = document.getElementById('container-veiculos');
    if (!container) return;

    if (window.currentView === 'tabela') {
        renderizarTabelaVeiculos(lista, container);
    } else {
        renderizarCardsVeiculos(lista, container);
    }
}

function renderizarCardsVeiculos(lista, container) {
    container.className = "container-cards";
    container.innerHTML = lista.map(v => criarCardVeiculo(v)).join('');
    atualizarContador(lista.length);
}

function atualizarContador(quantidade) {
    const info = document.getElementById('info-paginacao');
    if (info) {
        info.innerText = quantidade === 1 ? '1 veículo encontrado' : `${quantidade} veículos encontrados`;
    }
}

function criarCardVeiculo(v) {
    const prop = v.propietario_veiculo && v.propietario_veiculo.length > 0 ? v.propietario_veiculo[0] : null;

    const caminhoFoto = v.fotoVeiculo ? v.fotoVeiculo : '../img/capa_padrao_veiculo.png';

    return `
        <div class="card-ponto">
            <div class="card-capa" style="background-image: url('${caminhoFoto}');">
                <h3>${v.placa}</h3>
                <div class="tipo-capa">
                    <i class="ph ph-steering-wheel"></i> ${v.tipo_veiculo}
                </div>
            </div>

            <div class="card-conteudo-detalhado">
                <div class="card-header">
                    <h4 style="margin:0; color:#db5c33;">${v.marca} ${v.modelo}</h4>
                    <span style="font-size: 0.8rem; font-weight: bold; color: #666;">${v.ano || '---'}</span>
                </div>
                
                <div class="card-body-scroll">
                    <p><i class="ph ph-hash"></i> <strong>Placa:</strong> ${v.placa}</p>
                    <p><i class="ph ph-gauge"></i> <strong>KM Atual:</strong> ${v.km_atual} km</p>
                    <p><i class="ph ph-weight"></i> <strong>Carga Máx:</strong> ${v.cargaMax || '---'}</p>
                    <p><i class="ph ph-calendar"></i> <strong>Última Revisão:</strong> ${v.dtUltimaRevisao ? new Date(v.dtUltimaRevisao).toLocaleDateString() : 'Não informada'}</p>
                    
                    <hr>
                    <h5 style="margin: 10px 0 5px 0; color: #db5c33;">Proprietário</h5>
                    <p><i class="ph ph-user"></i> ${prop ? prop.nome_prop : 'N/A'}</p>
                    <p><i class="ph ph-phone"></i> ${prop ? prop.telefone_prop : 'N/A'}</p>
                    <p><i class="ph ph-envelope"></i> ${prop ? prop.email_prop : 'N/A'}</p>
                </div>

                <div class="card-footer">
                    <button class="btn-card-editar" onclick="abrirModalEdicaoVeiculo('${v.id_veiculo}')">
                        <i class="ph ph-pencil-simple"></i> Editar
                    </button>
                </div>
            </div>
        </div>`;
}

function renderizarTabelaVeiculos(lista, container) {
    container.className = "tabela-container"; 
    container.innerHTML = `
        <table class="tabela-dados">
            <thead>
                <tr>
                    <th>Placa</th>
                    <th>Marca/Modelo</th>
                    <th>Tipo</th>
                    <th>KM Atual</th>
                    <th>Proprietário</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${lista.map(v => {
                    const prop = v.propietario_veiculo?.[0];
                    return `
                    <tr>
                        <td>${v.placa}</td>
                        <td>${v.marca} ${v.modelo}</td>
                        <td>${v.tipo_veiculo}</td>
                        <td>${v.km_atual} km</td>
                        <td>${prop ? prop.nome_prop : '---'}</td>
                        <td class="acoes-icones">
                            <button class="action-btn btn-edit" onclick="abrirModalEdicaoVeiculo('${v.id_veiculo}')" title="Editar">
                                Editar
                            </button>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
    atualizarContador(lista.length);
}

// --- FUNÇÕES DE MODAL ---

window.abrirModalEdicaoVeiculo = async function(id) {
    const veiculo = todosVeiculos.find(v => String(v.id_veiculo) === String(id));
    
    if (veiculo) {
        const prop = veiculo.propietario_veiculo?.[0] || null;

        document.getElementById('editar-id').value = id;

        // 1. Corrigir Marcação do Tipo (Rádio)
        const radios = document.querySelectorAll('input[name="editar-tipo"]');
        radios.forEach(radio => {
            radio.checked = (radio.value.toLowerCase() === veiculo.tipo_veiculo.toLowerCase());
        });

        // 2. Corrigir Mapeamento de Campos (Baseado no seu buscarVeiculos)
        document.getElementById('editar-placa').value = veiculo.placa || '';
        document.getElementById('editar-ano').value = veiculo.ano || '';
        document.getElementById('editar-marca').value = veiculo.marca || '';
        document.getElementById('editar-modelo').value = veiculo.modelo || '';
        
        // Use os nomes exatos das colunas do banco de dados
        document.getElementById('editar-km').value = veiculo.km_atual || 0; 
        document.getElementById('editar-carga').value = veiculo.cargaMax || ''; // Ajustado para snake_case
        document.getElementById('editar-revisao').value = veiculo.dtUltimaRevisao || ''; // Ajustado para snake_case

        // Dados do proprietário
        document.getElementById('editar-nome-prop').value = prop ? prop.nome_prop : '';
        document.getElementById('editar-tel-prop').value = prop ? prop.telefone_prop : '';
        document.getElementById('editar-email-prop').value = prop ? prop.email_prop : '';

        document.getElementById('modal-editar-veiculo').classList.add('mostrar-modal');
        document.getElementById('modal-overlay').classList.add('mostrar-modal');
    }
};

window.fecharModais = function() {
    document.getElementById('modal-overlay').classList.remove('mostrar-modal');
    document.getElementById('modal-editar-veiculo').classList.remove('mostrar-modal');
    if(document.getElementById('modal-confirmar-exclusao')) {
        document.getElementById('modal-confirmar-exclusao').classList.remove('mostrar-modal');
    }
};

// Lógica de Submit da Edição
const formEditar = document.getElementById('form-editar-veiculo');
if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();

        const idVeiculo = document.getElementById('editar-id').value;

        const dadosVeiculo = {
            tipo_veiculo: document.querySelector('input[name="editar-tipo"]:checked').value,
            placa: document.getElementById('editar-placa').value,
            ano: parseInt(document.getElementById('editar-ano').value) || null,
            marca: document.getElementById('editar-marca').value,
            modelo: document.getElementById('editar-modelo').value,
            km_atual: parseInt(document.getElementById('editar-km').value) || 0,
            cargaMax: document.getElementById('editar-carga').value,
            dtUltimaRevisao: document.getElementById('editar-revisao').value || null
        };

        const dadosProp = {
            nome_prop: document.getElementById('editar-nome-prop').value,
            telefone_prop: document.getElementById('editar-tel-prop').value,
            email_prop: document.getElementById('editar-email-prop').value
        };

        try {
            // 1. Atualiza Tabela Veículo
            const { error: errV } = await supabaseClient
                .from('veiculo')
                .update(dadosVeiculo)
                .eq('id_veiculo', idVeiculo);

            if (errV) throw errV;

            // 2. Atualiza Tabela Proprietário
            const { error: errP } = await supabaseClient
                .from('propietario_veiculo')
                .update(dadosProp)
                .eq('id_veiculo', idVeiculo);

            if (errP) throw errP;

            mostrarAlerta('Dados atualizados com sucesso!', 'success');
            fecharModais();
            buscarVeiculos(); // Recarrega a lista para refletir as mudanças

        } catch (error) {
            console.error('Erro ao atualizar:', error.message);
            mostrarAlerta('Erro ao salvar alterações.', 'error');
        }
    });
}

// Filtro simples por placa ou modelo
function filtrarVeiculos() {
    const termo = document.getElementById('pesquisa-veiculo').value.toLowerCase();
    const cargaMin = parseFloat(document.getElementById('filtro-carga').value) || 0;
    const anoBusca = parseInt(document.getElementById('filtro-ano').value) || 0;
    const dataBusca = document.getElementById('filtro-data-revisao').value;
    const tiposSelecionados = Array.from(document.querySelectorAll('.filtro-tipo:checked')).map(cb => cb.value);

    const filtrados = todosVeiculos.filter(v => {
        const prop = v.propietario_veiculo && v.propietario_veiculo.length > 0 ? v.propietario_veiculo[0] : null;
        
        // Pesquisa por Placa ou Proprietário
        const matchPesquisa = v.placa.toLowerCase().includes(termo) || 
                             (prop && prop.nome_prop.toLowerCase().includes(termo));

        // Filtro de Tipo
        const matchTipo = tiposSelecionados.length === 0 || tiposSelecionados.includes(v.tipo_veiculo);

        // Filtro de Carga (Converte string "1000kg" para número se necessário)
        const valorCarga = parseFloat(v.cargaMax) || 0;
        const matchCarga = valorCarga >= cargaMin;

        // Filtro de Ano
        const matchAno = anoBusca === 0 || v.ano === anoBusca;

        // Filtro de Data de Manutenção (Mostra revisões feitas APÓS a data selecionada)
        const matchData = !dataBusca || (v.dtUltimaRevisao && v.dtUltimaRevisao >= dataBusca);

        return matchPesquisa && matchTipo && matchCarga && matchAno && matchData;
    });

    renderizarCardsVeiculos(filtrados);
}


// EXCLUSÃO 
window.abrirConfirmacaoExclusao = function() {
    const placa = document.getElementById('editar-placa').value;
    document.getElementById('placa-exclusao-titulo').innerText = placa;
    
    // Esconde o modal de edição mas mantém o overlay ativo
    document.getElementById('modal-editar-veiculo').classList.remove('mostrar-modal');
    document.getElementById('modal-confirmar-exclusao').classList.add('mostrar-modal');
};

window.fecharConfirmacao = function() {
    document.getElementById('modal-confirmar-exclusao').classList.remove('mostrar-modal');
    document.getElementById('modal-editar-veiculo').classList.add('mostrar-modal');
};