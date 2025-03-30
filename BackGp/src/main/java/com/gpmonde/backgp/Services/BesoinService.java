package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.Besoin;
import com.gpmonde.backgp.Repositorys.BesoinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class BesoinService {
	private final BesoinRepository besoinRepository;

	// Récupérer tous les besoins
	public List<Besoin> getAllBesoins() {
		return besoinRepository.findAll();
	}

	// Récupérer un besoin par son ID
	public Optional<Besoin> getBesoinById(Long id) {
		return besoinRepository.findById(id);
	}

	// Créer un nouveau besoin
	public Besoin createBesoin(Besoin besoin) {
		return besoinRepository.save(besoin);
	}

	// Mettre à jour un besoin
	public Besoin updateBesoin(Long id, Besoin besoin) {
		if (besoinRepository.existsById(id)) {
			besoin.setId(id);
			return besoinRepository.save(besoin);
		}
		return null;
	}

	// Supprimer un besoin
	public void deleteBesoin(Long id) {
		besoinRepository.deleteById(id);
	}
}
