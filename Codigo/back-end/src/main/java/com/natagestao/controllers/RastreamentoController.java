package com.natagestao.controllers;

import com.natagestao.dto.LocalizacaoDTO;
import com.natagestao.services.GetrakService;
import com.natagestao.services.GetrakAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rastreamento")
public class RastreamentoController {

    @Autowired
    private GetrakService getrakService;

    @Autowired
    private GetrakAuthService getrakAuthService;

    @GetMapping("/veiculo/{placa}/localizacao")
    public ResponseEntity<LocalizacaoDTO> obterLocalizacao(@PathVariable String placa) {
        // Chamando o nosso serviço mockado
        LocalizacaoDTO localizacao = getrakService.obterLocalizacaoAtualMock(placa);
        return ResponseEntity.ok(localizacao);
    }

    @GetMapping("/veiculo/{placa}/historico")
    public ResponseEntity<java.util.List<LocalizacaoDTO>> obterHistorico(@PathVariable String placa) {
        java.util.List<LocalizacaoDTO> historico = getrakService.obterHistoricoMock(placa);
        return ResponseEntity.ok(historico);
    }

    // Endpoint de teste para verificar a autenticação com a Getrak
    @GetMapping("/teste-auth")
    public ResponseEntity<String> testarAutenticacao() {
        try {
            String token = getrakAuthService.gerarToken();
            if (token != null) {
                return ResponseEntity.ok("SUCESSO! A Getrak aceitou as chaves. Token: " + token);
            } else {
                return ResponseEntity.status(401).body("FALHA: A requisição chegou na Getrak, mas as chaves foram recusadas. Olhe o terminal do Java.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("ERRO INTERNO: " + e.getMessage());
        }
    }
}