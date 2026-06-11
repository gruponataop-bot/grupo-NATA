package com.natagestao.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.natagestao.models.TokenRedefinicaoSenha;

public interface TokenRedefinicaoSenhaRepository extends JpaRepository<TokenRedefinicaoSenha, Long> {

    Optional<TokenRedefinicaoSenha> findByTokenHash(String tokenHash);

    void deleteByEmailIgnoreCase(String email);
}
