package com.gpmonde.backgp.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AgentGpCreationRequest {
	private String username;
	private String password;
	private String email;
	private String nomagence;
	private String adresse;
	private String telephone;
	private Set<String> destinations;
	private MultipartFile logo;
	private MultipartFile carteIdentite;
}