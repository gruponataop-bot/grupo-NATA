// Configuração do Supabase
const SUPABASE_URL = 'https://wyhclddqdupnpdmfafde.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oA60gmRRa3B5bzOpUb-8XQ_L2TqAZZh';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o Mapa
    const mapa = L.map('mapa').setView([-20.385574, -43.503578], 12); // Foco inicial (Ouro Preto)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapa);

    let marcadorVeiculo;
    let linhaTrajeto;

    // 2. Lógica para pegar os parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const placaSelecionada = params.get('placa') || 'ABC1234';
    const idRotaSelecionada = params.get('id_rota');

    //  Busca e desenha as paradas da rota no mapa (Pontos de Coleta e Entrega) 
    async function carregarParadasDaRota() {
        if (!idRotaSelecionada) return;

        try {
            // Busca os pontos associados à rota, juntando com as tabelas de endereço para pegar Lat/Lon
            const { data: paradas, error } = await _supabase
                .from('ponto_parada')
                .select('*, ponto(nome_ponto, latitude, longitude), empresa_parceira(nome_empresa, latitude, longitude)')
                .eq('id_rota', idRotaSelecionada);

            if (error) throw error;

            paradas.forEach((parada, index) => {
                let lat, lng, nome;

                // Verifica se é Ponto Base ou Parceiro
                if (parada.ponto && parada.ponto.latitude) {
                    lat = parada.ponto.latitude;
                    lng = parada.ponto.longitude;
                    nome = parada.ponto.nome_ponto;
                } else if (parada.empresa_parceira && parada.empresa_parceira.latitude) {
                    lat = parada.empresa_parceira.latitude;
                    lng = parada.empresa_parceira.longitude;
                    nome = parada.empresa_parceira.nome_empresa;
                }

                // Se encontrou coordenadas válidas no banco, desenha no mapa
                if (lat && lng) {
                    const tipoTexto = parada.tipo_parada || '';
                    let iconeHtml = '';
                    let classeTipo = '';

                    // Define o ícone e a classe CSS com base no tipo
                    if (tipoTexto === 'Misto') {
                        iconeHtml = '<i class="ph ph-arrows-left-right"></i>';
                        classeTipo = 'marker-misto';
                    } else if (tipoTexto === 'Coleta') {
                        iconeHtml = '<i class="ph ph-package"></i>';
                        classeTipo = 'marker-coleta';
                    } else {
                        iconeHtml = '<i class="ph ph-truck"></i>';
                        classeTipo = 'marker-entrega';
                    }

                    // Cria o marcador visual informando apenas as classes e o ícone
                    const iconeParada = L.divIcon({
                        className: `custom-ponto-icon ${classeTipo}`,
                        html: iconeHtml,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15],
                        popupAnchor: [0, -15]
                    });
                    
                    L.marker([lat, lng], { icon: iconeParada })
                        .addTo(mapa)
                        .bindPopup(`<b>${index + 1}º Parada: ${nome}</b><br>Tipo: ${tipoTexto}`);
                }
            });

        } catch (err) {
            console.error("Erro ao carregar paradas no mapa:", err);
        }
    }

    // 3. Função para buscar a posição em tempo real do Veículo (Seu código anterior)
    async function atualizarPosicao() {
        try {
            const resposta = await fetch(`http://localhost:8080/api/rastreamento/veiculo/${placaSelecionada}/localizacao`);
            if (!resposta.ok) throw new Error('Erro ao buscar dados do veículo');
            
            const dados = await resposta.json();

            // Atualiza Textos na tela
            document.getElementById('info-placa').innerText = dados.placa;
            document.getElementById('info-velocidade').innerText = dados.velocidade.toFixed(1);
            
            const elIgnicao = document.getElementById('info-ignicao');
            if (dados.ignicaoLigada) {
                elIgnicao.innerHTML = `<span class="rt-status-on"><i class="ph ph-check-circle"></i> Ligada</span>`;
            } else {
                elIgnicao.innerHTML = `<span class="rt-status-off"><i class="ph ph-x-circle"></i> Desligada</span>`;
            }
            
            const dataFormatada = new Date(dados.dataHora).toLocaleTimeString('pt-BR');
            document.getElementById('info-hora').innerText = dataFormatada;

            // Atualiza o Marcador do Veículo no Mapa
            const novaPosicao = [dados.latitude, dados.longitude];

            if (!marcadorVeiculo) {
                // Ícone especial para o Carro/Caminhão
                const iconeCarro = L.divIcon({
                    className: 'custom-car-icon',
                    html: '<i class="ph-fill ph-car-profile"></i>',
                    iconSize: [38, 38],
                    iconAnchor: [19, 19],
                    popupAnchor: [0, -19]
                });

                marcadorVeiculo = L.marker(novaPosicao, { icon: iconeCarro }).addTo(mapa);
                marcadorVeiculo.bindPopup(`<b>Veículo:</b> ${dados.placa}`).openPopup();
            } else {
                marcadorVeiculo.setLatLng(novaPosicao);
            }

        } catch (erro) {
            console.error("Erro na atualização do mapa:", erro);
        }
    }

    // 4. Função para buscar e desenhar histórico de trajeto
    async function carregarHistoricoVeiculo() {
        try {
            // Coordenadas simuladas: Saída da UFOP até a Praça Tiradentes
            const lonInicial = -43.513364; const latInicial = -20.395155;
            const lonFinal = -43.503578;   const latFinal = -20.385574;

            // URL da API Open Source Routing Machine (Pega a melhor rota de carro)
            const urlOSRM = `https://router.project-osrm.org/route/v1/driving/${lonInicial},${latInicial};${lonFinal},${latFinal}?geometries=geojson`;

            const resposta = await fetch(urlOSRM);
            const dados = await resposta.json();

            // Se a API encontrou o caminho pelas ruas
            if (dados.routes && dados.routes.length > 0) {
                // O OSRM devolve [longitude, latitude], o Leaflet precisa inverter
                const coordenadasTrajeto = dados.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);

                // Cria a linha azul cobrindo exatamente o asfalto
                linhaTrajeto = L.polyline(coordenadasTrajeto, {
                    color: '#007bff', 
                    weight: 5,          
                    opacity: 0.8,       
                    smoothFactor: 1     
                }).addTo(mapa);
            }
        } catch (err) {
            console.error("Erro ao desenhar trajeto nas ruas:", err);
        }
    }

    // Inicialização
    carregarParadasDaRota();    // Desenha os pinos estáticos
    carregarHistoricoVeiculo(); // Busca o histórico do trajeto
    atualizarPosicao();         // Busca o carro
    setInterval(atualizarPosicao, 5000); // Fica atualizando o carro
});