const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let estoqueCarregado = [];
let itemParaDeletar = null;

document.addEventListener('DOMContentLoaded', () => {
    // Inicialização baseada na página atual
    if (document.getElementById('tabela-estoque-body')) {
        buscarEstoqueDoBanco();

        // Eventos para filtragem em tempo real (Igual ao modelo de parceiros)
        document.getElementById('pesquisa-item').addEventListener('input', filtrarEstoque);

        // Se houver filtro por categoria na sua tela, adicione aqui:
        const filtroCat = document.getElementById('filtro-categoria');
        if (filtroCat) filtroCat.addEventListener('change', filtrarEstoque);
    }

    // Ativa validações de segurança se houver campos numéricos
    validarInputsNumericos();
});

// --- BUSCA E RENDERIZAÇÃO ---

async function buscarEstoqueDoBanco() {
    const { data, error } = await supabaseClient
        .from('estoque')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro ao buscar:', error.message);
        renderizarTabela([]);
        return;
    }

    estoqueCarregado = data;
    renderizarTabela(data);

    const infoPaginacao = document.getElementById('info-paginacao');
    if (infoPaginacao) {
        infoPaginacao.innerText = `Exibindo ${data.length} item(ns) no total`;
    }
}

function renderizarTabela(lista) {
    const tbody = document.getElementById('tabela-estoque-body');
    if (!tbody) return;

    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px;">Nenhum item encontrado no inventário.</td></tr>`;
        return;
    }

    lista.forEach(item => {
        // Lógica de Status Automático baseada no Estoque Mínimo
        const statusBadge = calcularStatus(item.quantidade, item.estoque_minimo || 5);

        // Formatação amigável da validade
        const dataValidade = item.validade ? new Date(item.validade).toLocaleDateString('pt-BR') : '---';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.nome}</strong></td>
            <td><span class="tag-categoria">${item.categoria}</span></td>
            <td>${item.quantidade}</td>
            <td>${item.unidade || 'un'}</td>
            <td>${(item.valor_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${dataValidade}</td>
            <td>${statusBadge}</td>
            <td class="acoes-icones">
                <i class="action-btn" onclick="abrirVisualizar(${item.id})" title="Visualizar">Ver</i>
                <i class="action-btn" onclick="abrirEditar(${item.id})" title="Editar">Editar</i>
                <i class="action-btn action-btn-danger" style="color: #dc3545;" onclick="confirmarExclusao(${item.id}, '${item.nome}')" title="Excluir">Excluir</i>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- LÓGICA DE NEGÓCIO ---

function calcularStatus(qtd, min) {
    if (qtd <= 0) return '<span class="badge badge--suspenso">Esgotado</span>';
    if (qtd <= min) return '<span class="badge badge--critico">Crítico</span>'; 
    return '<span class="badge badge--ativo">Disponível</span>';
}

function filtrarEstoque() {
    const termo = document.getElementById('pesquisa-item').value.toLowerCase();

    // Se você tiver um select de categoria, pegue o valor aqui
    const filtroCat = document.getElementById('filtro-categoria')?.value || "todos";

    const filtrados = estoqueCarregado.filter(item => {
        const matchNome = item.nome.toLowerCase().includes(termo);
        const matchCat = (filtroCat === "todos" || item.categoria === filtroCat);
        return matchNome && matchCat;
    });

    renderizarTabela(filtrados);

    const infoPaginacao = document.getElementById('info-paginacao');
    if (infoPaginacao) {
        infoPaginacao.innerText = `Exibindo ${filtrados.length} de ${estoqueCarregado.length} item(ns)`;
    }
}

// --- CADASTRO E EDIÇÃO ---

async function cadastrarItemEstoque(event) {
    event.preventDefault();

    const novoItem = {
        nome: document.getElementById('nome-item').value,
        categoria: document.getElementById('categoria-item').value,
        quantidade: parseInt(document.getElementById('quantidade-item').value) || 0,
        valor_unitario: parseFloat(document.getElementById('valor-item').value) || 0,
        unidade: document.getElementById('unidade-item').value,
        validade: document.getElementById('validade-item').value || null,
        estoque_minimo: parseInt(document.getElementById('minimo-item').value) || 5,
        fornecedor: document.getElementById('origem-item').value,
        localizacao: document.getElementById('localizacao-item').value,
        observacao: document.getElementById('obs-item').value
    };

    try {
        const { error } = await supabaseClient.from('estoque').insert([novoItem]);
        if (error) throw error;

        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta("Item adicionado ao estoque com sucesso!", "success");
            setTimeout(() => { window.location.href = 'estoque.html'; }, 1500);
        } else {
            alert("Item adicionado ao estoque com sucesso!");
            window.location.href = 'estoque.html';
        }
        
    } catch (err) {
        console.error('Erro:', err.message);
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta("Erro ao salvar. Verifique se todos os campos obrigatórios estão preenchidos.", "error");
        } else {
            alert("Erro ao salvar. Verifique se todos os campos obrigatórios estão preenchidos.");
        }
    }
}

const formEditar = document.getElementById('form-editar-estoque');
if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;

        const dadosAtualizados = {
            nome: document.getElementById('edit-nome').value,
            categoria: document.getElementById('edit-categoria').value,
            quantidade: parseInt(document.getElementById('edit-quantidade').value),
            unidade: document.getElementById('edit-unidade').value,
            valor_unitario: parseFloat(document.getElementById('edit-valor').value) || 0, // NOVO CAMPO
            validade: document.getElementById('edit-validade').value || null,
            estoque_minimo: parseInt(document.getElementById('edit-minimo').value)
        };

        try {
            const { error } = await supabaseClient.from('estoque').update(dadosAtualizados).eq('id', id);
            if (error) throw error;

            if (typeof mostrarAlerta === 'function') mostrarAlerta('Dados atualizados com sucesso!', 'success');
            else alert('Dados atualizados com sucesso!');
            
            fecharModais();
            buscarEstoqueDoBanco();
        } catch (err) {
            if (typeof mostrarAlerta === 'function') mostrarAlerta('Não foi possível atualizar o item.', 'error');
            else alert('Não foi possível atualizar o item.');
        }
    });
}

// --- MODAIS ---

function abrirVisualizar(id) {
    const item = estoqueCarregado.find(i => i.id === id);
    if (!item) return;

    // Mapeamento de IDs para preencher o modal de visualização
    const campos = {
        'view-nome': item.nome,
        'view-categoria': item.categoria,
        'view-quantidade': `${item.quantidade} ${item.unidade || ''}`,
        'view-validade': item.validade ? new Date(item.validade).toLocaleDateString('pt-BR') : 'Não possui',
        'view-fornecedor': item.fornecedor || 'Não informado',
        'view-localizacao': item.localizacao || 'Geral',
        'view-valor': (item.valor_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    };

    for (let idCampo in campos) {
        const el = document.getElementById(idCampo);
        if (el) el.value = campos[idCampo];
    }

    document.getElementById('modal-visualizar').classList.add('mostrar-modal');
    document.getElementById('modal-overlay').classList.add('mostrar-modal');
}

function abrirEditar(id) {
    const item = estoqueCarregado.find(i => i.id === id);
    if (!item) return;

    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-nome').value = item.nome;
    document.getElementById('edit-categoria').value = item.categoria;
    document.getElementById('edit-quantidade').value = item.quantidade;
    document.getElementById('edit-unidade').value = item.unidade || '';
    document.getElementById('edit-valor').value = item.valor_unitario || '';
    document.getElementById('edit-validade').value = item.validade || '';
    document.getElementById('edit-minimo').value = item.estoque_minimo;

    document.getElementById('modal-editar').classList.add('mostrar-modal');
    document.getElementById('modal-overlay').classList.add('mostrar-modal');
}

function confirmarExclusao(id, nome) {
    itemParaDeletar = id;
    const displayNome = document.getElementById('config-nome-display');
    if (displayNome) displayNome.innerText = nome;

    document.getElementById('modal-config').classList.add('mostrar-modal');
    document.getElementById('modal-overlay').classList.add('mostrar-modal');
}

async function deletarItemEstoque() {
    if (!itemParaDeletar) return;

    try {
        const { error } = await supabaseClient.from('estoque').delete().eq('id', itemParaDeletar);
        if (error) throw error;

        fecharModais();
        buscarEstoqueDoBanco();
    } catch (err) {
        mostrarAlerta("Erro ao excluir item do banco de dados.");
    }
}

function fecharModais() {
    const seletores = [
        '#modal-visualizar',
        '#modal-editar',
        '#modal-config',
        '#modal-overlay',
        '.mostrar-modal'
    ];
    seletores.forEach(seletor => {
        const el = document.querySelector(seletor);
        if (el) el.classList.remove('mostrar-modal');
    });
}

// --- UTILITÁRIOS ---

function validarInputsNumericos() {
    // Garante que campos de número não aceitem valores negativos
    const ids = ['quantidade-item', 'minimo-item', 'edit-quantidade', 'edit-minimo'];
    ids.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', () => {
                if (parseInt(input.value) < 0) input.value = 0;
            });
        }
    });
}
