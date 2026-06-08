package com.natagestao.controllers;

import com.natagestao.models.PresencaParticipante;
import com.natagestao.repository.ParticipanteProjetoRepository;
import com.natagestao.repository.PresencaParticipanteRepository;
import com.natagestao.repository.ProjetoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projetos/{idProjeto}/presencas")
@CrossOrigin(origins = "*")
public class PresencaParticipanteController {

    @Autowired
    private PresencaParticipanteRepository repository;

    @Autowired
    private ProjetoRepository projetoRepository;

    @Autowired
    private ParticipanteProjetoRepository participanteProjetoRepository;

    @GetMapping
    public ResponseEntity<?> listar(
            @PathVariable Long idProjeto,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        if (!projetoRepository.existsById(idProjeto)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(repository.findByIdProjetoAndDataChamadaOrderByIdParticipanteAsc(idProjeto, data));
    }

    @PostMapping
    public ResponseEntity<?> salvar(
            @PathVariable Long idProjeto,
            @RequestBody List<PresencaParticipante> presencas) {
        if (!projetoRepository.existsById(idProjeto)) {
            return ResponseEntity.notFound().build();
        }
        if (presencas == null || presencas.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Envie ao menos uma presença."));
        }

        List<PresencaParticipante> salvas = new ArrayList<>();
        for (PresencaParticipante entrada : presencas) {
            if (entrada.getIdParticipante() == null || entrada.getDataChamada() == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Participante e data são obrigatórios."));
            }
            if (!participanteProjetoRepository.existsByIdProjetoAndIdParticipante(idProjeto, entrada.getIdParticipante())) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Participante não vinculado ao projeto."));
            }

            PresencaParticipante presenca = repository
                    .findByIdProjetoAndIdParticipanteAndDataChamada(idProjeto, entrada.getIdParticipante(), entrada.getDataChamada())
                    .orElseGet(PresencaParticipante::new);

            presenca.setIdProjeto(idProjeto);
            presenca.setIdParticipante(entrada.getIdParticipante());
            presenca.setDataChamada(entrada.getDataChamada());
            presenca.setPresente(Boolean.TRUE.equals(entrada.getPresente()));
            presenca.setObservacao(entrada.getObservacao());
            presenca.setRegistradoPor(entrada.getRegistradoPor());
            salvas.add(repository.save(presenca));
        }

        return ResponseEntity.ok(salvas);
    }
}