package com.gpmonde.backgp.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
public class JwtUtil {

	@Value("${jwt.secret}")
	private String SECRET_KEY;

	// Générer un JWT token
	public String generateToken(String username, List<String> roles) {
		Claims claims = Jwts.claims().setSubject(username);
		claims.put("roles", roles);

		return Jwts.builder()
				.setClaims(claims)
				.setIssuedAt(new Date())
				.setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // Expiration après 10 heures
				.signWith(SignatureAlgorithm.HS512, SECRET_KEY)
				.compact();
	}

	// Extraire le nom d'utilisateur du token
	public String extractUsername(String token) {
		return extractClaims(token).getSubject();
	}

	// Extraire les rôles du token
	public List<String> extractRoles(String token) {
		return (List<String>) extractClaims(token).get("roles");
	}

	// Extraire les informations (claims) du token
	private Claims extractClaims(String token) {
		return Jwts.parser()
				.setSigningKey(SECRET_KEY)
				.parseClaimsJws(token)
				.getBody();
	}

	// Vérifier si le token est expiré
	public boolean isTokenExpired(String token) {
		return extractClaims(token).getExpiration().before(new Date());
	}

	// Valider le token
	public boolean validateToken(String token, String username) {
		return (username.equals(extractUsername(token)) && !isTokenExpired(token));
	}
}