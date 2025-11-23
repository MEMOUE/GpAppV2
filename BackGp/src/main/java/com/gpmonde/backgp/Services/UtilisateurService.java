package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.Role;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Exceptions.UserAlreadyExistsException;
import com.gpmonde.backgp.Repositorys.RoleRepository;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private static final String DEFAULT_ROLE = "ROLE_USER";
    private final VerificationServiceRegister verificationServiceRegister;
    private final EmailService emailService;

    /**
     * Sauvegarde un utilisateur avec le rôle par défaut ROLE_USER.
     */
    @Transactional
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
     * Récupère un utilisateur par son ID.
     */
    public Optional<Utilisateur> findById(Long id) {
        return utilisateurRepository.findById(id);
    }

    /**
     * Met à jour un utilisateur existant.
     */
    @Transactional
    public Utilisateur update(Utilisateur utilisateur, Long id) {
        Utilisateur existingUser = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Mettre à jour seulement les champs modifiables
        if (utilisateur.getEmail() != null) {
            existingUser.setEmail(utilisateur.getEmail());
        }

        // Ne pas mettre à jour le mot de passe ici - utiliser changePassword
        // Ne pas mettre à jour le username - il est immutable

        return utilisateurRepository.save(existingUser);
    }

    /**
     * Met à jour uniquement le mot de passe.
     */
    @Transactional
    public void updatePassword(Utilisateur user) {
        utilisateurRepository.save(user);
    }

    /**
     * Supprime un utilisateur par ID.
     */
    @Transactional
    public void delete(Long id) {
        utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        utilisateurRepository.deleteById(id);
    }

    /**
     * Génère un token de réinitialisation de mot de passe.
     */
    @Transactional
    public void generateResetToken(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        utilisateurRepository.save(user);

        String resetLink = "https://gpmonde.com/reset-password?token=" + token;
        //String resetLink = "http://localhost:4200/reset-password?token=" + token;
        emailService.sendEmail(email, "Réinitialisation de mot de passe",
                "Cliquez ici pour réinitialiser votre mot de passe : " + resetLink);
    }

    /**
     * Réinitialise le mot de passe avec un token.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        Utilisateur user = utilisateurRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Token invalide ou expiré"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        utilisateurRepository.save(user);
    }
}