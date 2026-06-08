const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
let supabaseClient;
try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase inicializado com sucesso!");
} catch (e) {
    console.error("Erro ao carregar a biblioteca Supabase. Verifique o link do CDN no HTML.");
}

const PERFIL_ELISETE = {
    nome: "Elisete Aparecida Câncio Borges",
    texto: "Eu, Elisete Aparecida Câncio Borges, recebi de {empresa} o valor de R$ {valor} referente aos serviços prestados no mês de {mes_ano}."
};


document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa componentes globais se as funções existirem
    if (typeof initSidebar === 'function') initSidebar();
    if (typeof initTopbar === 'function') initTopbar();

    configurarDataAtual();
    await carregarEmpresasParceiras(); 
    configurarInteracoes();
    configurarModeloElisete();
});

function configurarDataAtual() {
    const hoje = new Date().toISOString().split('T')[0];
    const inputData = document.getElementById('input-data');
    if (inputData) {
        inputData.value = hoje;
        atualizarDataPreview(hoje);
    }
}

async function carregarEmpresasParceiras() {
    const select = document.getElementById('input-empresa');
    if (!select) return;

    try {
        // Busca id e nome da tabela empresa_parceira
        const { data: parceiros, error } = await supabaseClient
            .from('empresa_parceira')
            .select('id_empresa, nome_empresa');

        if (error) throw error;

        select.innerHTML = '<option value="">Selecione a empresa</option>';
        parceiros.forEach(p => {
            const option = document.createElement('option');
            option.value = p.nome_empresa;
            option.dataset.id = p.id_empresa;
            option.textContent = p.nome_empresa;
            select.appendChild(option);
        });
        console.log("Empresas carregadas com sucesso.");
    } catch (err) {
        console.error("Erro ao carregar empresas:", err.message);
    }
}

function configurarInteracoes() {
    // 1. Seletores dos Inputs (Formulário)
    const btnToggleAssinatura = document.getElementById('toggle-assinatura'); // ID corrigido conforme o HTML
    const inputNome = document.getElementById('input-nome-assinatura');
    const inputCargo = document.getElementById('input-cargo-assinatura');
    const inputEmpresa = document.getElementById('input-empresa');
    const inputLitros = document.getElementById('input-litros');
    const inputData = document.getElementById('input-data');

    // 2. Seletores do Preview (Visualização)
    const viewNome = document.getElementById('view-nome-assinante');
    const viewCargo = document.getElementById('view-cargo-assinante');

    // Botão de Gerar PDF
    const btnGerar = document.getElementById('btn-gerar-pdf');

    // 3. Listeners para Nome e Cargo (Atualização em tempo real)
    if (inputNome && viewNome) {
        inputNome.addEventListener('input', (e) => {
            const isElisete = document.getElementById('btn-modelo-elisete').classList.contains('ativo');
            if (!isElisete) {
                viewNome.textContent = e.target.value || "Nome do assinante";
            }
        });
    }

    if (inputCargo && viewCargo) {
        inputCargo.addEventListener('input', (e) => {
            const isElisete = document.getElementById('btn-modelo-elisete').classList.contains('ativo');
            if (!isElisete) {
                viewCargo.textContent = e.target.value || "Cargo do assinante";
            }
        });
    }

    // 4. Vincula os botões de tipo (Óleo e Pix)
    const btnOleo = document.getElementById('btn-oleo');
    const btnPix = document.getElementById('btn-pix');
    if (btnOleo) btnOleo.onclick = () => alternarTipo('oleo');
    if (btnPix) btnPix.onclick = () => alternarTipo('pix');

    // 5. Outras atualizações do Preview
    if (inputEmpresa) inputEmpresa.onchange = () => atualizarPreviewGeral();
    if (inputLitros) inputLitros.oninput = () => atualizarPreviewGeral();
    if (inputData) {
        inputData.onchange = (e) => {
            atualizarDataPreview(e.target.value);
            atualizarPreviewGeral();
        };
    }

    // 6. Lógica do botão de Assinatura Virtual/Física
    if (btnToggleAssinatura) {
        btnToggleAssinatura.onclick = function() {
            const isVirtual = this.classList.toggle('ativo');
            if (isVirtual) {
                this.innerHTML = '<i class="ph ph-cursor"></i> Assinatura virtual';
                if (inputNome) {
                    inputNome.disabled = false;
                    inputNome.style.backgroundColor = "#fff";
                }
            } else {
                this.innerHTML = '<i class="ph ph-pen"></i> Assinatura física';
                if (inputNome) {
                    inputNome.disabled = true;
                    inputNome.value = "";
                    inputNome.style.backgroundColor = "#f0f0f0";
                    if (viewNome) viewNome.textContent = "___________________________";
                }
            }
        };
    }

    // 7. Botão de Gerar PDF
    if (btnGerar) {
        btnGerar.onclick = function(e) {
            e.preventDefault();
            gerarPDF();
        };
    }
}

function atualizarPreviewGeral() {
    const inputEmpresa = document.getElementById('input-empresa');
    const inputLitros = document.getElementById('input-litros');
    const inputData = document.getElementById('input-data');
    
    // Atualiza Empresa
    const viewEmpresa = document.getElementById('view-empresa');
    if (viewEmpresa && inputEmpresa) {
        viewEmpresa.textContent = inputEmpresa.value || "________________";
    }

    // Atualiza Valor/Litros
    const viewLitros = document.getElementById('view-litros');
    if (viewLitros && inputLitros) {
        const valor = inputLitros.value;
        const textoExtenso = valor ? `(${numeroPorExtenso(valor)})` : "(xxx)";
        
        // Verifica se é o modelo Elisete (R$) ou Óleo (Litros)
        const isElisete = document.getElementById('view-data-corpo') !== null;
        const prefixo = isElisete ? "R$ " : "";
        const sufixo = !isElisete && document.getElementById('btn-oleo').classList.contains('ativo') ? " litros" : "";
        
        viewLitros.textContent = `${prefixo}${valor || 'X'}${sufixo} ${textoExtenso}`;
    }

    // Atualiza Data no corpo (específico da Elisete)
    const viewDataCorpo = document.getElementById('view-data-corpo');
    if (viewDataCorpo && inputData && inputData.value) {
        const partes = inputData.value.split('-');
        viewDataCorpo.textContent = `${partes[1]}/${partes[0]}`;
    }
}

function alternarTipo(tipo) {
    limparCamposParaEstadoInicial();

    const btnOleo = document.getElementById('btn-oleo');
    const btnPix = document.getElementById('btn-pix');
    const btnElisete = document.getElementById('btn-modelo-elisete');
    const areaCorpo = document.querySelector('.corpo-recibo');
    
    // Habilita novamente os campos de assinatura caso estivessem travados pela Elisete
    const inputNome = document.getElementById('input-nome-assinatura');
    const inputCargo = document.getElementById('input-cargo-assinatura');
    btnElisete.classList.remove('ativo');
    if (inputNome) inputNome.disabled = false;
    if (inputCargo) inputCargo.disabled = false;

    if (tipo === 'oleo') {
        btnOleo.classList.add('ativo');
        btnPix.classList.remove('ativo');
        areaCorpo.innerHTML = `
            <h2 class="titulo-recibo">RECIBO</h2>
            <p class="texto-principal">
                Recebemos da Empresa <span class="campo-dinamico" id="view-empresa">________________</span> 
                <span class="campo-dinamico" id="view-litros">X (xxx)</span> litros de óleo de cozinha usado referente a doação para a Casa de Acolhimento São Francisco de Assis (NATA).
            </p>
            <p class="atenciosamente">Atenciosamente,</p>
        `;
    } else {
        btnPix.classList.add('ativo');
        btnOleo.classList.remove('ativo');
        areaCorpo.innerHTML = `
            <h2 class="titulo-recibo">RECIBO DE VALOR</h2>
            <p class="texto-principal">
                Recebemos de <span class="campo-dinamico" id="view-empresa">________________</span> 
                o valor de R$<span class="campo-dinamico" id="view-litros"> Z,ZZ (zzzz)</span> referente a doação espontânea via PIX para o NATA.
            </p>
            <p class="atenciosamente">Atenciosamente,</p>
        `;
    }
    
    // IMPORTANTE: Resetar os nomes no preview para o que está nos inputs
    if (inputNome) document.getElementById('view-nome-assinatura').textContent = inputNome.value || "Nome do assinante";
    if (inputCargo) document.getElementById('view-cargo-assinatura').textContent = inputCargo.value || "Cargo do assinante";

    configurarInteracoes();
    atualizarPreviewGeral();
}

function atualizarDataPreview(dataISO) {
    if (!dataISO) return;
    const partes = dataISO.split('-');
    const dataFormatada = `${partes[2]} de ${obterMesExtenso(partes[1])} de ${partes[0]}`;
    const el = document.getElementById('data-atual');
    if (el) el.textContent = dataFormatada;
}

// Função para limpar todos os inputs e previews
function limparCamposParaEstadoInicial() {
    // Inputs
    const inputs = [
        'input-empresa', 'input-litros', 'input-nome-assinatura', 'input-cargo-assinatura'
    ];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = "";
            el.disabled = false;
            el.style.backgroundColor = "";
        }
    });

    // Reset da data para hoje
    configurarDataAtual();

    // Previews (Textos no papel)
    const viewEmpresa = document.getElementById('view-empresa');
    if (viewEmpresa) viewEmpresa.textContent = "________________";

    const viewLitros = document.getElementById('view-litros');
    if (viewLitros) viewLitros.textContent = "X (xxx)";

    const viewNome = document.getElementById('view-nome-assinante');
    if (viewNome) viewNome.textContent = "Nome do assinante";

    const viewCargo = document.getElementById('view-cargo-assinante');
    if (viewCargo) viewCargo.textContent = "Cargo do assinante";
}

function obterMesExtenso(mes) {
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return meses[parseInt(mes) - 1];
}

function numeroPorExtenso(n) {
    const unidades = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
    if (n < 20) return unidades[n];
    if (n < 100) return dezenas[Math.floor(n / 10)] + (n % 10 !== 0 ? " e " + unidades[n % 10] : "");
    if (n < 1000) return centenas[Math.floor(n / 100)] + (n % 100 !== 0 ? " e " + numeroPorExtenso(n % 100) : "");
    return n;
}

// Modal de Histórico
async function abrirModalHistorico() {
    document.getElementById('modal-historico').style.display = 'flex';
    try {
        const { data, error } = await supabaseClient
            .from('historico_comprovantes')
            .select(`*, empresa_parceira (nome_empresa)`)
            .order('data_emissao', { ascending: false });

        if (error) throw error;
        
        const tbody = document.getElementById('lista-historico-body');
        tbody.innerHTML = '';

        data.forEach(item => {
            const publicURL = supabaseClient.storage
                .from('comprovante')
                .getPublicUrl(`comprovantes/${item.url_pdf}`).data.publicUrl;

            tbody.innerHTML += `
                <tr>
                    <td>${item.empresa_parceira?.nome_empresa || 'N/A'}</td>
                    <td>${item.tipo.toUpperCase()}</td>
                    <td>${new Date(item.data_emissao).toLocaleDateString('pt-BR')}</td>
                    <td>
                        <a href="${publicURL}" target="_blank" style="color: #e26a39; font-size: 1.2rem;">
                            <i class="ph ph-download-simple"></i>
                        </a>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Erro no histórico:", err.message);
    }
}

function fecharModalHistorico() {
    document.getElementById('modal-historico').style.display = 'none';
}


function configurarModeloElisete() {
    const btnElisete = document.getElementById('btn-modelo-elisete');
    if (!btnElisete) return;

    btnElisete.onclick = function() {
        limparCamposParaEstadoInicial();
        this.classList.add('ativo');
        const areaCorpo = document.querySelector('.corpo-recibo');
        
        // Remove classes de ativo dos outros botões para não confundir
        document.getElementById('btn-oleo').classList.remove('ativo');
        document.getElementById('btn-pix').classList.remove('ativo');

        areaCorpo.innerHTML = `
            <h2 class="titulo-recibo">RECIBO</h2>
            <p class="texto-principal">
                Eu, <strong>Elisete Aparecida Câncio Borges</strong>, recebi de 
                <span class="campo-dinamico" id="view-empresa">________________</span> o valor de 
                <strong><span class="campo-dinamico" id="view-litros">R$ 0,00 (zero)</span></strong> 
                referente aos serviços prestados no mês <span class="campo-dinamico" id="view-data-corpo">MM/AAAA</span>.
            </p>
            <p class="atenciosamente">Atenciosamente,</p>
        `;

        // Trava campos de assinatura
        const viewNome = document.getElementById('view-nome-assinante');
        const viewCargo = document.getElementById('view-cargo-assinante');
        if(viewNome) viewNome.textContent = "Elisete Aparecida Câncio Borges";
        if(viewCargo) viewCargo.textContent = "";

        // Atualiza imediatamente com os dados que já estiverem nos inputs
        atualizarPreviewGeral();
    };
}


async function gerarPDF() {
    const elemento = document.querySelector('.coluna-preview');
    if (!elemento) {
        console.error("Folha do recibo não encontrada!");
        return;
    }

    const btn = document.getElementById('btn-gerar-pdf');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-circle-notch"></i> Gerando...';

    const nomeArquivo = `comprovante_nata_${Date.now()}.pdf`;

    const opcoes = {
        margin: 0,
        filename: `comprovante_nata_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            letterRendering: true,
            scrollY: 0, 
            scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        // 1. Gera o PDF como Blob para o Supabase
        const pdfBlob = await html2pdf().set(opcoes).from(elemento).output('blob');

        // 2. Faz o Upload para o Bucket 'comprovantes'
        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('comprovantes')
            .upload(`comprovantes/${nomeArquivo}`, pdfBlob);

        if (uploadError) throw uploadError;

        // 3. Salva no Banco de Dados (Historico)
        await salvarNoHistorico(nomeArquivo);

        // 4. Baixa para o usuário localmente
        html2pdf().set(opcoes).from(elemento).save();

        alert("Comprovante gerado e salvo com sucesso!");
    } catch (err) {
        console.error("Erro na operação:", err.message);
        alert("Erro ao salvar comprovante.");
    } finally {
        btn.innerHTML = textoOriginal;
    }
}

async function salvarNoHistorico(nomeArquivo) {
    const inputEmpresa = document.getElementById('input-empresa');
    const idEmpresa = inputEmpresa.options[inputEmpresa.selectedIndex].dataset.id;
    const tipo = document.getElementById('btn-oleo').classList.contains('ativo') ? 'oleo' : 'pix';
    const valor = parseFloat(document.getElementById('input-litros').value);
    const dataEmissao = document.getElementById('input-data').value;
    const nomeAssinante = document.getElementById('input-nome-assinatura').value;
    const cargoAssinante = document.getElementById('input-cargo-assinatura').value;
    const tipoAssinatura = document.getElementById('toggle-assinatura').classList.contains('ativo') ? 'virtual' : 'fisica';

    const { error } = await supabaseClient
        .from('historico_comprovantes')
        .insert([{
            id_empresa: idEmpresa,
            tipo: tipo,
            valor_quantidade: valor,
            data_emissao: dataEmissao,
            nome_assinante: nomeAssinante,
            cargo_assinante: cargoAssinante,
            tipo_assinatura: tipoAssinatura,
            url_pdf: nomeArquivo // Importante: salve o caminho do arquivo
        }]);

    if (error) throw error;
}