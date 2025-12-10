package com.gpmonde.backgp.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CompleteProfileRequest {

    @NotBlank(message = "Le nom de l'agence est obligatoire")
    private String nomagence;

    @NotBlank(message = "L'adresse est obligatoire")
    private String adresse;

    @NotBlank(message = "Le téléphone est obligatoire")
    private String telephone;

    private String destinations; // Format: "Paris,Lyon,Marseille"
}