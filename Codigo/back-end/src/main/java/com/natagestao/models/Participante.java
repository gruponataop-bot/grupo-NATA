package com.natagestao.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "participantes")
public class Participante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_participant")
    private Long id;

    @Column(name = "nome_participante", nullable = false)
    private String nome;

    @Column(name = "data_nascimento")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataNascimento;

    @Column(name = "serie")
    private String serie;

    @Column(name = "escola")
    private String escola;

    @Column(name = "turno_escolar")
    private String turnoEscolar;

    @Column(name = "necessidades_especiais", columnDefinition = "TEXT")
    private String necessidadesEspeciais;

    // Dados do Responsável
    @Column(name = "nome_responsavel")
    private String nomeResponsavel;

    @Column(name = "parentesco")
    private String parentesco;

    @Column(name = "telefone_responsavel")
    private String telefoneResponsavel;

    @Column(name = "status")
    private String status;

    @Column(name = "endereco", columnDefinition = "TEXT")
    private String endereco;

    // Horários do Reforço
    @Column(name = "horarios_selecionados", columnDefinition = "TEXT")
    private String horariosSelecionados;

    @Column(name = "projeto")
    private String projeto;

    public Participante() {
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public String getSerie() {
        return serie;
    }

    public void setSerie(String serie) {
        this.serie = serie;
    }

    public String getEscola() {
        return escola;
    }

    public void setEscola(String escola) {
        this.escola = escola;
    }

    public String getTurnoEscolar() {
        return turnoEscolar;
    }

    public void setTurnoEscolar(String turnoEscolar) {
        this.turnoEscolar = turnoEscolar;
    }

    public String getNecessidadesEspeciais() {
        return necessidadesEspeciais;
    }

    public void setNecessidadesEspeciais(String necessidadesEspeciais) {
        this.necessidadesEspeciais = necessidadesEspeciais;
    }

    public String getNomeResponsavel() {
        return nomeResponsavel;
    }

    public void setNomeResponsavel(String nomeResponsavel) {
        this.nomeResponsavel = nomeResponsavel;
    }

    public String getParentesco() {
        return parentesco;
    }

    public void setParentesco(String parentesco) {
        this.parentesco = parentesco;
    }

    public String getTelefoneResponsavel() {
        return telefoneResponsavel;
    }

    public void setTelefoneResponsavel(String telefoneResponsavel) {
        this.telefoneResponsavel = telefoneResponsavel;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getHorariosSelecionados() {
        return horariosSelecionados;
    }

    public void setHorariosSelecionados(String horariosSelecionados) {
        this.horariosSelecionados = horariosSelecionados;
    }

    public String getProjeto() {
    return projeto;
}

public void setProjeto(String projeto) {
    this.projeto = projeto;
}

}