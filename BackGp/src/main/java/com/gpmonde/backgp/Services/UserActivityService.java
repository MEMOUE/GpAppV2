package com.gpmonde.backgp.Services;

import com.gpmonde.backgp.Entities.UserActivity;
import com.gpmonde.backgp.Repositorys.UserActivityRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserActivityService {
	private final UserActivityRepository repository;

	public UserActivityService(UserActivityRepository repository) {
		this.repository = repository;
	}

	public void saveActivity(UserActivity activity) {
		repository.save(activity);
	}

	public List<UserActivity> getAllActivities() {
		return repository.findAll();
	}
}

