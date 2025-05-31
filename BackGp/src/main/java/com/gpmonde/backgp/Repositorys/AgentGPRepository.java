package com.gpmonde.backgp.Repositorys;

import com.gpmonde.backgp.Entities.AgentGp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AgentGPRepository extends JpaRepository<AgentGp, Long> {

	@Query("SELECT a FROM AgentGp a JOIN a.destinations d WHERE LOWER(d) = LOWER(:depart) AND LOWER(:arrivee) IN (SELECT LOWER(d2) FROM AgentGp ag JOIN ag.destinations d2 WHERE ag = a)")
	List<AgentGp> findByDepartAndArriveeAgence(@Param("depart") String depart, @Param("arrivee") String arrivee);

	// Recherche par nom d'utilisateur
	Optional<AgentGp> findByUsername(String username);

	// Recherche par email
	Optional<AgentGp> findByEmail(String email);

	// Recherche par nom d'agence
	Optional<AgentGp> findByNomagence(String nomagence);

	// Recherche par téléphone
	Optional<AgentGp> findByTelephone(String telephone);

	// Agents actifs (enabled = true)
	List<AgentGp> findByEnabledTrue();

	// Agents par destination spécifique
	@Query("SELECT DISTINCT a FROM AgentGp a JOIN a.destinations d WHERE LOWER(d) = LOWER(:destination)")
	List<AgentGp> findByDestination(@Param("destination") String destination);
}