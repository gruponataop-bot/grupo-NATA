const SUPABASE_URL = 'https://raykwpryvxfittrlkbey.supabase.co';
const SUPABASE_KEY = 'sb_publishable_C5oimXD8Ez6Ngh_MpSg01g_9J6F4Eam';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let pontosCarregados = [];

document.addEventListener('DOMContentLoaded', () => {

    window.currentView = 'tabela';

    const btnTabela = document.querySelector('.btn-view[data-view="tabela"]');
    const btnCards = document.querySelector('.btn-view[data-view="cards"]');
    if (btnTabela && btnCards) {
        btnTabela.classList.add('active');
        btnCards.classList.remove('active');
    }

    if (typeof initViewSwitcher === 'function') {
        initViewSwitcher(() => {
            filtrarPontos();
        });
    }

    buscarPontosDoBanco();

    // Eventos para filtragem em tempo real
    document.getElementById('pesquisa-nome').addEventListener('input', filtrarPontos);
    document.getElementById('filtro-coleta').addEventListener('change', filtrarPontos);
    document.getElementById('filtro-entrega').addEventListener('change', filtrarPontos);
});

async function buscarPontosDoBanco() {
    try {
        // Busca simultânea nas duas tabelas
        const [resPontos, resParceiros] = await Promise.all([
            supabaseClient.from('ponto').select('*').eq('ativo', true),
            supabaseClient.from('empresa_parceira').select('*').eq('ativo', true)
        ]);

        if (resPontos.error) throw resPontos.error;
        if (resParceiros.error) throw resParceiros.error;

        // Formata os parceiros para terem a mesma estrutura visual dos pontos
        // Filtrando apenas aqueles que são coleta OU entrega
        const parceirosComoPontos = resParceiros.data
            .filter(p => p.isPontoColeta || p.isPontoEntrega)
            .map(p => ({
                ...p,
                id_ponto: `parceiro-${p.id_empresa}`, // Prefixo para não conflitar IDs
                nome_ponto: p.nome_empresa,
                isParceiro: true // Flag para controle interno se necessário
            }));

        // Une as duas listas
        pontosCarregados = [...resPontos.data, ...parceirosComoPontos];
        renderizarConteudo(pontosCarregados);

        renderizarCards(pontosCarregados);
        
        const infoPaginacao = document.getElementById('info-paginacao');
        if (infoPaginacao) {
            infoPaginacao.innerText = `Exibindo ${pontosCarregados.length} ponto(s)`;
        }
    } catch (error) {
        console.error('Erro ao buscar dados unificados:', error.message);
        renderizarCards([]); 
    }
}

// Função mestre que decide o que renderizar
function renderizarConteudo(pontos) {
    const containerCards = document.getElementById('container-pontos');
    const containerTabela = document.getElementById('tabela-pontos-container');
    const corpoTabela = document.getElementById('corpo-tabela-pontos');

    if (window.currentView === 'tabela') {
        containerCards.style.display = 'none';
        containerTabela.style.display = 'block';
        
        corpoTabela.innerHTML = pontos.map(p => `
            <tr>
                <td>${(p.nome_ponto || p.nome_empresa).toUpperCase()}</td>
                <td>
                    ${p.isPontoColeta ? '<span class="tag-coleta">Coleta</span>' : ''}
                    ${p.isPontoEntrega ? '<span class="tag-entrega">Entrega</span>' : ''}
                </td>
                <td>${p.nome_representante || '---'}</td>
                <td>${p.cidade || '---'}</td>
                <td class="acoes-icones">
                    <button class="action-btn btn-edit" onclick="abrirModalEdicao('${p.id_ponto || 'parceiro-'+p.id_empresa}')">
                        Editar
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        containerCards.style.display = 'grid';
        containerTabela.style.display = 'none';
        renderizarCards(pontos); // Reutiliza sua função de cards existente
    }
    
    document.getElementById('info-paginacao').innerText = `Exibindo ${pontos.length} ponto(s)`;
}

function renderizarTabela(pontos) {
    const container = document.getElementById('container-pontos');
    let html = `
    <div class="tabela-container">
        <table class="tabela-dados">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Endereço</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;

    pontos.forEach(ponto => {
        html += `
            <tr>
                <td>${ponto.nome}</td>
                <td>${ponto.isColeta ? 'Coleta' : 'Entrega'}</td>
                <td>${ponto.logradouro}, ${ponto.numero}</td>
                <td>
                    <button class="btn-acao-tabela" onclick="abrirEdicao('${ponto.id}')">
                        <i class="ph ph-pencil"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function criarCardPonto(ponto) {
    const div = document.createElement('div');
    div.className = 'card-ponto'; // Certifique-se que esta classe existe no seu CSS
    
    // Define o ícone com base no tipo
    const iconClass = ponto.isParceiro ? 'ph-buildings' : 'ph-map-pin';
    const corBadge = ponto.isParceiro ? '#007bff' : '#db5c33';

    div.innerHTML = `
        <div class="card-header">
            <i class="ph ${iconClass}" style="color: ${corBadge}; font-size: 24px;"></i>
            <span class="badge-tipo" style="background: ${corBadge}">${ponto.isParceiro ? 'PARCEIRO' : 'PONTO'}</span>
        </div>
        <div class="card-body">
            <h4>${ponto.nome_ponto || ponto.nome_empresa}</h4>
            <p><i class="ph ph-map-pin"></i> ${ponto.cidade_ponto || ponto.cidade_empresa || 'Cidade não informada'}</p>
            <div class="tags-container">
                ${ponto.isColeta ? '<span class="tag-coleta">Coleta</span>' : ''}
                ${ponto.isEntrega ? '<span class="tag-entrega">Entrega</span>' : ''}
            </div>
        </div>
        <div class="card-footer">
            <button onclick="abrirEdicao('${ponto.id_ponto || 'parceiro-' + ponto.id_empresa}')" class="btn-editar-card">
                <i class="ph ph-pencil-simple"></i> Editar
            </button>
        </div>
    `;
    return div;
}


function renderizarCards(lista) {
    const containerCards = document.getElementById('container-pontos');
    if (!containerCards) return;
    
    containerCards.innerHTML = ""; 

    if (lista.length === 0) {
        containerCards.innerHTML = `<p style="grid-column: 1/-1; text-align: center; margin-top: 30px;">Nenhum ponto encontrado.</p>`;
        return;
    }

    lista.forEach(item => {
        // Define o texto do tipo para a capa
        let tipoTexto = "";
        if (item.isPontoColeta && item.isPontoEntrega) tipoTexto = "Coleta / Entrega";
        else if (item.isPontoColeta) tipoTexto = "Coleta";
        else if (item.isPontoEntrega) tipoTexto = "Entrega";

        const cardHTML = `
            <div class="card-ponto">
                <div class="card-capa">
                    <h3>${item.nome_ponto}</h3>
                    <div class="tipo-capa">
                        <i class="ph ph-map-pin"></i> ${tipoTexto}
                    </div>
                </div>

                <div class="card-conteudo-detalhado">
                    <div class="card-header" style="margin-bottom: 5px;">
                        <h4 style="margin:0; color:#db5c33;">${item.nome_ponto}</h4>
                        <i class="ph ph-map-pin"></i> ${tipoTexto}
                    </div>
                    
                    <div class="card-body-scroll">
                        <p><strong>Contato:</strong> ${item.nome_representante}</p>
                        <p><i class="ph ph-phone"></i> <strong>Telefone:</strong> ${item.telefone_representante}</p>
                        <p><i class="ph ph-envelope"></i> <strong>Email:</strong> ${item.email_representante}</p>
                        <hr>
                        <p><strong>CEP:</strong> ${item.cep}</p>
                        <p><strong>Endereço:</strong> ${item.rua}, ${item.numero}, ${item.bairro}</p>
                        <p><strong>Complemento:</strong> ${item.complemento}</p>
                        <p><strong>Cidade:</strong> ${item.cidade}</p>
                    </div>

                    <div class="card-footer" style="padding-top: 10px; border-top: 1px solid #eee;">
                        <button class="btn-card-editar" onclick="abrirModalEdicao('${item.id_ponto}')">
                            <i class="ph ph-pencil-simple"></i> Editar
                        </button>
                    </div>
                </div>
            </div>`;
        containerCards.innerHTML += cardHTML;
    });
}

// Funções de Modal (globais para funcionarem no onclick)
window.abrirModalEdicao = function(id) {
    console.log("Tentando editar ID:", id);
    const ponto = pontosCarregados.find(p => String(p.id_ponto) === String(id));

    if (ponto) {
        // 1. IMPORTANTE: Preencher o ID oculto para o formulário saber quem editar
        const campoId = document.getElementById('editar-id');
        if (campoId) campoId.value = id;

        // 2. Preenchimento com verificação de existência do elemento
        const campos = {
            'editar-nome': ponto.nome_ponto,
            'editar-contato': ponto.nome_representante,
            'editar-email': ponto.email_representante,
            'editar-telefone': ponto.telefone_representante,
            'editar-cep': ponto.cep,
            'editar-rua': ponto.rua,
            'editar-numero': ponto.numero,
            'editar-bairro': ponto.bairro,
            'editar-cidade': ponto.cidade,
            'editar-complemento': ponto.complemento
        };

        for (const [idCampo, valor] of Object.entries(campos)) {
            const elemento = document.getElementById(idCampo);
            if (elemento) elemento.value = valor || '';
        }

        for (const [idCampo, valor] of Object.entries(campos)) {
            const elemento = document.getElementById(idCampo);
            if (elemento) { 
                elemento.value = valor || ''; 
            } else {
                console.warn(`Campo ${idCampo} não encontrado.`);
            }
        }

        // 3. Rádios de Coleta e Entrega
        const coletaSim = document.getElementById('coleta-sim');
        const coletaNao = document.getElementById('coleta-nao');
        if (ponto.isPontoColeta) coletaSim.checked = true; else coletaNao.checked = true;

        const entregaSim = document.getElementById('entrega-sim');
        const entregaNao = document.getElementById('entrega-nao');
        if (ponto.isPontoEntrega) entregaSim.checked = true; else entregaNao.checked = true;

        // 4. Abre as modais (Certifique-se de que as classes CSS 'mostrar-modal' existam)
        document.getElementById('modal-editar-ponto').classList.add('mostrar-modal');
        document.getElementById('modal-overlay').classList.add('mostrar-modal');
    }
}

function fecharModais() {
    const overlay = document.getElementById('modal-overlay');
    const modalEdicao = document.getElementById('modal-editar-ponto');
    
    if (overlay) overlay.classList.remove('mostrar-modal');
    if (modalEdicao) modalEdicao.classList.remove('mostrar-modal');
    
    fecharConfirmacao();
}

// EDITAR PONTO
// Envio do formulário de edição
const formEditar = document.getElementById('form-editar-ponto');
if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Feedback Visual
        const botaoSalvar = document.querySelector('button[form="form-editar-ponto"]');
        const textoBotaoOriginal = botaoSalvar.innerHTML;
        botaoSalvar.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Atualizando...';
        botaoSalvar.disabled = true;

        const idOriginal = document.getElementById('editar-id').value;
        const isParceiro = idOriginal.startsWith('parceiro-');
        const idLimpo = isParceiro ? idOriginal.replace('parceiro-', '') : idOriginal;
        
        const tabela = isParceiro ? 'empresa_parceira' : 'ponto';
        const colunaId = isParceiro ? 'id_empresa' : 'id_ponto';

        // Extrai os campos de endereço
        const rua = document.getElementById('editar-rua').value;
        const numero = document.getElementById('editar-numero').value;
        const bairro = document.getElementById('editar-bairro').value;
        const cidade = document.getElementById('editar-cidade').value;

        // Busca as coordenadas do endereço atualizado
        const coordenadas = await obterCoordenadas(rua, numero, bairro, cidade);

        if (coordenadas.latitude === null) {
            mostrarAlerta('Endereço não encontrado no GPS! Verifique o nome da rua e a cidade.', 'warning');
            botaoSalvar.innerHTML = textoBotaoOriginal;
            botaoSalvar.disabled = false;
            return; 
        }

        const dadosAtualizados = {
            [isParceiro ? 'nome_empresa' : 'nome_ponto']: document.getElementById('editar-nome').value,
            nome_representante: document.getElementById('editar-contato').value,
            email_representante: document.getElementById('editar-email').value,
            telefone_representante: document.getElementById('editar-telefone').value,
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
                .from(tabela)
                .update(dadosAtualizados)
                .eq(colunaId, idLimpo);

            if (error) throw error;

            mostrarAlerta('Dados atualizados com sucesso!', 'success');
            fecharModais();
            buscarPontosDoBanco(); 
        } catch (err) {
            console.error('Erro ao atualizar:', err.message);
            mostrarAlerta('Não foi possível salvar as alterações.', 'error');
        } finally {
            // Restaura o botão independentemente de dar certo ou erro
            botaoSalvar.innerHTML = textoBotaoOriginal;
            botaoSalvar.disabled = false;
        }
    });
}


function filtrarPontos() {
    const termo = document.getElementById('pesquisa-nome').value.toLowerCase();
    const querColeta = document.getElementById('filtro-coleta').checked;
    const querEntrega = document.getElementById('filtro-entrega').checked;

    const filtrados = pontosCarregados.filter(p => {
        const nome = (p.nome_ponto || p.nome_empresa || "").toLowerCase();
        const rep = (p.nome_representante || "").toLowerCase();
        
        const bateTexto = nome.includes(termo) || rep.includes(termo);
        const bateColeta = !querColeta || p.isPontoColeta;
        const bateEntrega = !querEntrega || p.isPontoEntrega;
        
        return bateTexto && bateColeta && bateEntrega;
    });

    renderizarConteudo(filtrados);
}


// Exclusão
function abrirConfirmacaoExclusao() {
    const nome = document.getElementById('editar-nome').value;
    document.getElementById('nome-exclusao-titulo').innerText = nome.toUpperCase();
    document.getElementById('nome-exclusao-corpo').innerText = nome.toUpperCase();
    
    document.getElementById('modal-confirmar-exclusao').classList.add('mostrar-modal');
}

function fecharConfirmacao() {
    const modalDel = document.getElementById('modal-confirmar-exclusao');
    if (modalDel) {
        modalDel.classList.remove('mostrar-modal');
    }
}

// Remover ponto do banco ao confirmar exclusão
document.getElementById('btn-confirmar-delete').addEventListener('click', async () => {
    const idOriginal = document.getElementById('editar-id').value;
    const isParceiro = idOriginal.startsWith('parceiro-');
    const idLimpo = isParceiro ? idOriginal.replace('parceiro-', '') : idOriginal;
    
    const tabela = isParceiro ? 'empresa_parceira' : 'ponto';
    const colunaId = isParceiro ? 'id_empresa' : 'id_ponto';

    try {
        const { error } = await supabaseClient
            .from(tabela)
            .update({ ativo: false })
            .eq(colunaId, idLimpo);

        if (error) throw error;

        mostrarAlerta('Removido com sucesso!', 'success');
        fecharConfirmacao();
        fecharModais();
        buscarPontosDoBanco();
    } catch (err) {
        console.error('Erro ao excluir:', err.message);
        mostrarAlerta('Erro ao excluir o registro.', 'error');
    }
});