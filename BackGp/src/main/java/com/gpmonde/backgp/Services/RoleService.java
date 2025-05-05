package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.Role;
import com.gpmonde.backgp.Repositorys.RoleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoleService {

	private final RoleRepository roleRepository;

	@PostConstruct
	public void initRoles() {
		String[] defaultRoles = {"ROLE_USER", "ROLE_AGENTGP"};

		for (String roleName : defaultRoles) {
			if (roleRepository.findByName(roleName).isEmpty()) {
				Role role = new Role();
				role.setName(roleName);
				roleRepository.save(role);

			}
		}
	}

	public Role createRole(String roleName) {
		Role role = new Role();
		role.setName(roleName);
		return roleRepository.save(role);
	}
	public List<Role> getAllRoles() {
		return roleRepository.findAll();
	}
	public Optional<Role> getRole(String roleName) {
		return roleRepository.findByName(roleName);
	}



}
