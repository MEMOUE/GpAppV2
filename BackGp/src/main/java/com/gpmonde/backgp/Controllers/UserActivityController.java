package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.UserActivity;
import com.gpmonde.backgp.Services.UserActivityService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tracking")
@Tag(name = "Activités Utilisateur")
@CrossOrigin("*")
public class UserActivityController {
	private final UserActivityService service;

	public UserActivityController(UserActivityService service) {
		this.service = service;
	}

	@PostMapping
	public void trackUser(@RequestBody UserActivity activity) {
		service.saveActivity(activity);
	}

	@GetMapping
	public List<UserActivity> getAllActivities() {
		return service.getAllActivities();
	}
}

