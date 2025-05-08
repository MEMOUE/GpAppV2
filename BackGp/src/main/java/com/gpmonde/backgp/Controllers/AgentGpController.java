package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Services.AgentGpService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/agentgp")
@Tag(name = "AgentGp")
public class AgentGpController {

	private final AgentGpService agentGpService;


	/**
	 * Récupérer tous les agents.
	 *
	 * @return Une liste de tous les agents.
	 */
	@GetMapping
	public List<AgentGp> getAllAgents() {
		return agentGpService.getAllAgentsGp();
	}

	/**
	 * Récupérer un agent par son ID.
	 *
	 * @param id L'ID de l'agent.
	 * @return L'agent correspondant à l'ID.
	 */
	@GetMapping("/{id}")
	public AgentGp getAgentById(@PathVariable Long id) {
		return agentGpService.getAgentById(id);
	}

	/**
	 * Ajouter un nouvel agent.
	 *
	 * @param agentGp Les détails de l'agent.
	 * @return L'agent ajouté.
	 */
	@PostMapping
	public AgentGp createAgent(@RequestBody AgentGp agentGp) {
		return agentGpService.createAgentGp(agentGp);
	}

	/**
	 * Mettre à jour un agent existant.
	 *
	 * @param id      L'ID de l'agent à mettre à jour.
	 * @param agentGp Les nouvelles données de l'agent.
	 * @return L'agent mis à jour.
	 */
	@PutMapping("/{id}")
	public AgentGp updateAgent(@PathVariable Long id, @RequestBody AgentGp agentGp) {
		return agentGpService.updateAgentGp(id, agentGp);
	}

	/**
	 * Supprimer un agent par son ID.
	 *
	 * @param id L'ID de l'agent à supprimer.
	 */
	@DeleteMapping("/{id}")
	public void deleteAgent(@PathVariable Long id) {
		agentGpService.deleteAgentGp(id);
	}

	@GetMapping("/agence")
	public List<AgentGp> findByDepartAndArriveeAgence(@RequestParam  String depart, @RequestParam  String destination){
		return agentGpService.findByDepartAndArriveeAgence(depart, destination);
	}
}
