package com.natagestao.controllers;

import com.natagestao.models.Estoque;
import com.natagestao.repository.EstoqueRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/estoque")
@CrossOrigin(origins = "*")
public class EstoqueController {

    @Autowired
    private EstoqueRepository repository;

    // Listar todos os itens
    @GetMapping
    public List<Estoque> listarTodos() {
        return repository.findAll();
    }

    // Buscar item por ID
    @GetMapping("/{id}")
    public ResponseEntity<Estoque> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Criar novo item no estoque
    @PostMapping
    public ResponseEntity<Estoque> criar(@RequestBody Estoque item) {
        Estoque salvo = repository.save(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    // Atualizar item (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<Estoque> atualizar(@PathVariable Long id, @RequestBody Estoque novosDados) {
        return repository.findById(id)
                .map(item -> {
                    item.setNome(novosDados.getNome());
                    item.setCategoria(novosDados.getCategoria());
                    item.setQuantidade(novosDados.getQuantidade());
                    item.setValorUnitario(novosDados.getValorUnitario());
                    item.setUnidade(novosDados.getUnidade());
                    item.setValidade(novosDados.getValidade());
                    item.setEstoqueMinimo(novosDados.getEstoqueMinimo());
                    item.setFornecedor(novosDados.getFornecedor());
                    item.setLocalizacao(novosDados.getLocalizacao());
                    item.setObservacao(novosDados.getObservacao());

                    return ResponseEntity.ok(repository.save(item));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Deletar item
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Buscar itens por nome (barra de pesquisa)
    @GetMapping("/buscar")
    public List<Estoque> buscar(@RequestParam String q) {
        return repository.findAll().stream()
            .filter(item -> item.getNome() != null &&
                            item.getNome().toLowerCase().contains(q.toLowerCase()))
            .collect(Collectors.toList());
    }
}