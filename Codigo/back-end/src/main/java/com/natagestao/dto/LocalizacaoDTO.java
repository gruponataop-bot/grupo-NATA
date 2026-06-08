package com.natagestao.dto;

import java.time.LocalDateTime;

public class LocalizacaoDTO {
    private String placa;
    private double latitude;
    private double longitude;
    private double velocidade;
    private boolean ignicaoLigada;
    private LocalDateTime dataHora;

    // Construtor vazio
    public LocalizacaoDTO() {}

    // Getters e Setters
    public String getPlaca() { return placa; }
    public void setPlaca(String placa) { this.placa = placa; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public double getVelocidade() { return velocidade; }
    public void setVelocidade(double velocidade) { this.velocidade = velocidade; }

    public boolean isIgnicaoLigada() { return ignicaoLigada; }
    public void setIgnicaoLigada(boolean ignicaoLigada) { this.ignicaoLigada = ignicaoLigada; }

    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
}