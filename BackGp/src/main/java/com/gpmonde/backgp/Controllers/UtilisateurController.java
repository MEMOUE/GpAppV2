package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Services.UtilisateurService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
@Tag(name = "Utilisateur")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Crée un nouvel utilisateur avec le rôle par défaut ROLE_USER.
     *
     * @param utilisateur L'utilisateur à créer.
     * @return L'utilisateur créé.
     */
    @PostMapping
    public Utilisateur createUtilisateur(@RequestBody Utilisateur utilisateur) {
        return utilisateurService.save(utilisateur);
    }

    /**
     * Récupère tous les utilisateurs.
     *
     * @return La liste des utilisateurs.
     */
    @GetMapping
    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurService.findAll();
    }

    /**
     * Récupère un utilisateur par son ID.
     *
     * @param id L'ID de l'utilisateur.
     * @return L'utilisateur trouvé.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Utilisateur> getUtilisateurById(@PathVariable Long id) {
        return utilisateurService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Met à jour un utilisateur existant.
     *
     * @param utilisateur Les nouvelles données de l'utilisateur.
     * @param id L'ID de l'utilisateur à mettre à jour.
     * @return L'utilisateur mis à jour.
     */
    @PutMapping("/{id}")
    public Utilisateur updateUtilisateur(@RequestBody Utilisateur utilisateur, @PathVariable Long id) {
        return utilisateurService.update(utilisateur, id);
    }

    /**
     * Supprime un utilisateur par ID.
     *
     * @param id L'ID de l'utilisateur à supprimer.
     */
    @DeleteMapping("/{id}")
    public void deleteUtilisateur(@PathVariable Long id) {
        utilisateurService.delete(id);
    }

    /**
     * Change le mot de passe d'un utilisateur.
     *
     * @param id L'ID de l'utilisateur.
     * @param passwords Map contenant currentPassword et newPassword.
     * @return ResponseEntity avec message de succès ou d'erreur.
     */
    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwords
    ) {
        try {
            String currentPassword = passwords.get("currentPassword");
            String newPassword = passwords.get("newPassword");

            Utilisateur user = utilisateurService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // Vérifier le mot de passe actuel
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Mot de passe actuel incorrect"));
            }

            // Mettre à jour le mot de passe
            user.setPassword(passwordEncoder.encode(newPassword));
            utilisateurService.updatePassword(user);

            return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}