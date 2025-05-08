package com.gpmonde.backgp.Controllers;
import com.gpmonde.backgp.DTO.LoginRequest;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Services.UtilisateurService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
@Tag(name = "Utilisateur")
public class UtilisateurController {

	private final UtilisateurService utilisateurService;


	/**
	 * Crée un nouvel utilisateur avec le rôle par défaut ROLE_USER.
	 *
	 * @param utilisateur L'utilisateur à créer.
	 * @return L'utilisateur créé.
	 */
	@PostMapping
	public Utilisateur createUtilisateur(@RequestBody Utilisateur utilisateur) {
		return utilisateurService.save(utilisateur);
	}

	/**
	 * Récupère tous les utilisateurs.
	 *
	 * @return La liste des utilisateurs.
	 */
	@GetMapping
	public List<Utilisateur> getAllUtilisateurs() {
		return utilisateurService.findAll();
	}

	/**
	 * Met à jour un utilisateur existant.
	 *
	 * @param utilisateur Les nouvelles données de l'utilisateur.
	 * @param id                L'ID de l'utilisateur à mettre à jour.
	 * @return L'utilisateur mis à jour.
	 */
	@PutMapping("/{id}")
	public Utilisateur updateUtilisateur(@RequestBody Utilisateur utilisateur, @PathVariable Long id) {
		return utilisateurService.update(utilisateur, id);
	}

	/**
	 * Supprime un utilisateur par ID.
	 *
	 * @param id L'ID de l'utilisateur à supprimer.
	 */
	@DeleteMapping("/{id}")
	public void deleteUtilisateur(@PathVariable Long id) {
		utilisateurService.delete(id);
	}

}