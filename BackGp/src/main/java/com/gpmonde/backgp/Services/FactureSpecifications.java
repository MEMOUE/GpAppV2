package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.DTO.FactureFilterDTO;
import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Entities.Facture;
import com.gpmonde.backgp.Entities.ProgrammeGp;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class FactureSpecifications {

	public static Specification<Facture> withFilters(FactureFilterDTO filter, AgentGp agent) {
		return (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();

			// Filtre obligatoire : factures de l'agent connecté uniquement
			predicates.add(criteriaBuilder.equal(root.get("agentGp"), agent));

			// Filtre par nom de client
			if (StringUtils.hasText(filter.getNomClient())) {
				predicates.add(criteriaBuilder.like(
						criteriaBuilder.lower(root.get("nomClient")),
						"%" + filter.getNomClient().toLowerCase() + "%"
				));
			}

			// Filtre par numéro de facture
			if (StringUtils.hasText(filter.getNumeroFacture())) {
				predicates.add(criteriaBuilder.like(
						criteriaBuilder.lower(root.get("numeroFacture")),
						"%" + filter.getNumeroFacture().toLowerCase() + "%"
				));
			}

			// Filtre par statut
			if (filter.getStatut() != null) {
				predicates.add(criteriaBuilder.equal(root.get("statut"), filter.getStatut()));
			}

			// Filtre par date de début
			if (filter.getDateDebut() != null) {
				LocalDateTime dateDebutTime = filter.getDateDebut().atStartOfDay();
				predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("dateCreation"), dateDebutTime));
			}

			// Filtre par date de fin
			if (filter.getDateFin() != null) {
				LocalDateTime dateFinTime = filter.getDateFin().atTime(23, 59, 59);
				predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("dateCreation"), dateFinTime));
			}

			// FILTRE GLOBAL : recherche dans tous les champs pertinents
			if (StringUtils.hasText(filter.getGlobalFilter())) {
				String globalSearchTerm = "%" + filter.getGlobalFilter().toLowerCase() + "%";

				// Jointures pour accéder aux données du programme
				Join<Facture, ProgrammeGp> programmeJoin = root.join("programmeGp", JoinType.LEFT);

				Predicate globalPredicate = criteriaBuilder.or(
						// Recherche dans le numéro de facture
						criteriaBuilder.like(criteriaBuilder.lower(root.get("numeroFacture")), globalSearchTerm),

						// Recherche dans le nom du client
						criteriaBuilder.like(criteriaBuilder.lower(root.get("nomClient")), globalSearchTerm),

						// Recherche dans l'adresse du client
						criteriaBuilder.like(criteriaBuilder.lower(root.get("adresseClient")), globalSearchTerm),

						// Recherche dans le laveur de bagage
						criteriaBuilder.like(criteriaBuilder.lower(root.get("laveurBagage")), globalSearchTerm),

						// Recherche dans le départ du programme
						criteriaBuilder.like(criteriaBuilder.lower(programmeJoin.get("depart")), globalSearchTerm),

						// Recherche dans la destination du programme
						criteriaBuilder.like(criteriaBuilder.lower(programmeJoin.get("destination")), globalSearchTerm),

						// Recherche dans la description du programme
						criteriaBuilder.like(criteriaBuilder.lower(programmeJoin.get("description")), globalSearchTerm),

						// Recherche dans les notes
						criteriaBuilder.like(criteriaBuilder.lower(root.get("notes")), globalSearchTerm)
				);

				predicates.add(globalPredicate);
			}

			return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
		};
	}

	public static Specification<Facture> belongsToAgent(AgentGp agent) {
		return (root, query, criteriaBuilder) ->
				criteriaBuilder.equal(root.get("agentGp"), agent);
	}

	public static Specification<Facture> hasStatut(Facture.StatutFacture statut) {
		return (root, query, criteriaBuilder) ->
				criteriaBuilder.equal(root.get("statut"), statut);
	}

	public static Specification<Facture> clientContains(String nomClient) {
		return (root, query, criteriaBuilder) -> {
			if (!StringUtils.hasText(nomClient)) {
				return criteriaBuilder.conjunction();
			}
			return criteriaBuilder.like(
					criteriaBuilder.lower(root.get("nomClient")),
					"%" + nomClient.toLowerCase() + "%"
			);
		};
	}

	public static Specification<Facture> numeroFactureContains(String numeroFacture) {
		return (root, query, criteriaBuilder) -> {
			if (!StringUtils.hasText(numeroFacture)) {
				return criteriaBuilder.conjunction();
			}
			return criteriaBuilder.like(
					criteriaBuilder.lower(root.get("numeroFacture")),
					"%" + numeroFacture.toLowerCase() + "%"
			);
		};
	}

	public static Specification<Facture> createdBetween(LocalDate dateDebut, LocalDate dateFin) {
		return (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();

			if (dateDebut != null) {
				LocalDateTime dateDebutTime = dateDebut.atStartOfDay();
				predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("dateCreation"), dateDebutTime));
			}

			if (dateFin != null) {
				LocalDateTime dateFinTime = dateFin.atTime(23, 59, 59);
				predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("dateCreation"), dateFinTime));
			}

			if (predicates.isEmpty()) {
				return criteriaBuilder.conjunction();
			}

			return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
		};
	}
}