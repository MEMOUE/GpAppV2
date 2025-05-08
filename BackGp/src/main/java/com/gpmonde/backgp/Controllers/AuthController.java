package com.gpmonde.backgp.Controllers;


import com.gpmonde.backgp.DTO.LoginRequest;
import com.gpmonde.backgp.DTO.ResetPasswordRequest;
import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Entities.VerificationTokenRegister;
import com.gpmonde.backgp.Repositorys.AgentGPRepository;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import com.gpmonde.backgp.Repositorys.VerificationTokenRepositoryRegister;
import com.gpmonde.backgp.Services.AuthService;
import com.gpmonde.backgp.Services.UtilisateurService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RequiredArgsConstructor
//@CrossOrigin("*")
@RequestMapping("/api/auth")
@RestController
@Tag(name = "Authentification")
public class AuthController {

	private final AuthService authService;
	private final VerificationTokenRepositoryRegister verificationTokenRegister;
	private final UtilisateurRepository utilisateurRepository;
	private final AgentGPRepository agentGPRepository;
	private final UtilisateurService utilisateurService;

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginRequest credentials) {
		return authService.login(credentials.getEmail(), credentials.getPassword());
	}

	@PostMapping("/logout")
	public ResponseEntity<?> logout() {
		return ResponseEntity.ok(Map.of("message", "Déconnexion réussie"));
	}

	@GetMapping("/verify")
	public ResponseEntity<String> verifyAccount(@RequestParam String token) {
		VerificationTokenRegister verificationToken = verificationTokenRegister.findByToken(token);

		if (verificationToken == null || verificationToken.isExpired()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token invalide ou expiré.");
		}

		Utilisateur user = verificationToken.getUser();

		if (user instanceof AgentGp) {
			AgentGp agentGp = (AgentGp) user;
			agentGp.setEnabled(true);
			agentGPRepository.save(agentGp); // Utilisez le repository spécifique
		} else {
			user.setEnabled(true);
			utilisateurRepository.save(user);
		}

		verificationTokenRegister.delete(verificationToken);
		return ResponseEntity.ok("Compte vérifié avec succès !");
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
		String email = request.get("email");
		utilisateurService.generateResetToken(email);
		Map<String, String> response = new HashMap<>();
		response.put("message", "Un lien de réinitialisation a été envoyé à votre e-mail.");

		return ResponseEntity.ok(response);
	}


	@PostMapping("/reset-password")
	public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequest request) {
		utilisateurService.resetPassword(request.getToken(), request.getNewPassword());

		Map<String, String> response = new HashMap<>();
		response.put("message", "Mot de passe réinitialisé avec succès.");

		return ResponseEntity.ok(response);
	}



}
