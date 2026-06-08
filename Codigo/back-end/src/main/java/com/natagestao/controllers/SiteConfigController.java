package com.natagestao.controllers;

import com.natagestao.models.SiteConfig;
import com.natagestao.repository.SiteConfigRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/site-config")
@CrossOrigin(origins = "*")
public class SiteConfigController {

    private static final String CHAVE_HOME = "home";

    private final SiteConfigRepository repository;

    public SiteConfigController(SiteConfigRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/home")
    public ResponseEntity<Map<String, String>> buscarHome() {
        String valor = repository.findById(CHAVE_HOME)
                .map(SiteConfig::getValor)
                .orElse("{}");

        return ResponseEntity.ok(Map.of("valor", valor));
    }

    @PutMapping("/home")
    public ResponseEntity<Map<String, String>> salvarHome(@RequestBody Map<String, String> payload) {
        String valor = payload.getOrDefault("valor", "{}");
        repository.save(new SiteConfig(CHAVE_HOME, valor));

        return ResponseEntity.ok(Map.of("valor", valor));
    }
}
