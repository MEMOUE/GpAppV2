package com.gpmonde.backgp.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.HashSet;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public class Utilisateur {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String username;

	@Column(nullable = false)
	@JsonIgnore
	private String password;

	@Column(nullable = false, unique = true)
	private String email;

	private boolean enabled = false;

	@Column(name = "reset_token")
	private String resetToken;

	@ManyToMany(fetch = FetchType.EAGER)
	@JoinTable(
			name = "utilisateur_roles",
			joinColumns = @JoinColumn(name = "utilisateur_id"),
			inverseJoinColumns = @JoinColumn(name = "role_id")
	)
	private Set<Role> roles = new HashSet<>();

	@ManyToMany
	@JoinTable(
			name = "utilisateur_suivi_agentgp",
			joinColumns = @JoinColumn(name = "utilisateur_id"),
			inverseJoinColumns = @JoinColumn(name = "agentgp_id")
	)
	@JsonIgnore  // Fonctionne maintenant correctement
	private Set<AgentGp> agentsSuivis = new HashSet<>();
}
