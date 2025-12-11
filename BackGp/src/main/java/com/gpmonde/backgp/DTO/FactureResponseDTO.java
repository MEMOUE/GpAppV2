package com.gpmonde.backgp.DTO;

import com.gpmonde.backgp.Entities.Facture;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour la réponse d'une facture
 * Contient toutes les informations de la facture, du programme et de l'agent
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FactureResponseDTO {

    // ========== INFORMATIONS FACTURE ==========

    /**
     * ID unique de la facture
     */
    private Long id;

    /**
     * Numéro de facture généré automatiquement
     * Format: GP-YYYY-MM-DD-XXXXX
     * Exemple: GP-2025-12-11-00123
     */
    private String numeroFacture;

    /**
     * Nom du client
     */
    private String nomClient;

    /**
     * Adresse complète du client
     */
    private String adresseClient;

    /**
     * Nom du laveur de bagage
     */
    private String laveurBagage;

    /**
     * Nombre de kilogrammes de bagages
     */
    private Integer nombreKg;

    /**
     * Prix total du transport avec devise
     * Exemple: "50000 FCFA", "500 EUR", "75 USD"
     */
    private String prixTransport;

    /**
     * Prix unitaire par kilogramme avec devise
     * Calculé automatiquement: prixTransport / nombreKg
     * Exemple: "1000 FCFA/kg", "10 EUR/kg"
     */
    private String prixUnitaire;

    /**
     * Date et heure de création de la facture
     */
    private LocalDateTime dateCreation;

    /**
     * Statut de la facture
     * Valeurs: PAYEE, NON_PAYEE
     */
    private Facture.StatutFacture statut;

    /**
     * Notes ou commentaires supplémentaires sur la facture
     */
    private String notes;

    // ========== INFORMATIONS PROGRAMME ==========

    /**
     * ID du programme de transport associé
     */
    private Long programmeId;

    /**
     * Description du programme de transport
     */
    private String programmeDescription;

    /**
     * Ville/pays de départ
     */
    private String depart;

    /**
     * Ville/pays de destination
     */
    private String destination;

    /**
     * Garantie du programme (en pourcentage)
     * Exemple: "95.5" pour 95.5%
     */
    private String garantie;

    // ========== INFORMATIONS AGENT GP ==========

    /**
     * ID de l'agent GP qui a créé la facture
     */
    private Long agentId;

    /**
     * Nom d'utilisateur de l'agent
     */
    private String agentNom;

    /**
     * Nom de l'agence GP
     */
    private String agentAgence;

    /**
     * Numéro de téléphone de l'agence
     */
    private String agentTelephone;

    /**
     * Adresse de l'agence
     */
    private String agentAdresse;

    /**
     * Email de l'agent
     */
    private String agentEmail;

    /**
     * Convertit une entité Facture en DTO
     * Extrait toutes les informations nécessaires de l'entité et de ses relations
     *
     * @param facture L'entité Facture à convertir
     * @return Le DTO avec toutes les informations
     */
    public static FactureResponseDTO fromEntity(Facture facture) {
        FactureResponseDTO dto = new FactureResponseDTO();

        // Informations de base de la facture
        dto.setId(facture.getId());
        dto.setNumeroFacture(facture.getNumeroFacture());
        dto.setNomClient(facture.getNomClient());
        dto.setAdresseClient(facture.getAdresseClient());
        dto.setLaveurBagage(facture.getLaveurBagage());
        dto.setNombreKg(facture.getNombreKg());
        dto.setPrixTransport(facture.getPrixTransport());
        dto.setPrixUnitaire(facture.getPrixUnitaire());
        dto.setDateCreation(facture.getDateCreation());
        dto.setStatut(facture.getStatut());
        dto.setNotes(facture.getNotes());

        // Informations du programme associé
        if (facture.getProgrammeGp() != null) {
            dto.setProgrammeId(facture.getProgrammeGp().getId());
            dto.setProgrammeDescription(facture.getProgrammeGp().getDescription());
            dto.setDepart(facture.getProgrammeGp().getDepart());
            dto.setDestination(facture.getProgrammeGp().getDestination());
            dto.setGarantie(facture.getProgrammeGp().getGarantie() != null
                    ? facture.getProgrammeGp().getGarantie().toString()
                    : null);
        }

        // Informations de l'agent GP
        if (facture.getAgentGp() != null) {
            dto.setAgentId(facture.getAgentGp().getId());
            dto.setAgentNom(facture.getAgentGp().getUsername());
            dto.setAgentAgence(facture.getAgentGp().getNomagence());
            dto.setAgentTelephone(facture.getAgentGp().getTelephone());
            dto.setAgentAdresse(facture.getAgentGp().getAdresse());
            dto.setAgentEmail(facture.getAgentGp().getEmail());
        }

        return dto;
    }

    /**
     * Retourne un résumé court de la facture
     * Utile pour les logs ou les affichages condensés
     *
     * @return Résumé de la facture
     */
    public String getResume() {
        return String.format("Facture %s - Client: %s - Montant: %s - Statut: %s",
                numeroFacture, nomClient, prixTransport, statut);
    }

    /**
     * Vérifie si la facture est payée
     *
     * @return true si la facture est payée, false sinon
     */
    public boolean estPayee() {
        return statut == Facture.StatutFacture.PAYEE;
    }

    /**
     * Retourne le trajet complet (départ → destination)
     *
     * @return Trajet au format "Départ → Destination"
     */
    public String getTrajet() {
        if (depart != null && destination != null) {
            return depart + " → " + destination;
        }
        return null;
    }
}