//package com.gpmonde.backgp.DTO;
//
//FIXME COMMENTER LA FONCTIONNALITE DE LA GESTION DE FACTURE

//import com.gpmonde.backgp.Entities.Facture;
//import lombok.AllArgsConstructor;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//import org.springframework.format.annotation.DateTimeFormat;
//
//import java.time.LocalDate;
//
///**
// * DTO pour filtrer les factures avec pagination
// * Utilisé pour les recherches avancées de factures
// */
//@Data
//@AllArgsConstructor
//@NoArgsConstructor
//public class FactureFilterDTO {
//
//    /**
//     * Filtre par nom de client (recherche partielle, insensible à la casse)
//     * Exemple: "Dupont" trouvera "Jean Dupont", "Marie DUPONT", etc.
//     */
//    private String nomClient;
//
//    /**
//     * Filtre par numéro de facture (recherche partielle, insensible à la casse)
//     * Exemple: "GP-2025" trouvera toutes les factures de 2025
//     */
//    private String numeroFacture;
//
//    /**
//     * Filtre par statut de facture
//     * Valeurs possibles: PAYEE, NON_PAYEE
//     */
//    private Facture.StatutFacture statut;
//
//    /**
//     * Date de début pour filtrer les factures par période de création
//     * Format: yyyy-MM-dd (ex: 2025-01-01)
//     */
//    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
//    private LocalDate dateDebut;
//
//    /**
//     * Date de fin pour filtrer les factures par période de création
//     * Format: yyyy-MM-dd (ex: 2025-12-31)
//     */
//    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
//    private LocalDate dateFin;
//
//    /**
//     * Filtre global qui recherche dans tous les champs:
//     * - Numéro de facture
//     * - Nom du client
//     * - Adresse du client
//     * - Laveur de bagage
//     * - Départ du programme
//     * - Destination du programme
//     * - Description du programme
//     * - Notes
//     *
//     * Très utile pour une recherche rapide sans spécifier le champ
//     */
//    private String globalFilter;
//
//    /**
//     * Numéro de page (commence à 0)
//     * Exemple: page=0 pour la première page, page=1 pour la deuxième, etc.
//     */
//    private int page = 0;
//
//    /**
//     * Nombre d'éléments par page
//     * Valeur par défaut: 25
//     * Recommandé: entre 10 et 100
//     */
//    private int size = 25;
//
//    /**
//     * Champ utilisé pour le tri
//     * Valeurs possibles:
//     * - dateCreation (par défaut)
//     * - numeroFacture
//     * - nomClient
//     * - statut
//     * - prixTransport
//     */
//    private String sortBy = "dateCreation";
//
//    /**
//     * Direction du tri
//     * Valeurs possibles:
//     * - DESC (décroissant, par défaut) - les plus récents d'abord
//     * - ASC (croissant) - les plus anciens d'abord
//     */
//    private String sortDirection = "DESC";
//}