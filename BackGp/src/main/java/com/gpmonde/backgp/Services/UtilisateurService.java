package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.DTO.CompleteProfileRequest;
import com.gpmonde.backgp.DTO.RegistrationRequest;
import com.gpmonde.backgp.Entities.Role;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Entities.Utilisateur.AuthProvider;
import com.gpmonde.backgp.Exceptions.UserAlreadyExistsException;
import com.gpmonde.backgp.Repositorys.RoleRepository;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationServiceRegister verificationServiceRegister;
    private final EmailService emailService;
    private final FileStorageService fileStorageService;

    /**
     * Inscription simple (utilisateur normal)
     */
    @Transactional
    public Utilisateur registerUser(RegistrationRequest request) {

        if (utilisateurRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new UserAlreadyExistsException("Un compte existe déjà avec cet email");
        }

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setUsername(request.getUsername());
        utilisateur.setEmail(request.getEmail());
        utilisateur.setPassword(passwordEncoder.encode(request.getPassword()));
        utilisateur.setProvider(AuthProvider.LOCAL);
        utilisateur.setEnabled(false);

        // Ajouter le rôle USER
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Rôle USER introuvable"));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        utilisateur.setRoles(roles);

        Utilisateur savedUser = utilisateurRepository.save(utilisateur);

        // Envoyer l'email de vérification
        String token = verificationServiceRegister.generateToken(savedUser);
        verificationServiceRegister.sendVerificationEmail(savedUser, token);

        return savedUser;
    }

    /**
     * Inscription AgentGP (avec fichiers)
     */
    @Transactional
    public Utilisateur registerAgentGp(
            RegistrationRequest request,
            MultipartFile logo,
            MultipartFile carteIdentite) {

        if (utilisateurRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new UserAlreadyExistsException("Un compte existe déjà avec cet email");
        }

        // Valider les fichiers
        if (logo == null || logo.isEmpty()) {
            throw new IllegalArgumentException("Le logo est obligatoire");
        }
        if (carteIdentite == null || carteIdentite.isEmpty()) {
            throw new IllegalArgumentException("La carte d'identité est obligatoire");
        }

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setUsername(request.getUsername());
        utilisateur.setEmail(request.getEmail());
        utilisateur.setPassword(passwordEncoder.encode(request.getPassword()));
        utilisateur.setProvider(AuthProvider.LOCAL);
        utilisateur.setEnabled(false);

        // Informations agence
        utilisateur.setNomagence(request.getNomagence());
        utilisateur.setAdresse(request.getAdresse());
        utilisateur.setTelephone(request.getTelephone());

        // Parser destinations
        if (request.getDestinations() != null && !request.getDestinations().isEmpty()) {
            Set<String> destinations = Arrays.stream(request.getDestinations().split(","))
                    .map(String::trim)
                    .collect(Collectors.toSet());
            utilisateur.setDestinations(destinations);
        }

        // Sauvegarder les fichiers
        String logoUrl = fileStorageService.saveLogo(logo, request.getUsername());
        String carteUrl = fileStorageService.saveCarteIdentite(carteIdentite, request.getUsername());
        utilisateur.setLogourl(logoUrl);
        utilisateur.setCarteidentiteurl(carteUrl);

        // Ajouter le rôle AGENTGP
        Role agentRole = roleRepository.findByName("ROLE_AGENTGP")
                .orElseThrow(() -> new RuntimeException("Rôle AGENTGP introuvable"));

        Set<Role> roles = new HashSet<>();
        roles.add(agentRole);
        utilisateur.setRoles(roles);

        Utilisateur savedUser = utilisateurRepository.save(utilisateur);

        // Envoyer l'email de vérification
        String token = verificationServiceRegister.generateToken(savedUser);
        verificationServiceRegister.sendVerificationEmail(savedUser, token);

        return savedUser;
    }

    /**
     * Compléter le profil (pour utilisateurs OAuth2)
     */
    @Transactional
    public Utilisateur completeProfile(
            CompleteProfileRequest request,
            MultipartFile logo,
            MultipartFile carteIdentite) {

        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        Utilisateur utilisateur = utilisateurRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Valider les fichiers
        if (logo == null || logo.isEmpty()) {
            throw new IllegalArgumentException("Le logo est obligatoire");
        }
        if (carteIdentite == null || carteIdentite.isEmpty()) {
            throw new IllegalArgumentException("La carte d'identité est obligatoire");
        }

        // Mettre à jour le profil
        utilisateur.setNomagence(request.getNomagence());
        utilisateur.setAdresse(request.getAdresse());
        utilisateur.setTelephone(request.getTelephone());

        // Parser destinations
        if (request.getDestinations() != null && !request.getDestinations().isEmpty()) {
            Set<String> destinations = Arrays.stream(request.getDestinations().split(","))
                    .map(String::trim)
                    .collect(Collectors.toSet());
            utilisateur.setDestinations(destinations);
        }

        // Sauvegarder les fichiers
        String logoUrl = fileStorageService.saveLogo(logo, utilisateur.getUsername());
        String carteUrl = fileStorageService.saveCarteIdentite(carteIdentite, utilisateur.getUsername());
        utilisateur.setLogourl(logoUrl);
        utilisateur.setCarteidentiteurl(carteUrl);

        // Ajouter le rôle AGENTGP
        Role agentRole = roleRepository.findByName("ROLE_AGENTGP")
                .orElseThrow(() -> new RuntimeException("Rôle AGENTGP introuvable"));
        utilisateur.getRoles().add(agentRole);

        return utilisateurRepository.save(utilisateur);
    }

    /**
     * Récupérer tous les utilisateurs
     */
    public List<Utilisateur> findAll() {
        return utilisateurRepository.findAll();
    }

    /**
     * Récupérer tous les agents GP
     */
    public List<Utilisateur> findAllAgents() {
        return utilisateurRepository.findAll().stream()
                .filter(Utilisateur::isAgentGp)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer un utilisateur par ID
     */
    public Optional<Utilisateur> findById(Long id) {
        return utilisateurRepository.findById(id);
    }

    /**
     * Mettre à jour un utilisateur
     */
    @Transactional
    public Utilisateur update(Utilisateur utilisateur, Long id) {
        Utilisateur existingUser = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (utilisateur.getEmail() != null) {
            existingUser.setEmail(utilisateur.getEmail());
        }

        if (utilisateur.getNomagence() != null) {
            existingUser.setNomagence(utilisateur.getNomagence());
        }

        if (utilisateur.getAdresse() != null) {
            existingUser.setAdresse(utilisateur.getAdresse());
        }

        if (utilisateur.getTelephone() != null) {
            existingUser.setTelephone(utilisateur.getTelephone());
        }

        if (utilisateur.getDestinations() != null) {
            existingUser.setDestinations(utilisateur.getDestinations());
        }

        return utilisateurRepository.save(existingUser);
    }

    /**
     * Mettre à jour le mot de passe
     */
    @Transactional
    public void updatePassword(Utilisateur user) {
        utilisateurRepository.save(user);
    }

    /**
     * Supprimer un utilisateur
     */
    @Transactional
    public void delete(Long id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        // Supprimer les fichiers associés
        if (utilisateur.getLogourl() != null) {
            fileStorageService.deleteFile(utilisateur.getLogourl());
        }
        if (utilisateur.getCarteidentiteurl() != null) {
            fileStorageService.deleteFile(utilisateur.getCarteidentiteurl());
        }

        utilisateurRepository.deleteById(id);
    }

    /**
     * Générer un token de réinitialisation
     */
    @Transactional
    public void generateResetToken(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        utilisateurRepository.save(user);

        String resetLink = "https://gpmonde.com/reset-password?token=" + token;
        emailService.sendEmail(email, "Réinitialisation de mot de passe",
                "Cliquez ici pour réinitialiser votre mot de passe : " + resetLink);
    }

    /**
     * Réinitialiser le mot de passe
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