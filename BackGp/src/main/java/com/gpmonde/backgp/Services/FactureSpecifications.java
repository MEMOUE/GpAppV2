package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.DTO.FactureFilterDTO;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Entities.Facture;
import com.gpmonde.backgp.Entities.ProgrammeGp;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Spécifications JPA pour filtrer les factures
 * Utilise l'API Criteria de JPA pour construire des requêtes dynamiques
 */
public class FactureSpecifications {

    /**
     * Construit une spécification combinée avec tous les filtres
     *
     * @param filter DTO contenant tous les critères de filtrage
     * @param agent L'agent GP dont on veut les factures
     * @return Spécification JPA combinée
     */
    public static Specification<Facture> withFilters(FactureFilterDTO filter, Utilisateur agent) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // ========== FILTRE OBLIGATOIRE: AGENT ==========
            // Sécurité: un agent ne peut voir que ses propres factures
            predicates.add(criteriaBuilder.equal(root.get("agentGp"), agent));

            // ========== FILTRE PAR NOM DE CLIENT ==========
            if (StringUtils.hasText(filter.getNomClient())) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("nomClient")),
                        "%" + filter.getNomClient().toLowerCase() + "%"
                ));
            }

            // ========== FILTRE PAR NUMÉRO DE FACTURE ==========
            if (StringUtils.hasText(filter.getNumeroFacture())) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("numeroFacture")),
                        "%" + filter.getNumeroFacture().toLowerCase() + "%"
                ));
            }

            // ========== FILTRE PAR STATUT ==========
            if (filter.getStatut() != null) {
                predicates.add(criteriaBuilder.equal(root.get("statut"), filter.getStatut()));
            }

            // ========== FILTRE PAR DATE DE DÉBUT ==========
            if (filter.getDateDebut() != null) {
                LocalDateTime dateDebutTime = filter.getDateDebut().atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("dateCreation"),
                        dateDebutTime
                ));
            }

            // ========== FILTRE PAR DATE DE FIN ==========
            if (filter.getDateFin() != null) {
                LocalDateTime dateFinTime = filter.getDateFin().atTime(23, 59, 59);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("dateCreation"),
                        dateFinTime
                ));
            }

            // ========== FILTRE GLOBAL ==========
            // Recherche dans tous les champs pertinents
            if (StringUtils.hasText(filter.getGlobalFilter())) {
                String globalSearchTerm = "%" + filter.getGlobalFilter().toLowerCase() + "%";

                // Jointure avec le programme pour accéder aux champs départ/destination
                Join<Facture, ProgrammeGp> programmeJoin = root.join("programmeGp", JoinType.LEFT);

                // Construction du prédicat OR pour rechercher dans tous les champs
                Predicate globalPredicate = criteriaBuilder.or(
                        // Recherche dans le numéro de facture
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("numeroFacture")),
                                globalSearchTerm
                        ),

                        // Recherche dans le nom du client
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("nomClient")),
                                globalSearchTerm
                        ),

                        // Recherche dans l'adresse du client
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("adresseClient")),
                                globalSearchTerm
                        ),

                        // Recherche dans le laveur de bagage
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("laveurBagage")),
                                globalSearchTerm
                        ),

                        // Recherche dans le départ du programme
                        criteriaBuilder.like(
                                criteriaBuilder.lower(programmeJoin.get("depart")),
                                globalSearchTerm
                        ),

                        // Recherche dans la destination du programme
                        criteriaBuilder.like(
                                criteriaBuilder.lower(programmeJoin.get("destination")),
                                globalSearchTerm
                        ),

                        // Recherche dans la description du programme
                        criteriaBuilder.like(
                                criteriaBuilder.lower(programmeJoin.get("description")),
                                globalSearchTerm
                        ),

                        // Recherche dans les notes
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("notes")),
                                globalSearchTerm
                        )
                );

                predicates.add(globalPredicate);
            }

            // Combiner tous les prédicats avec AND
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Spécification pour filtrer par agent
     *
     * @param agent L'agent GP
     * @return Spécification filtrant par agent
     */
    public static Specification<Facture> belongsToAgent(Utilisateur agent) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("agentGp"), agent);
    }

    /**
     * Spécification pour filtrer par statut
     *
     * @param statut Le statut de facture
     * @return Spécification filtrant par statut
     */
    public static Specification<Facture> hasStatut(Facture.StatutFacture statut) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("statut"), statut);
    }

    /**
     * Spécification pour rechercher par nom de client (partiel)
     *
     * @param nomClient Nom du client
     * @return Spécification avec recherche partielle
     */
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

    /**
     * Spécification pour rechercher par numéro de facture (partiel)
     *
     * @param numeroFacture Numéro de facture
     * @return Spécification avec recherche partielle
     */
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

    /**
     * Spécification pour filtrer par période de création
     *
     * @param dateDebut Date de début (incluse)
     * @param dateFin Date de fin (incluse)
     * @return Spécification filtrant par période
     */
    public static Specification<Facture> createdBetween(LocalDate dateDebut, LocalDate dateFin) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (dateDebut != null) {
                LocalDateTime dateDebutTime = dateDebut.atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("dateCreation"),
                        dateDebutTime
                ));
            }

            if (dateFin != null) {
                LocalDateTime dateFinTime = dateFin.atTime(23, 59, 59);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("dateCreation"),
                        dateFinTime
                ));
            }

            if (predicates.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Spécification pour les factures payées
     *
     * @return Spécification pour statut PAYEE
     */
    public static Specification<Facture> isPayee() {
        return hasStatut(Facture.StatutFacture.PAYEE);
    }

    /**
     * Spécification pour les factures non payées
     *
     * @return Spécification pour statut NON_PAYEE
     */
    public static Specification<Facture> isNonPayee() {
        return hasStatut(Facture.StatutFacture.NON_PAYEE);
    }

    /**
     * Spécification pour rechercher par programme
     *
     * @param programmeId ID du programme
     * @return Spécification filtrant par programme
     */
    public static Specification<Facture> forProgramme(Long programmeId) {
        return (root, query, criteriaBuilder) -> {
            if (programmeId == null) {
                return criteriaBuilder.conjunction();
            }
            Join<Facture, ProgrammeGp> programmeJoin = root.join("programmeGp");
            return criteriaBuilder.equal(programmeJoin.get("id"), programmeId);
        };
    }

    /**
     * Spécification pour rechercher par trajet (départ et/ou destination)
     *
     * @param depart Ville de départ
     * @param destination Ville de destination
     * @return Spécification filtrant par trajet
     */
    public static Specification<Facture> hasTrajet(String depart, String destination) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Facture, ProgrammeGp> programmeJoin = root.join("programmeGp");

            if (StringUtils.hasText(depart)) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(programmeJoin.get("depart")),
                        "%" + depart.toLowerCase() + "%"
                ));
            }

            if (StringUtils.hasText(destination)) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(programmeJoin.get("destination")),
                        "%" + destination.toLowerCase() + "%"
                ));
            }

            if (predicates.isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}