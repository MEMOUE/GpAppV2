package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Services.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
@Tag(name = "Utilisateurs")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @Operation(summary = "Liste tous les utilisateurs")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurService.findAll();
    }

    @GetMapping("/agents")
    @Operation(summary = "Liste tous les agents GP")
    public List<Utilisateur> getAllAgents() {
        return utilisateurService.findAllAgents();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupère un utilisateur par ID")
    public ResponseEntity<Utilisateur> getUtilisateurById(@PathVariable Long id) {
        return utilisateurService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Met à jour un utilisateur")
    public Utilisateur updateUtilisateur(
            @RequestBody Utilisateur utilisateur,
            @PathVariable Long id) {
        return utilisateurService.update(utilisateur, id);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprime un utilisateur")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUtilisateur(@PathVariable Long id) {
        utilisateurService.delete(id);
    }

    @PostMapping("/{id}/change-password")
    @Operation(summary = "Change le mot de passe")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwords) {

        try {
            String currentPassword = passwords.get("currentPassword");
            String newPassword = passwords.get("newPassword");

            Utilisateur user = utilisateurService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // Vérifier que l'utilisateur a un mot de passe (pas OAuth2)
            if (user.isOAuth2User()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error",
                                "Impossible de changer le mot de passe pour un compte OAuth2"));
            }

            // Vérifier le mot de passe actuel
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Mot de passe actuel incorrect"));
            }

            // Mettre à jour le mot de passe
            user.setPassword(passwordEncoder.encode(newPassword));
            utilisateurService.updatePassword(user);

            return ResponseEntity.ok(Map.of(
                    "message", "Mot de passe modifié avec succès"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}