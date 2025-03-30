package com.gpmonde.backgp.Repositorys;

import com.gpmonde.backgp.Entities.VerificationTokenRegister;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationTokenRepositoryRegister extends JpaRepository<VerificationTokenRegister,Long> {
	VerificationTokenRegister findByToken(String token);
}
