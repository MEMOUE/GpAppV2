package com.gpmonde.backgp.Configs;

import com.gpmonde.backgp.Security.JwtAuthenticationFilter;
import com.gpmonde.backgp.Security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtUtil jwtUtil;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http.csrf(csrf -> csrf.disable())
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(
								"/api/user/**",
								"/api/agentgp/**",
								"/api/auth/login/**",
								"/api/auth/logout/**",
								"/api/programmegp/**", // Retirer cette ligne
								"/api/programmegp/searsh/**",
								"api/programmegp/active-or-recent",
								"/api/tracking",
								"/favicon.ico",
								"/api/suivi/**",
								"/api/ws/**",
								"/api/notifications/user/**",

								"/h2-console/**",
								"/swagger-ui/**",
								"/swagger-resources/**",
								"/swagger-ui.html/**",
								 "/api/programmegp/mylist/**", // Retirer cette ligne aussi
								"/api/auth/verify/**",
								"/api/besoins/**",
								"/api/auth/forgot-password/**",
								"/api/auth/reset-password/**",
								"/v3/api-docs/**"
						).permitAll()
						// Endpoints des factures - réservés aux agents GP
						.requestMatchers("/api/factures/**").hasRole("AGENTGP")
						.requestMatchers( "/api/factures").hasRole("AGENTGP")
						.requestMatchers("/api/factures").hasRole("AGENTGP")
						.requestMatchers("/api/factures/paginated").hasRole("AGENTGP")
						.requestMatchers("/api/factures/statistiques").hasRole("AGENTGP")
						.requestMatchers("/api/factures/*").hasRole("AGENTGP")
						.requestMatchers("/api/factures/*/pdf").hasRole("AGENTGP")
						.requestMatchers("/api/factures/*/pdf/preview").hasRole("AGENTGP")
						.requestMatchers( "/api/factures/*/payer").hasRole("AGENTGP")
						.requestMatchers("/api/factures/*/statut").hasRole("AGENTGP")
						.anyRequest().authenticated()
				)
				.addFilterBefore(new JwtAuthenticationFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class)
				.httpBasic(withDefaults());
		http.headers(headers -> headers
				.frameOptions(frameOptions -> frameOptions.disable())
		);

		return http.build();
	}
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		//configuration.setAllowedOrigins(List.of("https://gpmonde.com","https://www.gpmonde.com"));
		configuration.setAllowedOrigins(List.of("http://localhost:4200/"));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

}
