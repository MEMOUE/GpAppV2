package com.gpmonde.backgp.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AgentGpResponse {
	private Long id;
	private String username;
	private String email;
	private String nomagence;
	private String adresse;
	private String telephone;
	private String logourl;
	private String carteidentiteurl;
	private Set<String> destinations;
	private boolean enabled;
	private String message;

	/**
	 * Constructeur pour créer une réponse de succès
	 */
	public static AgentGpResponse success(Long id, String username, String email,
	                                      String nomagence, String adresse, String telephone,
	                                      String logourl, String carteidentiteurl,
	                                      Set<String> destinations, boolean enabled) {
		AgentGpResponse response = new AgentGpResponse();
		response.setId(id);
		response.setUsername(username);
		response.setEmail(email);
		response.setNomagence(nomagence);
		response.setAdresse(adresse);
		response.setTelephone(telephone);
		response.setLogourl(logourl);
		response.setCarteidentiteurl(carteidentiteurl);
		response.setDestinations(destinations);
		response.setEnabled(enabled);
		response.setMessage("Agent créé avec succès. Un email de vérification a été envoyé.");
		return response;
	}

	/**
	 * Constructeur pour créer une réponse d'erreur
	 */
	public static AgentGpResponse error(String message) {
		AgentGpResponse response = new AgentGpResponse();
		response.setMessage(message);
		return response;
	}

	/**
	 * URLs complètes pour accéder aux fichiers
	 */
	public String getFullLogoUrl() {
		return logourl != null ? "/api/files" + logourl : null;
	}

	public String getFullCarteIdentiteUrl() {
		return carteidentiteurl != null ? "/api/files" + carteidentiteurl : null;
	}
}