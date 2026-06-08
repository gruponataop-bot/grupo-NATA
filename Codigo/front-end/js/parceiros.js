const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let parceirosCarregados = [];

document.addEventListener('DOMContentLoaded', () => {
    window.currentView = 'tabela';

    if (typeof initViewSwitcher === 'function') {
        initViewSwitcher((viewSelecionada) => {
            window.currentView = viewSelecionada;
            renderizarConteudo(parceirosCarregados); 
        });
    }

    buscarParceirosDoBanco();

    // Listeners de filtro
    document.getElementById('pesquisa-nome').addEventListener('input', filtrarParceiros);
    document.getElementById('filtro-coleta').addEventListener('change', filtrarParceiros);
    document.getElementById('filtro-entrega').addEventListener('change', filtrarParceiros);
});

async function buscarParceirosDoBanco() {
    const { data, error } = await supabaseClient
        .from('empresa_parceira')
        .select('*');

    if (error) {
        console.error('Erro ao buscar:', error.message);
        renderizarConteudo([]); 
        return;
    }

    parceirosCarregados = data;
    renderizarConteudo(data);
    
    const infoPaginacao = document.getElementById('info-paginacao');
    if (infoPaginacao) {
        infoPaginacao.innerText = `Exibindo ${data.length} parceiro(s)`;
    }
}

function renderizarConteudo(lista) {
    const container = document.getElementById('container-central-parceiros');
    if (!container) return;

    if (window.currentView === 'tabela') {
        renderizarTabela(lista, container);
    } else {
        renderizarCards(lista, container);
    }
    
    document.getElementById('info-paginacao').innerText = `Exibindo ${lista.length} parceiro(s)`;
}

function renderizarTabela(lista, container) {
    container.className = "tabela-container";
    container.innerHTML = `
        <table class="tabela-dados">
            <thead>
                <tr>
                    <th>Nome da Empresa</th>
                    <th>Tipo</th>
                    <th>Representante</th>
                    <th>Cidade</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${lista.map(p => `
                    <tr>
                        <td>${p.nome_empresa.toUpperCase()}</td>
                        <td>
                            ${p.isPontoColeta ? '<span class="tag-coleta">Coleta</span>' : ''}
                            ${p.isPontoEntrega ? '<span class="tag-entrega">Entrega</span>' : ''}
                        </td>
                        <td>${p.nome_representante || '---'}</td>
                        <td>${p.cidade || '---'}</td>
                        <td class="acoes-icones">
                            <button class="action-btn btn-edit" onclick="abrirModalEdicao(${p.id_empresa})" title="Editar">
                                Editar
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderizarCards(lista, container) {
    container.className = "container-cards";
    container.innerHTML = ""; 

    if (lista.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; margin-top: 30px;">Nenhum parceiro encontrado.</p>`;
        return;
    }

    lista.forEach(item => {
        // Lógica para definir o texto do tipo na capa
        let tipoTexto = "";
        if (item.isPontoColeta && item.isPontoEntrega) tipoTexto = "Coleta e Entrega";
        else if (item.isPontoColeta) tipoTexto = "Ponto de Coleta";
        else if (item.isPontoEntrega) tipoTexto = "Ponto de Entrega";

        const cardHTML = `
            <div class="card-ponto">
                <div class="card-capa">
                    <h3>${item.nome_empresa}</h3>
                    <div class="tipo-capa">
                        <i class="ph ph-user"></i> ${item.nome_representante}
                    </div>
                    <div class="tipo-capa" style="margin-top: 10px; font-size: 0.9rem;">
                        <i class="ph ph-map-pin"></i> ${tipoTexto}
                    </div>
                </div>
                
                <div class="card-conteudo-detalhado">
                    <div class="card-header">
                        <h3>${item.nome_empresa}</h3>
                    </div>
                    
                    <div class="card-body-scroll">
                        <div class="card-body">
                            <p><strong>Representante:</strong> ${item.nome_representante}</p>
                            <p><strong><i class="ph ph-phone"></i> Telefone:</strong>  ${item.telefone_representante}</p>
                            <p><strong><i class="ph ph-envelope"></i> Email:</strong> ${item.email_representante}</p>
                            <hr>
                            <p><strong>Cidade:</strong> ${item.cidade} - ${item.bairro}</p>
                            <p><strong>Endereço:</strong> ${item.rua}, ${item.numero}</p>
                            
                            <div class="tags-tipo-card" style="margin-top: 15px;">
                                ${item.isPontoColeta ? `<span class="tag-tipo coleta"><i class="ph ph-truck"></i> Coleta</span>` : ''}
                                ${item.isPontoEntrega ? `<span class="tag-tipo entrega"><i class="ph ph-package"></i> Entrega</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="card-footer">
                        <button class="btn-card-editar" onclick="abrirModalEdicao(${item.id_empresa})">
                            <i class="ph ph-pencil-simple"></i> Editar
                        </button>
                        <button class="btn-card-recibo" onclick="gerarRecibo(${item.id_empresa})">
                            <i class="ph ph-file-text"></i> Recibo
                        </button>
                    </div>
                </div>
            </div>`;
        container.innerHTML += cardHTML;
    });
}

// Funções de Modal (globais para funcionarem no onclick)
function abrirModalEdicao(id) {
    // Busca o parceiro específico dentro do nosso array local
    const parceiro = parceirosCarregados.find(p => p.id_empresa === id);

    if (parceiro) {
        // Preenche os campos do modal com os dados do banco
        document.getElementById('editar-id').value = parceiro.id_empresa;
        document.getElementById('editar-nome').value = parceiro.nome_empresa;
        document.getElementById('editar-id').value = parceiro.id_empresa;
        document.getElementById('editar-nome').value = parceiro.nome_empresa;
        document.getElementById('editar-contato').value = parceiro.nome_representante;
        document.getElementById('editar-email').value = parceiro.email_representante;
        document.getElementById('editar-telefone').value = parceiro.telefone_representante;
        document.getElementById('editar-cep').value = parceiro.cep;
        document.getElementById('editar-cnpj').value = parceiro.cnpj;
        document.getElementById('editar-rua').value = parceiro.rua;
        document.getElementById('editar-bairro').value = parceiro.bairro;
        document.getElementById('editar-cidade').value = parceiro.cidade;
        document.getElementById('editar-numero').value = parceiro.numero;

        // Marcar Rádios de Coleta
        if (parceiro.isPontoColeta) {
            document.getElementById('coleta-sim').checked = true;
        } else {
            document.getElementById('coleta-nao').checked = true;
        }

        // Marcar Rádios de Entrega
        if (parceiro.isPontoEntrega) {
            document.getElementById('entrega-sim').checked = true;
        } else {
            document.getElementById('entrega-nao').checked = true;
        }

        // Abre visualmente o modal
        document.getElementById('modal-editar-parceiro').classList.add('mostrar-modal');
        document.getElementById('modal-overlay').classList.add('mostrar-modal');
    }
}

function fecharModais() {
    document.getElementById('modal-overlay').classList.remove('mostrar-modal');
    document.getElementById('modal-editar-parceiro').classList.remove('mostrar-modal');
}

// EDITAR PARCEIRO
// Evento de envio do formulário de edição
const formEditar = document.getElementById('form-editar-parceiro');
if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Feedback Visual
        const botaoSalvar = document.querySelector('button[form="form-editar-parceiro"]');
        const textoBotaoOriginal = botaoSalvar.innerHTML;
        botaoSalvar.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Atualizando...';
        botaoSalvar.disabled = true;

        const id = document.getElementById('editar-id').value;

        // Monta o objeto com os novos valores
        const rua = document.getElementById('editar-rua').value;
        const numero = document.getElementById('editar-numero').value;
        const bairro = document.getElementById('editar-bairro').value;
        const cidade = document.getElementById('editar-cidade').value;

        const coordenadas = await obterCoordenadas(rua, numero, bairro, cidade);

        if (coordenadas.latitude === null) {
            mostrarAlerta('Endereço não encontrado no GPS! Verifique o nome da rua e a cidade.', 'warning');
            botaoSalvar.innerHTML = textoBotaoOriginal;
            botaoSalvar.disabled = false;
            return; 
        }
        
        const dadosAtualizados = {
            nome_empresa: document.getElementById('editar-nome').value,
            nome_representante: document.getElementById('editar-contato').value,
            email_representante: document.getElementById('editar-email').value,
            telefone_representante: document.getElementById('editar-telefone').value,
            cnpj: document.getElementById('editar-cnpj').value,
            cep: document.getElementById('editar-cep').value,
            rua: rua,
            bairro: bairro,
            cidade: cidade,
            numero: numero,
            isPontoColeta: document.querySelector('input[name="editar-ponto-coleta"]:checked').value === "true",
            isPontoEntrega: document.querySelector('input[name="editar-ponto-entrega"]:checked').value === "true",
            // Coordenadas atualizadas
            latitude: coordenadas.latitude,
            longitude: coordenadas.longitude
        };

        try {
            const { error } = await supabaseClient
                .from('empresa_parceira')
                .update(dadosAtualizados)
                .eq('id_empresa', id);

            if (error) throw error;

            mostrarAlerta('Dados atualizados com sucesso!', 'success');
            fecharModais();
            buscarParceirosDoBanco(); 
        } catch (err) {
            console.error('Erro ao atualizar:', err.message);
            mostrarAlerta('Não foi possível salvar as alterações.', 'error');
        } finally {
            // Restaura o botão
            botaoSalvar.innerHTML = textoBotaoOriginal;
            botaoSalvar.disabled = false;
        }
    });
}


function filtrarParceiros() {
    const termoPesquisa = document.getElementById('pesquisa-nome').value.toLowerCase();
    const querColeta = document.getElementById('filtro-coleta').checked;
    const querEntrega = document.getElementById('filtro-entrega').checked;

    // Filtra os dados que já estão na memória (parceirosCarregados)
    const parceirosFiltrados = parceirosCarregados.filter(p => {
        const nomeMatch = p.nome_empresa.toLowerCase().includes(termoPesquisa);
        let tipoMatch = true;
        if (querColeta && !p.isPontoColeta) tipoMatch = false;
        if (querEntrega && !p.isPontoEntrega) tipoMatch = false;
        return nomeMatch && tipoMatch;
    });

    // Atualiza o contador
    const infoPaginacao = document.getElementById('info-paginacao');
    if (infoPaginacao) {
        infoPaginacao.innerText = `Exibindo ${parceirosFiltrados.length} de ${parceirosCarregados.length} parceiro(s)`;
    }

    renderizarConteudo(parceirosFiltrados);
}