package com.gpmonde.backgp.Repositorys;

// com.gpmonde.backgp.repositories.NotificationRepository.java

import com.gpmonde.backgp.Entities.Notification;
import com.gpmonde.backgp.Entities.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
	List<Notification> findByUtilisateurOrderByDateDesc(Utilisateur utilisateur);
}
