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
								"api/programmegp/**",
								"api/programmegp/searsh/**",
								"/api/tracking",
								"/favicon.ico",
								//Base H2
								"/h2-console/**",
								//OpenApi
								"/swagger-ui/**",
								"/swagger-resources/**",
								"swagger-ui.html/**",
								"/api/programmegp/mylist/**",
								"/api/auth/verify/**",
								"/api/besoins/**",
								"/api/auth/forgot-password/**",
								"/api/auth/reset-password/**",
								"/v3/api-docs/**").permitAll()
//						.requestMatchers(
//								"").authenticated()

						//.requestMatchers("api/programmegp/**").hasAnyRole("ADMINGP")

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
		configuration.setAllowedOrigins(List.of("http://localhost:4200","http://gpmonde.com","http://www.gpmonde.com"));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

}