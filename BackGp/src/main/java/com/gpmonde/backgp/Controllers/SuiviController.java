package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Repositorys.AgentGPRepository;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/suivi")
@RequiredArgsConstructor
public class SuiviController {

	private final UtilisateurRepository utilisateurRepository;
	private final AgentGPRepository agentGpRepository;

	@PostMapping("/suivre/{utilisateurId}/{agentId}")
	public ResponseEntity<Map<String, String>> suivreAgent(@PathVariable Long utilisateurId, @PathVariable Long agentId) {
		Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
		AgentGp agentGp = agentGpRepository.findById(agentId).orElse(null);

		if (utilisateur == null || agentGp == null) {
			Map<String, String> response = new HashMap<>();
			response.put("error", "Utilisateur ou agent introuvable");
			return ResponseEntity.status(404).body(response);
		}

		utilisateur.getAgentsSuivis().add(agentGp);
		utilisateurRepository.save(utilisateur);

		Map<String, String> response = new HashMap<>();
		response.put("message", "Agent suivi avec succès !");
		return ResponseEntity.ok(response);
	}

	@PostMapping("/arreter/{utilisateurId}/{agentId}")
	public ResponseEntity<Map<String, String>> arreterSuivreAgent(@PathVariable Long utilisateurId, @PathVariable Long agentId) {
		Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
		AgentGp agentGp = agentGpRepository.findById(agentId).orElse(null);

		if (utilisateur == null || agentGp == null) {
			Map<String, String> response = new HashMap<>();
			response.put("error", "Utilisateur ou agent introuvable");
			return ResponseEntity.status(404).body(response);
		}

		utilisateur.getAgentsSuivis().remove(agentGp);
		utilisateurRepository.save(utilisateur);

		Map<String, String> response = new HashMap<>();
		response.put("message", "Suivi de l'agent arrêté !");
		return ResponseEntity.ok(response);
	}

	@GetMapping("/agents-suivis/{utilisateurId}")
	public ResponseEntity<Map<String, Object>> getAgentsSuivis(@PathVariable Long utilisateurId) {
		Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);

		if (utilisateur == null) {
			Map<String, Object> response = new HashMap<>();
			response.put("error", "Utilisateur introuvable");
			return ResponseEntity.status(404).body(response);
		}

		List<String> agents = new ArrayList<>();
		for (AgentGp agentGp : utilisateur.getAgentsSuivis()) {
			agents.add(agentGp.getUsername());
		}

		Map<String, Object> response = new HashMap<>();
		response.put("agentsSuivis", agents);
		return ResponseEntity.ok(response);
	}
}
