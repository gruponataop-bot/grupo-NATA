package com.natagestao.controllers;

import com.natagestao.models.ParticipanteProjeto;
import com.natagestao.repository.ParticipanteProjetoRepository;
import com.natagestao.repository.ParticipanteRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projetos/{idProjeto}/participantes")
@CrossOrigin(origins = "*")
public class ParticipanteProjetoController {

    @Autowired
    private ParticipanteProjetoRepository vincRepository;

    @Autowired
    private ParticipanteRepository participanteRepository;

    @GetMapping
    public List<Map<String, Object>> listar(@PathVariable Long idProjeto) {
        List<ParticipanteProjeto> vinculos = vincRepository.findByIdProjeto(idProjeto);
        return vinculos.stream().map(v -> {
            Map<String, Object> map = new HashMap<>();
            map.put("vinculoId", v.getId());
            map.put("idParticipante", v.getIdParticipante());
            map.put("dataVinculo", v.getDataVinculo());
            map.put("status", v.getStatus());
            participanteRepository.findById(v.getIdParticipante()).ifPresent(p -> {
                map.put("nome", p.getNome());
                map.put("nomeResponsavel", p.getNomeResponsavel());
                map.put("telefoneResponsavel", p.getTelefoneResponsavel());
                map.put("serie", p.getSerie());
            });
            return map;
        }).collect(Collectors.toList());
    }

    @PostMapping("/{idParticipante}")
    public ResponseEntity<?> vincular(
            @PathVariable Long idProjeto,
            @PathVariable Long idParticipante) {

        if (vincRepository.existsByIdProjetoAndIdParticipante(idProjeto, idParticipante)) {
            return ResponseEntity.badRequest()
                .body(Map.of("erro", "Participante já vinculado a este projeto"));
        }

        ParticipanteProjeto vinculo = new ParticipanteProjeto();
        vinculo.setIdProjeto(idProjeto);
        vinculo.setIdParticipante(idParticipante);
        vinculo.setDataVinculo(LocalDate.now());
        vinculo.setStatus("Ativo");

        return ResponseEntity.ok(vincRepository.save(vinculo));
    }

    @DeleteMapping("/{idParticipante}")
    public ResponseEntity<Void> desvincular(
            @PathVariable Long idProjeto,
            @PathVariable Long idParticipante) {

        return vincRepository.findByIdProjetoAndIdParticipante(idProjeto, idParticipante)
            .map(v -> {
                vincRepository.delete(v);
                return ResponseEntity.noContent().<Void>build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
