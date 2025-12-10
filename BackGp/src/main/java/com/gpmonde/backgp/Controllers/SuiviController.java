package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Contrôleur pour gérer les relations de suivi entre utilisateurs et agents GP
 * Permet aux utilisateurs de suivre/ne plus suivre des agents GP
 */
@RestController
@RequestMapping("/api/suivi")
@Tag(name = "Suivi", description = "Gestion des suivis d'agents GP par les utilisateurs")
@RequiredArgsConstructor
@Slf4j
public class SuiviController {

    private final UtilisateurRepository utilisateurRepository;

    /**
     * Suivre un agent GP
     *
     * @param utilisateurId L'ID de l'utilisateur qui veut suivre
     * @param agentId L'ID de l'agent GP à suivre
     * @return Message de confirmation
     */
    @PostMapping("/suivre/{utilisateurId}/{agentId}")
    @Operation(summary = "Suivre un agent GP",
            description = "Permet à un utilisateur de suivre un agent GP pour recevoir ses notifications")
    public ResponseEntity<Map<String, String>> suivreAgent(
            @PathVariable Long utilisateurId,
            @PathVariable Long agentId) {

        log.info("Tentative de suivi: Utilisateur {} -> Agent {}", utilisateurId, agentId);

        // Récupérer l'utilisateur
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
        if (utilisateur == null) {
            log.warn("Utilisateur introuvable: {}", utilisateurId);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Utilisateur introuvable");
            return ResponseEntity.status(404).body(response);
        }

        // Récupérer l'agent GP
        Utilisateur agentGp = utilisateurRepository.findById(agentId).orElse(null);
        if (agentGp == null) {
            log.warn("Agent GP introuvable: {}", agentId);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Agent GP introuvable");
            return ResponseEntity.status(404).body(response);
        }

        // Vérifier que c'est bien un agent GP
        if (!agentGp.isAgentGp()) {
            log.warn("L'utilisateur {} n'est pas un agent GP", agentId);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Cet utilisateur n'est pas un agent GP");
            return ResponseEntity.status(400).body(response);
        }

        // Vérifier si l'utilisateur ne suit pas déjà cet agent
        if (utilisateur.getAgentsSuivis().contains(agentGp)) {
            log.info("L'utilisateur {} suit déjà l'agent {}", utilisateurId, agentId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Vous suivez déjà cet agent");
            return ResponseEntity.ok(response);
        }

        // Ajouter l'agent aux agents suivis
        utilisateur.getAgentsSuivis().add(agentGp);
        utilisateurRepository.save(utilisateur);

        log.info("Suivi établi: Utilisateur {} -> Agent {}", utilisateurId, agentId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Agent suivi avec succès !");
        response.put("agentNom", agentGp.getUsername());
        response.put("agentAgence", agentGp.getNomagence());
        return ResponseEntity.ok(response);
    }

    /**
     * Arrêter de suivre un agent GP
     *
     * @param utilisateurId L'ID de l'utilisateur
     * @param agentId L'ID de l'agent GP à ne plus suivre
     * @return Message de confirmation
     */
    @PostMapping("/arreter/{utilisateurId}/{agentId}")
    @Operation(summary = "Arrêter de suivre un agent GP",
            description = "Permet à un utilisateur de ne plus suivre un agent GP")
    public ResponseEntity<Map<String, String>> arreterSuivreAgent(
            @PathVariable Long utilisateurId,
            @PathVariable Long agentId) {

        log.info("Tentative d'arrêt de suivi: Utilisateur {} -> Agent {}",
                utilisateurId, agentId);

        // Récupérer l'utilisateur
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
        if (utilisateur == null) {
            log.warn("Utilisateur introuvable: {}", utilisateurId);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Utilisateur introuvable");
            return ResponseEntity.status(404).body(response);
        }

        // Récupérer l'agent GP
        Utilisateur agentGp = utilisateurRepository.findById(agentId).orElse(null);
        if (agentGp == null) {
            log.warn("Agent GP introuvable: {}", agentId);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Agent GP introuvable");
            return ResponseEntity.status(404).body(response);
        }

        // Retirer l'agent des agents suivis
        boolean removed = utilisateur.getAgentsSuivis().remove(agentGp);

        if (!removed) {
            log.info("L'utilisateur {} ne suivait pas l'agent {}", utilisateurId, agentId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Vous ne suiviez pas cet agent");
            return ResponseEntity.ok(response);
        }

        utilisateurRepository.save(utilisateur);

        log.info("Suivi arrêté: Utilisateur {} -X- Agent {}", utilisateurId, agentId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Suivi de l'agent arrêté !");
        response.put("agentNom", agentGp.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Récupérer la liste des agents suivis par un utilisateur
     *
     * @param utilisateurId L'ID de l'utilisateur
     * @return Liste des agents suivis avec leurs informations
     */
    @GetMapping("/agents-suivis/{utilisateurId}")
    @Operation(summary = "Liste des agents suivis",
            description = "Récupère la liste des agents GP suivis par un utilisateur")
    public ResponseEntity<Map<String, Object>> getAgentsSuivis(@PathVariable Long utilisateurId) {

        log.debug("Récupération des agents suivis par l'utilisateur: {}", utilisateurId);

        // Récupérer l'utilisateur
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
        if (utilisateur == null) {
            log.warn("Utilisateur introuvable: {}", utilisateurId);
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Utilisateur introuvable");
            return ResponseEntity.status(404).body(response);
        }

        // Construire la liste des agents suivis avec leurs détails
        List<Map<String, Object>> agentsDetails = utilisateur.getAgentsSuivis().stream()
                .map(agent -> {
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", agent.getId());
                    details.put("username", agent.getUsername());
                    details.put("nomagence", agent.getNomagence());
                    details.put("adresse", agent.getAdresse());
                    details.put("telephone", agent.getTelephone());
                    details.put("logourl", agent.getLogourl());
                    details.put("destinations", agent.getDestinations());
                    return details;
                })
                .collect(Collectors.toList());

        log.debug("Utilisateur {} suit {} agent(s)",
                utilisateurId, agentsDetails.size());

        Map<String, Object> response = new HashMap<>();
        response.put("agentsSuivis", agentsDetails);
        response.put("count", agentsDetails.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Vérifier si un utilisateur suit un agent spécifique
     *
     * @param utilisateurId L'ID de l'utilisateur
     * @param agentId L'ID de l'agent GP
     * @return true si l'utilisateur suit l'agent, false sinon
     */
    @GetMapping("/est-suivi/{utilisateurId}/{agentId}")
    @Operation(summary = "Vérifier le suivi",
            description = "Vérifie si un utilisateur suit un agent GP spécifique")
    public ResponseEntity<Map<String, Boolean>> estSuivi(
            @PathVariable Long utilisateurId,
            @PathVariable Long agentId) {

        log.debug("Vérification du suivi: Utilisateur {} -> Agent {}",
                utilisateurId, agentId);

        Map<String, Boolean> response = new HashMap<>();

        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
        Utilisateur agent = utilisateurRepository.findById(agentId).orElse(null);

        if (utilisateur == null || agent == null) {
            response.put("estSuivi", false);
            return ResponseEntity.ok(response);
        }

        boolean estSuivi = utilisateur.getAgentsSuivis().contains(agent);
        response.put("estSuivi", estSuivi);

        return ResponseEntity.ok(response);
    }

    /**
     * Récupérer le nombre de suiveurs d'un agent
     *
     * @param agentId L'ID de l'agent GP
     * @return Le nombre de suiveurs
     */
    @GetMapping("/nombre-suiveurs/{agentId}")
    @Operation(summary = "Nombre de suiveurs",
            description = "Récupère le nombre de suiveurs d'un agent GP")
    public ResponseEntity<Map<String, Object>> getNombreSuiveurs(@PathVariable Long agentId) {

        log.debug("Récupération du nombre de suiveurs pour l'agent: {}", agentId);

        Utilisateur agent = utilisateurRepository.findById(agentId).orElse(null);

        if (agent == null) {
            log.warn("Agent introuvable: {}", agentId);
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Agent introuvable");
            return ResponseEntity.status(404).body(response);
        }

        if (!agent.isAgentGp()) {
            log.warn("L'utilisateur {} n'est pas un agent GP", agentId);
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Cet utilisateur n'est pas un agent GP");
            return ResponseEntity.status(400).body(response);
        }

        int nombreSuiveurs = agent.getSuiveurs().size();

        log.debug("Agent {} a {} suiveur(s)", agentId, nombreSuiveurs);

        Map<String, Object> response = new HashMap<>();
        response.put("agentId", agentId);
        response.put("agentNom", agent.getUsername());
        response.put("nombreSuiveurs", nombreSuiveurs);

        return ResponseEntity.ok(response);
    }
}