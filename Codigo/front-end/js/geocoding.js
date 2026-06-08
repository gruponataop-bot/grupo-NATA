/**
 * Busca as coordenadas usando a API gratuita do OpenStreetMap com sistema de Fallback.
 */
async function obterCoordenadas(rua, numero, bairro, cidade) {
    // Função interna auxiliar para fazer a chamada HTTP
    const buscarNaAPI = async (query) => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
            const resposta = await fetch(url);
            const dados = await resposta.json();
            
            if (dados && dados.length > 0) {
                return {
                    latitude: parseFloat(dados[0].lat),
                    longitude: parseFloat(dados[0].lon)
                };
            }
            return null; // Não encontrou
        } catch (erro) {
            console.error("Erro na API de mapas:", erro);
            return null;
        }
    };

    // Filtra valores vazios para não mandar vírgulas sobrando
    const limpar = (arr) => arr.filter(item => item && item.trim() !== '').join(', ');

    // TENTATIVA 1: Endereço super completo (Rua, Número, Bairro, Cidade, Brasil)
    let tentativa = limpar([rua, numero, bairro, cidade, "Brasil"]);
    let coordenadas = await buscarNaAPI(tentativa);
    if (coordenadas) return coordenadas;

    // TENTATIVA 2: Sem o bairro (Bairros frequentemente falham no OpenStreetMap)
    tentativa = limpar([rua, numero, cidade, "Brasil"]);
    coordenadas = await buscarNaAPI(tentativa);
    if (coordenadas) return coordenadas;

    // TENTATIVA 3: Apenas Rua e Cidade (Garante pelo menos que o pino caia na rua certa)
    tentativa = limpar([rua, cidade, "Brasil"]);
    coordenadas = await buscarNaAPI(tentativa);
    if (coordenadas) return coordenadas;

    // Se falhar em tudo
    console.warn("Geocoding falhou: Endereço muito impreciso ou não mapeado ->", rua);
    return { latitude: null, longitude: null };
}