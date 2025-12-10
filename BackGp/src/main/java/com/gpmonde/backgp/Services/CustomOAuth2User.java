package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.Utilisateur;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
public class CustomOAuth2User implements OAuth2User {

    private final Utilisateur utilisateur;
    private final Map<String, Object> attributes;

    public CustomOAuth2User(Utilisateur utilisateur, Map<String, Object> attributes) {
        this.utilisateur = utilisateur;
        this.attributes = attributes;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return utilisateur.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());
    }

    @Override
    public String getName() {
        return utilisateur.getEmail();
    }
}