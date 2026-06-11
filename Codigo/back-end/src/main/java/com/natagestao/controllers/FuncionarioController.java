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
import com.natagestao.services.PasswordService;

@RestController
@RequestMapping("/api/funcionarios")
@CrossOrigin(origins = "*", exposedHeaders = "X-Email-Sent")
public class FuncionarioController {

    @Autowired
    private FuncionarioRepository repository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordService passwordService;

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
            String senhaTemporaria = passwordService.gerarSenhaTemporaria();
            funcionario.setSenha(passwordService.gerarHash(senhaTemporaria));
            Funcionario salvo = repository.save(funcionario);
            boolean emailEnviado = true;

            try {
                emailService.enviarEmailSenha(funcionario.getEmail(), funcionario.getNome_funcionario(), senhaTemporaria);
            } catch (Exception e) {
                emailEnviado = false;
                System.err.println("Funcionario cadastrado, mas o e-mail de senha nao foi enviado: " + e.getMessage());
                e.printStackTrace();
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .header("X-Email-Sent", Boolean.toString(emailEnviado))
                    .body(salvo);
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
                    if (dadosNovos.getSenha() != null && !dadosNovos.getSenha().isBlank()) {
                        p.setSenha(passwordService.gerarHash(dadosNovos.getSenha().trim()));
                    }
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
