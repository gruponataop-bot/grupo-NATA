package com.natagestao.services;

import com.natagestao.dto.LoginRequest;
import com.natagestao.dto.LoginResponse;
import com.natagestao.models.Funcionario;
import com.natagestao.repository.FuncionarioRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final FuncionarioRepository funcionarioRepository;
    private final PasswordService passwordService;

    public AuthService(FuncionarioRepository funcionarioRepository, PasswordService passwordService) {
        this.funcionarioRepository = funcionarioRepository;
        this.passwordService = passwordService;
    }

    public LoginResponse login(LoginRequest request) {
        String email = normalizar(request.getEmail());
        String senha = normalizar(request.getSenha());

        Funcionario funcionario = funcionarioRepository.buscarPorEmailLogin(email)
                .orElseThrow(() -> new RuntimeException("Email nao encontrado."));

        if (!passwordService.corresponde(senha, funcionario.getSenha())) {
            throw new RuntimeException("Senha invalida.");
        }

        if (!passwordService.ehHashBcrypt(funcionario.getSenha())) {
            funcionario.setSenha(passwordService.gerarHash(senha));
            funcionarioRepository.save(funcionario);
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
