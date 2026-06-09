const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let todasManutencoes = [];

document.addEventListener('DOMContentLoaded', () => {
    buscarManutencoes();
    
    // Listeners para filtros
    document.getElementById('pesquisa-geral').addEventListener('input', aplicarFiltros);
    document.getElementById('filtro-tipo-servico').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-data-especifica').addEventListener('change', aplicarFiltros);
    document.getElementById('ordenacao-manutencao').addEventListener('change', aplicarFiltros);
});

document.addEventListener('DOMContentLoaded', () => {
    const btnConfirmarDelete = document.getElementById('btn-confirmar-delete');
    if (btnConfirmarDelete) {
        btnConfirmarDelete.addEventListener('click', async () => {
            const id = document.getElementById('editar-id').value;

            try {
                const { error } = await supabaseClient
                    .from('manutencao')
                    .delete()
                    .eq('id_manutencao', id);

                if (error) throw error;

                mostarAlerta('Manutenção excluída com sucesso!', 'success');
                fecharModais();
                buscarManutencoes(); // Recarrega a tabela

            } catch (err) {
                console.error('Erro ao excluir:', err.message);
                mostarAlerta('Erro ao excluir o registro.', 'error');
            }
        });
    }
});

async function buscarManutencoes() {
    try {
        const { data, error } = await supabaseClient
            .from('manutencao')
            .select(`*, veiculo (modelo)`);

        if (error) throw error;
        todasManutencoes = data; 
        aplicarFiltros(); // Renderiza pela primeira vez aplicando a ordenação padrão

    } catch (error) {
        console.error('Erro ao buscar manutenções:', error);
    }
}

function renderizarTabela(lista) {
    const container = document.getElementById('container-cards'); 
    if (!container) return;

    if (lista.length === 0) {
        container.innerHTML = '<p style="padding: 20px;">Nenhuma manutenção encontrada.</p>';
        return;
    }

    let html = `
        <div class="tabela-container">
            <table class="tabela-dados">
                <thead>
                    <tr>
                        <th>Placa</th>
                        <th>Veículo</th>
                        <th>Tipo</th>
                        <th>Serviço</th>
                        <th>Data</th>
                        <th>Local</th>
                        <th>Custo</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;

    lista.forEach(m => {
        const dataFormatada = new Date(m.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const custoFormatado = m.custo ? m.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
        
        // Normaliza o status para usar como classe CSS (remove acentos e espaços)
        const classeStatus = m.status.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '-');

        html += `
            <tr>
                <td>${m.placa || '---'}</td>
                <td>${m.veiculo?.modelo || '---'}</td>
                <td>${m.tipo}</td>
                <td>${m.servico}</td>
                <td>${dataFormatada}</td>
                <td>${m.local}</td>
                <td>${custoFormatado}</td>
                <td><span class="badge ${classeStatus}">${m.status}</span></td>
                <td class="acoes-icones">
                    <button onclick="abrirEdicao('${m.id_manutencao}')" class="action-btn btn-edit">
                        Editar
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
    
    const infoPag = document.getElementById('info-paginacao');
    if(infoPag) infoPag.innerText = `Exibindo ${lista.length} registro(s)`;
}


function aplicarFiltros() {
    const termoBusca = document.getElementById('pesquisa-geral').value.toLowerCase();
    const tipoFiltro = document.getElementById('filtro-tipo-servico').value;
    const dataFiltro = document.getElementById('filtro-data-especifica').value;
    const ordenacao = document.getElementById('ordenacao-manutencao').value;

    let filtrados = todasManutencoes.filter(m => {
        // Busca Geral (Placa, Modelo, Serviço ou Local)
        const matchTexto = 
            (m.placa?.toLowerCase().includes(termoBusca)) ||
            (m.veiculo?.modelo?.toLowerCase().includes(termoBusca)) ||
            (m.servico?.toLowerCase().includes(termoBusca)) ||
            (m.local?.toLowerCase().includes(termoBusca));

        // Filtro por Tipo
        const matchTipo = tipoFiltro === "" || m.tipo === tipoFiltro;

        // Filtro por Data
        const matchData = dataFiltro === "" || m.data === dataFiltro;

        return matchTexto && matchTipo && matchData;
    });

    // Lógica de Ordenação
    filtrados.sort((a, b) => {
        switch (ordenacao) {
            case 'data-desc': return new Date(b.data) - new Date(a.data);
            case 'data-asc':  return new Date(a.data) - new Date(b.data);
            case 'valor-desc': return b.custo - a.custo;
            case 'valor-asc':  return a.custo - b.custo;
            case 'status': return a.status.localeCompare(b.status);
            default: return 0;
        }
    });

    renderizarTabela(filtrados);
}


// Abrir o modal e carregar os dados existentes
window.abrirEdicao = function(id) {
    const manutencao = todasManutencoes.find(m => m.id_manutencao == id);
    
    if (manutencao) {
        document.getElementById('editar-id').value = manutencao.id_manutencao;
        document.getElementById('editar-placa').value = manutencao.placa || "";
        document.getElementById('editar-tipo').value = manutencao.tipo;
        document.getElementById('editar-servico').value = manutencao.servico;
        document.getElementById('editar-data').value = manutencao.data;
        document.getElementById('editar-local').value = manutencao.local;
        document.getElementById('editar-custo').value = manutencao.custo;
        document.getElementById('editar-status').value = manutencao.status;

        document.getElementById('modal-editar').classList.add('mostrar-modal');
        
        const modal = document.getElementById('modal-editar');
        const overlay = document.getElementById('modal-overlay');

        if (modal) modal.classList.add('mostrar-modal');
        if (overlay) overlay.classList.add('active');
    }
};

// Função para fechar os modais
window.fecharModais = function() {
    const modalEditar = document.getElementById('modal-editar');
    const modalDelete = document.getElementById('modal-confirmar-exclusao');
    const overlay = document.getElementById('modal-overlay');

    if (modalEditar) modalEditar.classList.remove('mostrar-modal');
    if (modalDelete) modalDelete.classList.remove('mostrar-modal');
    if (overlay) overlay.classList.remove('mostrar-modal', 'active');
};

// Evento de Submit para salvar a edição
const formEditar = document.getElementById('form-editar-manutencao');
if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();

        const idManutencao = document.getElementById('editar-id').value;
        const dadosAtualizados = {
            tipo: document.getElementById('editar-tipo').value,
            servico: document.getElementById('editar-servico').value,
            data: document.getElementById('editar-data').value,
            local: document.getElementById('editar-local').value,
            custo: parseFloat(document.getElementById('editar-custo').value) || 0,
            status: document.getElementById('editar-status').value
        };

        try {
            const { error } = await supabaseClient
                .from('manutencao')
                .update(dadosAtualizados)
                .eq('id_manutencao', idManutencao);

            if (error) throw error;

            mostarAlerta('Manutenção atualizada com sucesso!', 'success');
            fecharModais();
            buscarManutencoes(); // Recarrega a tabela

        } catch (err) {
            console.error('Erro ao atualizar:', err.message);
            mostarAlerta('Erro ao salvar alterações.', 'error');
        }
    });
}

// EXCLUSÃO
window.abrirConfirmacaoExclusao = function() {
    // Esconde o modal de edição
    document.getElementById('modal-editar').classList.remove('mostrar-modal');
    
    // Mostra o modal de exclusão (o overlay já está com mostrar-modal, então ele fica)
    document.getElementById('modal-confirmar-exclusao').classList.add('mostrar-modal');
};