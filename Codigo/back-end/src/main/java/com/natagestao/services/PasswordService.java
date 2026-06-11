package com.natagestao.services;

import java.security.SecureRandom;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {

    private static final String CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final int TAMANHO_SENHA_TEMPORARIA = 12;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom secureRandom = new SecureRandom();

    public String gerarSenhaTemporaria() {
        StringBuilder senha = new StringBuilder(TAMANHO_SENHA_TEMPORARIA);
        for (int i = 0; i < TAMANHO_SENHA_TEMPORARIA; i++) {
            senha.append(CARACTERES.charAt(secureRandom.nextInt(CARACTERES.length())));
        }
        return senha.toString();
    }

    public String gerarHash(String senha) {
        return passwordEncoder.encode(senha);
    }

    public boolean corresponde(String senhaInformada, String senhaArmazenada) {
        if (senhaInformada == null || senhaArmazenada == null) {
            return false;
        }
        if (ehHashBcrypt(senhaArmazenada)) {
            return passwordEncoder.matches(senhaInformada, senhaArmazenada);
        }
        return senhaArmazenada.equals(senhaInformada);
    }

    public boolean ehHashBcrypt(String valor) {
        return valor != null && (valor.startsWith("$2a$") || valor.startsWith("$2b$")
                || valor.startsWith("$2y$"));
    }
}
