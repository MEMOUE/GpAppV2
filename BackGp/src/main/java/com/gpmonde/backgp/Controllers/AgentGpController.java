package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Services.AgentGpService;
import com.gpmonde.backgp.Services.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/agentgp")
@Tag(name = "🚌 AgentGp", description = "Gestion des agents de transport GP")
@CrossOrigin("*")
public class AgentGpController {

	private final AgentGpService agentGpService;
	private final FileStorageService fileStorageService;

	/**
	 * Récupérer tous les agents.
	 */
	@GetMapping
	@Operation(
			summary = "Lister tous les agents GP",
			description = "Récupère la liste complète de tous les agents GP enregistrés dans le système."
	)
	public List<AgentGp> getAllAgents() {
		return agentGpService.getAllAgentsGp();
	}

	/**
	 * Récupérer un agent par son ID.
	 */
	@GetMapping("/{id}")
	@Operation(
			summary = "Récupérer un agent par ID",
			description = "Récupère les détails d'un agent GP spécifique par son identifiant."
	)
	public AgentGp getAgentById(@Parameter(description = "ID de l'agent", required = true) @PathVariable Long id) {
		return agentGpService.getAgentById(id);
	}

	/**
	 * Créer un nouvel agent GP avec logo et carte d'identité
	 */
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(
			summary = "Créer un nouvel agent GP",
			description = "Créer un nouveau compte d'agent GP avec logo et carte d'identité obligatoires. Tous les champs sont requis."
	)
	public ResponseEntity<?> createAgent(
			@RequestParam("username") String username,
			@RequestParam("password") String password,
			@RequestParam("email") String email,
			@RequestParam("nomagence") String nomagence,
			@RequestParam("adresse") String adresse,
			@RequestParam("telephone") String telephone,
			@RequestParam("destinations") String destinations,
			@RequestParam("logo") MultipartFile logo,
			@RequestParam("carteIdentite") MultipartFile carteIdentite) {

		try {
			// Validation des fichiers obligatoires
			if (logo == null || logo.isEmpty()) {
				Map<String, String> error = new HashMap<>();
				error.put("error", "Le logo est obligatoire");
				return ResponseEntity.badRequest().body(error);
			}

			if (carteIdentite == null || carteIdentite.isEmpty()) {
				Map<String, String> error = new HashMap<>();
				error.put("error", "La carte d'identité est obligatoire");
				return ResponseEntity.badRequest().body(error);
			}

			// Créer l'agent
			AgentGp agentGp = new AgentGp();
			agentGp.setUsername(username);
			agentGp.setPassword(password);
			agentGp.setEmail(email);
			agentGp.setNomagence(nomagence);
			agentGp.setAdresse(adresse);
			agentGp.setTelephone(telephone);

			// Parser les destinations
			if (destinations != null && !destinations.trim().isEmpty()) {
				String[] destArray = destinations.split(",");
				for (String dest : destArray) {
					agentGp.getDestinations().add(dest.trim());
				}
			}

			// Sauvegarder les fichiers
			String logoUrl = fileStorageService.saveLogo(logo, username);
			String carteUrl = fileStorageService.saveCarteIdentite(carteIdentite, username);

			// Assigner les URLs des fichiers
			agentGp.setLogourl(logoUrl);
			agentGp.setCarteidentiteurl(carteUrl);

			// Créer l'agent
			AgentGp savedAgent = agentGpService.createAgentGp(agentGp);

			return ResponseEntity.ok(savedAgent);

		} catch (Exception e) {
			Map<String, String> error = new HashMap<>();
			error.put("error", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	/**
	 * Mettre à jour un agent existant.
	 */
	@PutMapping("/{id}")
	@Operation(
			summary = "Mettre à jour un agent",
			description = "Met à jour les informations d'un agent existant."
	)
	public AgentGp updateAgent(@PathVariable Long id, @RequestBody AgentGp agentGp) {
		return agentGpService.updateAgentGp(id, agentGp);
	}

	/**
	 * Uploader le logo d'un agent existant
	 */
	@PostMapping(value = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(
			summary = "Mettre à jour le logo d'un agent",
			description = "Remplace le logo existant d'un agent GP par un nouveau fichier image."
	)
	public ResponseEntity<?> uploadLogo(@PathVariable Long id, @RequestParam("logo") MultipartFile logo) {
		try {
			if (logo == null || logo.isEmpty()) {
				Map<String, String> error = new HashMap<>();
				error.put("error", "Le fichier logo est obligatoire");
				return ResponseEntity.badRequest().body(error);
			}

			AgentGp agent = agentGpService.getAgentById(id);

			// Supprimer l'ancien logo s'il existe
			if (agent.getLogourl() != null) {
				fileStorageService.deleteFile(agent.getLogourl());
			}

			// Sauvegarder le nouveau logo
			String logoUrl = fileStorageService.saveLogo(logo, agent.getUsername());
			agent.setLogourl(logoUrl);

			agentGpService.updateAgentGp(id, agent);

			Map<String, String> response = new HashMap<>();
			response.put("message", "Logo uploadé avec succès");
			response.put("logoUrl", logoUrl);
			response.put("fullUrl", "/api/files" + logoUrl);

			return ResponseEntity.ok(response);

		} catch (Exception e) {
			Map<String, String> error = new HashMap<>();
			error.put("error", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	/**
	 * Uploader la carte d'identité d'un agent existant
	 */
	@PostMapping(value = "/{id}/carte-identite", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(
			summary = "Mettre à jour la carte d'identité d'un agent",
			description = "Remplace la carte d'identité existante d'un agent GP par un nouveau fichier image."
	)
	public ResponseEntity<?> uploadCarteIdentite(@PathVariable Long id, @RequestParam("carteIdentite") MultipartFile carteIdentite) {
		try {
			if (carteIdentite == null || carteIdentite.isEmpty()) {
				Map<String, String> error = new HashMap<>();
				error.put("error", "Le fichier carte d'identité est obligatoire");
				return ResponseEntity.badRequest().body(error);
			}

			AgentGp agent = agentGpService.getAgentById(id);

			// Supprimer l'ancienne carte s'elle existe
			if (agent.getCarteidentiteurl() != null) {
				fileStorageService.deleteFile(agent.getCarteidentiteurl());
			}

			// Sauvegarder la nouvelle carte
			String carteUrl = fileStorageService.saveCarteIdentite(carteIdentite, agent.getUsername());
			agent.setCarteidentiteurl(carteUrl);

			agentGpService.updateAgentGp(id, agent);

			Map<String, String> response = new HashMap<>();
			response.put("message", "Carte d'identité uploadée avec succès");
			response.put("carteIdentiteUrl", carteUrl);
			response.put("fullUrl", "/api/files" + carteUrl);

			return ResponseEntity.ok(response);

		} catch (Exception e) {
			Map<String, String> error = new HashMap<>();
			error.put("error", e.getMessage());
			return ResponseEntity.badRequest().body(error);
		}
	}

	/**
	 * Supprimer un agent par son ID.
	 */
	@DeleteMapping("/{id}")
	@Operation(
			summary = "Supprimer un agent",
			description = "Supprime un agent et ses fichiers associés."
	)
	public void deleteAgent(@PathVariable Long id) {
		// Récupérer l'agent avant suppression pour supprimer ses fichiers
		try {
			AgentGp agent = agentGpService.getAgentById(id);

			// Supprimer les fichiers associés
			if (agent.getLogourl() != null) {
				fileStorageService.deleteFile(agent.getLogourl());
			}
			if (agent.getCarteidentiteurl() != null) {
				fileStorageService.deleteFile(agent.getCarteidentiteurl());
			}
		} catch (Exception e) {
			// Log l'erreur mais continuer la suppression
			System.err.println("Erreur lors de la suppression des fichiers: " + e.getMessage());
		}

		agentGpService.deleteAgentGp(id);
	}

	@GetMapping("/agence")
	@Operation(
			summary = "Rechercher des agents par destination",
			description = "Trouve les agents qui desservent les destinations spécifiées."
	)
	public List<AgentGp> findByDepartAndArriveeAgence(
			@RequestParam String depart,
			@RequestParam String destination) {
		return agentGpService.findByDepartAndArriveeAgence(depart, destination);
	}
}