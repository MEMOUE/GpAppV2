package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.Utilisateur;
import com.gpmonde.backgp.Entities.VerificationTokenRegister;
import com.gpmonde.backgp.Repositorys.VerificationTokenRepositoryRegister;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VerificationServiceRegister {

	private final VerificationTokenRepositoryRegister tokenRepository;
	private final JavaMailSender mailSender;

	public String generateToken(Utilisateur user) {
		String token = UUID.randomUUID().toString();
		VerificationTokenRegister verificationToken = new VerificationTokenRegister();
		verificationToken.setToken(token);
		verificationToken.setUser(user);
		verificationToken.setExpiryDate(1440);
		tokenRepository.save(verificationToken);
		return token;
	}

	public void sendVerificationEmail(Utilisateur user, String token) {
		String url = "https://147.79.101.109:80/verify?token=" + token; // URL du frontend Angular
		SimpleMailMessage message = new SimpleMailMessage();
		message.setTo(user.getEmail());
		message.setSubject("Vérification de votre compte");
		message.setText("Cliquez sur le lien pour vérifier votre compte : " + url);
		mailSender.send(message);
	}



}
