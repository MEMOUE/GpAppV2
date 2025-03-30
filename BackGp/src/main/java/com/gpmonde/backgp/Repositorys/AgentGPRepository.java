package com.gpmonde.backgp.Repositorys;

import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Entities.ProgrammeGp;
import com.gpmonde.backgp.Entities.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AgentGPRepository extends JpaRepository<AgentGp, Long> {
	@Query("SELECT a FROM AgentGp a JOIN a.destinations d WHERE LOWER(d) = LOWER(:depart) AND LOWER(:arrivee) IN (SELECT LOWER(d2) FROM AgentGp ag JOIN ag.destinations d2 WHERE ag = a)")
	List<AgentGp> findByDepartAndArriveeAgence(@Param("depart") String depart, @Param("arrivee") String arrivee);

}
