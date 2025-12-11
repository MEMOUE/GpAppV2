//package com.gpmonde.backgp.Services;
//
//FIXME COMMENTER LA FONCTIONNALITE DE LA GESTION DE FACTURE

//import com.gpmonde.backgp.DTO.FactureCreateDTO;
//import com.gpmonde.backgp.DTO.FactureFilterDTO;
//import com.gpmonde.backgp.DTO.FactureResponseDTO;
//import com.gpmonde.backgp.Entities.Utilisateur;
//import com.gpmonde.backgp.Entities.Facture;
//import com.gpmonde.backgp.Entities.ProgrammeGp;
//import com.gpmonde.backgp.Repositorys.FactureRepository;
//import com.gpmonde.backgp.Repositorys.ProgrammeGpRepository;
//import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
//import com.lowagie.text.*;
//import com.lowagie.text.Font;
//import com.lowagie.text.Image;
//import com.lowagie.text.Rectangle;
//import com.lowagie.text.pdf.*;
//import com.lowagie.text.pdf.draw.LineSeparator;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.domain.Sort;
//import org.springframework.data.jpa.domain.Specification;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.awt.*;
//import java.io.ByteArrayOutputStream;
//import java.io.IOException;
//import java.time.format.DateTimeFormatter;
//import java.util.*;
//import java.util.List;
//import java.util.stream.Collectors;
//
///**
// * Service pour la gestion des factures
// * Gère toutes les opérations métier liées aux factures
// */
//@Service
//@RequiredArgsConstructor
//@Slf4j
//public class FactureService {
//
//    private final FactureRepository factureRepository;
//    private final ProgrammeGpRepository programmeGpRepository;
//    private final UtilisateurRepository utilisateurRepository;
//
//    /**
//     * Créer une nouvelle facture pour un programme
//     *
//     * @param dto Les données de la facture à créer
//     * @return La facture créée avec toutes les informations
//     * @throws IllegalArgumentException Si le programme n'existe pas ou n'appartient pas à l'agent
//     */
//    @Transactional
//    public FactureResponseDTO creerFacture(FactureCreateDTO dto) {
//        log.info("Création d'une facture pour le programme ID: {}", dto.getProgrammeId());
//
//        // Récupérer l'agent connecté
//        Utilisateur agent = getCurrentAgent();
//
//        // Vérifier que c'est bien un agent GP
//        if (!agent.isAgentGp()) {
//            log.error("L'utilisateur {} n'est pas un agent GP", agent.getUsername());
//            throw new IllegalArgumentException("Seuls les agents GP peuvent créer des factures");
//        }
//
//        // Récupérer le programme
//        ProgrammeGp programme = programmeGpRepository.findById(dto.getProgrammeId())
//                .orElseThrow(() -> new IllegalArgumentException("Programme non trouvé"));
//
//        // Vérifier que le programme appartient à l'agent
//        if (!programme.getAgentGp().getId().equals(agent.getId())) {
//            log.error("Le programme {} n'appartient pas à l'agent {}",
//                    dto.getProgrammeId(), agent.getId());
//            throw new IllegalArgumentException("Ce programme ne vous appartient pas");
//        }
//
//        // Créer la facture
//        Facture facture = new Facture();
//        facture.setNomClient(dto.getNomClient());
//        facture.setAdresseClient(dto.getAdresseClient());
//        facture.setLaveurBagage(dto.getLaveurBagage());
//        facture.setNombreKg(dto.getNombreKg());
//        facture.setPrixTransport(dto.getPrixTransport());
//
//        // Calculer le prix unitaire
//        facture.setPrixUnitaire(calculatePrixUnitaire(
//                dto.getPrixTransport(),
//                dto.getNombreKg(),
//                programme.getPrix()
//        ));
//
//        facture.setNotes(dto.getNotes());
//        facture.setAgentGp(agent);
//        facture.setProgrammeGp(programme);
//        facture.setStatut(Facture.StatutFacture.NON_PAYEE);
//
//        // Traiter la signature si présente
//        if (dto.getSignatureBase64() != null && !dto.getSignatureBase64().isEmpty()) {
//            try {
//                byte[] signatureBytes = Base64.getDecoder().decode(
//                        dto.getSignatureBase64().replace("data:image/png;base64,", "")
//                );
//                facture.setSignatureData(signatureBytes);
//                log.debug("Signature ajoutée à la facture");
//            } catch (Exception e) {
//                log.warn("Erreur lors du traitement de la signature: {}", e.getMessage());
//            }
//        }
//
//        // Sauvegarder la facture
//        Facture savedFacture = factureRepository.save(facture);
//        log.info("Facture créée avec succès: {} pour l'agent {}",
//                savedFacture.getNumeroFacture(), agent.getUsername());
//
//        return FactureResponseDTO.fromEntity(savedFacture);
//    }
//
//    /**
//     * Récupérer toutes les factures de l'agent connecté
//     *
//     * @return Liste de toutes les factures
//     */
//    public List<FactureResponseDTO> getFacturesAgent() {
//        Utilisateur agent = getCurrentAgent();
//        log.debug("Récupération des factures pour l'agent: {}", agent.getUsername());
//
//        List<Facture> factures = factureRepository.findByAgentGpOrderByDateCreationDesc(agent);
//
//        log.debug("Trouvé {} facture(s)", factures.size());
//        return factures.stream()
//                .map(FactureResponseDTO::fromEntity)
//                .collect(Collectors.toList());
//    }
//
//    /**
//     * Récupérer les factures avec pagination et filtres
//     *
//     * @param filter DTO contenant tous les critères de filtrage
//     * @return Page de factures avec métadonnées de pagination
//     */
//    public Page<FactureResponseDTO> getFacturesAgentPaginated(FactureFilterDTO filter) {
//        Utilisateur agent = getCurrentAgent();
//
//        log.debug("Filtrage des factures pour l'agent {} avec les paramètres: {}",
//                agent.getUsername(), filter);
//
//        // Créer la spécification avec tous les filtres
//        Specification<Facture> spec = FactureSpecifications.withFilters(filter, agent);
//
//        // Créer le tri
//        Sort sort = Sort.by(
//                Sort.Direction.fromString(filter.getSortDirection()),
//                filter.getSortBy()
//        );
//
//        // Créer la pagination
//        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(), sort);
//
//        // Exécuter la requête avec les filtres
//        Page<Facture> factures = factureRepository.findAll(spec, pageable);
//
//        log.debug("Factures trouvées: {} sur {} total (page {}/{})",
//                factures.getNumberOfElements(),
//                factures.getTotalElements(),
//                factures.getNumber() + 1,
//                factures.getTotalPages());
//
//        return factures.map(FactureResponseDTO::fromEntity);
//    }
//
//    /**
//     * Récupérer une facture par son ID
//     *
//     * @param id L'ID de la facture
//     * @return Optional contenant la facture si trouvée et appartenant à l'agent
//     */
//    public Optional<FactureResponseDTO> getFactureById(Long id) {
//        Utilisateur agent = getCurrentAgent();
//
//        log.debug("Récupération de la facture {} pour l'agent {}", id, agent.getUsername());
//
//        return factureRepository.findById(id)
//                .filter(facture -> facture.getAgentGp().getId().equals(agent.getId()))
//                .map(facture -> {
//                    log.debug("Facture {} trouvée et appartient à l'agent", id);
//                    return FactureResponseDTO.fromEntity(facture);
//                });
//    }
//
//    /**
//     * Générer le PDF d'une facture
//     *
//     * @param factureId L'ID de la facture
//     * @return Tableau de bytes représentant le PDF
//     * @throws DocumentException Si erreur lors de la génération du PDF
//     * @throws IOException Si erreur lors de la lecture des ressources
//     */
//    public byte[] genererPDF(Long factureId) throws DocumentException, IOException {
//        log.info("Génération du PDF pour la facture ID: {}", factureId);
//
//        Facture facture = factureRepository.findById(factureId)
//                .orElseThrow(() -> new IllegalArgumentException("Facture non trouvée"));
//
//        // Vérifier les droits d'accès
//        Utilisateur agent = getCurrentAgent();
//        if (!facture.getAgentGp().getId().equals(agent.getId())) {
//            log.error("L'agent {} tente d'accéder à une facture qui ne lui appartient pas",
//                    agent.getUsername());
//            throw new IllegalArgumentException("Accès non autorisé à cette facture");
//        }
//
//        byte[] pdfBytes = generatePDFContent(facture);
//        log.info("PDF généré avec succès pour la facture {} ({} bytes)",
//                factureId, pdfBytes.length);
//
//        return pdfBytes;
//    }
//
//    /**
//     * Changer le statut d'une facture
//     *
//     * @param factureId L'ID de la facture
//     * @param nouveauStatut Le nouveau statut
//     * @return La facture avec le statut mis à jour
//     */
//    @Transactional
//    public FactureResponseDTO changerStatutFacture(Long factureId, Facture.StatutFacture nouveauStatut) {
//        log.info("Changement du statut de la facture {} vers {}", factureId, nouveauStatut);
//
//        Facture facture = factureRepository.findById(factureId)
//                .orElseThrow(() -> new IllegalArgumentException("Facture non trouvée"));
//
//        // Vérifier les droits d'accès
//        Utilisateur agent = getCurrentAgent();
//        if (!facture.getAgentGp().getId().equals(agent.getId())) {
//            log.error("Accès non autorisé à la facture {} par l'agent {}",
//                    factureId, agent.getUsername());
//            throw new IllegalArgumentException("Accès non autorisé à cette facture");
//        }
//
//        // Mettre à jour le statut
//        facture.setStatut(nouveauStatut);
//
//        // Si marquée comme payée, enregistrer la date de paiement
//        if (nouveauStatut == Facture.StatutFacture.PAYEE && facture.getDatePayement() == null) {
//            facture.marquerCommePayee();
//            log.debug("Date de paiement enregistrée pour la facture {}", factureId);
//        }
//
//        // Si marquée comme non payée, supprimer la date de paiement
//        if (nouveauStatut == Facture.StatutFacture.NON_PAYEE) {
//            facture.marquerCommeNonPayee();
//            log.debug("Date de paiement supprimée pour la facture {}", factureId);
//        }
//
//        Facture savedFacture = factureRepository.save(facture);
//        log.info("Statut de la facture {} changé avec succès vers {}",
//                factureId, nouveauStatut);
//
//        return FactureResponseDTO.fromEntity(savedFacture);
//    }
//
//    /**
//     * Récupérer les statistiques de l'agent
//     *
//     * @return Map contenant les statistiques (montants totaux, nombre de factures, etc.)
//     */
//    public Map<String, Object> getStatistiquesAgent() {
//        Utilisateur agent = getCurrentAgent();
//        log.debug("Calcul des statistiques pour l'agent: {}", agent.getUsername());
//
//        List<Facture> factures = factureRepository.findByAgentGpOrderByDateCreationDesc(agent);
//
//        // Calculer les totaux par devise
//        Map<String, Double> totauxParDevise = new HashMap<>();
//        Map<String, Double> totauxPayesParDevise = new HashMap<>();
//
//        for (Facture facture : factures) {
//            try {
//                double valeur = extractNumericalValue(facture.getPrixTransport());
//                String devise = extractDevise(facture.getPrixTransport());
//                if (devise == null) devise = "FCFA"; // Devise par défaut
//
//                // Total général
//                totauxParDevise.merge(devise, valeur, Double::sum);
//
//                // Total factures payées
//                if (facture.getStatut() == Facture.StatutFacture.PAYEE) {
//                    totauxPayesParDevise.merge(devise, valeur, Double::sum);
//                }
//            } catch (Exception e) {
//                log.warn("Erreur lors du calcul des statistiques pour la facture {}: {}",
//                        facture.getNumeroFacture(), e.getMessage());
//            }
//        }
//
//        // Formater les totaux
//        String totalFormatted = formatMontantsParDevise(totauxParDevise);
//        String totalPayeFormatted = formatMontantsParDevise(totauxPayesParDevise);
//
//        long nombreFactures = factures.size();
//        long nombreFacturesPayees = factures.stream()
//                .filter(f -> f.getStatut() == Facture.StatutFacture.PAYEE)
//                .count();
//        long nombreFacturesNonPayees = nombreFactures - nombreFacturesPayees;
//
//        // Calculer le taux de paiement
//        double tauxPaiement = nombreFactures > 0
//                ? (nombreFacturesPayees * 100.0 / nombreFactures)
//                : 0.0;
//
//        Map<String, Object> statistiques = new HashMap<>();
//        statistiques.put("totalFactures", totalFormatted);
//        statistiques.put("totalFacturesPayees", totalPayeFormatted);
//        statistiques.put("nombreFactures", nombreFactures);
//        statistiques.put("nombreFacturesPayees", nombreFacturesPayees);
//        statistiques.put("nombreFacturesNonPayees", nombreFacturesNonPayees);
//        statistiques.put("tauxPaiement", String.format("%.1f%%", tauxPaiement));
//
//        log.debug("Statistiques calculées: {} factures, {} payées ({})",
//                nombreFactures, nombreFacturesPayees, statistiques.get("tauxPaiement"));
//
//        return statistiques;
//    }
//
//    // ========== MÉTHODES PRIVÉES ==========
//
//    /**
//     * Récupère l'agent actuellement connecté
//     *
//     * @return L'utilisateur agent connecté
//     * @throws IllegalStateException Si l'agent n'est pas trouvé
//     */
//    private Utilisateur getCurrentAgent() {
//        String username = SecurityContextHolder.getContext().getAuthentication().getName();
//        return utilisateurRepository.findByUsername(username)
//                .orElseThrow(() -> new IllegalStateException("Agent non trouvé"));
//    }
//
//    /**
//     * Calcule le prix unitaire par kilogramme
//     *
//     * @param prixTotal Prix total du transport
//     * @param nombreKg Nombre de kilogrammes
//     * @param prixProgramme Prix du programme (pour extraire la devise)
//     * @return Prix unitaire formaté avec devise
//     */
//    private String calculatePrixUnitaire(String prixTotal, Integer nombreKg, String prixProgramme) {
//        if (nombreKg == null || nombreKg == 0) {
//            String devise = extractDevise(prixProgramme);
//            return "0 " + (devise != null ? devise : "FCFA");
//        }
//
//        try {
//            // Extraire la valeur numérique du prix total
//            double valeurTotale = extractNumericalValue(prixTotal);
//            double prixUnitaire = valeurTotale / nombreKg;
//
//            // Extraire la devise
//            String devise = extractDevise(prixTotal);
//            if (devise == null) {
//                devise = extractDevise(prixProgramme);
//            }
//            if (devise == null) {
//                devise = "FCFA"; // Devise par défaut
//            }
//
//            // Formater avec 2 décimales
//            return String.format("%.2f %s", prixUnitaire, devise);
//
//        } catch (Exception e) {
//            log.warn("Erreur lors du calcul du prix unitaire: {}", e.getMessage());
//            return "0 FCFA";
//        }
//    }
//
//    /**
//     * Extrait la valeur numérique d'un prix
//     *
//     * @param prix Prix sous forme de string (ex: "50000 FCFA")
//     * @return Valeur numérique
//     */
//    private double extractNumericalValue(String prix) {
//        if (prix == null || prix.trim().isEmpty()) {
//            return 0.0;
//        }
//
//        try {
//            // Supprimer tout ce qui n'est pas un chiffre, point ou virgule
//            String cleanedPrice = prix.replaceAll("[^0-9.,]", "");
//
//            // Remplacer la virgule par un point pour la décimale
//            cleanedPrice = cleanedPrice.replace(",", ".");
//
//            return Double.parseDouble(cleanedPrice);
//        } catch (NumberFormatException e) {
//            log.warn("Impossible d'extraire la valeur numérique de: {}", prix);
//            return 0.0;
//        }
//    }
//
//    /**
//     * Extrait la devise d'un prix
//     *
//     * @param prix Prix sous forme de string (ex: "50000 FCFA")
//     * @return La devise (FCFA, EUR, USD, etc.)
//     */
//    private String extractDevise(String prix) {
//        if (prix == null || prix.trim().isEmpty()) {
//            return null;
//        }
//
//        // Devises courantes
//        String[] devises = {"XOF", "FCFA", "€", "EUR", "EURO", "$", "USD", "£", "GBP", "¥", "JPY"};
//
//        for (String devise : devises) {
//            if (prix.toUpperCase().contains(devise)) {
//                // Normaliser certaines devises
//                if (devise.equals("€") || devise.equals("EURO")) return "EUR";
//                if (devise.equals("$")) return "USD";
//                if (devise.equals("£")) return "GBP";
//                if (devise.equals("¥")) return "JPY";
//                if (devise.equals("XOF")) return "FCFA";
//                return devise;
//            }
//        }
//
//        // Si aucune devise connue trouvée, extraire les caractères non numériques
//        String deviseExtracted = prix.replaceAll("[0-9.,\\s]", "").trim();
//        return deviseExtracted.isEmpty() ? null : deviseExtracted;
//    }
//
//    /**
//     * Formate les montants par devise pour l'affichage
//     *
//     * @param montantsParDevise Map des montants par devise
//     * @return String formatté (ex: "50000 FCFA + 500 EUR")
//     */
//    private String formatMontantsParDevise(Map<String, Double> montantsParDevise) {
//        if (montantsParDevise.isEmpty()) {
//            return "0 FCFA";
//        }
//
//        StringBuilder formatted = new StringBuilder();
//        for (Map.Entry<String, Double> entry : montantsParDevise.entrySet()) {
//            if (formatted.length() > 0) {
//                formatted.append(" + ");
//            }
//            formatted.append(String.format("%.2f %s", entry.getValue(), entry.getKey()));
//        }
//
//        return formatted.toString();
//    }
//
//    /**
//     * Génère le contenu PDF de la facture
//     *
//     * @param facture La facture à transformer en PDF
//     * @return Tableau de bytes représentant le PDF
//     * @throws DocumentException Si erreur lors de la génération
//     * @throws IOException Si erreur lors de la lecture des ressources
//     */
//    private byte[] generatePDFContent(Facture facture) throws DocumentException, IOException {
//        ByteArrayOutputStream baos = new ByteArrayOutputStream();
//        Document document = new Document(PageSize.A4);
//        PdfWriter writer = PdfWriter.getInstance(document, baos);
//
//        document.open();
//
//        // Définir les polices
//        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLUE);
//        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK);
//        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
//        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
//
//        // En-tête avec logo
//        addHeader(document, facture, titleFont, headerFont);
//
//        // Informations de l'agence
//        addAgenceInfo(document, facture.getAgentGp(), headerFont, normalFont);
//
//        // Ligne de séparation
//        addSeparatorLine(document);
//
//        // Informations du client et de la facture
//        addClientAndInvoiceInfo(document, facture, headerFont, normalFont, boldFont);
//
//        // Détails du programme
//        addProgrammeDetails(document, facture.getProgrammeGp(), headerFont, normalFont, boldFont);
//
//        // Tableau des services
//        addServicesTable(document, facture, headerFont, normalFont, boldFont);
//
//        // Signature
//        addSignature(document, facture, headerFont);
//
//        // Pied de page
//        addFooter(document, normalFont);
//
//        document.close();
//        return baos.toByteArray();
//    }
//
//    // ========== MÉTHODES DE GÉNÉRATION PDF ==========
//
//    private void addHeader(Document document, Facture facture, Font titleFont, Font headerFont)
//            throws DocumentException {
//
//        // Titre principal
//        Paragraph title = new Paragraph("FACTURE", titleFont);
//        title.setAlignment(Element.ALIGN_CENTER);
//        title.setSpacingAfter(10);
//        document.add(title);
//
//        // Numéro de facture et date
//        Paragraph factureInfo = new Paragraph();
//        factureInfo.add(new Chunk("N° Facture: ", headerFont));
//        factureInfo.add(new Chunk(facture.getNumeroFacture(), FontFactory.getFont(FontFactory.HELVETICA, 12)));
//        factureInfo.add(Chunk.NEWLINE);
//        factureInfo.add(new Chunk("Date: ", headerFont));
//        factureInfo.add(new Chunk(facture.getDateCreation().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
//                FontFactory.getFont(FontFactory.HELVETICA, 10)));
//        factureInfo.setAlignment(Element.ALIGN_RIGHT);
//        factureInfo.setSpacingAfter(15);
//        document.add(factureInfo);
//    }
//
//    private void addAgenceInfo(Document document, Utilisateur agent, Font headerFont, Font normalFont)
//            throws DocumentException {
//
//        Paragraph agenceTitle = new Paragraph("INFORMATIONS DE L'AGENCE", headerFont);
//        agenceTitle.setSpacingAfter(8);
//        document.add(agenceTitle);
//
//        PdfPTable agenceTable = new PdfPTable(2);
//        agenceTable.setWidthPercentage(100);
//        agenceTable.setWidths(new float[]{1, 3});
//
//        addTableRow(agenceTable, "Agence:", agent.getNomagence() != null ? agent.getNomagence() : "N/A",
//                headerFont, normalFont);
//        addTableRow(agenceTable, "Adresse:", agent.getAdresse() != null ? agent.getAdresse() : "N/A",
//                headerFont, normalFont);
//        addTableRow(agenceTable, "Téléphone:", agent.getTelephone() != null ? agent.getTelephone() : "N/A",
//                headerFont, normalFont);
//        addTableRow(agenceTable, "Email:", agent.getEmail(), headerFont, normalFont);
//
//        agenceTable.setSpacingAfter(15);
//        document.add(agenceTable);
//    }
//
//    private void addClientAndInvoiceInfo(Document document, Facture facture, Font headerFont,
//                                         Font normalFont, Font boldFont) throws DocumentException {
//
//        PdfPTable infoTable = new PdfPTable(2);
//        infoTable.setWidthPercentage(100);
//        infoTable.setWidths(new float[]{1, 1});
//
//        // Colonne client
//        PdfPCell clientCell = new PdfPCell();
//        clientCell.setBorder(Rectangle.BOX);
//        clientCell.setPadding(10);
//
//        Paragraph clientTitle = new Paragraph("INFORMATIONS CLIENT", headerFont);
//        clientTitle.setSpacingAfter(8);
//        clientCell.addElement(clientTitle);
//
//        Paragraph clientInfo = new Paragraph();
//        clientInfo.add(new Chunk("Nom: ", boldFont));
//        clientInfo.add(new Chunk(facture.getNomClient(), normalFont));
//        clientInfo.add(Chunk.NEWLINE);
//        clientInfo.add(new Chunk("Adresse: ", boldFont));
//        clientInfo.add(new Chunk(facture.getAdresseClient(), normalFont));
//        clientInfo.add(Chunk.NEWLINE);
//        clientInfo.add(new Chunk("Laveur: ", boldFont));
//        clientInfo.add(new Chunk(facture.getLaveurBagage(), normalFont));
//        clientCell.addElement(clientInfo);
//
//        infoTable.addCell(clientCell);
//
//        // Colonne facture
//        PdfPCell factureCell = new PdfPCell();
//        factureCell.setBorder(Rectangle.BOX);
//        factureCell.setPadding(10);
//
//        Paragraph factureTitle = new Paragraph("DÉTAILS FACTURE", headerFont);
//        factureTitle.setSpacingAfter(8);
//        factureCell.addElement(factureTitle);
//
//        Paragraph factureDetails = new Paragraph();
//        factureDetails.add(new Chunk("Statut: ", boldFont));
//        factureDetails.add(new Chunk(facture.getStatut().getDisplayName(), normalFont));
//        factureDetails.add(Chunk.NEWLINE);
//        factureDetails.add(new Chunk("Nombre KG: ", boldFont));
//        factureDetails.add(new Chunk(facture.getNombreKg().toString(), normalFont));
//        factureDetails.add(Chunk.NEWLINE);
//        factureDetails.add(new Chunk("Prix unitaire: ", boldFont));
//        factureDetails.add(new Chunk(facture.getPrixUnitaire(), normalFont));
//        factureCell.addElement(factureDetails);
//
//        infoTable.addCell(factureCell);
//        infoTable.setSpacingAfter(15);
//        document.add(infoTable);
//    }
//
//    private void addProgrammeDetails(Document document, ProgrammeGp programme, Font headerFont,
//                                     Font normalFont, Font boldFont) throws DocumentException {
//
//        Paragraph programmeTitle = new Paragraph("DÉTAILS DU PROGRAMME", headerFont);
//        programmeTitle.setSpacingAfter(8);
//        document.add(programmeTitle);
//
//        PdfPTable programmeTable = new PdfPTable(2);
//        programmeTable.setWidthPercentage(100);
//        programmeTable.setWidths(new float[]{1, 3});
//
//        addTableRow(programmeTable, "Description:", programme.getDescription(), boldFont, normalFont);
//        addTableRow(programmeTable, "Départ:", programme.getDepart(), boldFont, normalFont);
//        addTableRow(programmeTable, "Destination:", programme.getDestination(), boldFont, normalFont);
//        addTableRow(programmeTable, "Prix par KG:", programme.getPrix(), boldFont, normalFont);
//        addTableRow(programmeTable, "Garantie:", programme.getGarantie() + "%", boldFont, normalFont);
//
//        if (programme.getDateline() != null) {
//            addTableRow(programmeTable, "Date limite:", programme.getDateline().toString(),
//                    boldFont, normalFont);
//        }
//
//        programmeTable.setSpacingAfter(15);
//        document.add(programmeTable);
//    }
//
//    private void addServicesTable(Document document, Facture facture, Font headerFont,
//                                  Font normalFont, Font boldFont) throws DocumentException {
//
//        Paragraph servicesTitle = new Paragraph("DÉTAIL DES SERVICES", headerFont);
//        servicesTitle.setSpacingAfter(8);
//        document.add(servicesTitle);
//
//        PdfPTable servicesTable = new PdfPTable(4);
//        servicesTable.setWidthPercentage(100);
//        servicesTable.setWidths(new float[]{3, 1, 1, 1});
//
//        // En-têtes
//        PdfPCell[] headers = {
//                new PdfPCell(new Phrase("Description", headerFont)),
//                new PdfPCell(new Phrase("Quantité", headerFont)),
//                new PdfPCell(new Phrase("Prix unitaire", headerFont)),
//                new PdfPCell(new Phrase("Total", headerFont))
//        };
//
//        for (PdfPCell header : headers) {
//            header.setBackgroundColor(Color.LIGHT_GRAY);
//            header.setPadding(8);
//            header.setHorizontalAlignment(Element.ALIGN_CENTER);
//            servicesTable.addCell(header);
//        }
//
//        // Ligne de service
//        servicesTable.addCell(new PdfPCell(new Phrase("Transport de bagage", normalFont)));
//        servicesTable.addCell(new PdfPCell(new Phrase(facture.getNombreKg() + " KG", normalFont)));
//        servicesTable.addCell(new PdfPCell(new Phrase(facture.getPrixUnitaire(), normalFont)));
//        servicesTable.addCell(new PdfPCell(new Phrase(facture.getPrixTransport(), boldFont)));
//
//        // Ligne total
//        PdfPCell totalLabelCell = new PdfPCell(new Phrase("TOTAL À PAYER", headerFont));
//        totalLabelCell.setColspan(3);
//        totalLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
//        totalLabelCell.setPadding(8);
//        servicesTable.addCell(totalLabelCell);
//
//        PdfPCell totalValueCell = new PdfPCell(new Phrase(facture.getPrixTransport(),
//                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLUE)));
//        totalValueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
//        totalValueCell.setPadding(8);
//        servicesTable.addCell(totalValueCell);
//
//        servicesTable.setSpacingAfter(20);
//        document.add(servicesTable);
//    }
//
//    private void addSignature(Document document, Facture facture, Font headerFont)
//            throws DocumentException, IOException {
//        if (facture.getSignatureData() != null) {
//            Paragraph signatureTitle = new Paragraph("SIGNATURE DE L'AGENCE", headerFont);
//            signatureTitle.setSpacingAfter(10);
//            document.add(signatureTitle);
//
//            try {
//                Image signature = Image.getInstance(facture.getSignatureData());
//                signature.setAlignment(Element.ALIGN_LEFT);
//                signature.scaleToFit(150, 75);
//                document.add(signature);
//            } catch (Exception e) {
//                log.warn("Erreur lors de l'ajout de la signature: {}", e.getMessage());
//                Paragraph signatureError = new Paragraph("Signature non disponible",
//                        FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY));
//                document.add(signatureError);
//            }
//        }
//    }
//
//    private void addFooter(Document document, Font normalFont) throws DocumentException {
//        Paragraph footer = new Paragraph();
//        footer.setSpacingBefore(20);
//        footer.add(new Chunk("Merci de faire confiance à GPMonde pour vos transports internationaux.",
//                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY)));
//        footer.add(Chunk.NEWLINE);
//        footer.add(new Chunk("Visitez notre site web: www.gpmonde.com",
//                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.BLUE)));
//        footer.setAlignment(Element.ALIGN_CENTER);
//        document.add(footer);
//    }
//
//    private void addSeparatorLine(Document document) throws DocumentException {
//        Paragraph separator = new Paragraph();
//        separator.add(new Chunk(new LineSeparator()));
//        separator.setSpacingAfter(15);
//        document.add(separator);
//    }
//
//    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
//        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
//        labelCell.setBorder(Rectangle.NO_BORDER);
//        labelCell.setPadding(5);
//        table.addCell(labelCell);
//
//        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
//        valueCell.setBorder(Rectangle.NO_BORDER);
//        valueCell.setPadding(5);
//        table.addCell(valueCell);
//    }
//}