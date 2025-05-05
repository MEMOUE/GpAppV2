package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Entities.Role;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Exceptions.AgenceOrProgrammeGpNotFoundException;
import com.gpmonde.backgp.Exceptions.UserAlreadyExistsException;
import com.gpmonde.backgp.Repositorys.AgentGPRepository;
import com.gpmonde.backgp.Repositorys.RoleRepository;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
public class AgentGpService {

	private final AgentGPRepository agentGPRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;
	private final UtilisateurRepository utilisateurRepository;
	private final VerificationServiceRegister verificationServiceRegister;

	private static final String DEFAULT_ROLE = "ROLE_AGENTGP";

	/**
	 * Crée un nouvel agent GP avec le rôle par défaut.
	 *
	 * @param agentGp L'agent GP à créer.
	 * @return L'agent GP créé.
	 */
	@Transactional
	public AgentGp createAgentGp(AgentGp agentGp) {

		if (utilisateurRepository.findByEmail(agentGp.getEmail()).isPresent()) {
			throw new UserAlreadyExistsException("Un compte existe déjà avec cet email");
		}

		Role adminRole = roleRepository.findByName(DEFAULT_ROLE)
				.orElseGet(() -> {
					Role role = new Role();
					role.setName(DEFAULT_ROLE);
					return roleRepository.save(role);
				});

		// Ajouter le rôle à l'agent
		agentGp.getRoles().add(adminRole);

		agentGp.setPassword(passwordEncoder.encode(agentGp.getPassword()));
		agentGp.setEnabled(false);

		AgentGp saveAgence = agentGPRepository.save(agentGp);

		// Génère le token et envoie l'email après l'enregistrement
		String token = verificationServiceRegister.generateToken(saveAgence);
		verificationServiceRegister.sendVerificationEmail(saveAgence, token);

		return saveAgence;
	}

	/**
	 * Récupère tous les agents GP.
	 *
	 * @return Liste des agents GP.
	 */
	public List<AgentGp> getAllAgentsGp() {
		return agentGPRepository.findAll();
	}

	/**
	 * Met à jour les informations d'un agent GP.
	 *
	 * @param id      L'ID de l'agent à mettre à jour.
	 * @param agentGp Les nouvelles informations.
	 * @return L'agent GP mis à jour.
	 */
	@Transactional
	public AgentGp updateAgentGp(Long id, AgentGp agentGp) {
		// Récupérer l'agent existant
		AgentGp existingAgent = agentGPRepository.findById(id)
				.orElseThrow();

		// Mettre à jour les informations de l'agent
		existingAgent.setUsername(agentGp.getUsername());
		existingAgent.setPassword(agentGp.getPassword());
		existingAgent.setEmail(agentGp.getEmail());
		existingAgent.setAdresse(agentGp.getAdresse());
		existingAgent.setTelephone(agentGp.getTelephone());
		existingAgent.setDestinations(agentGp.getDestinations());

		existingAgent.setPassword(passwordEncoder.encode(existingAgent.getPassword()));
		return agentGPRepository.save(existingAgent);
	}

	/**
	 * Supprime un agent GP par ID.
	 *
	 * @param id L'ID de l'agent à supprimer.
	 */
	@Transactional
	public void deleteAgentGp(Long id) {
		if (!agentGPRepository.existsById(id)) {
			throw new IllegalArgumentException("Agent non trouvé avec l'ID: " + id);
		}
		agentGPRepository.deleteById(id);
	}

	/**
	 * Récupère un agent GP par ID.
	 *
	 * @param id L'ID de l'agent à récupérer.
	 * @return L'agent GP trouvé.
	 */
	public AgentGp getAgentById(Long id) {
		return agentGPRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("Agent non trouvé avec l'ID: " + id));
	}


	public List<AgentGp> findByDepartAndArriveeAgence(String depart, String destination) {
		List<AgentGp> agents = agentGPRepository.findByDepartAndArriveeAgence(depart, destination);

		if (agents.isEmpty()) {
			throw new AgenceOrProgrammeGpNotFoundException(
					"AGENCE_NOT_FOUND",
					depart + " → " + destination
			);
		}

		return agents;
	}

}
