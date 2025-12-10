package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.DTO.CompleteProfileRequest;
import com.gpmonde.backgp.DTO.LoginRequest;
import com.gpmonde.backgp.DTO.RegistrationRequest;
import com.gpmonde.backgp.DTO.ResetPasswordRequest;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Entities.VerificationTokenRegister;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import com.gpmonde.backgp.Repositorys.VerificationTokenRepositoryRegister;
import com.gpmonde.backgp.Services.AuthService;
import com.gpmonde.backgp.Services.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RequiredArgsConstructor
@RequestMapping("/api/auth")
@RestController
@Tag(name = "Authentification")
public class AuthController {

    private final AuthService authService;
    private final UtilisateurService utilisateurService;
    private final VerificationTokenRepositoryRegister verificationTokenRegister;
    private final UtilisateurRepository utilisateurRepository;

    @PostMapping("/login")
    @Operation(summary = "Connexion")
    public ResponseEntity<?> login(@RequestBody LoginRequest credentials) {
        return authService.login(credentials.getEmail(), credentials.getPassword());
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Déconnexion réussie"));
    }

    @PostMapping("/register")
    @Operation(summary = "Inscription utilisateur simple")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest request) {
        try {
            Utilisateur user = utilisateurService.registerUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Inscription réussie. Vérifiez votre email.",
                    "userId", user.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register-agent")
    @Operation(summary = "Inscription AgentGP avec fichiers")
    public ResponseEntity<?> registerAgent(
            @RequestParam("username") String username,
            @RequestParam("password") String password,
            @RequestParam("email") String email,
            @RequestParam("nomagence") String nomagence,
            @RequestParam("adresse") String adresse,
            @RequestParam("telephone") String telephone,
            @RequestParam(value = "destinations", required = false) String destinations,
            @RequestParam("logo") MultipartFile logo,
            @RequestParam("carteIdentite") MultipartFile carteIdentite) {

        try {
            RegistrationRequest request = new RegistrationRequest();
            request.setUsername(username);
            request.setPassword(password);
            request.setEmail(email);
            request.setNomagence(nomagence);
            request.setAdresse(adresse);
            request.setTelephone(telephone);
            request.setDestinations(destinations);

            Utilisateur user = utilisateurService.registerAgentGp(
                    request, logo, carteIdentite
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Inscription AgentGP réussie. Vérifiez votre email.",
                    "userId", user.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/complete-profile")
    @Operation(summary = "Compléter le profil (OAuth2 users)")
    public ResponseEntity<?> completeProfile(
            @RequestParam("nomagence") String nomagence,
            @RequestParam("adresse") String adresse,
            @RequestParam("telephone") String telephone,
            @RequestParam(value = "destinations", required = false) String destinations,
            @RequestParam("logo") MultipartFile logo,
            @RequestParam("carteIdentite") MultipartFile carteIdentite) {

        try {
            CompleteProfileRequest request = new CompleteProfileRequest();
            request.setNomagence(nomagence);
            request.setAdresse(adresse);
            request.setTelephone(telephone);
            request.setDestinations(destinations);

            Utilisateur user = utilisateurService.completeProfile(
                    request, logo, carteIdentite
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Profil complété avec succès",
                    "hasCompleteProfile", user.hasCompleteProfile()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/verify")
    @Operation(summary = "Vérification email")
    public ResponseEntity<String> verifyAccount(@RequestParam String token) {
        VerificationTokenRegister verificationToken =
                verificationTokenRegister.findByToken(token);

        if (verificationToken == null || verificationToken.isExpired()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Token invalide ou expiré.");
        }

        Utilisateur user = verificationToken.getUser();
        user.setEnabled(true);
        utilisateurRepository.save(user);

        verificationTokenRegister.delete(verificationToken);
        return ResponseEntity.ok("Compte vérifié avec succès !");
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Mot de passe oublié")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @RequestBody Map<String, String> request) {

        String email = request.get("email");
        utilisateurService.generateResetToken(email);

        return ResponseEntity.ok(Map.of(
                "message", "Un lien de réinitialisation a été envoyé à votre e-mail."
        ));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Réinitialiser le mot de passe")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestBody ResetPasswordRequest request) {

        utilisateurService.resetPassword(
                request.getToken(),
                request.getNewPassword()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Mot de passe réinitialisé avec succès."
        ));
    }
}