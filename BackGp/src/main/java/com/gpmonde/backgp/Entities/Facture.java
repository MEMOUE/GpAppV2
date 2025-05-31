package com.gpmonde.backgp.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "factures")
public class Facture {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String numeroFacture;

	@Column(nullable = false)
	private String nomClient;

	@Column(nullable = false)
	private String adresseClient;

	@Column(nullable = false)
	private String laveurBagage;

	@Column(nullable = false)
	private Integer nombreKg;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal prixTransport;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal prixUnitaire;

	@Lob
	@Column(columnDefinition = "LONGBLOB")
	private byte[] signatureData;

	@Column(nullable = false)
	private LocalDateTime dateCreation;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private StatutFacture statut = StatutFacture.BROUILLON;

	// Relations
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "agent_id", nullable = false)
	private AgentGp agentGp;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "programme_id", nullable = false)
	private ProgrammeGp programmeGp;

	// Informations de traçabilité
	@Column
	private LocalDateTime dateEnvoi;

	@Column
	private LocalDateTime datePayement;

	@Column(length = 500)
	private String notes;

	@PrePersist
	protected void onCreate() {
		if (dateCreation == null) {
			dateCreation = LocalDateTime.now();
		}
		if (numeroFacture == null) {
			generateNumeroFacture();
		}
	}

	private void generateNumeroFacture() {
		// Format: GP-YYYY-MM-DD-XXXXX
		String date = LocalDateTime.now().toString().substring(0, 10);
		String random = String.format("%05d", (int) (Math.random() * 100000));
		this.numeroFacture = "GP-" + date + "-" + random;
	}

	public enum StatutFacture {
		BROUILLON,
		FINALISEE,
		ENVOYEE,
		PAYEE,
		ANNULEE
	}
}