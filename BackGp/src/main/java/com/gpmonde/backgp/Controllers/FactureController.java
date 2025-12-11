//package com.gpmonde.backgp.Controllers;

//FIXME COMMENTER LA FONCTIONNALITE DE LA GESTION DE FACTURE

//
//import com.gpmonde.backgp.DTO.FactureCreateDTO;
//import com.gpmonde.backgp.DTO.FactureFilterDTO;
//import com.gpmonde.backgp.DTO.FactureResponseDTO;
//import com.gpmonde.backgp.Entities.Facture;
//import com.gpmonde.backgp.Services.FactureService;
//import io.swagger.v3.oas.annotations.Operation;
//import io.swagger.v3.oas.annotations.Parameter;
//import io.swagger.v3.oas.annotations.responses.ApiResponse;
//import io.swagger.v3.oas.annotations.tags.Tag;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.data.domain.Page;
//import org.springframework.format.annotation.DateTimeFormat;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.web.bind.annotation.*;
//
//import java.time.LocalDate;
//import java.util.List;
//import java.util.Map;
//
///**
// * Contrôleur pour la gestion des factures des agents GP
// * Permet de créer, consulter, modifier et exporter les factures
// */
//@RestController
//@RequestMapping("/api/factures")
//@RequiredArgsConstructor
//@PreAuthorize("hasRole('ROLE_AGENTGP')")
//@Tag(name = "Factures", description = "Gestion des factures pour les agents GP")
//@Slf4j
//public class FactureController {
//
//    private final FactureService factureService;
//
//    /**
//     * Créer une nouvelle facture pour un programme
//     *
//     * @param factureDTO Les données de la facture à créer
//     * @return La facture créée avec son numéro unique
//     */
//    @PostMapping
//    @Operation(
//            summary = "Créer une nouvelle facture",
//            description = "Crée une facture pour un programme donné. Le numéro de facture est généré automatiquement."
//    )
//    @ApiResponse(responseCode = "201", description = "Facture créée avec succès")
//    @ApiResponse(responseCode = "400", description = "Données invalides")
//    @ApiResponse(responseCode = "403", description = "Accès non autorisé - L'agent ne peut créer de factures que pour ses propres programmes")
//    public ResponseEntity<FactureResponseDTO> creerFacture(@RequestBody FactureCreateDTO factureDTO) {
//        try {
//            log.info("Demande de création de facture pour le programme ID: {}", factureDTO.getProgrammeId());
//            FactureResponseDTO facture = factureService.creerFacture(factureDTO);
//            log.info("Facture créée avec succès: {}", facture.getNumeroFacture());
//            return ResponseEntity.status(HttpStatus.CREATED).body(facture);
//        } catch (IllegalArgumentException e) {
//            log.error("Erreur lors de la création de la facture: {}", e.getMessage());
//            return ResponseEntity.badRequest().build();
//        } catch (Exception e) {
//            log.error("Erreur inattendue lors de la création de la facture", e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }
//
//    /**
//     * Récupérer toutes les factures de l'agent connecté
//     *
//     * @return Liste de toutes les factures de l'agent
//     */
//    @GetMapping
//    @Operation(
//            summary = "Lister les factures de l'agent",
//            description = "Récupère toutes les factures de l'agent connecté, triées par date de création décroissante"
//    )
//    @ApiResponse(responseCode = "200", description = "Liste des factures récupérée")
//    public ResponseEntity<List<FactureResponseDTO>> getFactures() {
//        try {
//            log.debug("Récupération de toutes les factures de l'agent");
//            List<FactureResponseDTO> factures = factureService.getFacturesAgent();
//            log.debug("Trouvé {} facture(s)", factures.size());
//            return ResponseEntity.ok(factures);
//        } catch (Exception e) {
//            log.error("Erreur lors de la récupération des factures", e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }
//
//    /**
//     * Récupérer les factures avec pagination et filtres
//     *
//     * @param nomClient Filtre par nom de client (recherche partielle)
//     * @param numeroFacture Filtre par numéro de facture (recherche partielle)
//     * @param statut Filtre par statut (PAYEE ou NON_PAYEE)
//     * @param dateDebut Date de début pour filtrer par période
//     * @param dateFin Date de fin pour filtrer par période
//     * @param globalFilter Recherche globale dans tous les champs
//     * @param page Numéro de page (commence à 0)
//     * @param size Nombre d'éléments par page
//     * @param sortBy Champ de tri (dateCreation, numeroFacture, etc.)
//     * @param sortDirection Direction du tri (ASC ou DESC)
//     * @return Page de factures avec métadonnées de pagination
//     */
//    @GetMapping("/paginated")
//    @Operation(
//            summary = "Lister les factures avec pagination",
//            description = "Récupère les factures avec pagination, filtres et tri. Permet une recherche globale ou par champs spécifiques."
//    )
//    public ResponseEntity<Page<FactureResponseDTO>> getFacturesPaginated(
//            @Parameter(description = "Nom du client (recherche partielle)")
//            @RequestParam(required = false) String nomClient,
//
//            @Parameter(description = "Numéro de facture (recherche partielle)")
//            @RequestParam(required = false) String numeroFacture,
//
//            @Parameter(description = "Statut de la facture (PAYEE ou NON_PAYEE)")
//            @RequestParam(required = false) Facture.StatutFacture statut,
//
//            @Parameter(description = "Date de début pour filtrer les factures (format: yyyy-MM-dd)")
//            @RequestParam(required = false)
//            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
//
//            @Parameter(description = "Date de fin pour filtrer les factures (format: yyyy-MM-dd)")
//            @RequestParam(required = false)
//            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
//
//            @Parameter(description = "Recherche globale dans tous les champs (numéro, client, adresse, départ, destination, etc.)")
//            @RequestParam(required = false) String globalFilter,
//
//            @Parameter(description = "Numéro de page (commence à 0)")
//            @RequestParam(defaultValue = "0") int page,
//
//            @Parameter(description = "Nombre d'éléments par page (recommandé: 25-50)")
//            @RequestParam(defaultValue = "25") int size,
//
//            @Parameter(description = "Champ de tri (dateCreation, numeroFacture, nomClient, statut)")
//            @RequestParam(defaultValue = "dateCreation") String sortBy,
//
//            @Parameter(description = "Direction du tri (ASC: croissant, DESC: décroissant)")
//            @RequestParam(defaultValue = "DESC") String sortDirection) {
//
//        try {
//            // Construire l'objet de filtre
//            FactureFilterDTO filter = new FactureFilterDTO();
//            filter.setNomClient(nomClient);
//            filter.setNumeroFacture(numeroFacture);
//            filter.setStatut(statut);
//            filter.setDateDebut(dateDebut);
//            filter.setDateFin(dateFin);
//            filter.setGlobalFilter(globalFilter);
//            filter.setPage(page);
//            filter.setSize(size);
//            filter.setSortBy(sortBy);
//            filter.setSortDirection(sortDirection);
//
//            log.debug("Requête de factures paginées - Page: {}, Size: {}, Filtres: {}",
//                    page, size, filter);
//
//            Page<FactureResponseDTO> factures = factureService.getFacturesAgentPaginated(filter);
//
//            log.debug("Factures trouvées: {} sur {} total",
//                    factures.getNumberOfElements(), factures.getTotalElements());
//
//            return ResponseEntity.ok(factures);
//        } catch (Exception e) {
//            log.error("Erreur lors de la récupération des factures paginées", e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }
//
//    /**
//     * Récupérer une facture par son ID
//     *
//     * @param id L'ID de la facture
//     * @return Les détails complets de la facture
//     */
//    @GetMapping("/{id}")
//    @Operation(
//            summary = "Récupérer une facture par ID",
//            description = "Récupère les détails complets d'une facture spécifique. L'agent ne peut consulter que ses propres factures."
//    )
//    @ApiResponse(responseCode = "200", description = "Facture trouvée")
//    @ApiResponse(responseCode = "404", description = "Facture non trouvée ou accès non autorisé")
//    public ResponseEntity<FactureResponseDTO> getFacture(@PathVariable Long id) {
//        try {
//            log.debug("Récupération de la facture ID: {}", id);
//            return factureService.getFactureById(id)
//                    .map(facture -> {
//                        log.debug("Facture {} trouvée", id);
//                        return ResponseEntity.ok(facture);
//                    })
//                    .orElseGet(() -> {
//                        log.warn("Facture {} non trouvée ou accès refusé", id);
//                        return ResponseEntity.notFound().build();
//                    });
//        } catch (Exception e) {
//            log.error("Erreur lors de la récupération de la facture {}", id, e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }
//
//    /**
//     * Télécharger le PDF d'une facture
//     *
//     * @param id L'ID de la facture
//     * @return Le fichier PDF en téléchargement
//     */
//    @GetMapping("/{id}/pdf")
//    @Operation(
//            summary = "Télécharger la facture en PDF",
//            description = "Génère et télécharge le PDF de la facture avec toutes les informations (agent, client, programme, montants)"
//    )
//    @ApiResponse(responseCode = "200", description = "PDF généré avec succès")
//    @ApiResponse(responseCode = "404", description = "Facture non trouvée")
//    public ResponseEntity<byte[]> downloadPDF(@PathVariable Long id) {
//        try {
//            log.info("Génération du PDF pour la facture ID: {}", id);
//            byte[] pdfData = factureService.genererPDF(id);
//
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_PDF);
//            headers.setContentDispositionFormData("attachment", "facture-" + id + ".pdf");
//            headers.setContentLength(pdfData.length);
//
//            log.info("PDF généré avec succès pour la facture {} ({} bytes)", id, pdfData.length);
//            return ResponseEntity.ok()
//                    .headers(headers)
//                    .body(pdfData);
//        } catch (IllegalArgumentException e) {
//            log.error("Facture non trouvée: {}", id);
//            return ResponseEntity.notFound().build();
//        } catch (Exception e) {
//            log.error("Erreur lors de la génération du PDF pour la facture {}", id, e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }
//
//    /**
//     * Prévisualiser le PDF d'une facture dans le navigateur
//     *
//     * @param id L'ID de la facture
//     * @return Le fichier PDF pour affichage inline
//     */
//    @GetMapping("/{id}/pdf/preview")
//    @Operation(
//            summary = "Prévisualiser la facture en PDF",
//            description = "Affiche le PDF de la facture inline dans le navigateur au lieu de le télécharger"
//    )
//    public ResponseEntity<byte[]> previewPDF(@PathVariable Long id) {
//        try {
//            log.debug("Prévisualisation du PDF pour la facture ID: {}", id);
//            byte[] pdfData = factureService.genererPDF(id);
//
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_PDF);
//            headers.setContentDispositionFormData("inline", "facture-" + id + ".pdf");
//
//            return ResponseEntity.ok()
//                    .headers(headers)
//                    .body(pdfData);
//        } catch (IllegalArgumentException e) {
//            log.error("Facture non trouvée: {}", id);
//            return ResponseEntity.notFound().build();
//        } catch (Exception e) {
//            log.error("Erreur lors de la prévisualisation du PDF pour la facture {}", id, e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }
//
//    /**
//     * Marquer une facture comme payée
//     *
//     * @param id L'ID de la facture
//     * @return La facture avec le statut mis à jour
//     */
//    @PostMapping("/{id}/payer")
//    @Operation(
//            summary = "Marquer une facture comme payée",
//            description = "Change le statut de la facture vers PAYEE et enregistre la date de paiement automatiquement"
//    )
//    public ResponseEntity<FactureResponseDTO> payerFacture(@PathVariable Long id) {
//        try {
//            log.info("Marquage de la facture {} comme payée", id);
//            FactureResponseDTO facture = factureService.changerStatutFacture(id, Facture.StatutFacture.PAYEE);
//            log.info("Facture {} marquée comme payée avec succès", id);
//            return ResponseEntity.ok(facture);
//        } catch (IllegalArgumentException e) {
//            log.error("Facture {} non trouvée lors du paiement", id);
//            return ResponseEntity.notFound().build();
//        } catch (Exception e) {
//            log.error("Erreur lors du paiement de la facture {}", id, e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }
//
//    /**
//     * Changer le statut d'une facture
//     *
//     * @param id L'ID de la facture
//     * @param request Map contenant le nouveau statut
//     * @return La facture avec le statut mis à jour
//     */
//    @PutMapping("/{id}/statut")
//    @Operation(
//            summary = "Changer le statut d'une facture",
//            description = "Met à jour le statut d'une facture (PAYEE ou NON_PAYEE uniquement)"
//    )
//    @ApiResponse(responseCode = "200", description = "Statut mis à jour")
//    @ApiResponse(responseCode = "400", description = "Statut invalide (seuls PAYEE et NON_PAYEE sont autorisés)")
//    @ApiResponse(responseCode = "404", description = "Facture non trouvée")
//    public ResponseEntity<FactureResponseDTO> changerStatut(
//            @PathVariable Long id,
//            @RequestBody Map<String, String> request) {
//        try {
//            String statutStr = request.get("statut");
//
//            // Validation des statuts autorisés
//            if (!"PAYEE".equals(statutStr) && !"NON_PAYEE".equals(statutStr)) {
//                log.error("Statut invalide: {}. Seuls PAYEE et NON_PAYEE sont autorisés", statutStr);
//                return ResponseEntity.badRequest().build();
//            }
//
//            log.info("Changement du statut de la facture {} vers {}", id, statutStr);
//            Facture.StatutFacture statut = Facture.StatutFacture.valueOf(statutStr);
//            FactureResponseDTO facture = factureService.changerStatutFacture(id, statut);
//            log.info("Statut de la facture {} changé avec succès", id);
//            return ResponseEntity.ok(facture);
//        } catch (IllegalArgumentException e) {
//            log.error("Statut invalide ou facture non trouvée: {}", e.getMessage());
//            return ResponseEntity.badRequest().build();
//        } catch (Exception e) {
//            log.error("Erreur lors du changement de statut de la facture {}", id, e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }
//
//    /**
//     * Récupérer les statistiques des factures de l'agent
//     *
//     * @return Statistiques (nombre total, montant total, nombre payées, etc.)
//     */
//    @GetMapping("/statistiques")
//    @Operation(
//            summary = "Statistiques des factures",
//            description = "Récupère les statistiques des factures de l'agent: montant total, nombre de factures, taux de paiement, etc."
//    )
//    public ResponseEntity<Map<String, Object>> getStatistiques() {
//        try {
//            log.debug("Récupération des statistiques de factures");
//            Map<String, Object> statistiques = factureService.getStatistiquesAgent();
//            log.debug("Statistiques récupérées: {}", statistiques);
//            return ResponseEntity.ok(statistiques);
//        } catch (Exception e) {
//            log.error("Erreur lors de la récupération des statistiques", e);
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//        }
//    }
//
//    /**
//     * Gestion des erreurs IllegalArgumentException
//     */
//    @ExceptionHandler(IllegalArgumentException.class)
//    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
//        log.warn("IllegalArgumentException: {}", e.getMessage());
//        return ResponseEntity.badRequest()
//                .body(Map.of("error", e.getMessage()));
//    }
//
//    /**
//     * Gestion des erreurs générales
//     */
//    @ExceptionHandler(Exception.class)
//    public ResponseEntity<Map<String, String>> handleGeneralException(Exception e) {
//        log.error("Erreur inattendue dans FactureController", e);
//        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                .body(Map.of("error", "Une erreur inattendue s'est produite"));
//    }
//}