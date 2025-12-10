package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.DTO.OAuth2.OAuth2UserInfo;
import com.gpmonde.backgp.DTO.OAuth2.OAuth2UserInfoFactory;
import com.gpmonde.backgp.Entities.Role;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Entities.Utilisateur.AuthProvider;
import com.gpmonde.backgp.Repositorys.RoleRepository;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {

        OAuth2User oauth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration()
                .getRegistrationId();

        OAuth2UserInfo userInfo = OAuth2UserInfoFactory
                .getOAuth2UserInfo(registrationId, oauth2User.getAttributes());

        if (userInfo.getEmail() == null || userInfo.getEmail().isEmpty()) {
            throw new OAuth2AuthenticationException(
                    "Email introuvable depuis le provider OAuth2"
            );
        }

        Utilisateur utilisateur = registerOrUpdateUser(
                AuthProvider.valueOf(registrationId.toUpperCase()),
                userInfo
        );

        return new CustomOAuth2User(utilisateur, oauth2User.getAttributes());
    }

    private Utilisateur registerOrUpdateUser(
            AuthProvider provider,
            OAuth2UserInfo userInfo) {

        Optional<Utilisateur> optionalUser = utilisateurRepository
                .findByEmail(userInfo.getEmail());

        Utilisateur utilisateur;

        if (optionalUser.isPresent()) {
            utilisateur = optionalUser.get();

            // Vérifier que le provider correspond
            if (!utilisateur.getProvider().equals(provider)) {
                throw new OAuth2AuthenticationException(
                        "Vous êtes déjà inscrit avec " + utilisateur.getProvider()
                );
            }

            // Mise à jour des informations
            utilisateur.setUsername(userInfo.getName());
            utilisateur.setImageUrl(userInfo.getImageUrl());
            utilisateur.setProviderId(userInfo.getProviderId());

        } else {
            // Création d'un nouvel utilisateur
            utilisateur = new Utilisateur();
            utilisateur.setUsername(userInfo.getName());
            utilisateur.setEmail(userInfo.getEmail());
            utilisateur.setProvider(provider);
            utilisateur.setProviderId(userInfo.getProviderId());
            utilisateur.setImageUrl(userInfo.getImageUrl());
            utilisateur.setEnabled(true); // OAuth2 users sont auto-vérifiés

            // Ajouter le rôle USER par défaut
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Rôle USER introuvable"));

            Set<Role> roles = new HashSet<>();
            roles.add(userRole);
            utilisateur.setRoles(roles);
        }

        return utilisateurRepository.save(utilisateur);
    }
}