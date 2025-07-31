package com.gpmonde.backgp.Controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
@CrossOrigin("*")
@Tag(name = "📁 Gestion des fichiers", description = "Endpoints pour accéder aux fichiers uploadés (logos et cartes d'identité)")
public class FileController {

	@Value("${app.upload.dir:uploads}")
	private String uploadDir;

	/**
	 * Télécharger/Afficher un logo
	 */
	@GetMapping("/logos/{filename:.+}")
	@Operation(
			summary = "Afficher un logo d'agence",
			description = "Récupère et affiche le logo d'une agence GP par son nom de fichier.",
			responses = {
					@ApiResponse(responseCode = "200", description = "Logo trouvé et retourné"),
					@ApiResponse(responseCode = "404", description = "Logo non trouvé"),
					@ApiResponse(responseCode = "400", description = "Nom de fichier invalide")
			}
	)
	public ResponseEntity<Resource> downloadLogo(
			@Parameter(description = "Nom du fichier logo (ex: agence_logo_uuid123.jpg)", required = true)
			@PathVariable String filename) {
		return downloadFile("logos", filename);
	}

	/**
	 * Télécharger/Afficher une carte d'identité
	 */
	@GetMapping("/cartes-identite/{filename:.+}")
	@Operation(
			summary = "Afficher une carte d'identité",
			description = "Récupère et affiche la carte d'identité d'un agent GP par son nom de fichier.",
			responses = {
					@ApiResponse(responseCode = "200", description = "Carte d'identité trouvée et retournée"),
					@ApiResponse(responseCode = "404", description = "Carte d'identité non trouvée"),
					@ApiResponse(responseCode = "400", description = "Nom de fichier invalide")
			}
	)
	public ResponseEntity<Resource> downloadCarteIdentite(
			@Parameter(description = "Nom du fichier carte d'identité (ex: agence_carte_uuid456.jpg)", required = true)
			@PathVariable String filename) {
		return downloadFile("cartes-identite", filename);
	}

	/**
	 * Méthode générique pour télécharger un fichier
	 */
	private ResponseEntity<Resource> downloadFile(String subDirectory, String filename) {
		try {
			Path filePath = Paths.get(uploadDir, subDirectory, filename);
			Resource resource = new UrlResource(filePath.toUri());

			if (resource.exists() && resource.isReadable()) {
				// Déterminer le type de contenu
				String contentType = getContentType(filename);

				return ResponseEntity.ok()
						.contentType(MediaType.parseMediaType(contentType))
						.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
						.header(HttpHeaders.CACHE_CONTROL, "max-age=3600") // Cache 1 heure
						.body(resource);
			} else {
				return ResponseEntity.notFound().build();
			}
		} catch (MalformedURLException e) {
			return ResponseEntity.badRequest().build();
		}
	}

	/**
	 * Détermine le type de contenu en fonction de l'extension du fichier
	 */
	private String getContentType(String filename) {
		if (filename.toLowerCase().endsWith(".png")) {
			return "image/png";
		} else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
			return "image/jpeg";
		} else if (filename.toLowerCase().endsWith(".gif")) {
			return "image/gif";
		} else if (filename.toLowerCase().endsWith(".webp")) {
			return "image/webp";
		} else {
			return "application/octet-stream";
		}
	}
}