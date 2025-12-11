//package com.gpmonde.backgp.Repositorys;
//
//FIXME COMMENTER LA FONCTIONNALITE DE LA GESTION DE FACTURE

//import com.gpmonde.backgp.Entities.Utilisateur;
//import com.gpmonde.backgp.Entities.Facture;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//import org.springframework.stereotype.Repository;
//
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Optional;
//
///**
// * Repository pour la gestion des factures
// * Fournit des méthodes de recherche et de requête personnalisées
// */
//@Repository
//public interface FactureRepository extends JpaRepository<Facture, Long>, JpaSpecificationExecutor<Facture> {
//
//    // ========== RECHERCHES DE BASE ==========
//
//    /**
//     * Rechercher les factures d'un agent, triées par date de création décroissante
//     *
//     * @param agentGp L'utilisateur agent GP
//     * @return Liste des factures de l'agent
//     */
//    List<Facture> findByAgentGpOrderByDateCreationDesc(Utilisateur agentGp);
//
//    /**
//     * Rechercher les factures d'un agent avec pagination
//     *
//     * @param agentGp L'utilisateur agent GP
//     * @param pageable Configuration de pagination et tri
//     * @return Page de factures
//     */
//    Page<Facture> findByAgentGpOrderByDateCreationDesc(Utilisateur agentGp, Pageable pageable);
//
//    /**
//     * Rechercher une facture par son numéro unique
//     *
//     * @param numeroFacture Le numéro de facture (ex: GP-2025-12-11-00123)
//     * @return Optional contenant la facture si trouvée
//     */
//    Optional<Facture> findByNumeroFacture(String numeroFacture);
//
//    // ========== RECHERCHES PAR STATUT ==========
//
//    /**
//     * Rechercher les factures d'un agent par statut
//     *
//     * @param agentGp L'utilisateur agent GP
//     * @param statut Le statut de facture (PAYEE ou NON_PAYEE)
//     * @return Liste des factures correspondantes
//     */
//    List<Facture> findByAgentGpAndStatutOrderByDateCreationDesc(
//            Utilisateur agentGp,
//            Facture.StatutFacture statut);
//
//    // ========== RECHERCHES PAR PÉRIODE ==========
//
//    /**
//     * Rechercher les factures d'un agent pour une période donnée
//     *
//     * @param agent L'utilisateur agent GP
//     * @param dateDebut Date de début de la période
//     * @param dateFin Date de fin de la période
//     * @return Liste des factures dans la période
//     */
//    @Query("SELECT f FROM Facture f WHERE f.agentGp = :agent " +
//            "AND f.dateCreation BETWEEN :dateDebut AND :dateFin " +
//            "ORDER BY f.dateCreation DESC")
//    List<Facture> findByAgentAndPeriode(
//            @Param("agent") Utilisateur agent,
//            @Param("dateDebut") LocalDateTime dateDebut,
//            @Param("dateFin") LocalDateTime dateFin);
//
//    // ========== RECHERCHES PAR CLIENT ==========
//
//    /**
//     * Rechercher les factures par nom de client (recherche partielle)
//     *
//     * @param agent L'utilisateur agent GP
//     * @param nomClient Nom du client (recherche insensible à la casse)
//     * @return Liste des factures correspondantes
//     */
//    @Query("SELECT f FROM Facture f WHERE f.agentGp = :agent " +
//            "AND LOWER(f.nomClient) LIKE LOWER(CONCAT('%', :nomClient, '%')) " +
//            "ORDER BY f.dateCreation DESC")
//    List<Facture> findByAgentAndClientContaining(
//            @Param("agent") Utilisateur agent,
//            @Param("nomClient") String nomClient);
//
//    // ========== STATISTIQUES ==========
//
//    /**
//     * Compter le nombre de factures d'un agent par statut
//     *
//     * @param agent L'utilisateur agent GP
//     * @param statut Le statut de facture
//     * @return Nombre de factures avec ce statut
//     */
//    @Query("SELECT COUNT(f) FROM Facture f " +
//            "WHERE f.agentGp = :agent AND f.statut = :statut")
//    Long countByAgentAndStatut(
//            @Param("agent") Utilisateur agent,
//            @Param("statut") Facture.StatutFacture statut);
//
//    /**
//     * Calculer le chiffre d'affaires total d'un agent pour certains statuts
//     * Retourne la somme des valeurs numériques extraites des prix
//     *
//     * Note: Cette méthode ne peut pas calculer directement la somme car les prix
//     * sont stockés comme String avec devise. Il faut parser les valeurs dans le service.
//     *
//     * @param agent L'utilisateur agent GP
//     * @param statuts Liste des statuts à inclure
//     * @return Liste des prix en format String
//     */
//    @Query("SELECT f.prixTransport FROM Facture f " +
//            "WHERE f.agentGp = :agent AND f.statut IN :statuts")
//    List<String> findPrixTransportByAgentAndStatuts(
//            @Param("agent") Utilisateur agent,
//            @Param("statuts") List<Facture.StatutFacture> statuts);
//
//    // ========== FACTURES RÉCENTES ==========
//
//    /**
//     * Récupérer les 10 dernières factures créées par un agent
//     *
//     * @param agentGp L'utilisateur agent GP
//     * @return Liste des 10 dernières factures
//     */
//    List<Facture> findTop10ByAgentGpOrderByDateCreationDesc(Utilisateur agentGp);
//
//    /**
//     * Récupérer les factures d'un agent avec des statuts spécifiques
//     *
//     * @param agent L'utilisateur agent GP
//     * @param statuts Liste des statuts à inclure
//     * @return Liste des factures correspondantes
//     */
//    @Query("SELECT f FROM Facture f " +
//            "WHERE f.agentGp = :agent AND f.statut IN :statuts " +
//            "ORDER BY f.dateCreation DESC")
//    List<Facture> findByAgentAndStatuts(
//            @Param("agent") Utilisateur agent,
//            @Param("statuts") List<Facture.StatutFacture> statuts);
//
//    // ========== REQUÊTES POUR STATISTIQUES ==========
//
//    /**
//     * Récupérer tous les prix de transport d'un agent (pour calculer le total)
//     *
//     * @param agent L'utilisateur agent GP
//     * @return Liste de tous les prix en format String
//     */
//    @Query("SELECT f.prixTransport FROM Facture f WHERE f.agentGp = :agent")
//    List<String> findAllPrixTransportByAgent(@Param("agent") Utilisateur agent);
//
//    /**
//     * Récupérer les prix des factures payées d'un agent
//     *
//     * @param agent L'utilisateur agent GP
//     * @return Liste des prix des factures payées
//     */
//    @Query("SELECT f.prixTransport FROM Facture f " +
//            "WHERE f.agentGp = :agent AND f.statut = 'PAYEE'")
//    List<String> findPrixTransportPayeesByAgent(@Param("agent") Utilisateur agent);
//
//    // ========== REQUÊTES DE VÉRIFICATION ==========
//
//    /**
//     * Vérifier si un agent a des factures
//     *
//     * @param agent L'utilisateur agent GP
//     * @return true si l'agent a au moins une facture, false sinon
//     */
//    boolean existsByAgentGp(Utilisateur agent);
//
//    /**
//     * Vérifier si une facture avec ce numéro existe déjà
//     *
//     * @param numeroFacture Le numéro de facture
//     * @return true si le numéro existe déjà, false sinon
//     */
//    boolean existsByNumeroFacture(String numeroFacture);
//
//    /**
//     * Compter le nombre total de factures d'un agent
//     *
//     * @param agent L'utilisateur agent GP
//     * @return Nombre total de factures
//     */
//    long countByAgentGp(Utilisateur agent);
//
//    /**
//     * Récupérer les factures non payées d'un agent
//     * Utile pour les rappels de paiement
//     *
//     * @param agent L'utilisateur agent GP
//     * @return Liste des factures non payées
//     */
//    @Query("SELECT f FROM Facture f " +
//            "WHERE f.agentGp = :agent " +
//            "AND f.statut = 'NON_PAYEE' " +
//            "ORDER BY f.dateCreation DESC")
//    List<Facture> findFacturesNonPayeesByAgent(@Param("agent") Utilisateur agent);
//
//    /**
//     * Récupérer les factures payées d'un agent
//     *
//     * @param agent L'utilisateur agent GP
//     * @return Liste des factures payées
//     */
//    @Query("SELECT f FROM Facture f " +
//            "WHERE f.agentGp = :agent " +
//            "AND f.statut = 'PAYEE' " +
//            "ORDER BY f.datePayement DESC")
//    List<Facture> findFacturesPayeesByAgent(@Param("agent") Utilisateur agent);
//}