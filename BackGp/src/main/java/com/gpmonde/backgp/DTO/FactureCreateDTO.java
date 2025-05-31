// FactureCreateDTO.java
package com.gpmonde.backgp.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FactureCreateDTO {
	private Long programmeId;
	private String nomClient;
	private String adresseClient;
	private String laveurBagage;
	private Integer nombreKg;
	private BigDecimal prixTransport;
	private String signatureBase64; // Signature en base64
	private String notes;
}
