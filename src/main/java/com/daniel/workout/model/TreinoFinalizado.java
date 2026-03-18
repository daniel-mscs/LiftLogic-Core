package com.daniel.workout.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "treinos_finalizados")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TreinoFinalizado {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // guarda a letra da divisão (A,B,C...) ou nome
    private String treino;

    // tempo total do treino em segundos
    private Long tempoSegundos;

    private Long volumeTotal;

    private LocalDateTime dataFinalizacao;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
}