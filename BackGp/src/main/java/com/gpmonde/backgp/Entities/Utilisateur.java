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
@Table(name = "utilisateurs")
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    // Password peut être null pour OAuth2
    @Column(length = 255)
    @JsonIgnore
    private String password;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private boolean enabled = false;

    @Column(name = "reset_token")
    private String resetToken;

    // === CHAMPS OAUTH2 ===
    @Column(name = "provider", nullable = false)
    @Enumerated(EnumType.STRING)
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "provider_id")
    private String providerId;

    @Column(name = "image_url")
    private String imageUrl;

    // === INFORMATIONS AGENCE (optionnel) ===
    @Column(unique = true, length = 100)
    private String nomagence;

    @Column(length = 255)
    private String adresse;

    @Column(length = 20)
    private String telephone;

    @Column(name = "logo_url")
    private String logourl;

    @Column(name = "carte_identite_url")
    private String carteidentiteurl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "utilisateur_destinations",
            joinColumns = @JoinColumn(name = "utilisateur_id")
    )
    @Column(name = "destination")
    private Set<String> destinations = new HashSet<>();

    // === RELATIONS ===
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "utilisateur_roles",
            joinColumns = @JoinColumn(name = "utilisateur_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "utilisateur_suivi",
            joinColumns = @JoinColumn(name = "suiveur_id"),
            inverseJoinColumns = @JoinColumn(name = "suivi_id")
    )
    @JsonIgnore
    private Set<Utilisateur> agentsSuivis = new HashSet<>();

    @ManyToMany(mappedBy = "agentsSuivis")
    @JsonIgnore
    private Set<Utilisateur> suiveurs = new HashSet<>();

    // === ENUM PROVIDER ===
    public enum AuthProvider {
        LOCAL,
        GOOGLE,
        FACEBOOK,
        GITHUB
    }

    // === MÉTHODES UTILITAIRES ===
    public boolean isAgentGp() {
        return this.roles.stream()
                .anyMatch(role -> "ROLE_AGENTGP".equals(role.getName()));
    }

    public boolean hasCompleteProfile() {
        return nomagence != null && !nomagence.isEmpty()
                && adresse != null && !adresse.isEmpty()
                && telephone != null && !telephone.isEmpty()
                && logourl != null && !logourl.isEmpty()
                && carteidentiteurl != null && !carteidentiteurl.isEmpty();
    }

    public boolean isOAuth2User() {
        return provider != AuthProvider.LOCAL;
    }

    @PrePersist
    protected void onCreate() {
        if (provider == null) {
            provider = AuthProvider.LOCAL;
        }
    }
}