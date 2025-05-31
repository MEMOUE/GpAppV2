package com.gpmonde.backgp.DTO;

import com.gpmonde.backgp.Entities.Facture;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FactureFilterDTO {
	private String nomClient;
	private Facture.StatutFacture statut;
	private LocalDateTime dateDebut;
	private LocalDateTime dateFin;
	private String numeroFacture;
	private int page = 0;
	private int size = 10;
	private String sortBy = "dateCreation";
	private String sortDirection = "DESC";
}