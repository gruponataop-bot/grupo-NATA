package com.natagestao.controllers;

import com.natagestao.dto.LoginRequest;
import com.natagestao.models.Funcionario;
import com.natagestao.repository.FuncionarioRepository;
import com.natagestao.services.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.text.Normalizer;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Importante para o JavaScript conseguir acessar
public class AuthController {

    @Autowired
    private FuncionarioRepository repository;

    private static final Map<String, TokenRedefinicaoSenha> tokensRedefinicao = new ConcurrentHashMap<>();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest dados) {
        String email = normalizar(dados.getEmail());
        String senha = normalizar(dados.getSenha());
        String cargo = normalizar(dados.getCargo());

        if (email.isEmpty() || senha.isEmpty() || cargo.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciais invalidas");
        }
        // Busca o funcionário (retorna Optional)
        Optional<Funcionario> funcionarioOpt = repository.buscarPorEmailLogin(email);

        // Verifica se o funcionário existe
        if (funcionarioOpt.isPresent()) {
            Funcionario funcionario = funcionarioOpt.get();

            // Valida senha e cargo
            if (normalizar(funcionario.getSenha()).equals(senha) &&
                normalizarCargo(funcionario.getCargo()).equals(normalizarCargo(cargo))) {
                
                // Retorna o objeto funcionário (ou um LoginResponse se preferir filtrar dados)
                return ResponseEntity.ok(funcionario); 
            }
        }

        // Se chegar aqui, ou o email não existe, ou a senha/cargo estão errados
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciais inválidas");
    }
    @Autowired
    private EmailService emailService;
    @PostMapping("/esqueci-senha")
public ResponseEntity<String> esqueciSenha(@RequestBody LoginRequest request) {
    Optional<Funcionario> funcionarioOpt =
            repository.buscarPorEmailLogin(normalizar(request.getEmail()));

    if (funcionarioOpt.isEmpty()) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body("E-mail não encontrado.");
    }

    Funcionario funcionario = funcionarioOpt.get();

    // Gera um token único
    String token = java.util.UUID.randomUUID().toString();

    tokensRedefinicao.put(
            token,
            new TokenRedefinicaoSenha(funcionario.getEmail(), LocalDateTime.now().plusMinutes(15))
    );

    // Envia o e-mail com o link
    emailService.enviarEmailRedefinirSenha(
            funcionario.getEmail(),
            funcionario.getNome_funcionario(),
            token
    );

    return ResponseEntity.ok("E-mail de recuperação enviado com sucesso.");
}

@PostMapping("/redefinir-senha")
public ResponseEntity<String> redefinirSenha(@RequestBody Map<String, String> request) {
    String token = request.get("token");
    String novaSenha = request.get("novaSenha");

    if (token == null || token.isBlank()) {
        return ResponseEntity.badRequest().body("Token não informado.");
    }

    if (novaSenha == null || novaSenha.length() < 6) {
        return ResponseEntity.badRequest().body("A senha deve ter pelo menos 6 caracteres.");
    }

    TokenRedefinicaoSenha dadosToken = tokensRedefinicao.get(token);

    if (dadosToken == null) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Link inválido ou expirado.");
    }

    if (dadosToken.expiracao().isBefore(LocalDateTime.now())) {
        tokensRedefinicao.remove(token);
        return ResponseEntity.status(HttpStatus.GONE).body("Link expirado. Solicite uma nova recuperação de senha.");
    }

    Optional<Funcionario> funcionarioOpt = repository.buscarPorEmailLogin(dadosToken.email());

    if (funcionarioOpt.isEmpty()) {
        tokensRedefinicao.remove(token);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Funcionário não encontrado.");
    }

    Funcionario funcionario = funcionarioOpt.get();
    funcionario.setSenha(novaSenha);
    repository.save(funcionario);
    tokensRedefinicao.remove(token);

    return ResponseEntity.ok("Senha redefinida com sucesso.");
}

private record TokenRedefinicaoSenha(String email, LocalDateTime expiracao) {
}

private String normalizar(String valor) {
    return valor == null ? "" : valor.trim();
}

private String normalizarCargo(String cargo) {
    String valor = Normalizer.normalize(normalizar(cargo), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase();

    if (valor.equals("administrador")) {
        return "administrativo";
    }

    return valor;
}
}
