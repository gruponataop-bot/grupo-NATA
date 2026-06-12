package com.natagestao.controllers;

import java.text.Normalizer;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

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
        String operacaoId = UUID.randomUUID().toString().substring(0, 8);
        String email = normalizar(request == null ? null : request.getEmail());
        String token = null;

        try {
            logger.info("[recuperacao-senha:{}] Solicitacao recebida para {}", operacaoId, mascararEmail(email));

            Optional<Funcionario> funcionarioOpt = repository.buscarPorEmailLogin(email);
            if (funcionarioOpt.isEmpty()) {
                logger.info("[recuperacao-senha:{}] E-mail nao encontrado", operacaoId);
                return ResponseEntity.ok("Se o e-mail estiver cadastrado, o link de recuperacao sera enviado.");
            }

            Funcionario funcionario = funcionarioOpt.get();
            logger.info("[recuperacao-senha:{}] Funcionario encontrado; criando token", operacaoId);
            token = tokenService.criar(funcionario.getEmail());
            logger.info("[recuperacao-senha:{}] Token criado; enviando e-mail pelo Brevo", operacaoId);

            String messageId = emailService.enviarEmailRedefinirSenha(
                    funcionario.getEmail(),
                    funcionario.getNome_funcionario(),
                    token);
            logger.info("[recuperacao-senha:{}] E-mail aceito pelo Brevo; messageId={}", operacaoId, messageId);
        } catch (Exception e) {
            logger.error("[recuperacao-senha:{}] Falha no fluxo: {}", operacaoId, mensagemErro(e), e);
            if (token != null) {
                removerTokenAposFalha(token, operacaoId);
            }
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("Nao foi possivel concluir a recuperacao. Codigo: " + operacaoId);
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

    private void removerTokenAposFalha(String token, String operacaoId) {
        try {
            TokenRedefinicaoSenha tokenSalvo = tokenService.buscar(token);
            if (tokenSalvo != null) {
                tokenService.remover(tokenSalvo);
            }
        } catch (Exception e) {
            logger.error("[recuperacao-senha:{}] Nao foi possivel remover o token apos a falha", operacaoId, e);
        }
    }

    private String mensagemErro(Exception erro) {
        return erro.getMessage() == null || erro.getMessage().isBlank()
                ? erro.getClass().getSimpleName()
                : erro.getMessage();
    }

    private String mascararEmail(String email) {
        int arroba = email.indexOf('@');
        if (arroba <= 1) {
            return "***";
        }
        return email.charAt(0) + "***" + email.substring(arroba);
    }

    private String normalizarCargo(String cargo) {
        String valor = Normalizer.normalize(normalizar(cargo), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
        return valor.equals("administrador") ? "administrativo" : valor;
    }
}
