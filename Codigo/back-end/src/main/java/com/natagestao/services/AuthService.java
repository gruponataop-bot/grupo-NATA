package com.natagestao.services;

import com.natagestao.dto.LoginRequest;
import com.natagestao.dto.LoginResponse;
import com.natagestao.models.Funcionario;
import com.natagestao.repository.FuncionarioRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final FuncionarioRepository funcionarioRepository;

    public AuthService(FuncionarioRepository funcionarioRepository) {
        this.funcionarioRepository = funcionarioRepository;
    }

    public LoginResponse login(LoginRequest request) {
        String email = normalizar(request.getEmail());
        String senha = normalizar(request.getSenha());

        Funcionario funcionario = funcionarioRepository.buscarPorEmailLogin(email)
                .orElseThrow(() -> new RuntimeException("Email nao encontrado."));

        if (!normalizar(funcionario.getSenha()).equals(senha)) {
            throw new RuntimeException("Senha invalida.");
        }

        return new LoginResponse(
                funcionario.getId_funcionario(),
                funcionario.getNome_funcionario(),
                funcionario.getEmail(),
                funcionario.getCargo(),
                "Login realizado com sucesso."
        );
    }

    private String normalizar(String valor) {
        return valor == null ? "" : valor.trim();
    }
}
