package com.natagestao.controllers;

import java.text.Normalizer;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.natagestao.dto.LoginRequest;
import com.natagestao.models.Funcionario;
import com.natagestao.models.TokenRedefinicaoSenha;
import com.natagestao.repository.FuncionarioRepository;
import com.natagestao.services.EmailService;
import com.natagestao.services.PasswordService;
import com.natagestao.services.TokenService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final FuncionarioRepository repository;
    private final EmailService emailService;
    private final PasswordService passwordService;
    private final TokenService tokenService;

    public AuthController(FuncionarioRepository repository, EmailService emailService,
            PasswordService passwordService, TokenService tokenService) {
        this.repository = repository;
        this.emailService = emailService;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest dados) {
        String email = normalizar(dados.getEmail());
        String senha = normalizar(dados.getSenha());
        String cargo = normalizar(dados.getCargo());

        if (email.isEmpty() || senha.isEmpty() || cargo.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciais invalidas.");
        }

        Optional<Funcionario> funcionarioOpt = repository.buscarPorEmailLogin(email);
        if (funcionarioOpt.isPresent()) {
            Funcionario funcionario = funcionarioOpt.get();
            boolean senhaValida = passwordService.corresponde(senha, funcionario.getSenha());
            boolean cargoValido = normalizarCargo(funcionario.getCargo()).equals(normalizarCargo(cargo));

            if (senhaValida && cargoValido) {
                migrarSenhaLegada(funcionario, senha);
                return ResponseEntity.ok(funcionario);
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciais invalidas.");
    }

    @PostMapping("/esqueci-senha")
    public ResponseEntity<String> esqueciSenha(@RequestBody LoginRequest request) {
        Optional<Funcionario> funcionarioOpt = repository.buscarPorEmailLogin(normalizar(request.getEmail()));
        if (funcionarioOpt.isEmpty()) {
            return ResponseEntity.ok("Se o e-mail estiver cadastrado, o link de recuperacao sera enviado.");
        }

        Funcionario funcionario = funcionarioOpt.get();
        String token = tokenService.criar(funcionario.getEmail());

        try {
            emailService.enviarEmailRedefinirSenha(funcionario.getEmail(), funcionario.getNome_funcionario(), token);
        } catch (RuntimeException e) {
            TokenRedefinicaoSenha tokenSalvo = tokenService.buscar(token);
            if (tokenSalvo != null) {
                tokenService.remover(tokenSalvo);
            }
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("Nao foi possivel enviar o e-mail. Verifique a configuracao do Resend.");
        }

        return ResponseEntity.ok("Se o e-mail estiver cadastrado, o link de recuperacao sera enviado.");
    }

    @PostMapping("/redefinir-senha")
    public ResponseEntity<String> redefinirSenha(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String novaSenha = request.get("novaSenha");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body("Token nao informado.");
        }
        if (novaSenha == null || novaSenha.length() < 8) {
            return ResponseEntity.badRequest().body("A senha deve ter pelo menos 8 caracteres.");
        }

        TokenRedefinicaoSenha tokenSalvo = tokenService.buscar(token);
        if (tokenSalvo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Link invalido ou expirado.");
        }
        if (tokenService.expirou(tokenSalvo)) {
            tokenService.remover(tokenSalvo);
            return ResponseEntity.status(HttpStatus.GONE).body("Link expirado. Solicite uma nova recuperacao.");
        }

        Optional<Funcionario> funcionarioOpt = repository.buscarPorEmailLogin(tokenSalvo.getEmail());
        if (funcionarioOpt.isEmpty()) {
            tokenService.remover(tokenSalvo);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Funcionario nao encontrado.");
        }

        Funcionario funcionario = funcionarioOpt.get();
        funcionario.setSenha(passwordService.gerarHash(novaSenha));
        repository.save(funcionario);
        tokenService.remover(tokenSalvo);
        return ResponseEntity.ok("Senha redefinida com sucesso.");
    }

    private void migrarSenhaLegada(Funcionario funcionario, String senha) {
        if (!passwordService.ehHashBcrypt(funcionario.getSenha())) {
            funcionario.setSenha(passwordService.gerarHash(senha));
            repository.save(funcionario);
        }
    }

    private String normalizar(String valor) {
        return valor == null ? "" : valor.trim();
    }

    private String normalizarCargo(String cargo) {
        String valor = Normalizer.normalize(normalizar(cargo), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
        return valor.equals("administrador") ? "administrativo" : valor;
    }
}
