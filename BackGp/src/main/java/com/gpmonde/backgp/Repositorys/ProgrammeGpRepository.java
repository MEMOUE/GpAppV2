package com.gpmonde.backgp.Repositorys;

import com.gpmonde.backgp.Entities.AgentGp;
import com.gpmonde.backgp.Entities.ProgrammeGp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgrammeGpRepository extends JpaRepository<ProgrammeGp, Long> {
	@Query("SELECT p FROM ProgrammeGp p WHERE LOWER(p.depart) = LOWER(:depart) AND LOWER(p.destination) = LOWER(:destination)")
	List<ProgrammeGp> findByDepartureAndDestination(@Param("depart") String depart, @Param("destination") String destination);

	List<ProgrammeGp> findByAgentGpId(Long agentId);


}

