package com.gpmonde.backgp.Repositorys;

import com.gpmonde.backgp.Entities.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
	Optional<Utilisateur> findByUsername(String username);
	Optional<Utilisateur> findByEmail(String email);
	Optional<Utilisateur> findByResetToken(String resetToken);
}

