package com.natagestao.controllers;

import com.natagestao.models.Voluntario;
import com.natagestao.repository.ProjetoRepository;
import com.natagestao.repository.VoluntarioRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.natagestao.models.Projeto;

import java.util.HashSet;

import java.util.List;

@RestController
@RequestMapping("/api/voluntarios")
@CrossOrigin(origins = "*") // Permite que o seu HTML conecte aqui sem dar erro de CORS
public class VoluntarioController {

    @Autowired
    private VoluntarioRepository repository;
    @Autowired
    private ProjetoRepository projetoRepository;

    // 1. ROTA PARA LISTAR TODOS (Vai preencher a sua tabela no front)
    @GetMapping
    public List<Voluntario> listarTodos() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Voluntario> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 2. ROTA PARA CADASTRAR NOVO VOLUNTÁRIO
    @PostMapping
    public ResponseEntity<Void> criar(@RequestBody Voluntario voluntario) {
        repository.save(voluntario);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // 3. ROTA PARA ATUALIZAR UM VOLUNTÁRIO (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<Voluntario> atualizar(@PathVariable Long id, @RequestBody Voluntario dadosAtualizados) {
        return repository.findById(id)
                .map(voluntarioExistente -> {
                    // Atualiza os dados velhos com os dados novos
                    voluntarioExistente.setNome(dadosAtualizados.getNome());
                    voluntarioExistente.setEmail(dadosAtualizados.getEmail());
                    voluntarioExistente.setTelefone(dadosAtualizados.getTelefone());
                    voluntarioExistente.setDataNascimento(dadosAtualizados.getDataNascimento());
                    voluntarioExistente.setHabilidades(dadosAtualizados.getHabilidades());
                    voluntarioExistente.setOutrasHabilidades(dadosAtualizados.getOutrasHabilidades());
                    voluntarioExistente.setDiasDisponiveis(dadosAtualizados.getDiasDisponiveis());
                    voluntarioExistente.setTurnosDisponiveis(dadosAtualizados.getTurnosDisponiveis());
                    if (dadosAtualizados.getDisponibilidades() != null) {
                        voluntarioExistente.setDisponibilidades(dadosAtualizados.getDisponibilidades());
                    }
                    voluntarioExistente.setObservacoesDisponibilidade(dadosAtualizados.getObservacoesDisponibilidade());
                    voluntarioExistente.setStatus(dadosAtualizados.getStatus());
                    voluntarioExistente.setCpf(dadosAtualizados.getCpf());
                    voluntarioExistente.setEndereco(dadosAtualizados.getEndereco());
                    
                    Voluntario salvo = repository.save(voluntarioExistente);
                    return ResponseEntity.ok(salvo);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    // ==========================================
    // VINCULAR PROJETOS AO VOLUNTÁRIO
    // ==========================================
    @PostMapping("/{id}/projetos")
    public ResponseEntity<Voluntario> vincularProjetos(@PathVariable Long id, @RequestBody List<Long> projetoIds) {
        return repository.findById(id).map(voluntario -> {
            // Busca todos os projetos no banco que tenham os IDs que o JS enviou
            List<Projeto> projetosEncontrados = projetoRepository.findAllById(projetoIds);
            
            // Salva a lista de projetos dentro do voluntário
            voluntario.setProjetos(new HashSet<>(projetosEncontrados));
            
            // Salva no banco de dados
            Voluntario salvo = repository.save(voluntario);
            return ResponseEntity.ok(salvo);
        }).orElse(ResponseEntity.notFound().build());
    }
    // ==========================================
    // DELETAR VOLUNTÁRIO (DELETE)
    // ==========================================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarVoluntario(@PathVariable Long id) {
        // Mudamos de voluntarioRepository para repository
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build(); // Retorna código 204 (Sucesso, mas sem conteúdo)
        }
        return ResponseEntity.notFound().build(); // Retorna 404 se o ID não existir
    }
}
