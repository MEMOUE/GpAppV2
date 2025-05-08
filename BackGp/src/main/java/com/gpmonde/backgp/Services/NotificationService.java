package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.Notification;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Repositorys.NotificationRepository;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class NotificationService {

	private final NotificationRepository notificationRepository;
	private final SimpMessagingTemplate messagingTemplate;
	private final UtilisateurRepository utilisateurRepository;

	public void sendNotification(Utilisateur utilisateur, String message, String agence) {
		// Créer et enregistrer la notification
		Notification notif = new Notification();
		notif.setMessage(message);
		notif.setAgence(agence);
		notif.setUtilisateur(utilisateur);
		notif.setDate(LocalDateTime.now());

		notificationRepository.save(notif);

		// DTO à envoyer côté frontend
		Map<String, Object> payload = new HashMap<>();
		payload.put("message", message);
		payload.put("agentId", utilisateur.getId());
		payload.put("agence", agence);

		// Envoyer via WebSocket à l'utilisateur
		messagingTemplate.convertAndSendToUser(
				utilisateur.getUsername(), // Le username doit correspondre à celui utilisé dans le frontend
				"/queue/notifications",
				payload
		);
	}

	public List<Notification> getNotificationsByUserId(Long userId) {
		Utilisateur utilisateur = utilisateurRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

		return notificationRepository.findByUtilisateurOrderByDateDesc(utilisateur);
	}
}
