package com.gpmonde.backgp.Security;

import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Services.CustomOAuth2User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler
        extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;

    @Value("${app.oauth2.redirect-uri:http://localhost:4200/oauth2/redirect}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        if (response.isCommitted()) {
            logger.debug("Response déjà commise, impossible de rediriger");
            return;
        }

        CustomOAuth2User oauth2User = (CustomOAuth2User) authentication.getPrincipal();
        Utilisateur utilisateur = oauth2User.getUtilisateur();

        // Générer le JWT
        String token = jwtUtil.generateToken(
                utilisateur.getUsername(),
                utilisateur.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toList())
        );

        // Construire l'URL de redirection avec le token
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", token)
                .queryParam("userId", utilisateur.getId())
                .queryParam("hasCompleteProfile", utilisateur.hasCompleteProfile())
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}