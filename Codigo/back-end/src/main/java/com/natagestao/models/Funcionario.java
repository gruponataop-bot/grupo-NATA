package com.natagestao.models;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name = "funcionario")
public class Funcionario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("id_funcionario")
    @JsonAlias({ "id" })
    private Long id_funcionario;

    @Column(nullable = false, length = 150)
    private String nome_funcionario;

    @Column(nullable = false, unique = true, length = 14)
    private String cpf;

    @Column(length = 15)
    private String telefone;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String cargo;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    public Long getId_funcionario () {return id_funcionario;}
    public void setId_funcionario (Long id) {id_funcionario=id;}
    public String getNome_funcionario () {return nome_funcionario;}
    public void setNome_funcionario (String nome) {nome_funcionario=nome;}
    public String getCpf () {return cpf;}
    public void setCpf (String cpf) {this.cpf=cpf;}
    public String getTelefone () {return telefone;}
    public void setTelefone (String telefone) {this.telefone=telefone;}
    public String getEmail () {return email;}
    public void setEmail (String email) {this.email=email;}
    public String getCargo () {return cargo;}
    public void setCargo (String cargo) {this.cargo=cargo;}
    public String getSenha () {return senha;}
    public void setSenha (String senha) {this.senha=senha;}
}
