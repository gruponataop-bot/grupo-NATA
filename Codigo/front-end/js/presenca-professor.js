// ==========================================
// HABILIDADES E GRADE DE DISPONIBILIDADE
// ==========================================

// 1. Inicia a tabela assim que a página carrega
document.addEventListener('DOMContentLoaded', () => {
    renderizarTabelaDisponibilidade();
    carregarHabilidadesEDisponibilidade();
});

// 2. Monta as caixinhas de Segunda a Domingo
function renderizarTabelaDisponibilidade() {
    const tbody = document.getElementById('corpoDisponibilidade');
    if (!tbody) return;

    const diasSemanaList = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const turnosList = ['Manhã', 'Tarde', 'Noite'];

    tbody.innerHTML = diasSemanaList.map(dia => {
        const celulasTurnos = turnosList.map(turno => {
            const chave = `${dia}_${turno}`;
            return `
                <td style="text-align: center; vertical-align: middle;">
                    <label style="display: flex; justify-content: center; width: 100%; cursor: pointer;">
                        <input type="checkbox" value="${chave}" class="disp-checkbox" style="width: 18px; height: 18px; accent-color: var(--color-brand);">
                    </label>
                </td>`;
        }).join('');

        return `
            <tr>
                <td style="font-weight: 500; padding: 12px 8px;">${dia}</td>
                ${celulasTurnos}
            </tr>`;
    }).join('');
}

// 3. Carrega os dados salvos (Simulando o banco com LocalStorage para teste)
function carregarHabilidadesEDisponibilidade() {
    const id = localStorage.getItem('usuarioLogadoId');
    if (!id) return;

    // Carrega Habilidades
    const habilidadesSalvas = JSON.parse(localStorage.getItem(`hab_prof_${id}`) || '[]');
    document.querySelectorAll('.em-skills-grid input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = habilidadesSalvas.includes(checkbox.value);
    });

    // Carrega Disponibilidade
    const disponibilidadeSalva = JSON.parse(localStorage.getItem(`disp_prof_${id}`) || '[]');
    document.querySelectorAll('.disp-checkbox').forEach(checkbox => {
        checkbox.checked = disponibilidadeSalva.includes(checkbox.value);
    });
}

// 4. Captura a ação de salvar do formulário principal
const formPerfil = document.getElementById('formPerfilProfessor');
if (formPerfil) {
    formPerfil.addEventListener('submit', (e) => {
        const id = localStorage.getItem('usuarioLogadoId');
        if (!id) return;

        // Pega as habilidades marcadas
        const habilidadesMarcadas = Array.from(document.querySelectorAll('.em-skills-grid input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        // Pega as disponibilidades marcadas
        const disponibilidadeMarcada = Array.from(document.querySelectorAll('.disp-checkbox:checked'))
            .map(cb => cb.value);

        // Salva localmente (Posteriormente você pode enviar isso no fetch do backend)
        localStorage.setItem(`hab_prof_${id}`, JSON.stringify(habilidadesMarcadas));
        localStorage.setItem(`disp_prof_${id}`, JSON.stringify(disponibilidadeMarcada));
        
        // O restante do seu salvamento do form continuará rodando normalmente
    });
}