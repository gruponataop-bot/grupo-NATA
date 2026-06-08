package com.natagestao.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "presenca_participante",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_presenca_projeto_participante_data",
            columnNames = {"id_projeto", "id_participante", "data_chamada"}
        )
    }
)
public class PresencaParticipante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_projeto", nullable = false)
    private Long idProjeto;

    @Column(name = "id_participante", nullable = false)
    private Long idParticipante;

    @Column(name = "data_chamada", nullable = false)
    private LocalDate dataChamada;

    @Column(nullable = false)
    private Boolean presente = false;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "registrado_por")
    private Long registradoPor;

    @Column(name = "registrado_em")
    private LocalDateTime registradoEm;

    @PrePersist
    @PreUpdate
    public void marcarRegistro() {
        this.registradoEm = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdProjeto() { return idProjeto; }
    public void setIdProjeto(Long idProjeto) { this.idProjeto = idProjeto; }

    public Long getIdParticipante() { return idParticipante; }
    public void setIdParticipante(Long idParticipante) { this.idParticipante = idParticipante; }

    public LocalDate getDataChamada() { return dataChamada; }
    public void setDataChamada(LocalDate dataChamada) { this.dataChamada = dataChamada; }

    public Boolean getPresente() { return presente; }
    public void setPresente(Boolean presente) { this.presente = presente; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }

    public Long getRegistradoPor() { return registradoPor; }
    public void setRegistradoPor(Long registradoPor) { this.registradoPor = registradoPor; }

    public LocalDateTime getRegistradoEm() { return registradoEm; }
    public void setRegistradoEm(LocalDateTime registradoEm) { this.registradoEm = registradoEm; }
}