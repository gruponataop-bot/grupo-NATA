const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let todasRotas = [];

document.addEventListener('DOMContentLoaded', async () => {
    await carregarFiltrosIniciais(); 
    buscarRotasDoBanco();

    document.getElementById('pesquisa-geral').addEventListener('input', filtrarRotas);
    document.getElementById('filtro-tipo').addEventListener('change', filtrarRotas);
    document.getElementById('filtro-veiculo').addEventListener('change', filtrarRotas);
    document.getElementById('filtro-motorista').addEventListener('change', filtrarRotas);
    document.getElementById('filtro-status').addEventListener('change', filtrarRotas);
});

async function carregarFiltrosIniciais() {
    try {
        const { data: veiculos } = await supabaseClient.from('veiculo').select('id_veiculo, placa');
        const selectV = document.getElementById('filtro-veiculo');
        veiculos?.forEach(v => selectV.innerHTML += `<option value="${v.id_veiculo}">${v.placa}</option>`);

        const { data: motoristas } = await supabaseClient.from('motorista').select('id_motorista, nome_motorista');
        const selectM = document.getElementById('filtro-motorista');
        motoristas?.forEach(m => selectM.innerHTML += `<option value="${m.id_motorista}">${m.nome_motorista}</option>`);

    } catch (err) {
        console.error("Erro ao carregar opções de filtro:", err);
    }
}

async function buscarRotasDoBanco() {
    try {
        const { data, error } = await supabaseClient
            .from('rota')
            .select(`
                *,
                veiculo (placa, modelo),
                motorista:id_motorista (nome_motorista),
                ponto_parada (
                    id_ponto,
                    id_empresa,
                    tipo_parada,
                    status_parada,
                    ponto (nome_ponto, rua, bairro),
                    empresa_parceira (nome_empresa)
                ),
                rota_estoque (
                    quantidade,
                    estoque (nome, unidade)
                )
            `);

        if (error) throw error;

        todasRotas = data;
        renderizarCardsRotas(data);
    } catch (error) {
        console.error('Erro ao buscar rotas:', error.message);
    }
}

function renderizarCardsRotas(lista) {
    const container = document.getElementById('container-rotas');
    if (!container) return;
    container.innerHTML = "";

    const obterNomeLocal = (parada) => {
        if (parada.ponto) return parada.ponto.nome_ponto;
        if (parada.empresa_parceira) return parada.empresa_parceira.nome_empresa;
        return 'Local não encontrado';
    };

    lista.forEach(rota => {
        const coletas = rota.ponto_parada.filter(p => p.tipo_parada === 'Coleta' || p.tipo_parada === 'Misto');
        const entregas = rota.ponto_parada.filter(p => p.tipo_parada === 'Entrega' || p.tipo_parada === 'Misto');
        const cargas = rota.rota_estoque || []; 

        const cardHTML = `
            <div class="card-rota">
                <div class="card-rota-capa">
                    <h2 class="titulo">${rota.noma_rota}</h2>
                    <div class="tag-tipo-rota">${rota.tipo_rota || 'Misto'}</div>
                    <div class="footer-capa">
                        <i class="ph ph-truck"></i>
                        <span>${rota.veiculo?.placa || 'Veículo N/D'}</span>
                    </div>
                </div>

                <div class="card-rota-detalhes">
                    <div class="detalhes-header">
                        <h3>${rota.noma_rota}</h3>
                        <span class="status-badge-tag">${rota.status_rota == 1 ? 'Registrada' : 'Em Rota'}</span>
                    </div>
                    
                    <div class="info-recursos">
                        <p><strong>Motorista:</strong> ${rota.motorista?.nome_motorista || 'N/D'}</p>
                        <p><strong>Veículo:</strong> ${rota.veiculo?.modelo || 'N/D'} (${rota.veiculo?.placa || ''})</p>
                    </div>

                    <div class="listas-pontos">
                        <div class="coluna-pontos">
                            <h4><i class="ph ph-download-simple"></i> Coletas</h4>
                            <div class="container-tags">
                                ${coletas.length > 0 
                                    ? coletas.map(c => `<span class="tag-local">${obterNomeLocal(c)}</span>`).join('')
                                    : '<span class="tag-vazia">Nenhuma parada</span>'}
                            </div>
                        </div>
                        <div class="coluna-pontos">
                            <h4><i class="ph ph-upload-simple"></i> Entregas</h4>
                            <div class="container-tags">
                                ${entregas.length > 0 
                                    ? entregas.map(e => `<span class="tag-local">${obterNomeLocal(e)}</span>`).join('')
                                    : '<span class="tag-vazia">Nenhuma parada</span>'}
                            </div>
                        </div>
                    </div>

                    <div class="carga-veiculo">
                        <h4><i class="ph ph-package"></i> Carga do Veículo</h4>
                        <div class="container-tags">
                            ${cargas.length > 0 
                                ? cargas.map(c => `<span class="tag-carga">${c.quantidade} ${c.estoque?.unidade || 'un'} - ${c.estoque?.nome || 'Item'}</span>`).join('')
                                : '<span class="tag-vazia">Sem itens de estoque cadastrados.</span>'}
                        </div>
                    </div>

                    <div class="acoes-card-rota">
                        <button onclick="window.location.href='editarrota.html?id=${rota.id_rota}'" class="btn-editar">
                            <i class="ph ph-pencil"></i> Editar
                        </button>
                        <button onclick="window.location.href='rastreamento.html?placa=${rota.veiculo?.placa || ''}&id_rota=${rota.id_rota}'" class="btn-iniciar-rota">
                            <i class="ph ph-play"></i> Iniciar Rota
                        </button>
                    </div>
                </div>
            </div>`;
        container.innerHTML += cardHTML;
    });

    document.getElementById('info-paginacao').innerText = `Exibindo ${lista.length} rota(s)`;
}

function filtrarRotas() {
    const termo = document.getElementById('pesquisa-geral').value.toLowerCase();
    const tipo = document.getElementById('filtro-tipo').value;
    const veiculoId = document.getElementById('filtro-veiculo').value;
    const motoristaId = document.getElementById('filtro-motorista').value;
    const status = document.getElementById('filtro-status').value;

    const filtradas = todasRotas.filter(r => {
        const matchNomeRota = r.noma_rota.toLowerCase().includes(termo);
        const matchPonto = r.ponto_parada.some(p => {
            const nomeStr = p.ponto?.nome_ponto || p.empresa_parceira?.nome_empresa || '';
            return nomeStr.toLowerCase().includes(termo);
        });
        const matchBuscaGeral = matchNomeRota || matchPonto;

        const matchTipo = tipo === "" || r.tipo_rota === tipo;
        const matchVeiculo = veiculoId === "" || String(r.id_veiculo) === veiculoId;
        const matchMotorista = motoristaId === "" || String(r.id_motorista) === motoristaId;
        const matchStatus = status === "" || String(r.status_rota) === status;

        return matchBuscaGeral && matchTipo && matchVeiculo && matchMotorista && matchStatus;
    });

    renderizarCardsRotas(filtradas);
}