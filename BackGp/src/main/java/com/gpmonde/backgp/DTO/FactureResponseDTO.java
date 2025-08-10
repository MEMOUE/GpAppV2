package com.gpmonde.backgp.DTO;

import com.gpmonde.backgp.Entities.Facture;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FactureResponseDTO {
	private Long id;
	private String numeroFacture;
	private String nomClient;
	private String adresseClient;
	private String laveurBagage;
	private Integer nombreKg;
	// Changement: prix en string avec devise
	private String prixTransport;
	private String prixUnitaire;
	private LocalDateTime dateCreation;
	private Facture.StatutFacture statut;
	private String notes;

	// Informations du programme
	private Long programmeId;
	private String programmeDescription;
	private String depart;
	private String destination;
	private String garantie;

	// Informations de l'agent
	private Long agentId;
	private String agentNom;
	private String agentAgence;
	private String agentTelephone;
	private String agentAdresse;
	private String agentEmail;

	public static FactureResponseDTO fromEntity(Facture facture) {
		FactureResponseDTO dto = new FactureResponseDTO();
		dto.setId(facture.getId());
		dto.setNumeroFacture(facture.getNumeroFacture());
		dto.setNomClient(facture.getNomClient());
		dto.setAdresseClient(facture.getAdresseClient());
		dto.setLaveurBagage(facture.getLaveurBagage());
		dto.setNombreKg(facture.getNombreKg());
		dto.setPrixTransport(facture.getPrixTransport());
		dto.setPrixUnitaire(facture.getPrixUnitaire());
		dto.setDateCreation(facture.getDateCreation());
		dto.setStatut(facture.getStatut());
		dto.setNotes(facture.getNotes());

		if (facture.getProgrammeGp() != null) {
			dto.setProgrammeId(facture.getProgrammeGp().getId());
			dto.setProgrammeDescription(facture.getProgrammeGp().getDescription());
			dto.setDepart(facture.getProgrammeGp().getDepart());
			dto.setDestination(facture.getProgrammeGp().getDestination());
			dto.setGarantie(facture.getProgrammeGp().getGarantie().toString());
		}

		if (facture.getAgentGp() != null) {
			dto.setAgentId(facture.getAgentGp().getId());
			dto.setAgentNom(facture.getAgentGp().getUsername());
			dto.setAgentAgence(facture.getAgentGp().getNomagence());
			dto.setAgentTelephone(facture.getAgentGp().getTelephone());
			dto.setAgentAdresse(facture.getAgentGp().getAdresse());
			dto.setAgentEmail(facture.getAgentGp().getEmail());
		}

		return dto;
	}
}