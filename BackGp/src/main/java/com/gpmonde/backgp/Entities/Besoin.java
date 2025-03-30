package com.gpmonde.backgp.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Besoin {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotNull
	@Size(min = 10, max = 255)
	private String description;

	@NotNull
	@Size(min = 10, max = 15)
	private String telephone;

	@Temporal(TemporalType.DATE)
	private Date dateline;

	@ManyToOne
	@JoinColumn(name = "user_id", nullable = false)
	private Utilisateur utilisateur;
}
