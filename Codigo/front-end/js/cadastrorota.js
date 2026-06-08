const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let paradasDaRota = [];
let cargaDaRota = []; 
let idRotaAtual = null;

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosIniciais();
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
    
    const existente = cargaDaRota.find(c => c.id_estoque === idItem);
    const qtdTotalPrevista = existente ? existente.quantidade + qtd : qtd;

    if (qtdTotalPrevista > qtdMax) {
        if (typeof mostrarAlerta === 'function') mostrarAlerta(`A quantidade excede o estoque disponível (${qtdMax}).`, "error");
        return;
    }

    if (existente) {
        existente.quantidade += qtd;
    } else {
        cargaDaRota.push({ 
            id_estoque: idItem, 
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
    
    if(!corpo) return;
    
    if (cargaDaRota.length === 0) {
        corpo.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--prof-muted);">Nenhum item adicionado à carga.</td></tr>`;
        if (elTotal) elTotal.textContent = "R$ 0,00";
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
    
    if (elTotal) elTotal.textContent = somaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

window.removerItemCarga = (index) => {
    cargaDaRota.splice(index, 1);
    renderizarTabelaCarga();
};

function configurarFormulario() {
    const form = document.getElementById('form-nova-rota');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (paradasDaRota.length === 0) {
            if (typeof mostrarAlerta === 'function') mostrarAlerta("Adicione pelo menos um ponto de parada!", "error");
            return;
        }

        const temColeta = paradasDaRota.some(p => p.tipo === 'Coleta' || p.tipo === 'Misto');
        const temEntrega = paradasDaRota.some(p => p.tipo === 'Entrega' || p.tipo === 'Misto');
        let tipoCalculado = (temColeta && temEntrega) ? "Coleta / Entrega" : (temColeta ? "Coleta" : "Entrega");

        const formData = new FormData(e.target);
        const novaRota = {
            noma_rota: formData.get('nome_rota'), 
            id_veiculo: parseInt(formData.get('id_veiculo')) || null,
            id_motorista: parseInt(formData.get('id_motorista')) || null, 
            status_rota: 1, 
            tipo_rota: tipoCalculado,
            carga_total: cargaDaRota.reduce((t, item) => t + item.quantidade, 0)
        };

        try {
            const { data: rotaCriada, error: errRota } = await _supabase.from('rota').insert([novaRota]).select().single();
            if (errRota) throw errRota;

            const paradasParaBanco = paradasDaRota.map((p, i) => ({
                id_rota: rotaCriada.id_rota,
                id_ponto: p.id_ponto,
                id_empresa: p.id_empresa, 
                ordem_parada: i + 1,
                status_parada: 'Pendente',
                tipo_parada: p.tipo
            }));

            const { error: errParadas } = await _supabase.from('ponto_parada').insert(paradasParaBanco);
            if (errParadas) throw errParadas;

            if (cargaDaRota.length > 0) {
                const cargaParaBanco = cargaDaRota.map(c => ({
                    id_rota: rotaCriada.id_rota,
                    id_estoque: c.id_estoque,
                    quantidade: c.quantidade
                }));
                const { error: errCarga } = await _supabase.from('rota_estoque').insert(cargaParaBanco);
                if (errCarga) console.error("Erro carga:", errCarga);
            }

            if (typeof mostrarAlerta === 'function') {
                mostrarAlerta("Rota cadastrada com sucesso!", "success");
                setTimeout(() => window.location.href = "rotas.html", 1500);
            }
        } catch (error) {
            if (typeof mostrarAlerta === 'function') mostrarAlerta("Erro ao cadastrar: " + error.message, "error");
        }
    });
}