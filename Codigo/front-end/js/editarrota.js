const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let paradasDaRota = [];
let cargaDaRota = []; 
let idRotaAtual = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    idRotaAtual = urlParams.get('id');

    if (!idRotaAtual) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta("ID da rota não encontrado!", "error");
        setTimeout(() => { window.location.href = 'rotas.html'; }, 1500);
        return;
    }

    await carregarDadosIniciais();
    await buscarDadosDaRota();
    configurarFormulario();
});

async function carregarDadosIniciais() {
    const { data: veiculos } = await _supabase.from('veiculo').select('id_veiculo, placa, modelo');
    const selectV = document.getElementById('select-veiculo');
    if(selectV) {
        selectV.innerHTML = '<option value="">Selecione o Veículo</option>';
        veiculos?.forEach(v => selectV.innerHTML += `<option value="${v.id_veiculo}">${v.placa} - ${v.modelo}</option>`);
    }

    const { data: motoristas } = await _supabase.from('motorista').select('id_motorista, nome_motorista');
    const selectM = document.getElementById('select-motorista');
    if(selectM) {
        selectM.innerHTML = '<option value="">Selecione o Motorista</option>';
        motoristas?.forEach(m => selectM.innerHTML += `<option value="${m.id_motorista}">${m.nome_motorista}</option>`);
    }

    const { data: pontos } = await _supabase.from('ponto').select('id_ponto, nome_ponto, isPontoColeta, isPontoEntrega');
    const { data: parceiros } = await _supabase.from('empresa_parceira').select('id_empresa, nome_empresa, isPontoColeta, isPontoEntrega');
    const selectP = document.getElementById('select-ponto-base');
    if(selectP) {
        selectP.innerHTML = '<option value="">Selecione um local...</option>';
        pontos?.forEach(p => {
            const tipo = p.isPontoColeta && p.isPontoEntrega ? 'Misto' : (p.isPontoColeta ? 'Coleta' : 'Entrega');
            selectP.innerHTML += `<option value="PONTO-${p.id_ponto}" data-nome="${p.nome_ponto}" data-tipo="${tipo}">${p.nome_ponto} (${tipo})</option>`;
        });
        parceiros?.forEach(parc => {
            if (parc.isPontoColeta) selectP.innerHTML += `<option value="EMPRESA-${parc.id_empresa}" data-nome="${parc.nome_empresa}" data-tipo="Coleta">${parc.nome_empresa} (Parceiro - Coleta)</option>`;
            if (parc.isPontoEntrega) selectP.innerHTML += `<option value="EMPRESA-${parc.id_empresa}" data-nome="${parc.nome_empresa}" data-tipo="Entrega">${parc.nome_empresa} (Parceiro - Entrega)</option>`;
        });
    }

    // Puxando o valor_unitario
    const selectE = document.getElementById('select-estoque');
    try {
        const { data: estoque, error: erroEstoque } = await _supabase.from('estoque')
            .select('id, nome, quantidade, unidade, categoria, valor_unitario')
            .gt('quantidade', 0);
        
        if (erroEstoque) throw erroEstoque;

        if(selectE) {
            selectE.innerHTML = '<option value="">Selecione um item do estoque...</option>';
            estoque?.forEach(item => {
                const valorFormatado = (item.valor_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                selectE.innerHTML += `<option value="${item.id}" data-nome="${item.nome}" data-unidade="${item.unidade || 'un'}" data-max="${item.quantidade}" data-valor="${item.valor_unitario || 0}">${item.nome} (Disp: ${item.quantidade} ${item.unidade || 'un'} | ${valorFormatado})</option>`;
            });
        }
    } catch (err) {
        console.error("ERRO NO SUPABASE:", err.message);
        if (selectE) selectE.innerHTML = '<option value="">Erro ao carregar estoque...</option>';
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta("Falha ao carregar estoque. Verifique se a coluna 'valor_unitario' existe no Supabase.", "error");
        }
    }
}

async function buscarDadosDaRota() {
    try {
        const { data: rota, error: errRota } = await _supabase.from('rota').select('*').eq('id_rota', idRotaAtual).single();
        if (errRota) throw errRota;

        document.getElementById('edit-nome-rota').value = rota.noma_rota;
        document.getElementById('edit-tipo-rota').value = rota.tipo_rota;
        document.getElementById('select-veiculo').value = rota.id_veiculo || "";
        document.getElementById('select-motorista').value = rota.id_motorista || "";

        const { data: paradas } = await _supabase
            .from('ponto_parada')
            .select('*, ponto(nome_ponto), empresa_parceira(nome_empresa)')
            .eq('id_rota', idRotaAtual);

        if (paradas) {
            paradasDaRota = paradas.sort((a, b) => a.ordem_parada - b.ordem_parada).map(p => {
                let nomeExibicao = "Desconhecido";
                if (p.ponto) nomeExibicao = p.ponto.nome_ponto;
                else if (p.empresa_parceira) nomeExibicao = p.empresa_parceira.nome_empresa;
                
                return { 
                    id_ponto: p.id_ponto, 
                    id_empresa: p.id_empresa, 
                    nome: nomeExibicao, 
                    tipo: p.tipo_parada, 
                    ordem: p.ordem_parada 
                };
            });
        }
        renderizarTabelaParadas();

        // ATUALIZADO: Buscar também o valor_unitario da relação com a tabela estoque
        const { data: cargas } = await _supabase.from('rota_estoque').select('*, estoque(nome, unidade, valor_unitario)').eq('id_rota', idRotaAtual);
        if (cargas) {
            cargaDaRota = cargas.map(re => ({
                id_estoque: re.id_estoque,
                nome: re.estoque?.nome || 'Item indisponível',
                unidade: re.estoque?.unidade || 'un',
                valor_unitario: re.estoque?.valor_unitario || 0,
                quantidade: re.quantidade
            }));
        }
        renderizarTabelaCarga();

    } catch (error) {
        console.error(error);
        if (typeof mostrarAlerta === 'function') mostrarAlerta("Erro ao carregar dados da rota.", "error");
    }
}

window.adicionarPontoNaLista = () => {
    const select = document.getElementById('select-ponto-base');
    const val = select.value;
    
    if (!val) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta("Selecione um local antes de inserir na rota.", "warning");
        return;
    }

    const isEmpresa = val.startsWith('EMPRESA-');
    const rawId = parseInt(val.split('-')[1]);
    const option = select.options[select.selectedIndex];

    paradasDaRota.push({
        id_ponto: isEmpresa ? null : rawId,
        id_empresa: isEmpresa ? rawId : null,
        nome: option.getAttribute('data-nome'),
        tipo: option.getAttribute('data-tipo'),
        ordem: paradasDaRota.length + 1
    });
    renderizarTabelaParadas();
};

function renderizarTabelaParadas() {
    const corpo = document.getElementById('lista-paradas-corpo');
    if (!corpo) return;
    corpo.innerHTML = paradasDaRota.map((p, index) => `
        <tr>
            <td>${index + 1}º</td>
            <td>${p.nome}</td>
            <td><span class="status-tag ${p.tipo?.toLowerCase()}">${p.tipo}</span></td>
            <td>
                <div style="display: flex; gap: 4px; align-items: center;">
                    <button type="button" onclick="moverParadaCima(${index})" class="btn-tabela-editar" style="color: var(--prof-text); padding: 4px; font-size: 16px;" title="Mover para cima" ${index === 0 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                        <i class="ph ph-caret-up"></i>
                    </button>
                    <button type="button" onclick="moverParadaBaixo(${index})" class="btn-tabela-editar" style="color: var(--prof-text); padding: 4px; font-size: 16px;" title="Mover para baixo" ${index === paradasDaRota.length - 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                        <i class="ph ph-caret-down"></i>
                    </button>
                    <button type="button" onclick="removerParada(${index})" class="btn-tabela-editar" style="color: red; padding: 4px; font-size: 16px;" title="Remover">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.removerParada = (index) => {
    paradasDaRota.splice(index, 1);
    renderizarTabelaParadas();
};

window.moverParadaCima = (index) => {
    if (index > 0) {
        const temp = paradasDaRota[index];
        paradasDaRota[index] = paradasDaRota[index - 1];
        paradasDaRota[index - 1] = temp;
        renderizarTabelaParadas();
    }
};

window.moverParadaBaixo = (index) => {
    if (index < paradasDaRota.length - 1) {
        const temp = paradasDaRota[index];
        paradasDaRota[index] = paradasDaRota[index + 1];
        paradasDaRota[index + 1] = temp;
        renderizarTabelaParadas();
    }
};

window.adicionarItemCarga = () => {
    const select = document.getElementById('select-estoque');
    const inputQtd = document.getElementById('input-qtd-estoque');
    const idItem = select.value;
    const qtd = parseInt(inputQtd.value);

    if (!idItem || isNaN(qtd) || qtd <= 0) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta("Selecione um item e informe uma quantidade válida maior que zero.", "warning");
        return;
    }

    const option = select.options[select.selectedIndex];
    const qtdMax = parseInt(option.getAttribute('data-max'));
    const valorUnitario = parseFloat(option.getAttribute('data-valor')) || 0;
    
    const existente = cargaDaRota.find(c => c.id_estoque == idItem);
    const qtdTotalPrevista = existente ? existente.quantidade + qtd : qtd;

    if (qtdTotalPrevista > qtdMax) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta(`A quantidade excede o estoque (${qtdMax}).`, "error");
        return;
    }

    if (existente) {
        existente.quantidade += qtd;
    } else {
        cargaDaRota.push({ 
            id_estoque: parseInt(idItem), 
            nome: option.getAttribute('data-nome'), 
            unidade: option.getAttribute('data-unidade'), 
            valor_unitario: valorUnitario,
            quantidade: qtd 
        });
    }

    select.value = "";
    inputQtd.value = "";
    renderizarTabelaCarga();
};

function renderizarTabelaCarga() {
    const corpo = document.getElementById('lista-carga-corpo');
    const elTotal = document.getElementById('valor-total-carga');
    
    if (!corpo) return;
    
    if (cargaDaRota.length === 0) {
        corpo.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--prof-muted);">Nenhum item adicionado à carga.</td></tr>`;
        if(elTotal) elTotal.textContent = "R$ 0,00";
        return;
    }
    
    let somaTotal = 0;
    
    corpo.innerHTML = cargaDaRota.map((c, index) => {
        const subtotal = c.quantidade * (c.valor_unitario || 0);
        somaTotal += subtotal;
        
        return `
        <tr>
            <td><strong>${c.nome}</strong></td>
            <td>${c.quantidade} ${c.unidade}</td>
            <td>${(c.valor_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>
                <button type="button" onclick="removerItemCarga(${index})" class="btn-tabela-editar" style="color: red; padding: 4px;">
                    <i class="ph ph-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
    
    if(elTotal) elTotal.textContent = somaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

window.removerItemCarga = (index) => {
    cargaDaRota.splice(index, 1);
    renderizarTabelaCarga();
};

function configurarFormulario() {
    document.getElementById('form-editar-rota').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (paradasDaRota.length === 0) {
            if (typeof mostrarAlerta === 'function') mostrarAlerta("Adicione pelo menos um ponto de parada!", "error");
            return;
        }

        const temColeta = paradasDaRota.some(p => p.tipo === 'Coleta' || p.tipo === 'Misto');
        const temEntrega = paradasDaRota.some(p => p.tipo === 'Entrega' || p.tipo === 'Misto');
        let tipoCalculado = (temColeta && temEntrega) ? "Coleta / Entrega" : (temColeta ? "Coleta" : "Entrega");

        const formData = new FormData(e.target);
        const dadosAtualizados = {
            noma_rota: formData.get('nome_rota'),
            id_veiculo: formData.get('id_veiculo') ? parseInt(formData.get('id_veiculo')) : null,
            id_motorista: formData.get('id_motorista') ? parseInt(formData.get('id_motorista')) : null,
            tipo_rota: tipoCalculado,
            carga_total: cargaDaRota.reduce((t, item) => t + item.quantidade, 0)
        };

        try {
            await _supabase.from('rota').update(dadosAtualizados).eq('id_rota', idRotaAtual);

            await _supabase.from('ponto_parada').delete().eq('id_rota', idRotaAtual);
            const paradasParaBanco = paradasDaRota.map((p, i) => ({
                id_rota: idRotaAtual,
                id_ponto: p.id_ponto,
                id_empresa: p.id_empresa,
                ordem_parada: i + 1,
                status_parada: 'Pendente',
                tipo_parada: p.tipo
            }));
            
            const { error: errParadas } = await _supabase.from('ponto_parada').insert(paradasParaBanco);
            if (errParadas) throw errParadas;

            await _supabase.from('rota_estoque').delete().eq('id_rota', idRotaAtual);
            if (cargaDaRota.length > 0) {
                const cargaParaBanco = cargaDaRota.map(c => ({
                    id_rota: idRotaAtual,
                    id_estoque: c.id_estoque,
                    quantidade: c.quantidade
                }));
                await _supabase.from('rota_estoque').insert(cargaParaBanco);
            }

            if (typeof mostrarAlerta === 'function') {
                mostrarAlerta("Rota atualizada com sucesso!", "success");
                setTimeout(() => { window.location.href = "rotas.html"; }, 1500);
            }
        } catch (error) {
            console.error("ERRO COMPLETO:", error);
            if (typeof mostrarAlerta === 'function') mostrarAlerta("Erro ao atualizar o banco de dados: " + error.message, "error");
        }
    });
}

window.confirmarRemoverRota = async () => {
    if (confirm("Tem certeza que deseja excluir este plano de rota permanentemente?")) {
        try {
            await _supabase.from('rota_estoque').delete().eq('id_rota', idRotaAtual);
            await _supabase.from('ponto_parada').delete().eq('id_rota', idRotaAtual);
            
            const { error } = await _supabase.from('rota').delete().eq('id_rota', idRotaAtual);
            if (error) throw error;
            
            if (typeof mostrarAlerta === 'function') {
                mostrarAlerta("Rota removida com sucesso!", "success");
                setTimeout(() => { window.location.href = 'rotas.html'; }, 1500);
            }
        } catch (error) {
            if (typeof mostrarAlerta === 'function') mostrarAlerta("Erro ao remover: " + error.message, "error");
        }
    }
};