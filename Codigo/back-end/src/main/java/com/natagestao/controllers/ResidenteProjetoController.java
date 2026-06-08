package com.natagestao.controllers;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.natagestao.models.ResidenteProjeto;
import com.natagestao.repository.ResidenteProjetoRepository;
import com.natagestao.repository.ResidenteRepository;

@RestController
@RequestMapping("/api/projetos/{idProjeto}/residentes")
@CrossOrigin(origins = "*")
public class ResidenteProjetoController {
    
    @Autowired
    private ResidenteProjetoRepository residenteProjetoRepository;

    @Autowired
    private ResidenteRepository residenteRepository;

    @GetMapping
    public List<Map<String, Object>> listar(@PathVariable Long idProjeto) {
        List<ResidenteProjeto> vinculos = residenteProjetoRepository.findByIdProjeto(idProjeto);
        return vinculos.stream().map(v -> {
            Map<String, Object> map = new HashMap<>();
            map.put("vinculoId", v.getId());
            map.put("idResidente", v.getIdResidente());
            map.put("dataVinculo", v.getDataVinculo());
            map.put("status", v.getStatus());
            residenteRepository.findById(v.getIdResidente()).ifPresent(r -> {
                map.put("nome", r.getNome());

            });
            return map;
        }).collect(Collectors.toList());
}
    @PostMapping("/{idResidente}")
    public ResponseEntity<?> vincular(
            @PathVariable Long idProjeto,
            @PathVariable Long idResidente) {

        if (residenteProjetoRepository.existsByIdProjetoAndIdResidente(idProjeto, idResidente)) {
            return ResponseEntity.badRequest()
                .body(Map.of("erro", "Residente já vinculado a este projeto"));
        }

        ResidenteProjeto vinculo = new ResidenteProjeto();
        vinculo.setIdProjeto(idProjeto);
        vinculo.setIdResidente(idResidente);
        vinculo.setDataVinculo(LocalDate.now());
        vinculo.setStatus("Ativo");
        residenteProjetoRepository.save(vinculo);
        return ResponseEntity.ok().build();
}
    @DeleteMapping("/{idResidente}")
    public ResponseEntity<?> desvincular(
            @PathVariable Long idProjeto,
            @PathVariable Long idResidente) {

        return residenteProjetoRepository.findByIdProjetoAndIdResidente(idProjeto, idResidente)
                .map(vinculo -> {
                    residenteProjetoRepository.delete(vinculo);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
    
