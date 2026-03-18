package com.daniel.workout.repository;

import com.daniel.workout.model.TreinoFinalizado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TreinoFinalizadoRepository extends JpaRepository<TreinoFinalizado, Long> {
    List<TreinoFinalizado> findByUsuario_Id(Long usuarioId);
}