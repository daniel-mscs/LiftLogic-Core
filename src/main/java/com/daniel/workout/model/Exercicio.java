package com.daniel.workout.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "exercicios")
@Data
public class Exercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String grupoMuscular;
    private Integer series;
    private Integer repeticoes;
    private Double carga;
    private String treino;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    @JsonIgnore // Importante para não dar erro de loop infinito no JSON
    private Usuario usuario;
}