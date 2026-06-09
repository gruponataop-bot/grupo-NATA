const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
let _supabase = null;
function getSupabase() {
    if (!_supabase) _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return _supabase;
}

const API_URL = 'https://grupo-nata.onrender.com/api/projetos';
const API_FUNCIONARIOS_URL = 'https://grupo-nata.onrender.com/api/funcionarios';

document.addEventListener('DOMContentLoaded', async () => {
    await carregarFuncionarios();

    document.getElementById('form-novo-projeto').addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarProjeto();
    });
});

async function carregarFuncionarios() {
    try {
        const res = await fetch(API_FUNCIONARIOS_URL);
        if (!res.ok) return;
        const funcionarios = await res.json();
        const select = document.getElementById('formResponsavel');
        funcionarios.forEach(f => {
            const id = f.id_funcionario ?? f.idFuncionario ?? f.id;
            const nome = f.nome_funcionario ?? f.nomeFuncionario ?? f.nome ?? 'Sem nome';
            const cargo = f.cargo || 'sem cargo';
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `${nome} (${cargo})`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Erro ao carregar funcionários:', e);
    }
}

function previewImagem(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('imagePreview').src = e.target.result;
        const wrap = document.getElementById('imagePreviewContainer');
        wrap.style.display = 'flex';
        const fname = document.getElementById('uploadFilename');
        fname.textContent = file.name;
        fname.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function exibirErro(msg) {
    const el = document.getElementById('formErro');
    el.textContent = msg;
    el.style.display = 'block';
}

function ocultarErro() {
    const el = document.getElementById('formErro');
    el.textContent = '';
    el.style.display = 'none';
}

async function salvarProjeto() {
    ocultarErro();

    const btn = document.getElementById('btnSubmit');
    const btnOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-circle-notch" style="animation:spin .7s linear infinite"></i> Salvando...';

    const nome = document.getElementById('formNome').value.trim();
    const tipo = document.getElementById('formTipo').value;
    const publicoAlvo = document.getElementById('formPublicoAlvo').value;
    const dataInicio = document.getElementById('formDataInicio').value;

    if (!nome || !tipo || !publicoAlvo || !dataInicio) {
        exibirErro('Preencha os campos obrigatórios: Nome, Tipo, Público-alvo e Data de Início.');
        btn.disabled = false;
        btn.innerHTML = btnOriginal;
        return;
    }

    let imagemUrl = null;
    const arquivoImagem = document.getElementById('formImagem').files[0];
    if (arquivoImagem) {
        try {
            const ext = arquivoImagem.name.split('.').pop();
            const nomeArquivo = `projeto_${Date.now()}.${ext}`;
            const { error: uploadError } = await getSupabase().storage
                .from('projetos')
                .upload(nomeArquivo, arquivoImagem);
            if (uploadError) throw uploadError;
            const { data: publicUrlData } = getSupabase().storage
                .from('projetos')
                .getPublicUrl(nomeArquivo);
            imagemUrl = publicUrlData.publicUrl;
        } catch (e) {
            const msg = e?.message || '';
            if (msg.includes('Bucket not found') || msg.includes('bucket') || msg.includes('not found')) {
                exibirErro('Bucket "projetos" não encontrado no Supabase Storage. Crie-o em Storage → New bucket → nome: projetos → Public.');
            } else {
                exibirErro(`Erro no upload: ${msg || 'verifique o console para detalhes.'}`);
            }
            btn.disabled = false;
            btn.innerHTML = btnOriginal;
            return;
        }
    }

    const responsavelId = document.getElementById('formResponsavel').value;
    const payload = {
        nome,
        descricao: document.getElementById('formDescricao').value.trim(),
        tipo,
        publicoAlvo,
        horarios: obterHorariosProjetoSelecionados(),
        termoResponsabilidade: document.getElementById('formTermoResponsabilidade').value.trim(),
        dataInicio,
        dataFim: document.getElementById('formDataFim').value || null,
        status: document.getElementById('formStatus').value,
        imagemUrl,
        funcionarioResponsavel: responsavelId ? { id_funcionario: parseInt(responsavelId) } : null
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            let msg = 'Não foi possível salvar o projeto.';
            try { const corpo = await res.json(); msg = corpo.erro || msg; } catch (_) {}
            throw new Error(msg);
        }
        window.location.href = 'projetos.html';
    } catch (e) {
        exibirErro(e.message || 'Não foi possível salvar o projeto. Verifique se o servidor está rodando.');
        console.error(e);
        btn.disabled = false;
        btn.innerHTML = btnOriginal;
    }
}

function obterHorariosProjetoSelecionados() {
    return Array.from(document.querySelectorAll('input[name="horario-projeto"]:checked'))
        .map(input => input.value)
        .join(', ');
}
