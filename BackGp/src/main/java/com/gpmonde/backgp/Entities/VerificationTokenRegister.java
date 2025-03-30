package com.gpmonde.backgp.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class VerificationTokenRegister {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String token;

	@OneToOne
	@JoinColumn(name = "user_id")
	private Utilisateur user; // On supprime `agencegp`

	private LocalDateTime expiryDate;

	// Génère une date d'expiration (ex: 24h)
	public void setExpiryDate(int minutes) {
		this.expiryDate = LocalDateTime.now().plusMinutes(minutes);
	}

	public boolean isExpired() {
		return LocalDateTime.now().isAfter(this.expiryDate);
	}
}
