package com.gpmonde.backgp.Configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Value("${app.upload.dir:uploads}")
	private String uploadDir;

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		// Configuration pour servir les fichiers uploadés
		registry.addResourceHandler("/logos/**")
				.addResourceLocations("file:" + uploadDir + "/logos/");

		registry.addResourceHandler("/cartes-identite/**")
				.addResourceLocations("file:" + uploadDir + "/cartes-identite/");
	}
}