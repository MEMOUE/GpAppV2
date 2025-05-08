package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.ProgrammeGp;
import com.gpmonde.backgp.Services.ProgrammeGpService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "ProgrammeGp")
@RequestMapping("/api/programmegp")
public class ProgrammeGpController {

	private final ProgrammeGpService programmeGpService;


	@PreAuthorize("hasRole('ROLE_AGENTGP')")
	@PostMapping
	public ProgrammeGp addProgramme(@RequestBody ProgrammeGp programmeGp) {
		return programmeGpService.addProgramme(programmeGp);
	}

	@GetMapping
	public List<ProgrammeGp> getAllProgrammes() {
		return programmeGpService.getAllProgrammes();
	}

	@GetMapping("/{id}")
	public ProgrammeGp getProgrammeById(@PathVariable Long id) {
		return programmeGpService.getProgrammeById(id);
	}

	@PreAuthorize("hasRole('ROLE_AGENTGP')")
	@PutMapping("/{id}")
	public ProgrammeGp updateProgramme(@PathVariable Long id, @RequestBody ProgrammeGp programmeDetails) {
		return programmeGpService.updateProgramme(id, programmeDetails);
	}

	@PreAuthorize("hasRole('ROLE_AGENTGP')")
	@DeleteMapping("/{id}")
	public void deleteProgramme(@PathVariable Long id) {
		programmeGpService.deleteProgramme(id);
	}

	@GetMapping("/searsh")
	public List<ProgrammeGp> getProgrammegp(@RequestParam String depart, @RequestParam String destination) {
		return programmeGpService.findByDepartureAndDestination(depart, destination);
	}

	@PreAuthorize("hasRole('ROLE_AGENTGP')")
	@GetMapping("/mylist")
	public List<ProgrammeGp> getProgrammesForCurrentAgent() {
		return programmeGpService.getProgrammesForCurrentAgent();
	}
}
