package com.natagestao.models;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "residente_projeto")
public class ResidenteProjeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_projeto", nullable = false)
    private Long idProjeto;

    @Column(name = "id_residente", nullable = false)
    private Long idResidente;

    @Column(name = "data_vinculo")
    private LocalDate dataVinculo;

    @Column(nullable = false)
    private String status = "Ativo";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getIdProjeto() { return idProjeto; }
    public void setIdProjeto(Long idProjeto) { this.idProjeto = idProjeto; }
    public Long getIdResidente() { return idResidente; }
    public void setIdResidente(Long idResidente) { this.idResidente = idResidente; }
    public LocalDate getDataVinculo() { return dataVinculo; }
    public void setDataVinculo(LocalDate dataVinculo) { this.dataVinculo = dataVinculo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
