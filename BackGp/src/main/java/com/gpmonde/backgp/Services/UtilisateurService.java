package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.Role;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Exceptions.UserAlreadyExistsException;
import com.gpmonde.backgp.Repositorys.RoleRepository;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.gpmonde.backgp.Exceptions.ErrorMessages.USER_ALREADY_EXISTS;

@RequiredArgsConstructor
@Service
public class UtilisateurService {

	public  final UtilisateurRepository utilisateurRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;
	private static final String DEFAULT_ROLE = "ROLE_USER";
	private final VerificationServiceRegister verificationServiceRegister;
	private final EmailService emailService;

	/**
	 * Sauvegarde un utilisateur avec le rôle par défaut ROLE_USER.
	 */
	public Utilisateur save(Utilisateur utilisateur) {

		if (utilisateurRepository.findByEmail(utilisateur.getEmail()).isPresent()) {
			throw new UserAlreadyExistsException("Un compte existe déjà avec cet email");
		}

		Role roleUser = roleRepository.findByName(DEFAULT_ROLE)
				.orElseGet(() -> {
					Role newRole = new Role();
					newRole.setName(DEFAULT_ROLE);
					return roleRepository.save(newRole);
				});

		utilisateur.getRoles().add(roleUser);
		utilisateur.setPassword(passwordEncoder.encode(utilisateur.getPassword()));
		utilisateur.setEnabled(false);

		Utilisateur savedUser = utilisateurRepository.save(utilisateur);

		String token = verificationServiceRegister.generateToken(savedUser);
		verificationServiceRegister.sendVerificationEmail(savedUser, token);

		return savedUser;
	}


	/**
	 * Récupère tous les utilisateurs.
	 */
	public List<Utilisateur> findAll() {
		return utilisateurRepository.findAll();
	}

	/**
	 * Met à jour un utilisateur existant.
	 */
	public Utilisateur update(Utilisateur utilisateur, Long id) {
		Utilisateur existingUser = utilisateurRepository.findById(id)
				.orElseThrow();

		utilisateur.setId(existingUser.getId());
		utilisateur.setRoles(existingUser.getRoles());

		return utilisateurRepository.save(utilisateur);
	}

	/**
	 * Supprime un utilisateur par ID.
	 */
	public void delete(Long id) {
		utilisateurRepository.findById(id).orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
		utilisateurRepository.deleteById(id);
	}


	public void generateResetToken(String email) {
		Utilisateur user = utilisateurRepository.findByEmail(email)
				.orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

		String token = UUID.randomUUID().toString();
		user.setResetToken(token);
		utilisateurRepository.save(user);

		String resetLink = "http://localhost:4200/reset-password?token=" + token;
		emailService.sendEmail(email, "Réinitialisation de mot de passe", "Cliquez ici pour réinitialiser votre mot de passe : " + resetLink);
	}
	public void resetPassword(String token, String newPassword) {
		Utilisateur user = utilisateurRepository.findByResetToken(token)
				.orElseThrow(() -> new RuntimeException("Token invalide ou expiré"));

		user.setPassword(passwordEncoder.encode(newPassword));
		user.setResetToken(null);
		utilisateurRepository.save(user);
	}



}
