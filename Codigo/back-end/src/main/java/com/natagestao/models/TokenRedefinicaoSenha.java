package com.natagestao.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "token_redefinicao_senha")
public class TokenRedefinicaoSenha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private LocalDateTime expiracao;

    protected TokenRedefinicaoSenha() {
    }

    public TokenRedefinicaoSenha(String tokenHash, String email, LocalDateTime expiracao) {
        this.tokenHash = tokenHash;
        this.email = email;
        this.expiracao = expiracao;
    }

    public Long getId() { return id; }
    public String getTokenHash() { return tokenHash; }
    public String getEmail() { return email; }
    public LocalDateTime getExpiracao() { return expiracao; }
}
