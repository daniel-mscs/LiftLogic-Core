package com.daniel.workout.controller;

import com.daniel.workout.model.TreinoFinalizado;
import com.daniel.workout.repository.TreinoFinalizadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/historico")
@CrossOrigin(origins = "*")
public class TreinoFinalizadoController {

    @Autowired
    private TreinoFinalizadoRepository repository;

    @PostMapping
    public TreinoFinalizado salvarTreino(@RequestBody TreinoFinalizado treino) {
        treino.setDataFinalizacao(LocalDateTime.now());
        return repository.save(treino);
    }

    @GetMapping
    public List<TreinoFinalizado> listarHistorico() {
        return repository.findAll();
    }
}