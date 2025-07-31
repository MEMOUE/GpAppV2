package com.gpmonde.backgp.Services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

	@Value("${app.upload.dir:uploads}")
	private String uploadDir;

	private static final String LOGO_SUBDIR = "logos";
	private static final String CARTE_IDENTITE_SUBDIR = "cartes-identite";
	private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

	/**
	 * Sauvegarde le logo d'un agent
	 */
	public String saveLogo(MultipartFile file, String agentUsername) {
		return saveFile(file, LOGO_SUBDIR, agentUsername + "_logo");
	}

	/**
	 * Sauvegarde la carte d'identité d'un agent
	 */
	public String saveCarteIdentite(MultipartFile file, String agentUsername) {
		return saveFile(file, CARTE_IDENTITE_SUBDIR, agentUsername + "_carte");
	}

	/**
	 * Méthode générique pour sauvegarder un fichier
	 */
	private String saveFile(MultipartFile file, String subDirectory, String filePrefix) {
		try {
			// Validation du fichier
			validateFile(file);

			// Créer le répertoire s'il n'existe pas
			Path uploadPath = Paths.get(uploadDir, subDirectory);
			if (!Files.exists(uploadPath)) {
				Files.createDirectories(uploadPath);
			}

			// Générer un nom de fichier unique
			String originalFilename = file.getOriginalFilename();
			String fileExtension = getFileExtension(originalFilename);
			String uniqueFilename = filePrefix + "_" + UUID.randomUUID().toString() + fileExtension;

			// Sauvegarder le fichier
			Path filePath = uploadPath.resolve(uniqueFilename);
			Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

			// Retourner l'URL relative du fichier
			return "/" + subDirectory + "/" + uniqueFilename;

		} catch (IOException e) {
			throw new RuntimeException("Erreur lors de la sauvegarde du fichier: " + e.getMessage(), e);
		}
	}

	/**
	 * Valide le fichier uploadé
	 */
	private void validateFile(MultipartFile file) {
		if (file.isEmpty()) {
			throw new IllegalArgumentException("Le fichier ne peut pas être vide");
		}

		if (file.getSize() > MAX_FILE_SIZE) {
			throw new IllegalArgumentException("Le fichier ne peut pas dépasser 5MB");
		}

		String contentType = file.getContentType();
		if (contentType == null || !isImageFile(contentType)) {
			throw new IllegalArgumentException("Le fichier doit être une image (JPEG, PNG, GIF)");
		}
	}

	/**
	 * Vérifie si le fichier est une image
	 */
	private boolean isImageFile(String contentType) {
		return contentType.equals("image/jpeg") ||
				contentType.equals("image/png") ||
				contentType.equals("image/gif") ||
				contentType.equals("image/webp");
	}

	/**
	 * Extrait l'extension du fichier
	 */
	private String getFileExtension(String filename) {
		if (filename != null && filename.contains(".")) {
			return filename.substring(filename.lastIndexOf("."));
		}
		return "";
	}

	/**
	 * Supprime un fichier
	 */
	public void deleteFile(String fileUrl) {
		try {
			if (fileUrl != null && !fileUrl.isEmpty()) {
				Path filePath = Paths.get(uploadDir + fileUrl);
				Files.deleteIfExists(filePath);
			}
		} catch (IOException e) {
			// Log l'erreur mais ne pas faire échouer l'opération
			System.err.println("Erreur lors de la suppression du fichier: " + e.getMessage());
		}
	}

	/**
	 * Vérifie si un fichier existe
	 */
	public boolean fileExists(String fileUrl) {
		if (fileUrl == null || fileUrl.isEmpty()) {
			return false;
		}
		Path filePath = Paths.get(uploadDir + fileUrl);
		return Files.exists(filePath);
	}
}