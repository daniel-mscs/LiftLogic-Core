package com.daniel.workout.controller;

import com.daniel.workout.model.TreinoFinalizado;
import com.daniel.workout.model.Usuario;
import com.daniel.workout.repository.TreinoFinalizadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/treinos-finalizados")
@CrossOrigin(origins = "*")
public class TreinoFinalizadoController {

    @Autowired
    private TreinoFinalizadoRepository repo;

    private Usuario getUsuarioLogado() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Usuario) return (Usuario) principal;
        return null;
    }

    @PostMapping
    public ResponseEntity<?> salvar(@RequestBody TreinoFinalizado treino) {
        Usuario usuario = getUsuarioLogado();
        if (usuario == null) return ResponseEntity.status(401).body("Usuário não autenticado");

        treino.setUsuario(usuario);

        if (treino.getDataFinalizacao() == null) {
            treino.setDataFinalizacao(LocalDateTime.now());
        }

        TreinoFinalizado salvo = repo.save(treino);
        return ResponseEntity.ok(salvo);
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        Usuario usuario = getUsuarioLogado();
        if (usuario == null) return ResponseEntity.status(401).body("Usuário não autenticado");
        List<TreinoFinalizado> lista = repo.findByUsuario_Id(usuario.getId());
        return ResponseEntity.ok(lista);
    }
}