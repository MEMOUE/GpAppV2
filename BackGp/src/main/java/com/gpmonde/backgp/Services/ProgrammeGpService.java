package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.DTO.NotificationDTO;
import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Entities.ProgrammeGp;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Exceptions.AgenceOrProgrammeGpNotFoundException;
import com.gpmonde.backgp.Repositorys.ProgrammeGpRepository;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgrammeGpService {

	private final UtilisateurRepository utilisateurRepository;
	private final ProgrammeGpRepository programmeGpRepository;
	private final NotificationService notificationService;

	public ProgrammeGp addProgramme(ProgrammeGp programmeGp) {
		// Sauvegarder le programme
		ProgrammeGp savedProgramme = programmeGpRepository.save(programmeGp);

		// Récupérer l'agent concerné
		AgentGp agent = programmeGp.getAgentGp();

		// Construire le message de notification
		String message = "Nouvelle publication par l'agence " + agent.getNomagence();

		// Notifier tous les suiveurs de l'agent
		for (Utilisateur suiveur : agent.getSuiveurs()) {
			notificationService.sendNotification(suiveur, message, agent.getNomagence());
		}

		return savedProgramme;
	}

	public List<ProgrammeGp> getAllProgrammes() {
		return programmeGpRepository.findAll();
	}

	public ProgrammeGp getProgrammeById(Long id) {
		return programmeGpRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Programme non trouvé avec l'ID : " + id));
	}

	public ProgrammeGp updateProgramme(Long id, ProgrammeGp programmeDetails) {
		ProgrammeGp programme = getProgrammeById(id);
		programme.setDescription(programmeDetails.getDescription());
		programme.setDepart(programmeDetails.getDepart());
		programme.setDestination(programmeDetails.getDestination());
		programme.setPrix(programmeDetails.getPrix());
		programme.setGarantie(programmeDetails.getGarantie());
		programme.setDateline(programmeDetails.getDateline());
		return programmeGpRepository.save(programme);
	}

	public void deleteProgramme(Long id) {
		ProgrammeGp programme = getProgrammeById(id);
		programmeGpRepository.delete(programme);
	}

	public List<ProgrammeGp> findByDepartureAndDestination(String depart, String destination) {
		List<ProgrammeGp> programmes = programmeGpRepository.findByDepartureAndDestination(depart, destination);

		if (programmes.isEmpty()) {
			throw new AgenceOrProgrammeGpNotFoundException("PROGRAMMEGP_NOT_FOUND",
					depart + " → " + destination);
		}

		return programmes;
	}

	public List<ProgrammeGp> getProgrammesForCurrentAgent() {
		Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

		String username;
		if (principal instanceof UserDetails) {
			username = ((UserDetails) principal).getUsername();
		} else if (principal instanceof String) {
			username = (String) principal;
		} else {
			return List.of();
		}

		return utilisateurRepository.findByUsername(username)
				.filter(user -> user instanceof AgentGp)
				.map(user -> (AgentGp) user)
				.map(agent -> programmeGpRepository.findByAgentGpId(agent.getId()))
				.orElse(List.of());
	}

}