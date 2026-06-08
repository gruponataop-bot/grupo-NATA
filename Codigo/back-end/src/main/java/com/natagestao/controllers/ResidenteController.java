package com.natagestao.controllers;

import com.natagestao.models.Observacao;
import com.natagestao.models.Residente;
import com.natagestao.repository.ObservacaoRepository;
import com.natagestao.repository.ResidenteRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/residentes")
@CrossOrigin(origins = "*")
public class ResidenteController {

    @Autowired
    private ResidenteRepository repository;

    @Autowired
    private ObservacaoRepository observacaoRepository;

    // Listar todos
    @GetMapping
    public List<Residente> listarTodos() {
        return repository.findAll();
    }

    // Buscar por ID
    @GetMapping("/{id}")
    public ResponseEntity<Residente> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Criar novo residente
    @PostMapping
    public ResponseEntity<Residente> criar(@RequestBody Residente residente) {

        Residente salvo = repository.save(residente);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    // Atualizar residente (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<Residente> atualizar(@PathVariable Long id, @RequestBody Residente dadosNovos) {
        return repository.findById(id)
                .map(r -> {
                    r.setNome(dadosNovos.getNome());
                    r.setDataNascimento(dadosNovos.getDataNascimento());
                    r.setNecessidadesEspeciais(dadosNovos.getNecessidadesEspeciais());
                    r.setContatoEmergencia(dadosNovos.getContatoEmergencia());
                    r.setTelefoneEmergencia(dadosNovos.getTelefoneEmergencia());
                    r.setParentesco(dadosNovos.getParentesco());
                    r.setProjeto(dadosNovos.getProjeto());
                    r.setStatus(dadosNovos.getStatus());
                    r.setEndereco(dadosNovos.getEndereco());
                    r.setCpf(dadosNovos.getCpf());
                    r.setTelefone(dadosNovos.getTelefone());
                    r.setEmail(dadosNovos.getEmail());

                    return ResponseEntity.ok(repository.save(r));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Deletar residente
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Buscar residentes por nome
    @GetMapping("/buscar")
    public List<Residente> buscar(@RequestParam String q) {
        return repository.findAll().stream()
            .filter(r -> r.getNome() != null &&
                         r.getNome().toLowerCase().contains(q.toLowerCase()))
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}/observacoes")
    public ResponseEntity<List<Observacao>> listarObservacoesResidente(@PathVariable Long id) {
        List<Observacao> observacoes = observacaoRepository
            .findByTipoUsuarioAndIdUsuarioRelacionadoOrderByDataRegistroDesc("residente", id);
        return ResponseEntity.ok(observacoes);
    }

    @PostMapping("/{id}/observacoes")
    public ResponseEntity<Observacao> registrarObservacaoResidente(@PathVariable Long id, @RequestBody Observacao observacao) {
        observacao.setTipoUsuario("residente");
        observacao.setIdUsuarioRelacionado(id);
        
        Observacao salva = observacaoRepository.save(observacao);
        return ResponseEntity.ok(salva);
    }
}