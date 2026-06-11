package com.natagestao.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.natagestao.models.TokenRedefinicaoSenha;
import com.natagestao.repository.TokenRedefinicaoSenhaRepository;

@Service
public class TokenService {

    private final TokenRedefinicaoSenhaRepository repository;

    public TokenService(TokenRedefinicaoSenhaRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public String criar(String email) {
        repository.deleteByEmailIgnoreCase(email);
        String token = UUID.randomUUID().toString();
        repository.save(new TokenRedefinicaoSenha(hash(token), email, LocalDateTime.now().plusMinutes(15)));
        return token;
    }

    public TokenRedefinicaoSenha buscar(String token) {
        return repository.findByTokenHash(hash(token)).orElse(null);
    }

    public boolean expirou(TokenRedefinicaoSenha token) {
        return token.getExpiracao().isBefore(LocalDateTime.now());
    }

    public void remover(TokenRedefinicaoSenha token) {
        repository.delete(token);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponivel.", e);
        }
    }
}
