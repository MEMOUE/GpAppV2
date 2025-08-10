package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.DTO.FactureCreateDTO;
import com.gpmonde.backgp.DTO.FactureFilterDTO;
import com.gpmonde.backgp.DTO.FactureResponseDTO;
import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Entities.Facture;
import com.gpmonde.backgp.Entities.ProgrammeGp;
import com.gpmonde.backgp.Repositorys.AgentGPRepository;
import com.gpmonde.backgp.Repositorys.FactureRepository;
import com.gpmonde.backgp.Repositorys.ProgrammeGpRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FactureService {

	private final FactureRepository factureRepository;
	private final ProgrammeGpRepository programmeGpRepository;
	private final AgentGPRepository agentGPRepository;

	@Transactional
	public FactureResponseDTO creerFacture(FactureCreateDTO dto) {
		// Récupérer l'agent connecté
		AgentGp agent = getCurrentAgent();

		// Récupérer le programme
		ProgrammeGp programme = programmeGpRepository.findById(dto.getProgrammeId())
				.orElseThrow(() -> new IllegalArgumentException("Programme non trouvé"));

		// Vérifier que le programme appartient à l'agent
		if (!programme.getAgentGp().getId().equals(agent.getId())) {
			throw new IllegalArgumentException("Ce programme ne vous appartient pas");
		}

		// Créer la facture
		Facture facture = new Facture();
		facture.setNomClient(dto.getNomClient());
		facture.setAdresseClient(dto.getAdresseClient());
		facture.setLaveurBagage(dto.getLaveurBagage());
		facture.setNombreKg(dto.getNombreKg());
		facture.setPrixTransport(dto.getPrixTransport());

		// Calculer le prix unitaire à partir du prix total et du programme
		facture.setPrixUnitaire(calculatePrixUnitaire(dto.getPrixTransport(), dto.getNombreKg(), programme.getPrix()));

		facture.setNotes(dto.getNotes());
		facture.setAgentGp(agent);
		facture.setProgrammeGp(programme);
		facture.setStatut(Facture.StatutFacture.NON_PAYEE);

		// Traiter la signature
		if (dto.getSignatureBase64() != null && !dto.getSignatureBase64().isEmpty()) {
			try {
				byte[] signatureBytes = Base64.getDecoder().decode(
						dto.getSignatureBase64().replace("data:image/png;base64,", "")
				);
				facture.setSignatureData(signatureBytes);
			} catch (Exception e) {
				log.warn("Erreur lors du traitement de la signature: {}", e.getMessage());
			}
		}

		Facture savedFacture = factureRepository.save(facture);
		log.info("Facture créée avec succès: {}", savedFacture.getNumeroFacture());

		return FactureResponseDTO.fromEntity(savedFacture);
	}

	public List<FactureResponseDTO> getFacturesAgent() {
		AgentGp agent = getCurrentAgent();
		List<Facture> factures = factureRepository.findByAgentGpOrderByDateCreationDesc(agent);
		return factures.stream()
				.map(FactureResponseDTO::fromEntity)
				.collect(Collectors.toList());
	}

	// MÉTHODE CORRIGÉE : Récupérer les factures avec pagination et filtres
	public Page<FactureResponseDTO> getFacturesAgentPaginated(FactureFilterDTO filter) {
		AgentGp agent = getCurrentAgent();

		log.debug("Filtrage des factures avec les paramètres: {}", filter);

		// Créer la spécification avec tous les filtres
		Specification<Facture> spec = FactureSpecifications.withFilters(filter, agent);

		// Créer le tri
		Sort sort = Sort.by(
				Sort.Direction.fromString(filter.getSortDirection()),
				filter.getSortBy()
		);

		// Créer la pagination
		Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize(), sort);

		// Exécuter la requête avec les filtres
		Page<Facture> factures = factureRepository.findAll(spec, pageable);

		log.debug("Factures trouvées: {} sur {}", factures.getNumberOfElements(), factures.getTotalElements());

		return factures.map(FactureResponseDTO::fromEntity);
	}

	public Optional<FactureResponseDTO> getFactureById(Long id) {
		AgentGp agent = getCurrentAgent();
		return factureRepository.findById(id)
				.filter(facture -> facture.getAgentGp().getId().equals(agent.getId()))
				.map(FactureResponseDTO::fromEntity);
	}

	public byte[] genererPDF(Long factureId) throws DocumentException, IOException {
		Facture facture = factureRepository.findById(factureId)
				.orElseThrow(() -> new IllegalArgumentException("Facture non trouvée"));

		// Vérifier les droits
		AgentGp agent = getCurrentAgent();
		if (!facture.getAgentGp().getId().equals(agent.getId())) {
			throw new IllegalArgumentException("Accès non autorisé à cette facture");
		}

		return generatePDFContent(facture);
	}

	@Transactional
	public FactureResponseDTO changerStatutFacture(Long factureId, Facture.StatutFacture nouveauStatut) {
		Facture facture = factureRepository.findById(factureId)
				.orElseThrow(() -> new IllegalArgumentException("Facture non trouvée"));

		AgentGp agent = getCurrentAgent();
		if (!facture.getAgentGp().getId().equals(agent.getId())) {
			throw new IllegalArgumentException("Accès non autorisé à cette facture");
		}

		facture.setStatut(nouveauStatut);



		Facture savedFacture = factureRepository.save(facture);
		return FactureResponseDTO.fromEntity(savedFacture);
	}

	private byte[] generatePDFContent(Facture facture) throws DocumentException, IOException {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		Document document = new Document(PageSize.A4);
		PdfWriter writer = PdfWriter.getInstance(document, baos);

		document.open();

		// Définir les polices
		Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLUE);
		Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK);
		Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
		Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);

		// En-tête avec logo (si disponible)
		addHeader(document, facture, titleFont, headerFont);

		// Informations de l'agence
		addAgenceInfo(document, facture.getAgentGp(), headerFont, normalFont);

		// Ligne de séparation
		addSeparatorLine(document);

		// Informations du client et de la facture
		addClientAndInvoiceInfo(document, facture, headerFont, normalFont, boldFont);

		// Détails du programme
		addProgrammeDetails(document, facture.getProgrammeGp(), headerFont, normalFont, boldFont);

		// Tableau des services
		addServicesTable(document, facture, headerFont, normalFont, boldFont);

		// Signature
		addSignature(document, facture, headerFont);

		// Pied de page
		addFooter(document, normalFont);

		document.close();
		return baos.toByteArray();
	}

	private void addHeader(Document document, Facture facture, Font titleFont, Font headerFont)
			throws DocumentException {

		// Titre principal
		Paragraph title = new Paragraph("FACTURE", titleFont);
		title.setAlignment(Element.ALIGN_CENTER);
		title.setSpacingAfter(10);
		document.add(title);

		// Numéro de facture et date
		Paragraph factureInfo = new Paragraph();
		factureInfo.add(new Chunk("N° Facture: ", headerFont));
		factureInfo.add(new Chunk(facture.getNumeroFacture(), FontFactory.getFont(FontFactory.HELVETICA, 12)));
		factureInfo.add(Chunk.NEWLINE);
		factureInfo.add(new Chunk("Date: ", headerFont));
		factureInfo.add(new Chunk(facture.getDateCreation().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
				FontFactory.getFont(FontFactory.HELVETICA, 10)));
		factureInfo.setAlignment(Element.ALIGN_RIGHT);
		factureInfo.setSpacingAfter(15);
		document.add(factureInfo);
	}

	private void addAgenceInfo(Document document, AgentGp agent, Font headerFont, Font normalFont)
			throws DocumentException {

		Paragraph agenceTitle = new Paragraph("INFORMATIONS DE L'AGENCE", headerFont);
		agenceTitle.setSpacingAfter(8);
		document.add(agenceTitle);

		PdfPTable agenceTable = new PdfPTable(2);
		agenceTable.setWidthPercentage(100);
		agenceTable.setWidths(new float[]{1, 3});

		addTableRow(agenceTable, "Agence:", agent.getNomagence(), headerFont, normalFont);
		addTableRow(agenceTable, "Adresse:", agent.getAdresse(), headerFont, normalFont);
		addTableRow(agenceTable, "Téléphone:", agent.getTelephone(), headerFont, normalFont);
		addTableRow(agenceTable, "Email:", agent.getEmail(), headerFont, normalFont);

		agenceTable.setSpacingAfter(15);
		document.add(agenceTable);
	}

	private void addClientAndInvoiceInfo(Document document, Facture facture, Font headerFont, Font normalFont, Font boldFont)
			throws DocumentException {

		PdfPTable infoTable = new PdfPTable(2);
		infoTable.setWidthPercentage(100);
		infoTable.setWidths(new float[]{1, 1});

		// Colonne client
		PdfPCell clientCell = new PdfPCell();
		clientCell.setBorder(Rectangle.BOX);
		clientCell.setPadding(10);

		Paragraph clientTitle = new Paragraph("INFORMATIONS CLIENT", headerFont);
		clientTitle.setSpacingAfter(8);
		clientCell.addElement(clientTitle);

		Paragraph clientInfo = new Paragraph();
		clientInfo.add(new Chunk("Nom: ", boldFont));
		clientInfo.add(new Chunk(facture.getNomClient(), normalFont));
		clientInfo.add(Chunk.NEWLINE);
		clientInfo.add(new Chunk("Adresse: ", boldFont));
		clientInfo.add(new Chunk(facture.getAdresseClient(), normalFont));
		clientInfo.add(Chunk.NEWLINE);
		clientInfo.add(new Chunk("Laveur: ", boldFont));
		clientInfo.add(new Chunk(facture.getLaveurBagage(), normalFont));
		clientCell.addElement(clientInfo);

		infoTable.addCell(clientCell);

		// Colonne facture
		PdfPCell factureCell = new PdfPCell();
		factureCell.setBorder(Rectangle.BOX);
		factureCell.setPadding(10);

		Paragraph factureTitle = new Paragraph("DÉTAILS FACTURE", headerFont);
		factureTitle.setSpacingAfter(8);
		factureCell.addElement(factureTitle);

		Paragraph factureDetails = new Paragraph();
		factureDetails.add(new Chunk("Statut: ", boldFont));
		factureDetails.add(new Chunk(facture.getStatut().toString(), normalFont));
		factureDetails.add(Chunk.NEWLINE);
		factureDetails.add(new Chunk("Nombre KG: ", boldFont));
		factureDetails.add(new Chunk(facture.getNombreKg().toString(), normalFont));
		factureDetails.add(Chunk.NEWLINE);
		factureDetails.add(new Chunk("Prix unitaire: ", boldFont));
		factureDetails.add(new Chunk(facture.getPrixUnitaire() + " €", normalFont));
		factureCell.addElement(factureDetails);

		infoTable.addCell(factureCell);
		infoTable.setSpacingAfter(15);
		document.add(infoTable);
	}

	private void addProgrammeDetails(Document document, ProgrammeGp programme, Font headerFont, Font normalFont, Font boldFont)
			throws DocumentException {

		Paragraph programmeTitle = new Paragraph("DÉTAILS DU PROGRAMME", headerFont);
		programmeTitle.setSpacingAfter(8);
		document.add(programmeTitle);

		PdfPTable programmeTable = new PdfPTable(2);
		programmeTable.setWidthPercentage(100);
		programmeTable.setWidths(new float[]{1, 3});

		addTableRow(programmeTable, "Description:", programme.getDescription(), boldFont, normalFont);
		addTableRow(programmeTable, "Départ:", programme.getDepart(), boldFont, normalFont);
		addTableRow(programmeTable, "Destination:", programme.getDestination(), boldFont, normalFont);
		addTableRow(programmeTable, "Prix par KG:", programme.getPrix() + " €", boldFont, normalFont);
		addTableRow(programmeTable, "Garantie:", programme.getGarantie() + "%", boldFont, normalFont);

		if (programme.getDateline() != null) {
			addTableRow(programmeTable, "Date limite:",
					programme.getDateline().toString(), boldFont, normalFont);
		}

		programmeTable.setSpacingAfter(15);
		document.add(programmeTable);
	}

	private void addServicesTable(Document document, Facture facture, Font headerFont, Font normalFont, Font boldFont)
			throws DocumentException {

		Paragraph servicesTitle = new Paragraph("DÉTAIL DES SERVICES", headerFont);
		servicesTitle.setSpacingAfter(8);
		document.add(servicesTitle);

		PdfPTable servicesTable = new PdfPTable(4);
		servicesTable.setWidthPercentage(100);
		servicesTable.setWidths(new float[]{3, 1, 1, 1});

		// En-têtes
		PdfPCell[] headers = {
				new PdfPCell(new Phrase("Description", headerFont)),
				new PdfPCell(new Phrase("Quantité", headerFont)),
				new PdfPCell(new Phrase("Prix unitaire", headerFont)),
				new PdfPCell(new Phrase("Total", headerFont))
		};

		for (PdfPCell header : headers) {
			header.setBackgroundColor(Color.LIGHT_GRAY);
			header.setPadding(8);
			header.setHorizontalAlignment(Element.ALIGN_CENTER);
			servicesTable.addCell(header);
		}

		// Ligne de service
		servicesTable.addCell(new PdfPCell(new Phrase("Transport de bagage", normalFont)));
		servicesTable.addCell(new PdfPCell(new Phrase(facture.getNombreKg() + " KG", normalFont)));
		servicesTable.addCell(new PdfPCell(new Phrase(facture.getPrixUnitaire() + " €", normalFont)));
		servicesTable.addCell(new PdfPCell(new Phrase(facture.getPrixTransport() + " €", boldFont)));

		// Ligne total
		PdfPCell totalLabelCell = new PdfPCell(new Phrase("TOTAL À PAYER", headerFont));
		totalLabelCell.setColspan(3);
		totalLabelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
		totalLabelCell.setPadding(8);
		servicesTable.addCell(totalLabelCell);

		PdfPCell totalValueCell = new PdfPCell(new Phrase(facture.getPrixTransport() + " €",
				FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLUE)));
		totalValueCell.setHorizontalAlignment(Element.ALIGN_CENTER);
		totalValueCell.setPadding(8);
		servicesTable.addCell(totalValueCell);

		servicesTable.setSpacingAfter(20);
		document.add(servicesTable);
	}

	private void addSignature(Document document, Facture facture, Font headerFont) throws DocumentException, IOException {
		if (facture.getSignatureData() != null) {
			Paragraph signatureTitle = new Paragraph("SIGNATURE DE L'AGENCE", headerFont);
			signatureTitle.setSpacingAfter(10);
			document.add(signatureTitle);

			try {
				Image signature = Image.getInstance(facture.getSignatureData());
				signature.setAlignment(Element.ALIGN_LEFT);
				signature.scaleToFit(150, 75);
				document.add(signature);
			} catch (Exception e) {
				log.warn("Erreur lors de l'ajout de la signature: {}", e.getMessage());
				Paragraph signatureError = new Paragraph("Signature non disponible",
						FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY));
				document.add(signatureError);
			}
		}
	}

	private void addFooter(Document document, Font normalFont) throws DocumentException {
		Paragraph footer = new Paragraph();
		footer.setSpacingBefore(20);
		footer.add(new Chunk("Merci de faire confiance à GPMonde pour vos transports internationaux.",
				FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY)));
		footer.add(Chunk.NEWLINE);
		footer.add(new Chunk("Visitez notre site web: www.gpmonde.com",
				FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.BLUE)));
		footer.setAlignment(Element.ALIGN_CENTER);
		document.add(footer);
	}

	private void addSeparatorLine(Document document) throws DocumentException {
		Paragraph separator = new Paragraph();
		separator.add(new Chunk(new LineSeparator()));
		separator.setSpacingAfter(15);
		document.add(separator);
	}

	private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
		PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
		labelCell.setBorder(Rectangle.NO_BORDER);
		labelCell.setPadding(5);
		table.addCell(labelCell);

		PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
		valueCell.setBorder(Rectangle.NO_BORDER);
		valueCell.setPadding(5);
		table.addCell(valueCell);
	}

	private double extractNumericalValue(String prix) {
		if (prix == null || prix.trim().isEmpty()) {
			return 0.0;
		}

		try {
			// Supprimer tout ce qui n'est pas un chiffre, point ou virgule
			String cleanedPrice = prix.replaceAll("[^0-9.,]", "");

			// Remplacer la virgule par un point pour la décimale
			cleanedPrice = cleanedPrice.replace(",", ".");

			return Double.parseDouble(cleanedPrice);
		} catch (NumberFormatException e) {
			log.warn("Impossible d'extraire la valeur numérique de: {}", prix);
			return 0.0;
		}
	}

	private String extractDevise(String prix) {
		if (prix == null || prix.trim().isEmpty()) {
			return null;
		}

		// Expressions régulières pour les devises courantes
		String[] devises = {"XOF", "FCFA", "€", "EUR", "$", "USD", "£", "GBP", "¥", "JPY"};

		for (String devise : devises) {
			if (prix.toUpperCase().contains(devise)) {
				return devise;
			}
		}

		// Si aucune devise connue trouvée, extraire les caractères non numériques
		String deviseExtracted = prix.replaceAll("[0-9.,\\s]", "").trim();
		return deviseExtracted.isEmpty() ? null : deviseExtracted;
	}

	private String calculatePrixUnitaire(String prixTotal, Integer nombreKg, String prixProgramme) {
		if (nombreKg == null || nombreKg == 0) {
			return extractDevise(prixProgramme) != null ? "0 " + extractDevise(prixProgramme) : "0";
		}

		try {
			// Extraire la valeur numérique du prix total
			double valeurTotale = extractNumericalValue(prixTotal);
			double prixUnitaire = valeurTotale / nombreKg;

			// Extraire la devise du programme ou du prix total
			String devise = extractDevise(prixTotal);
			if (devise == null) {
				devise = extractDevise(prixProgramme);
			}
			if (devise == null) {
				devise = "€"; // Devise par défaut
			}

			// Formater avec 2 décimales
			return String.format("%.2f %s", prixUnitaire, devise);

		} catch (Exception e) {
			log.warn("Erreur lors du calcul du prix unitaire: {}", e.getMessage());
			return "0";
		}
	}

	private AgentGp getCurrentAgent() {
		String username = SecurityContextHolder.getContext().getAuthentication().getName();
		return agentGPRepository.findByUsername(username)
				.orElseThrow(() -> new IllegalStateException("Agent non trouvé"));
	}

	public Map<String, Object> getStatistiquesAgent() {
		AgentGp agent = getCurrentAgent();
		List<Facture> factures = factureRepository.findByAgentGpOrderByDateCreationDesc(agent);

		// Calculer le total en regroupant par devise
		Map<String, Double> totauxParDevise = new HashMap<>();

		for (Facture facture : factures) {
			try {
				double valeur = extractNumericalValue(facture.getPrixTransport());
				String devise = extractDevise(facture.getPrixTransport());
				if (devise == null) devise = "€"; // Devise par défaut

				totauxParDevise.merge(devise, valeur, Double::sum);
			} catch (Exception e) {
				log.warn("Erreur lors du calcul des statistiques pour la facture {}: {}",
						facture.getNumeroFacture(), e.getMessage());
			}
		}

		// Formater les totaux par devise
		StringBuilder totalFormatted = new StringBuilder();
		for (Map.Entry<String, Double> entry : totauxParDevise.entrySet()) {
			if (totalFormatted.length() > 0) {
				totalFormatted.append(" + ");
			}
			totalFormatted.append(String.format("%.2f %s", entry.getValue(), entry.getKey()));
		}

		long nombreFactures = factures.size();
		long nombreFacturesPayees = factures.stream()
				.filter(f -> f.getStatut() == Facture.StatutFacture.PAYEE)
				.count();

		return Map.of(
				"totalFactures", totalFormatted.toString(),
				"nombreFactures", nombreFactures,
				"nombreFacturesPayees", nombreFacturesPayees
		);
	}
}