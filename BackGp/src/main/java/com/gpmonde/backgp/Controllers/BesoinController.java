package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.Besoin;
import com.gpmonde.backgp.Services.BesoinService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@Tag(name = "Besoins")
@RequestMapping("/api/besoins")
public class BesoinController {

	private final BesoinService besoinService;

	@GetMapping
	public List<Besoin> getAllBesoins() {
		return besoinService.getAllBesoins();
	}

	@GetMapping("/{id}")
	public Besoin getBesoinById(@PathVariable Long id) {
		return besoinService.getBesoinById(id).orElse(null);
	}

	@PostMapping
	public Besoin CreateBesoin(@RequestBody Besoin besoin) {
		return besoinService.createBesoin(besoin);
	}

	@PutMapping
	public Besoin updateBesoin(@PathVariable Long id, @RequestBody Besoin besoin){
		return besoinService.updateBesoin(id, besoin);
	}

	@DeleteMapping("/{id}")
	public void deleteBesoin(@PathVariable Long id) {
		besoinService.deleteBesoin(id);
	}
}
