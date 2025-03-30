package com.gpmonde.backgp.Services;


import com.gpmonde.backgp.Entities.Role;
import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Repositorys.UtilisateurRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

	private final UtilisateurRepository utilisateurRepository;

	public CustomUserDetailsService( UtilisateurRepository utilisateurRepository) {
		this.utilisateurRepository = utilisateurRepository;

	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		Utilisateur utilisateur = utilisateurRepository.findByUsername(username).orElseThrow();

		return org.springframework.security.core.userdetails.User.builder()
				.username(utilisateur.getUsername())
				.password(utilisateur.getPassword())
				.roles(utilisateur.getRoles().stream()
						.map(Role::getName)
						.map(role -> role.replace("ROLE_", ""))
						.toArray(String[]::new))
				.build();
	}
}

