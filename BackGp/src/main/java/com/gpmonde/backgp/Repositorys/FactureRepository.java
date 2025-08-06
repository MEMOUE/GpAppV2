package com.gpmonde.backgp.Repositorys;

import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Entities.Facture;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long>, JpaSpecificationExecutor<Facture> {

	// Rechercher les factures par agent
	List<Facture> findByAgentGpOrderByDateCreationDesc(AgentGp agentGp);

	// Rechercher les factures par agent avec pagination
	Page<Facture> findByAgentGpOrderByDateCreationDesc(AgentGp agentGp, Pageable pageable);

	// Rechercher par numéro de facture
	Optional<Facture> findByNumeroFacture(String numeroFacture);

	// Rechercher les factures par statut et agent
	List<Facture> findByAgentGpAndStatutOrderByDateCreationDesc(AgentGp agentGp, Facture.StatutFacture statut);

	// Rechercher les factures par période
	@Query("SELECT f FROM Facture f WHERE f.agentGp = :agent AND f.dateCreation BETWEEN :dateDebut AND :dateFin ORDER BY f.dateCreation DESC")
	List<Facture> findByAgentAndPeriode(@Param("agent") AgentGp agent,
	                                    @Param("dateDebut") LocalDateTime dateDebut,
	                                    @Param("dateFin") LocalDateTime dateFin);

	// Rechercher par nom de client (recherche partielle)
	@Query("SELECT f FROM Facture f WHERE f.agentGp = :agent AND LOWER(f.nomClient) LIKE LOWER(CONCAT('%', :nomClient, '%')) ORDER BY f.dateCreation DESC")
	List<Facture> findByAgentAndClientContaining(@Param("agent") AgentGp agent, @Param("nomClient") String nomClient);

	// Statistiques pour l'agent
	@Query("SELECT COUNT(f) FROM Facture f WHERE f.agentGp = :agent AND f.statut = :statut")
	Long countByAgentAndStatut(@Param("agent") AgentGp agent, @Param("statut") Facture.StatutFacture statut);

	// Chiffre d'affaires par agent
	@Query("SELECT COALESCE(SUM(f.prixTransport), 0) FROM Facture f WHERE f.agentGp = :agent AND f.statut IN :statuts")
	Double sumPrixTransportByAgentAndStatuts(@Param("agent") AgentGp agent, @Param("statuts") List<Facture.StatutFacture> statuts);

	// Dernières factures créées
	List<Facture> findTop10ByAgentGpOrderByDateCreationDesc(AgentGp agentGp);
}