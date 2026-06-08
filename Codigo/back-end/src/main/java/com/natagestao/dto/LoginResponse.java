package com.natagestao.dto;

public class LoginResponse {

    private Long id;
    private String nome;
    private String email;
    private String tipo;
    private String mensagem;

    public LoginResponse(Long id, String nome, String email, String tipo, String mensagem) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.tipo = tipo;
        this.mensagem = mensagem;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getTipo() {
        return tipo;
    }

    public String getMensagem() {
        return mensagem;
    }
}