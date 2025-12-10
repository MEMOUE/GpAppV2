package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.ProgrammeGp;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Exceptions.AgenceOrProgrammeGpNotFoundException;
import com.gpmonde.backgp.Repositorys.ProgrammeGpRepository;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

/**
 * Service pour la gestion des programmes de transport GP
 * Gère toutes les opérations liées aux programmes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProgrammeGpService {

    private final UtilisateurRepository utilisateurRepository;
    private final ProgrammeGpRepository programmeGpRepository;
    private final NotificationService notificationService;

    /**
     * Ajouter un nouveau programme
     * Envoie des notifications aux suiveurs de l'agent
     *
     * @param programmeGp Le programme à créer
     * @return Le programme créé
     */
    @Transactional
    public ProgrammeGp addProgramme(ProgrammeGp programmeGp) {
        log.info("Création d'un nouveau programme pour l'agent: {}",
                programmeGp.getAgentGp().getId());

        // Sauvegarder le programme
        ProgrammeGp savedProgramme = programmeGpRepository.save(programmeGp);

        // Récupérer l'agent concerné
        Utilisateur agent = programmeGp.getAgentGp();

        // Vérifier que c'est bien un agent GP avec une agence
        if (agent.isAgentGp() && agent.getNomagence() != null) {
            // Construire le message de notification
            String message = "Nouvelle publication par l'agence " + agent.getNomagence();

            log.debug("Envoi de notifications à {} suiveurs", agent.getSuiveurs().size());

            // Notifier tous les suiveurs de l'agent
            for (Utilisateur suiveur : agent.getSuiveurs()) {
                notificationService.sendNotification(suiveur, message, agent.getNomagence());
            }

            log.info("Programme créé avec succès. ID: {}", savedProgramme.getId());
        }

        return savedProgramme;
    }

    /**
     * Récupérer tous les programmes
     *
     * @return Liste de tous les programmes
     */
    public List<ProgrammeGp> getAllProgrammes() {
        log.debug("Récupération de tous les programmes");
        return programmeGpRepository.findAll();
    }

    /**
     * Récupérer les programmes actifs ou créés dans les dernières 24h
     *
     * @return Liste des programmes actifs ou récents
     */
    public List<ProgrammeGp> getActiveOrRecentProgrammes() {
        log.debug("Récupération des programmes actifs ou récents");

        // Calcule la date/heure d'il y a 24h
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.HOUR_OF_DAY, -24);
        Date yesterday = cal.getTime();

        return programmeGpRepository.findActiveOrRecent(yesterday);
    }

    /**
     * Récupérer un programme par son ID
     *
     * @param id L'ID du programme
     * @return Le programme trouvé
     * @throws IllegalArgumentException Si le programme n'existe pas
     */
    public ProgrammeGp getProgrammeById(Long id) {
        log.debug("Récupération du programme avec ID: {}", id);
        return programmeGpRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Programme non trouvé avec l'ID : " + id));
    }

    /**
     * Mettre à jour un programme existant
     *
     * @param id L'ID du programme
     * @param programmeDetails Les nouvelles données
     * @return Le programme mis à jour
     */
    @Transactional
    public ProgrammeGp updateProgramme(Long id, ProgrammeGp programmeDetails) {
        log.info("Mise à jour du programme ID: {}", id);

        ProgrammeGp programme = getProgrammeById(id);

        // Mise à jour des champs
        programme.setDescription(programmeDetails.getDescription());
        programme.setDepart(programmeDetails.getDepart());
        programme.setDestination(programmeDetails.getDestination());
        programme.setPrix(programmeDetails.getPrix());
        programme.setGarantie(programmeDetails.getGarantie());
        programme.setDateline(programmeDetails.getDateline());

        ProgrammeGp updated = programmeGpRepository.save(programme);
        log.info("Programme mis à jour avec succès. ID: {}", id);

        return updated;
    }

    /**
     * Supprimer un programme
     *
     * @param id L'ID du programme à supprimer
     */
    @Transactional
    public void deleteProgramme(Long id) {
        log.info("Suppression du programme ID: {}", id);

        ProgrammeGp programme = getProgrammeById(id);
        programmeGpRepository.delete(programme);

        log.info("Programme supprimé avec succès. ID: {}", id);
    }

    /**
     * Rechercher des programmes par départ et destination
     *
     * @param depart Ville de départ
     * @param destination Ville de destination
     * @return Liste des programmes correspondants
     * @throws AgenceOrProgrammeGpNotFoundException Si aucun programme n'est trouvé
     */
    public List<ProgrammeGp> findByDepartureAndDestination(String depart, String destination) {
        log.debug("Recherche de programmes: {} -> {}", depart, destination);

        List<ProgrammeGp> programmes = programmeGpRepository
                .findByDepartureAndDestination(depart, destination);

        if (programmes.isEmpty()) {
            log.warn("Aucun programme trouvé pour: {} -> {}", depart, destination);
            throw new AgenceOrProgrammeGpNotFoundException(
                    "PROGRAMMEGP_NOT_FOUND",
                    depart + " → " + destination);
        }

        log.debug("Trouvé {} programme(s)", programmes.size());
        return programmes;
    }

    /**
     * Récupérer les programmes de l'agent actuellement connecté
     *
     * @return Liste des programmes de l'agent
     */
    public List<ProgrammeGp> getProgrammesForCurrentAgent() {
        // Récupérer l'authentification actuelle
        Object principal = SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            username = (String) principal;
        } else {
            log.warn("Type de principal non reconnu: {}",
                    principal.getClass().getName());
            return List.of();
        }

        log.debug("Récupération des programmes pour l'agent: {}", username);

        // Rechercher l'utilisateur et ses programmes
        return utilisateurRepository.findByUsername(username)
                .filter(Utilisateur::isAgentGp)
                .map(agent -> {
                    List<ProgrammeGp> programmes = programmeGpRepository
                            .findByAgentGpId(agent.getId());
                    log.debug("Trouvé {} programme(s) pour l'agent {}",
                            programmes.size(), username);
                    return programmes;
                })
                .orElseGet(() -> {
                    log.warn("Agent non trouvé ou utilisateur sans rôle AGENTGP: {}",
                            username);
                    return List.of();
                });
    }
}