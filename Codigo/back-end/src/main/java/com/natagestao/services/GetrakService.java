package com.natagestao.services;

import com.natagestao.dto.LocalizacaoDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class GetrakService {

    /**
     * Método esta Mockado para testar o front-end sem precisar da API real da Getrak.
     * Retorna coordenadas fixas (ex: próximo a Ouro Preto).
     */
    public LocalizacaoDTO obterLocalizacaoAtualMock(String placa) {
        LocalizacaoDTO mock = new LocalizacaoDTO();
        mock.setPlaca(placa);
        
        // MOCK
        // Coordenadas fictícias (Praça Tiradentes, Ouro Preto)
        mock.setLatitude(-20.385574);
        mock.setLongitude(-43.503578);
        
        // MOCK
        // Dados do veículo
        mock.setVelocidade(45.5);
        mock.setIgnicaoLigada(true);
        mock.setDataHora(LocalDateTime.now());
        
        return mock;
    }

    /**
     * Método Mockado para simular o histórico de trajeto do veículo.
     */
    public java.util.List<LocalizacaoDTO> obterHistoricoMock(String placa) {
        java.util.List<LocalizacaoDTO> historico = new java.util.ArrayList<>();

        // Array com coordenadas próximas simulando os "pings" do rastreador a cada curva
        double[][] coordenadasTrajeto = {
            {-20.395155, -43.513364}, // Início (próximo à UFOP / Bauxita)
            {-20.393430, -43.511390},
            {-20.392015, -43.509745}, // Entrando na Padre Rolim
            {-20.389745, -43.508543}, // Curva da Padre Rolim
            {-20.387920, -43.506820}, // Passando perto da Igreja das Mercês
            {-20.386850, -43.505430}, // Chegando no centro
            {-20.386000, -43.504200},
            {-20.385574, -43.503578}  // Ponto Final (Praça Tiradentes - mesma coordenada do carro atual)
        };

        for (double[] coord : coordenadasTrajeto) {
            LocalizacaoDTO p = new LocalizacaoDTO();
            p.setLatitude(coord[0]);
            p.setLongitude(coord[1]);
            historico.add(p);
        }

        return historico;
    }
}