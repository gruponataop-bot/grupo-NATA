package com.natagestao.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "site_config")
public class SiteConfig {

    @Id
    @Column(length = 80)
    private String chave;

    @Column(columnDefinition = "TEXT")
    private String valor;

    public SiteConfig() {
    }

    public SiteConfig(String chave, String valor) {
        this.chave = chave;
        this.valor = valor;
    }

    public String getChave() {
        return chave;
    }

    public void setChave(String chave) {
        this.chave = chave;
    }

    public String getValor() {
        return valor;
    }

    public void setValor(String valor) {
        this.valor = valor;
    }
}
