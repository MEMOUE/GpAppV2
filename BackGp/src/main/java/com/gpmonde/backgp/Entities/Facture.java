//package com.gpmonde.backgp.Entities;
//

//FIXME COMMENTER LA FONCTIONNALITE DE LA GESTION DE FACTURE

//import jakarta.persistence.*;
//import lombok.AllArgsConstructor;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//
//import java.time.LocalDateTime;
//
///**
// * Entité représentant une facture de transport
// * Une facture est liée à un programme de transport et à un agent GP
// */
//@Data
//@AllArgsConstructor
//@NoArgsConstructor
//@Entity
//@Table(name = "factures")
//public class Facture {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    /**
//     * Numéro unique de la facture
//     * Format: GP-YYYY-MM-DD-XXXXX
//     * Généré automatiquement lors de la création
//     */
//    @Column(nullable = false, unique = true)
//    private String numeroFacture;
//
//    /**
//     * Nom complet du client
//     */
//    @Column(nullable = false)
//    private String nomClient;
//
//    /**
//     * Adresse complète du client
//     */
//    @Column(nullable = false)
//    private String adresseClient;
//
//    /**
//     * Nom du laveur de bagage
//     */
//    @Column(nullable = false)
//    private String laveurBagage;
//
//    /**
//     * Nombre de kilogrammes de bagages transportés
//     */
//    @Column(nullable = false)
//    private Integer nombreKg;
//
//    /**
//     * Prix total du transport avec devise
//     * Format: "montant devise" (ex: "50000 FCFA", "500 EUR")
//     * Stocké comme String pour supporter différentes devises
//     */
//    @Column(nullable = false)
//    private String prixTransport;
//
//    /**
//     * Prix unitaire par kilogramme avec devise
//     * Calculé automatiquement: prixTransport / nombreKg
//     * Format: "montant devise" (ex: "1000 FCFA", "10 EUR")
//     */
//    @Column(nullable = false)
//    private String prixUnitaire;
//
//    /**
//     * Signature numérique de l'agent (optionnel)
//     * Stockée en base64 pour pouvoir l'afficher dans le PDF
//     */
//    @Lob
//    @Column(columnDefinition = "LONGBLOB")
//    private byte[] signatureData;
//
//    /**
//     * Date et heure de création de la facture
//     * Définie automatiquement lors de la création
//     */
//    @Column(nullable = false)
//    private LocalDateTime dateCreation;
//
//    /**
//     * Statut de la facture
//     * Valeurs possibles: PAYEE, NON_PAYEE
//     * Valeur par défaut: NON_PAYEE
//     */
//    @Enumerated(EnumType.STRING)
//    @Column(nullable = false)
//    private StatutFacture statut = StatutFacture.NON_PAYEE;
//
//    // ========== RELATIONS ==========
//
//    /**
//     * Agent GP qui a créé la facture
//     * Utilise maintenant Utilisateur avec vérification isAgentGp()
//     */
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "agent_id", nullable = false)
//    private Utilisateur agentGp;
//
//    /**
//     * Programme de transport associé à cette facture
//     */
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "programme_id", nullable = false)
//    private ProgrammeGp programmeGp;
//
//    // ========== INFORMATIONS DE TRAÇABILITÉ ==========
//
//    /**
//     * Date et heure du paiement de la facture
//     * Null si la facture n'est pas encore payée
//     */
//    @Column
//    private LocalDateTime datePayement;
//
//    /**
//     * Notes ou commentaires supplémentaires
//     * Optionnel, peut contenir des informations additionnelles sur la facture
//     */
//    @Column(length = 500)
//    private String notes;
//
//    // ========== HOOKS JPA ==========
//
//    /**
//     * Hook exécuté automatiquement avant la création de l'entité
//     * Initialise la date de création et génère le numéro de facture
//     */
//    @PrePersist
//    protected void onCreate() {
//        if (dateCreation == null) {
//            dateCreation = LocalDateTime.now();
//        }
//        if (numeroFacture == null) {
//            generateNumeroFacture();
//        }
//    }
//
//    /**
//     * Génère un numéro de facture unique
//     * Format: GP-YYYY-MM-DD-XXXXX
//     * Exemple: GP-2025-12-11-00123
//     */
//    private void generateNumeroFacture() {
//        // Extraire la date au format YYYY-MM-DD
//        String date = LocalDateTime.now().toString().substring(0, 10);
//
//        // Générer un nombre aléatoire à 5 chiffres
//        String random = String.format("%05d", (int) (Math.random() * 100000));
//
//        // Construire le numéro de facture
//        this.numeroFacture = "GP-" + date + "-" + random;
//    }
//
//    // ========== ENUM STATUT ==========
//
//    /**
//     * Énumération des statuts possibles d'une facture
//     * États simplifiés pour faciliter la gestion
//     */
//    public enum StatutFacture {
//        /**
//         * Facture non encore payée
//         */
//        NON_PAYEE("Non payée"),
//
//        /**
//         * Facture payée
//         */
//        PAYEE("Payée");
//
//        private final String displayName;
//
//        StatutFacture(String displayName) {
//            this.displayName = displayName;
//        }
//
//        /**
//         * Retourne le nom d'affichage du statut
//         *
//         * @return Nom d'affichage en français
//         */
//        public String getDisplayName() {
//            return displayName;
//        }
//
//        /**
//         * Vérifie si le statut indique que la facture est payée
//         *
//         * @return true si PAYEE, false sinon
//         */
//        public boolean isPayee() {
//            return this == PAYEE;
//        }
//    }
//
//    // ========== MÉTHODES UTILITAIRES ==========
//
//    /**
//     * Vérifie si la facture est payée
//     *
//     * @return true si le statut est PAYEE, false sinon
//     */
//    public boolean estPayee() {
//        return statut == StatutFacture.PAYEE;
//    }
//
//    /**
//     * Marque la facture comme payée et enregistre la date de paiement
//     */
//    public void marquerCommePayee() {
//        this.statut = StatutFacture.PAYEE;
//        this.datePayement = LocalDateTime.now();
//    }
//
//    /**
//     * Marque la facture comme non payée et supprime la date de paiement
//     */
//    public void marquerCommeNonPayee() {
//        this.statut = StatutFacture.NON_PAYEE;
//        this.datePayement = null;
//    }
//
//    /**
//     * Retourne une représentation textuelle de la facture
//     * Utile pour le debugging et les logs
//     *
//     * @return Résumé de la facture
//     */
//    @Override
//    public String toString() {
//        return String.format("Facture[id=%d, numero=%s, client=%s, montant=%s, statut=%s]",
//                id, numeroFacture, nomClient, prixTransport, statut);
//    }
//}