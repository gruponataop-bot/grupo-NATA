package com.natagestao.controllers;

import com.natagestao.models.Observacao;
import com.natagestao.models.Participante;
import com.natagestao.repository.ObservacaoRepository;
import com.natagestao.repository.ParticipanteRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/participantes")
@CrossOrigin(origins = "*")
public class ParticipanteController {

    @Autowired
    private ParticipanteRepository repository;

    @Autowired
    private ObservacaoRepository observacaoRepository;

    // Listar todos
    @GetMapping
    public List<Participante> listarTodos() {
        return repository.findAll();
    }

    // Buscar por ID
    @GetMapping("/{id}")
    public ResponseEntity<Participante> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Criar novo participante
    @PostMapping
    public ResponseEntity<Participante> criar(@RequestBody Participante participante) {

        Participante salvo = repository.save(participante);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    // Atualizar participante (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<Participante> atualizar(@PathVariable Long id, @RequestBody Participante dadosNovos) {
        return repository.findById(id)
                .map(p -> {
                    p.setNome(dadosNovos.getNome());
                    p.setDataNascimento(dadosNovos.getDataNascimento());
                    p.setSerie(dadosNovos.getSerie());
                    p.setEscola(dadosNovos.getEscola());
                    p.setTurnoEscolar(dadosNovos.getTurnoEscolar());
                    p.setNecessidadesEspeciais(dadosNovos.getNecessidadesEspeciais());
                    p.setNomeResponsavel(dadosNovos.getNomeResponsavel());
                    p.setTelefoneResponsavel(dadosNovos.getTelefoneResponsavel());
                    p.setParentesco(dadosNovos.getParentesco());
                    p.setHorariosSelecionados(dadosNovos.getHorariosSelecionados());
                    p.setProjeto(dadosNovos.getProjeto());
                    p.setStatus(dadosNovos.getStatus());
                    p.setEndereco(dadosNovos.getEndereco());

                    return ResponseEntity.ok(repository.save(p));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Deletar participante
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Buscar participantes por nome
    @GetMapping("/buscar")
    public List<Participante> buscar(@RequestParam String q) {
        return repository.findAll().stream()
            .filter(p -> p.getNome() != null &&
                         p.getNome().toLowerCase().contains(q.toLowerCase()))
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}/observacoes")
    public ResponseEntity<List<Observacao>> listarObservacoesParticipante(@PathVariable Long id) {
        List<Observacao> observacoes = observacaoRepository
            .findByTipoUsuarioAndIdUsuarioRelacionadoOrderByDataRegistroDesc("participante", id);
        return ResponseEntity.ok(observacoes);
    }

    @PostMapping("/{id}/observacoes")
    public ResponseEntity<Observacao> registrarObservacaoParticipante(@PathVariable Long id, @RequestBody Observacao observacao) {
        observacao.setTipoUsuario("participante");
        observacao.setIdUsuarioRelacionado(id);
        
        Observacao salva = observacaoRepository.save(observacao);
        return ResponseEntity.ok(salva);
    }
}