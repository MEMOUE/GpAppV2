package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import com.gpmonde.backgp.Security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

import static com.gpmonde.backgp.Exceptions.ErrorMessages.PASSWORD_NOT_FOUND;
import static com.gpmonde.backgp.Exceptions.ErrorMessages.USER_NOT_FOUND;

@Service
@RequiredArgsConstructor
public class AuthService {

	public final UtilisateurRepository utilisateurRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtUtil jwtUtil;

	/**
	 * Méthode pour gérer la connexion d'un utilisateur.
	 *
	 * @param email    Nom d'utilisateur
	 * @param password Mot de passe brut
	 * @return Message de succès ou exception en cas d'échec
	 */
	public ResponseEntity<?> login(String email, String password) {
		Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
				.orElseThrow(() -> new BadCredentialsException(USER_NOT_FOUND));

		// Vérification du mot de passe
		if (!passwordEncoder.matches(password, utilisateur.getPassword())) {
			throw new BadCredentialsException(PASSWORD_NOT_FOUND);
		}

		// Générer un JWT
		String jwt = jwtUtil.generateToken(utilisateur.getUsername(),
				utilisateur.getRoles().stream()
						.map(role -> role.getName())
						.toList());

		// Construire la réponse JSON
		Map<String, Object> response = new HashMap<>();
		//response.put("message", "Connexion réussie");
		response.put("token", jwt);
		response.put("iduser", utilisateur.getId());
		response.put("username", utilisateur.getUsername());
		response.put("email", utilisateur.getEmail());
		response.put("roles", utilisateur.getRoles());
		return ResponseEntity.ok(response);
	}
}