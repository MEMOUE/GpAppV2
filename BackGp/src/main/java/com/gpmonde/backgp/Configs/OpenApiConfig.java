package com.gpmonde.backgp.Configs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfig {
	private static final Logger logger = LoggerFactory.getLogger(OpenApiConfig.class);

	@Bean
	public OpenAPI customOpenAPI() {
		logger.info("Initializing OpenAPI configuration");

		OpenAPI openAPI = new OpenAPI()
				.info(new Info()
						.title("Plate-forme Gp")
						.description("API pour la gestion des Gp")
						.version("1.0.0")
				);

		logger.info("OpenAPI configuration initialized successfully");
		return openAPI;
	}


}
