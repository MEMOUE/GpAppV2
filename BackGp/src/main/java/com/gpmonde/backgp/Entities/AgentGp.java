package com.gpmonde.backgp.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
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
@PrimaryKeyJoinColumn(name = "id")
public class AgentGp extends Utilisateur {

	@Column(unique = true)
	@Size(max = 50)
	private String nomagence;

	@Column(nullable = false)
	@Size(max = 50)
	private String adresse;

	@Column(nullable = false)
	@Size(max = 20)
	private String telephone;

	@Column(name = "logo_url", nullable = false)
	@Size(min = 1, message = "Le logo est obligatoire")
	private String logourl;

	@Column(name = "carte_identite_url", nullable = false)
	@Size(min = 1, message = "La carte d'identité est obligatoire")
	private String carteidentiteurl;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "agent_destinations", joinColumns = @JoinColumn(name = "agent_id"))
	@Column(name = "destination")
	private Set<String> destinations = new HashSet<>();

	@ManyToMany(mappedBy = "agentsSuivis")
	@JsonIgnore
	private Set<Utilisateur> suiveurs = new HashSet<>();
}