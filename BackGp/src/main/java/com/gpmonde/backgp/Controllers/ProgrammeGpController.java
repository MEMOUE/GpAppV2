package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.ProgrammeGp;
import com.gpmonde.backgp.Services.ProgrammeGpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
//@CrossOrigin("*")
@RequestMapping("/api/programmegp")
public class ProgrammeGpController {

	private final ProgrammeGpService programmeGpService;




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

	@PutMapping("/{id}")
	public ProgrammeGp updateProgramme(@PathVariable Long id, @RequestBody ProgrammeGp programmeDetails) {
		return programmeGpService.updateProgramme(id, programmeDetails);
	}

	@DeleteMapping("/{id}")
	public void deleteProgramme(@PathVariable Long id) {
		programmeGpService.deleteProgramme(id);
	}

	@GetMapping("/searsh")
	public List<ProgrammeGp> getProgrammegp(@RequestParam String depart, @RequestParam String destination) {
		return programmeGpService.findByDepartureAndDestination(depart, destination);
	}

	@GetMapping("/mylist")
	public List<ProgrammeGp> getProgrammesForCurrentAgent() {
		return programmeGpService.getProgrammesForCurrentAgent();
	}
}
