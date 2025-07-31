package com.gpmonde.backgp.Validators;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import org.springframework.web.multipart.MultipartFile;

import java.lang.annotation.*;

/**
 * Annotation de validation pour les fichiers image
 */
@Documented
@Constraint(validatedBy = ImageFileValidator.ImageFileConstraintValidator.class)
@Target({ElementType.PARAMETER, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface ImageFileValidator {

	String message() default "Le fichier doit être une image valide (JPEG, PNG, GIF, WEBP) et ne pas dépasser 5MB";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	long maxSize() default 5 * 1024 * 1024; // 5MB par défaut

	String[] allowedTypes() default {"image/jpeg", "image/png", "image/gif", "image/webp"};

	boolean required() default true;

	/**
	 * Implémentation du validateur
	 */
	class ImageFileConstraintValidator implements ConstraintValidator<ImageFileValidator, MultipartFile> {

		private long maxSize;
		private String[] allowedTypes;
		private boolean required;

		@Override
		public void initialize(ImageFileValidator constraintAnnotation) {
			this.maxSize = constraintAnnotation.maxSize();
			this.allowedTypes = constraintAnnotation.allowedTypes();
			this.required = constraintAnnotation.required();
		}

		@Override
		public boolean isValid(MultipartFile file, ConstraintValidatorContext context) {
			// Si le fichier n'est pas requis et qu'il est null/vide, c'est valide
			if (!required && (file == null || file.isEmpty())) {
				return true;
			}

			// Si le fichier est requis et qu'il est null/vide, c'est invalide
			if (required && (file == null || file.isEmpty())) {
				context.disableDefaultConstraintViolation();
				context.buildConstraintViolationWithTemplate("Le fichier est obligatoire")
						.addConstraintViolation();
				return false;
			}

			// Vérifier la taille du fichier
			if (file.getSize() > maxSize) {
				context.disableDefaultConstraintViolation();
				context.buildConstraintViolationWithTemplate(
								String.format("Le fichier ne peut pas dépasser %d MB", maxSize / (1024 * 1024)))
						.addConstraintViolation();
				return false;
			}

			// Vérifier le type de contenu
			String contentType = file.getContentType();
			if (contentType == null) {
				context.disableDefaultConstraintViolation();
				context.buildConstraintViolationWithTemplate("Type de fichier non déterminable")
						.addConstraintViolation();
				return false;
			}

			boolean validType = false;
			for (String allowedType : allowedTypes) {
				if (allowedType.equals(contentType)) {
					validType = true;
					break;
				}
			}

			if (!validType) {
				context.disableDefaultConstraintViolation();
				context.buildConstraintViolationWithTemplate(
								"Le fichier doit être une image (JPEG, PNG, GIF, WEBP)")
						.addConstraintViolation();
				return false;
			}

			// Vérifier l'extension du fichier pour plus de sécurité
			String originalFilename = file.getOriginalFilename();
			if (originalFilename != null) {
				String extension = getFileExtension(originalFilename).toLowerCase();
				boolean validExtension = extension.equals(".jpg") ||
						extension.equals(".jpeg") ||
						extension.equals(".png") ||
						extension.equals(".gif") ||
						extension.equals(".webp");

				if (!validExtension) {
					context.disableDefaultConstraintViolation();
					context.buildConstraintViolationWithTemplate(
									"Extension de fichier non autorisée. Extensions acceptées: .jpg, .jpeg, .png, .gif, .webp")
							.addConstraintViolation();
					return false;
				}
			}

			return true;
		}

		private String getFileExtension(String filename) {
			if (filename != null && filename.contains(".")) {
				return filename.substring(filename.lastIndexOf("."));
			}
			return "";
		}
	}
}