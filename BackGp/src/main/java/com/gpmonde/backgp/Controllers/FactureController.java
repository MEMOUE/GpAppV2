//package com.gpmonde.backgp.Controllers;
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
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.web.bind.annotation.*;
//
//import org.springframework.format.annotation.DateTimeFormat;
//import java.time.LocalDate;
//
//import java.util.List;
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/factures")
//@RequiredArgsConstructor
//@PreAuthorize("hasRole('ROLE_AGENTGP')")
//@Tag(name = "Factures", description = "Gestion des factures pour les agents GP")
//@Slf4j
//public class FactureController {
//
//	private final FactureService factureService;
//
//	@PostMapping
//	@Operation(summary = "Créer une nouvelle facture", description = "Crée une facture pour un programme donné")
//	@ApiResponse(responseCode = "201", description = "Facture créée avec succès")
//	@ApiResponse(responseCode = "400", description = "Données invalides")
//	@ApiResponse(responseCode = "403", description = "Accès non autorisé")
//	public ResponseEntity<FactureResponseDTO> creerFacture(@RequestBody FactureCreateDTO factureDTO) {
//		try {
//			FactureResponseDTO facture = factureService.creerFacture(factureDTO);
//			log.info("Facture créée avec succès: {}", facture.getNumeroFacture());
//			return ResponseEntity.status(HttpStatus.CREATED).body(facture);
//		} catch (IllegalArgumentException e) {
//			log.error("Erreur lors de la création de la facture: {}", e.getMessage());
//			return ResponseEntity.badRequest().build();
//		} catch (Exception e) {
//			log.error("Erreur inattendue lors de la création de la facture", e);
//			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//		}
//	}
//
//	@GetMapping
//	@Operation(summary = "Lister les factures de l'agent", description = "Récupère toutes les factures de l'agent connecté")
//	@ApiResponse(responseCode = "200", description = "Liste des factures récupérée")
//	public ResponseEntity<List<FactureResponseDTO>> getFactures() {
//		try {
//			List<FactureResponseDTO> factures = factureService.getFacturesAgent();
//			return ResponseEntity.ok(factures);
//		} catch (Exception e) {
//			log.error("Erreur lors de la récupération des factures", e);
//			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//		}
//	}
//
//	@GetMapping("/paginated")
//	@Operation(summary = "Lister les factures avec pagination", description = "Récupère les factures avec pagination et filtres")
//	public ResponseEntity<Page<FactureResponseDTO>> getFacturesPaginated(
//			@Parameter(description = "Nom du client") @RequestParam(required = false) String nomClient,
//			@Parameter(description = "Numéro de facture") @RequestParam(required = false) String numeroFacture,
//			@Parameter(description = "Statut de la facture") @RequestParam(required = false) Facture.StatutFacture statut,
//			@Parameter(description = "Date de début (yyyy-mm-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
//			@Parameter(description = "Date de fin (yyyy-mm-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
//			@Parameter(description = "Recherche globale dans tous les champs") @RequestParam(required = false) String globalFilter,
//			@Parameter(description = "Numéro de page (commence à 0)") @RequestParam(defaultValue = "0") int page,
//			@Parameter(description = "Nombre d'éléments par page") @RequestParam(defaultValue = "25") int size,
//			@Parameter(description = "Champ de tri") @RequestParam(defaultValue = "dateCreation") String sortBy,
//			@Parameter(description = "Direction du tri (ASC ou DESC)") @RequestParam(defaultValue = "DESC") String sortDirection) {
//
//		try {
//			// Construire l'objet de filtre
//			FactureFilterDTO filter = new FactureFilterDTO();
//			filter.setNomClient(nomClient);
//			filter.setNumeroFacture(numeroFacture);
//			filter.setStatut(statut);
//			filter.setDateDebut(dateDebut);
//			filter.setDateFin(dateFin);
//			filter.setGlobalFilter(globalFilter);
//			filter.setPage(page);
//			filter.setSize(size);
//			filter.setSortBy(sortBy);
//			filter.setSortDirection(sortDirection);
//
//			log.debug("Requête de factures paginées avec filtres: {}", filter);
//
//			Page<FactureResponseDTO> factures = factureService.getFacturesAgentPaginated(filter);
//			return ResponseEntity.ok(factures);
//		} catch (Exception e) {
//			log.error("Erreur lors de la récupération des factures paginées", e);
//			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//		}
//	}
//
//	@GetMapping("/{id}")
//	@Operation(summary = "Récupérer une facture par ID", description = "Récupère les détails d'une facture spécifique")
//	@ApiResponse(responseCode = "200", description = "Facture trouvée")
//	@ApiResponse(responseCode = "404", description = "Facture non trouvée")
//	public ResponseEntity<FactureResponseDTO> getFacture(@PathVariable Long id) {
//		try {
//			return factureService.getFactureById(id)
//					.map(ResponseEntity::ok)
//					.orElse(ResponseEntity.notFound().build());
//		} catch (Exception e) {
//			log.error("Erreur lors de la récupération de la facture {}", id, e);
//			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//		}
//	}
//
//	@GetMapping("/{id}/pdf")
//	@Operation(summary = "Télécharger la facture en PDF", description = "Génère et télécharge le PDF de la facture")
//	@ApiResponse(responseCode = "200", description = "PDF généré avec succès")
//	@ApiResponse(responseCode = "404", description = "Facture non trouvée")
//	public ResponseEntity<byte[]> downloadPDF(@PathVariable Long id) {
//		try {
//			byte[] pdfData = factureService.genererPDF(id);
//
//			HttpHeaders headers = new HttpHeaders();
//			headers.setContentType(MediaType.APPLICATION_PDF);
//			headers.setContentDispositionFormData("attachment", "facture-" + id + ".pdf");
//			headers.setContentLength(pdfData.length);
//
//			return ResponseEntity.ok()
//					.headers(headers)
//					.body(pdfData);
//		} catch (IllegalArgumentException e) {
//			log.error("Facture non trouvée: {}", id);
//			return ResponseEntity.notFound().build();
//		} catch (Exception e) {
//			log.error("Erreur lors de la génération du PDF pour la facture {}", id, e);
//			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//		}
//	}
//
//	@GetMapping("/{id}/pdf/preview")
//	@Operation(summary = "Prévisualiser la facture en PDF", description = "Affiche le PDF de la facture inline dans le navigateur")
//	public ResponseEntity<byte[]> previewPDF(@PathVariable Long id) {
//		try {
//			byte[] pdfData = factureService.genererPDF(id);
//
//			HttpHeaders headers = new HttpHeaders();
//			headers.setContentType(MediaType.APPLICATION_PDF);
//			headers.setContentDispositionFormData("inline", "facture-" + id + ".pdf");
//
//			return ResponseEntity.ok()
//					.headers(headers)
//					.body(pdfData);
//		} catch (IllegalArgumentException e) {
//			log.error("Facture non trouvée: {}", id);
//			return ResponseEntity.notFound().build();
//		} catch (Exception e) {
//			log.error("Erreur lors de la prévisualisation du PDF pour la facture {}", id, e);
//			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//		}
//	}
//
//	// Méthode simplifiée pour marquer comme payée
//	@PostMapping("/{id}/payer")
//	@Operation(summary = "Marquer une facture comme payée", description = "Change le statut vers PAYEE et enregistre la date de paiement")
//	public ResponseEntity<FactureResponseDTO> payerFacture(@PathVariable Long id) {
//		try {
//			FactureResponseDTO facture = factureService.changerStatutFacture(id, Facture.StatutFacture.PAYEE);
//			return ResponseEntity.ok(facture);
//		} catch (IllegalArgumentException e) {
//			return ResponseEntity.notFound().build();
//		} catch (Exception e) {
//			log.error("Erreur lors du paiement de la facture {}", id, e);
//			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//		}
//	}
//
//	// Méthode pour changer le statut (utilisée pour marquer comme NON_PAYEE si nécessaire)
//	@PutMapping("/{id}/statut")
//	@Operation(summary = "Changer le statut d'une facture", description = "Met à jour le statut d'une facture")
//	@ApiResponse(responseCode = "200", description = "Statut mis à jour")
//	@ApiResponse(responseCode = "404", description = "Facture non trouvée")
//	public ResponseEntity<FactureResponseDTO> changerStatut(
//			@PathVariable Long id,
//			@RequestBody Map<String, String> request) {
//		try {
//			String statutStr = request.get("statut");
//
//			// Validation des statuts autorisés
//			if (!"PAYEE".equals(statutStr) && !"NON_PAYEE".equals(statutStr)) {
//				log.error("Statut invalide: {}. Seuls PAYEE et NON_PAYEE sont autorisés", statutStr);
//				return ResponseEntity.badRequest().build();
//			}
//
//			Facture.StatutFacture statut = Facture.StatutFacture.valueOf(statutStr);
//			FactureResponseDTO facture = factureService.changerStatutFacture(id, statut);
//			return ResponseEntity.ok(facture);
//		} catch (IllegalArgumentException e) {
//			log.error("Statut invalide ou facture non trouvée: {}", e.getMessage());
//			return ResponseEntity.badRequest().build();
//		} catch (Exception e) {
//			log.error("Erreur lors du changement de statut de la facture {}", id, e);
//			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//		}
//	}
//
//	@GetMapping("/statistiques")
//	@Operation(summary = "Statistiques des factures", description = "Récupère les statistiques des factures de l'agent")
//	public ResponseEntity<Map<String, Object>> getStatistiques() {
//		try {
//			Map<String, Object> statistiques = factureService.getStatistiquesAgent();
//			return ResponseEntity.ok(statistiques);
//		} catch (Exception e) {
//			log.error("Erreur lors de la récupération des statistiques", e);
//			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
//		}
//	}
//
//	@ExceptionHandler(IllegalArgumentException.class)
//	public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
//		return ResponseEntity.badRequest()
//				.body(Map.of("error", e.getMessage()));
//	}
//
//	@ExceptionHandler(Exception.class)
//	public ResponseEntity<Map<String, String>> handleGeneralException(Exception e) {
//		log.error("Erreur inattendue dans FactureController", e);
//		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//				.body(Map.of("error", "Une erreur inattendue s'est produite"));
//	}
//}