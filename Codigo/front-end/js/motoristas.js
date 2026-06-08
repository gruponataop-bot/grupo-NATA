// Configurações do Supabase
const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let todosMotoristas = []; 

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o SwitchView com a função de renderização
    window.currentView = 'tabela';
    
    if (typeof initViewSwitcher === 'function') {
        initViewSwitcher((viewSelecionada) => {
            window.currentView = viewSelecionada;
            renderizarCards(todosMotoristas); 
        });
    }
    
    buscarMotoristas();

    // Eventos para filtragem em tempo real
    document.getElementById('pesquisa-nome').addEventListener('input', filtrarMotoristas);
    document.getElementById('filtro-dia').addEventListener('change', filtrarMotoristas);
    document.querySelectorAll('.filtro-cnh, .filtro-turno').forEach(el => {
        el.addEventListener('change', filtrarMotoristas);
    });
});

/** -----------------------------------------------------------
 * BUSCA E FILTRAGEM
 * ----------------------------------------------------------- */

async function buscarMotoristas() {
    const container = document.getElementById('container-motoristas');
    try {
        const { data, error } = await supabaseClient
            .from('motorista')
            .select(`*, disponibilidade_motorista (dia_da_semana, turno)`);

        if (error) throw error;

        todosMotoristas = data; 
        renderizarCards(todosMotoristas);

    } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        if (container) container.innerHTML = "<p>Erro ao carregar dados.</p>";
    }
}

function filtrarMotoristas() {
    const nomeBusca = document.getElementById('pesquisa-nome').value.toLowerCase();
    const diaBusca = document.getElementById('filtro-dia').value;
    const cnhsSelecionadas = Array.from(document.querySelectorAll('.filtro-cnh:checked')).map(cb => cb.value);
    const turnosSelecionados = Array.from(document.querySelectorAll('.filtro-turno:checked')).map(cb => cb.value);

    const filtrados = todosMotoristas.filter(mot => {
        const matchNome = mot.nome_motorista.toLowerCase().includes(nomeBusca);
        const matchCNH = cnhsSelecionadas.length === 0 || cnhsSelecionadas.every(cnh => mot[cnh] === true);
        
        const filtrosDispAtivos = diaBusca !== "" || turnosSelecionados.length > 0;
        let matchDisp = true;

        if (filtrosDispAtivos) {
            matchDisp = mot.disponibilidade_motorista.some(d => {
                const matchDia = diaBusca === "" || d.dia_da_semana === diaBusca;
                const matchTurno = turnosSelecionados.length === 0 || turnosSelecionados.includes(d.turno);
                return matchDia && matchTurno;
            });
        }
        return matchNome && matchCNH && matchDisp;
    });

    renderizarCards(filtrados);
}

/** -----------------------------------------------------------
 * RENDERIZAÇÃO DE INTERFACE
 * ----------------------------------------------------------- */

function renderizarCards(motoristas) {
    const containerCards = document.getElementById('container-motoristas');
    const containerTabela = document.getElementById('container-tabela-motoristas');
    const bodyTabela = document.getElementById('body-tabela-motoristas');
    
    atualizarContador(motoristas.length);

    // Alternância de containers baseada na variável global atualizada pelo switchView.js
    if (window.currentView === 'cards') {
        containerCards.style.display = 'grid';
        containerTabela.style.display = 'none';
        containerCards.innerHTML = '';
        
        motoristas.forEach(m => {
            const mapaDisp = {};
            if (m.disponibilidade_motorista) {
                m.disponibilidade_motorista.forEach(d => {
                    if (!mapaDisp[d.dia_da_semana]) mapaDisp[d.dia_da_semana] = [];
                    mapaDisp[d.dia_da_semana].push(d.turno);
                });
            }
            containerCards.innerHTML += criarCardMotorista(m, mapaDisp);
        });
    } else {
        containerCards.style.display = 'none';
        containerTabela.style.display = 'block';
        containerTabela.className = "tabela-container";
        bodyTabela.innerHTML = '';
        
        motoristas.forEach(m => {
            bodyTabela.innerHTML += criarLinhaTabela(m);
        });
    }
}

function atualizarContador(quantidade) {
    const info = document.getElementById('info-paginacao');
    if (info) info.innerText = `Exibindo ${quantidade} motorista(s)`;
}

function criarLinhaTabela(mot) {
    const cnhs = [];
    if (mot.cnh_a) cnhs.push('A');
    if (mot.cnh_b) cnhs.push('B');
    if (mot.cnh_c) cnhs.push('C');

    const dispInfo = mot.disponibilidade_motorista && mot.disponibilidade_motorista.length > 0
        ? formatarDisponibilidadeTabela(mot.disponibilidade_motorista)
        : '';

    const endereco = `${mot.rua_motorista || ''}, ${mot.numeroResidencia_motorista || ''}, ${mot.bairro_motorista || ''} - ${mot.cidade_motorista || ''}`;

    return `
        <tr>
            <td>${mot.nome_motorista.toUpperCase()}</td>
            <td><span class="tag-status ativo">${cnhs.join(' / ') || '---'}</span></td>
            <td>${mot.telefone_motorista || '---'}</td>
            <td>${mot.email_motorista || '---'}</td>
            <td>${endereco}</td>
            <td>${dispInfo}</td>
            <td class="acoes-icones">
                <button class="action-btn btn-edit" onclick="abrirModalEdicao('${mot.id_motorista}')">
                    Editar
                </button>
            </td>
        </tr>
    `;
}

/**
 * Auxiliar para formatar a disponibilidade de forma compacta na tabela
 */
function formatarDisponibilidadeTabela(disponibilidades) {
    // Define a ordem desejada e as siglas para exibição
    const ordemDias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    const siglas = {
        'seg': 'Seg', 'ter': 'Ter', 'qua': 'Qua', 
        'qui': 'Qui', 'sex': 'Sex', 'sab': 'Sáb', 'dom': 'Dom'
    };
    
    const agrupado = {};
    
    // Agrupa os turnos por dia
    disponibilidades.forEach(d => {
        const diaChave = d.dia_da_semana.toLowerCase();
        if (!agrupado[diaChave]) agrupado[diaChave] = [];
        agrupado[diaChave].push(d.turno.charAt(0).toUpperCase());
    });

    // Mapeia seguindo a ordem do array 'ordemDias' e filtra apenas os que possuem dados
    return ordemDias
        .filter(dia => agrupado[dia]) 
        .map(dia => `${siglas[dia]}(${agrupado[dia].join(',')})`)
        .join(' | ');
}

function criarCardMotorista(mot, mapaDisp) {
    const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    const labels = { seg: 'S', ter: 'T', qua: 'Q', qui: 'Q', sex: 'S', sab: 'S', dom: 'D' };

    const htmlDias = dias.map(dia => {
        const turnos = mapaDisp[dia] || [];
        const isAtivo = turnos.length > 0 ? 'ativo' : '';
        return `
            <div class="dia-coluna">
                <span class="circulo-dia ${isAtivo}">${labels[dia]}</span>
                <div class="turnos-indicador">
                    <span class="${turnos.includes('manha') ? 'show' : ''}">m</span>
                    <span class="${turnos.includes('tarde') ? 'show' : ''}">t</span>
                    <span class="${turnos.includes('noite') ? 'show' : ''}">n</span>
                </div>
            </div>`;
    }).join('');

    return `
        <div class="card-ponto">
            <div class="card-capa">
                <h3>${mot.nome_motorista}</h3>
                <div class="tipo-capa">
                    <i class="ph ph-identification-card"></i> CNH: 
                    ${mot.cnh_a ? '|A|' : ''}${mot.cnh_b ? '|B|' : ''}${mot.cnh_c ? '|C|' : ''}
                </div>
            </div>
            <div class="card-conteudo-detalhado">
                <div class="card-header">
                    <h4 style="margin:0; color:#db5c33;">${mot.nome_motorista}</h4>
                    <div style="font-size: 0.8rem; color: #666;">
                        <i class="ph ph-identification-card"></i> CNH: 
                        ${mot.cnh_a ? '|A|' : ''}${mot.cnh_b ? '|B|' : ''}${mot.cnh_c ? '|C|' : ''}
                    </div>
                </div>
                <div class="card-body-scroll">
                    <p><i class="ph ph-phone"></i> <strong>Telefone:</strong> ${mot.telefone_motorista}</p>
                    <p><i class="ph ph-envelope"></i> <strong>Email:</strong> ${mot.email_motorista}</p>
                    <hr>
                    <p><i class="ph ph-map-pin"></i> <strong>Endereço:</strong> ${mot.rua_motorista}, ${mot.bairro_motorista}, ${mot.numeroResidencia_motorista}</p>
                    <p><i class="ph ph-buildings"></i> <strong>Cidade:</strong> ${mot.cidade_motorista}</p>
                    <hr>
                    <div class="disponibilidade-info">
                        <strong>Disponibilidade e Turnos:</strong>
                        <div class="dias-grid-turnos">${htmlDias}</div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn-card-editar" onclick="abrirModalEdicao('${mot.id_motorista}')">
                        <i class="ph ph-pencil-simple"></i> Editar
                    </button>
                </div>
            </div>
        </div>`;
}

/** -----------------------------------------------------------
 * MODAIS E AÇÕES
 * ----------------------------------------------------------- */

window.abrirModalEdicao = async function(id) {
    const motorista = todosMotoristas.find(m => String(m.id_motorista) === String(id));
    if (motorista) {
        document.getElementById('editar-id').value = id;
        document.getElementById('editar-nome').value = motorista.nome_motorista;
        document.getElementById('editar-cpf').value = motorista.cpf_motorista || '';
        document.getElementById('editar-email').value = motorista.email_motorista || '';
        document.getElementById('editar-telefone').value = motorista.telefone_motorista || '';
        document.getElementById('editar-cep').value = motorista.cep_motorista || '';
        document.getElementById('editar-rua').value = motorista.rua_motorista || '';
        document.getElementById('editar-numero').value = motorista.numeroResidencia_motorista || '';
        document.getElementById('editar-bairro').value = motorista.bairro_motorista || '';
        document.getElementById('editar-cidade').value = motorista.cidade_motorista || '';
        document.getElementById('editar-cnh-a').checked = motorista.cnh_a;
        document.getElementById('editar-cnh-b').checked = motorista.cnh_b;
        document.getElementById('editar-cnh-c').checked = motorista.cnh_c;

        document.getElementById('modal-editar-motorista').classList.add('mostrar-modal');
        document.getElementById('modal-overlay').classList.add('mostrar-modal');
    }
};

window.fecharModais = function() {
    document.getElementById('modal-overlay').classList.remove('mostrar-modal');
    document.getElementById('modal-editar-motorista').classList.remove('mostrar-modal');
    document.getElementById('modal-confirmar-exclusao').classList.remove('mostrar-modal');
};

const formEditar = document.getElementById('form-editar-motorista');
if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idMotorista = document.getElementById('editar-id').value;
        const dados = {
            nome_motorista: document.getElementById('editar-nome').value,
            cpf_motorista: document.getElementById('editar-cpf').value,
            email_motorista: document.getElementById('editar-email').value,
            telefone_motorista: document.getElementById('editar-telefone').value,
            cep_motorista: document.getElementById('editar-cep').value,
            rua_motorista: document.getElementById('editar-rua').value,
            numeroResidencia_motorista: document.getElementById('editar-numero').value,
            bairro_motorista: document.getElementById('editar-bairro').value,
            cidade_motorista: document.getElementById('editar-cidade').value,
            cnh_a: document.getElementById('editar-cnh-a').checked,
            cnh_b: document.getElementById('editar-cnh-b').checked,
            cnh_c: document.getElementById('editar-cnh-c').checked
        };

        try {
            const { error } = await supabaseClient.from('motorista').update(dados).eq('id_motorista', idMotorista);
            if (error) throw error;
            mostrarAlerta('Motorista atualizado!', 'success');
            fecharModais();
            buscarMotoristas();
        } catch (err) {
            mostrarAlerta('Erro ao salvar alterações.', 'error');
        }
    });
}

// Função para abrir a modal de confirmação
function abrirConfirmacaoExclusao() {
    const nome = document.getElementById('editar-nome').value;
    const titulo = document.getElementById('nome-exclusao-titulo');
    const corpo = document.getElementById('nome-exclusao-corpo');
    
    if (titulo) titulo.innerText = nome.toUpperCase();
    if (corpo) corpo.innerText = nome.toUpperCase();
    
    const modal = document.getElementById('modal-confirmar-exclusao');
    if (modal) modal.classList.add('mostrar-modal');
}

// Função para fechar a modal de confirmação
function fecharConfirmacao() {
    const modal = document.getElementById('modal-confirmar-exclusao');
    if (modal) modal.classList.remove('mostrar-modal');
}

// Evento do botão "SIM" dentro da modal de confirmação
document.getElementById('btn-confirmar-delete').addEventListener('click', async () => {
    const idMotorista = document.getElementById('editar-id').value;

    try {
        const { error } = await supabaseClient
            .from('motorista')
            .delete()
            .eq('id_motorista', idMotorista);

        if (error) throw error;

        mostrarAlerta('Motorista removido com sucesso!', 'success');
        fecharModais(); // Fecha a modal de edição e a de confirmação
        buscarMotoristas(); // Atualiza a lista na tela
    } catch (err) {
        console.error('Erro ao excluir:', err);
        mostrarAlerta('Erro ao excluir motorista.', 'error');
    }
});