package com.natagestao.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.natagestao.models.Funcionario;
import com.natagestao.repository.FuncionarioRepository;
import com.natagestao.services.EmailService;

@RestController
@RequestMapping("/api/funcionarios")
@CrossOrigin(origins = "*")
public class FuncionarioController {

    @Autowired
    private FuncionarioRepository repository;

    @Autowired
    private EmailService emailService;

    // Listar todos
    @GetMapping
    public List<Funcionario> listarTodos() {
        return repository.findAll();
    }

    // Buscar por ID
    @GetMapping("/{id}")
    public ResponseEntity<Funcionario> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Criar novo funcionário
    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Funcionario funcionario) {
        normalizarFuncionario(funcionario);

        if (repository.existsByEmail(funcionario.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Ja existe um funcionario cadastrado com este e-mail.");
        }

        if (repository.existsByCpf(funcionario.getCpf())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Ja existe um funcionario cadastrado com este CPF.");
        }

        try {
            Funcionario salvo = repository.save(funcionario);

            try {
                emailService.enviarEmailSenha(funcionario.getEmail(), funcionario.getNome_funcionario(), funcionario.getSenha());
            } catch (Exception e) {
                System.err.println("Funcionario cadastrado, mas o e-mail de senha nao foi enviado: " + e.getMessage());
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("CPF ou e-mail ja cadastrado para outro funcionario.");
        }
    }

    // Atualizar participante (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<Funcionario> atualizar(@PathVariable Long id, @RequestBody Funcionario dadosNovos) {
        normalizarFuncionario(dadosNovos);

        return repository.findById(id)
                .map(p -> {
                    p.setNome_funcionario(dadosNovos.getNome_funcionario());
                    p.setCargo(dadosNovos.getCargo());
                    p.setCpf(dadosNovos.getCpf());
                    p.setEmail(dadosNovos.getEmail());
                    p.setSenha(dadosNovos.getSenha());
                    p.setTelefone(dadosNovos.getTelefone());

                    return ResponseEntity.ok(repository.save(p));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Deletar participante
    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        try {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Retorna 409 quando há vínculo com outras tabelas (como projetos)
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("Este funcionário possui projetos vinculados.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erro ao excluir funcionário.");
        }
    }

    // Buscar participantes por nome
    @GetMapping("/buscar")
    public List<Funcionario> buscar(@RequestParam String q) {
        return repository.findAll().stream()
            .filter(p -> p.getNome_funcionario() != null &&
                         p.getNome_funcionario().toLowerCase().contains(q.toLowerCase()))
            .collect(Collectors.toList());
    }

    private void normalizarFuncionario(Funcionario funcionario) {
        if (funcionario.getEmail() != null) {
            funcionario.setEmail(funcionario.getEmail().trim());
        }
        if (funcionario.getCargo() != null) {
            funcionario.setCargo(funcionario.getCargo().trim());
        }
        if (funcionario.getSenha() != null) {
            funcionario.setSenha(funcionario.getSenha().trim());
        }
    }

}
