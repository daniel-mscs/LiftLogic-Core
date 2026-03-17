package com.daniel.workout.controller;

import com.daniel.workout.model.Exercicio;
import com.daniel.workout.repository.ExercicioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exercicios")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ExercicioController {

    @Autowired
    private ExercicioRepository repository;

    @GetMapping
    public List<Exercicio> listarTodos() {
        return repository.findAll();
    }

    @PostMapping
    public Exercicio salvar(@RequestBody Exercicio exercicio) {
        return repository.save(exercicio);
    }

    @PutMapping("/{id}")
    public Exercicio atualizar(@PathVariable Long id, @RequestBody Exercicio exercicioAtualizado) {
        return repository.findById(id)
                .map(exercicio -> {
                    exercicio.setCarga(exercicioAtualizado.getCarga());
                    return repository.save(exercicio);
                }).orElseThrow(() -> new RuntimeException("Exercício não encontrado!"));
    }

    @PatchMapping("/{id}")
    public Exercicio atualizarParcial(@PathVariable Long id, @RequestBody Map<String, Object> campos) {
        Exercicio exercicio = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercício não encontrado!"));

        if (campos.containsKey("carga")) {
            exercicio.setCarga(Double.parseDouble(campos.get("carga").toString()));
        }
        if (campos.containsKey("repeticoes")) {
            exercicio.setRepeticoes(Integer.parseInt(campos.get("repeticoes").toString()));
        }
        if (campos.containsKey("series")) {
            exercicio.setSeries(Integer.parseInt(campos.get("series").toString()));
        }

        return repository.save(exercicio);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        repository.deleteById(id);
    }
}