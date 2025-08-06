package com.gpmonde.backgp.DTO;

import com.gpmonde.backgp.Entities.Facture;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FactureFilterDTO {
	private String nomClient;
	private String numeroFacture;  // IMPORTANT: Ce champ doit être présent
	private Facture.StatutFacture statut;

	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	private LocalDate dateDebut;

	@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
	private LocalDate dateFin;

	// NOUVEAU: Filtre global
	private String globalFilter;

	private int page = 0;
	private int size = 25;
	private String sortBy = "dateCreation";
	private String sortDirection = "DESC";
}