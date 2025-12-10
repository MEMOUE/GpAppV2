package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.ProgrammeGp;
import com.gpmonde.backgp.Services.ProgrammeGpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur pour la gestion des programmes de transport GP
 * Gère les opérations CRUD sur les programmes
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "ProgrammeGp", description = "Gestion des programmes de transport")
@RequestMapping("/api/programmegp")
public class ProgrammeGpController {

    private final ProgrammeGpService programmeGpService;

    /**
     * Créer un nouveau programme de transport
     * Réservé aux agents GP uniquement
     *
     * @param programmeGp Le programme à créer
     * @return Le programme créé avec son ID
     */
    @PreAuthorize("hasRole('ROLE_AGENTGP')")
    @PostMapping
    @Operation(summary = "Créer un nouveau programme (Agents GP seulement)")
    public ProgrammeGp addProgramme(@RequestBody ProgrammeGp programmeGp) {
        return programmeGpService.addProgramme(programmeGp);
    }

    /**
     * Récupérer tous les programmes
     * Accessible à tous (public)
     *
     * @return Liste de tous les programmes
     */
    @GetMapping
    @Operation(summary = "Lister tous les programmes")
    public List<ProgrammeGp> getAllProgrammes() {
        return programmeGpService.getAllProgrammes();
    }

    /**
     * Récupérer les programmes actifs ou créés dans les dernières 24h
     * Accessible à tous (public)
     *
     * @return Liste des programmes actifs ou récents
     */
    @GetMapping("/active-or-recent")
    @Operation(summary = "Lister les programmes actifs ou récents (24h)")
    public List<ProgrammeGp> getActiveOrRecentProgrammes() {
        return programmeGpService.getActiveOrRecentProgrammes();
    }

    /**
     * Récupérer un programme par son ID
     * Accessible à tous (public)
     *
     * @param id L'ID du programme
     * @return Le programme trouvé
     */
    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un programme par ID")
    public ProgrammeGp getProgrammeById(@PathVariable Long id) {
        return programmeGpService.getProgrammeById(id);
    }

    /**
     * Mettre à jour un programme existant
     * Réservé aux agents GP uniquement
     *
     * @param id L'ID du programme à modifier
     * @param programmeDetails Les nouvelles données
     * @return Le programme mis à jour
     */
    @PreAuthorize("hasRole('ROLE_AGENTGP')")
    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un programme (Agents GP seulement)")
    public ProgrammeGp updateProgramme(@PathVariable Long id, @RequestBody ProgrammeGp programmeDetails) {
        return programmeGpService.updateProgramme(id, programmeDetails);
    }

    /**
     * Supprimer un programme
     * Réservé aux agents GP uniquement
     *
     * @param id L'ID du programme à supprimer
     */
    @PreAuthorize("hasRole('ROLE_AGENTGP')")
    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un programme (Agents GP seulement)")
    public void deleteProgramme(@PathVariable Long id) {
        programmeGpService.deleteProgramme(id);
    }

    /**
     * Rechercher des programmes par départ et destination
     * Accessible à tous (public)
     *
     * @param depart Ville de départ
     * @param destination Ville de destination
     * @return Liste des programmes correspondants
     */
    @GetMapping("/searsh")
    @Operation(summary = "Rechercher des programmes par départ et destination")
    public List<ProgrammeGp> getProgrammegp(
            @RequestParam String depart,
            @RequestParam String destination) {
        return programmeGpService.findByDepartureAndDestination(depart, destination);
    }

    /**
     * Récupérer les programmes de l'agent connecté
     * Réservé aux agents GP uniquement
     *
     * @return Liste des programmes de l'agent
     */
    @PreAuthorize("hasRole('ROLE_AGENTGP')")
    @GetMapping("/mylist")
    @Operation(summary = "Lister mes programmes (Agent connecté)")
    public List<ProgrammeGp> getProgrammesForCurrentAgent() {
        return programmeGpService.getProgrammesForCurrentAgent();
    }
}