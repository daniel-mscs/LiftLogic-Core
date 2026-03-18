package com.daniel.workout.controller;

import com.daniel.workout.model.Exercicio;
import com.daniel.workout.model.Usuario;
import com.daniel.workout.repository.ExercicioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/exercicios")
@CrossOrigin(origins = "*")
public class ExercicioController {

    @Autowired
    private ExercicioRepository exercicioRepository;

    // Helper: pega o usuário logado do SecurityContext (JwtFilter coloca o Usuario como principal)
    private Usuario getUsuarioLogado() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Usuario) {
            return (Usuario) principal;
        }
        return null;
    }

    // GET /api/exercicios?treino=A  -> lista exercícios do usuário (opcional filtrar por treino)
    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(required = false) String treino) {
        Usuario usuario = getUsuarioLogado();
        if (usuario == null) {
            return ResponseEntity.status(401).body("Usuário não autenticado");
        }

        List<Exercicio> lista = (treino == null || treino.isBlank())
                ? exercicioRepository.findByUsuario_Id(usuario.getId())
                : exercicioRepository.findByUsuario_IdAndTreino(usuario.getId(), treino);

        return ResponseEntity.ok(lista);
    }

    // POST /api/exercicios  -> cria exercicio e vincula ao usuário logado
    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Exercicio exercicio) {
        Usuario usuario = getUsuarioLogado();
        if (usuario == null) {
            return ResponseEntity.status(401).body("Usuário não autenticado");
        }

        exercicio.setUsuario(usuario);
        Exercicio salvo = exercicioRepository.save(exercicio);
        return ResponseEntity.ok(salvo);
    }

    // PATCH /api/exercicios/{id} -> atualiza campos permitidos (series, repeticoes, carga, nome, grupoMuscular, treino)
    @PatchMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Usuario usuario = getUsuarioLogado();
        if (usuario == null) {
            return ResponseEntity.status(401).body("Usuário não autenticado");
        }

        Optional<Exercicio> opt = exercicioRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Exercicio ex = opt.get();
        // verifica dono
        if (ex.getUsuario() == null || !ex.getUsuario().getId().equals(usuario.getId())) {
            return ResponseEntity.status(403).body("Não autorizado a editar este exercício");
        }

        // aplica updates (verificando os tipos)
        if (updates.containsKey("nome")) ex.setNome((String) updates.get("nome"));
        if (updates.containsKey("grupoMuscular")) ex.setGrupoMuscular((String) updates.get("grupoMuscular"));
        if (updates.containsKey("series")) ex.setSeries(parseInteger(updates.get("series")));
        if (updates.containsKey("repeticoes")) ex.setRepeticoes(parseInteger(updates.get("repeticoes")));
        if (updates.containsKey("carga")) ex.setCarga(parseDouble(updates.get("carga")));
        if (updates.containsKey("treino")) ex.setTreino((String) updates.get("treino"));

        Exercicio atualizado = exercicioRepository.save(ex);
        return ResponseEntity.ok(atualizado);
    }

    // DELETE /api/exercicios/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        Usuario usuario = getUsuarioLogado();
        if (usuario == null) {
            return ResponseEntity.status(401).body("Usuário não autenticado");
        }

        Optional<Exercicio> opt = exercicioRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Exercicio ex = opt.get();
        if (ex.getUsuario() == null || !ex.getUsuario().getId().equals(usuario.getId())) {
            return ResponseEntity.status(403).body("Não autorizado a deletar este exercício");
        }

        exercicioRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // helpers para conversão segura
    private Integer parseInteger(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).intValue();
        try { return Integer.parseInt(o.toString()); } catch (Exception e) { return null; }
    }

    private Double parseDouble(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).doubleValue();
        try { return Double.parseDouble(o.toString()); } catch (Exception e) { return null; }
    }
}