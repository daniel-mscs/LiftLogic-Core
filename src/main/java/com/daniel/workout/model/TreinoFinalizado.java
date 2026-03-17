package com.daniel.workout.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class TreinoFinalizado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String divisao;
    private int tempoSegundos;
    private double volumeTotal;
    private LocalDateTime dataFinalizacao;

    public TreinoFinalizado() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDivisao() { return divisao; }
    public void setDivisao(String divisao) { this.divisao = divisao; }

    public int getTempoSegundos() { return tempoSegundos; }
    public void setTempoSegundos(int tempoSegundos) { this.tempoSegundos = tempoSegundos; }

    public double getVolumeTotal() { return volumeTotal; }
    public void setVolumeTotal(double volumeTotal) { this.volumeTotal = volumeTotal; }

    public LocalDateTime getDataFinalizacao() { return dataFinalizacao; }
    public void setDataFinalizacao(LocalDateTime dataFinalizacao) { this.dataFinalizacao = dataFinalizacao; }
}