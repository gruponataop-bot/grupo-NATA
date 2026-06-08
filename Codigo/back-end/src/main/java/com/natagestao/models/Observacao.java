package com.natagestao.models;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "observacoes")
public class Observacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_autor")
    private Long idAutor;

    @Column(name = "nome_autor")
    private String nomeAutor;

    @Column(name = "data_registro")
    private LocalDate dataRegistro;

    @Column(columnDefinition = "TEXT")
    private String texto;

    @Column(name = "tipo_usuario")
    private String tipoUsuario; // "residente" ou "participante"

    @Column(name = "id_usuario_relacionado")
    private Long idUsuarioRelacionado;

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdAutor() { return idAutor; }
    public void setIdAutor(Long idAutor) { this.idAutor = idAutor; }

    public String getNomeAutor() { return nomeAutor; }
    public void setNomeAutor(String nomeAutor) { this.nomeAutor = nomeAutor; }

    public LocalDate getDataRegistro() { return dataRegistro; }
    public void setDataRegistro(LocalDate dataRegistro) { this.dataRegistro = dataRegistro; }

    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }

    public String getTipoUsuario() { return tipoUsuario; }
    public void setTipoUsuario(String tipoUsuario) { this.tipoUsuario = tipoUsuario; }

    public Long getIdUsuarioRelacionado() { return idUsuarioRelacionado; }
    public void setIdUsuarioRelacionado(Long idUsuarioRelacionado) { this.idUsuarioRelacionado = idUsuarioRelacionado; }
}