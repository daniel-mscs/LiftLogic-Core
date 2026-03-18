package com.daniel.workout.repository;

import com.daniel.workout.model.Exercicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExercicioRepository extends JpaRepository<Exercicio, Long> {

    // métodos compatíveis com o controller anterior
    List<Exercicio> findByUsuario_Id(Long usuarioId);
    List<Exercicio> findByUsuario_IdAndTreino(Long usuarioId, String treino);

    // versões em camelCase (alternativa)
    List<Exercicio> findByUsuarioId(Long usuarioId);
    List<Exercicio> findByUsuarioIdAndTreino(Long usuarioId, String treino);
}