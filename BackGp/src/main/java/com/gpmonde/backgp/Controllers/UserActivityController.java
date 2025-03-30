package com.gpmonde.backgp.Controllers;

import com.gpmonde.backgp.Entities.UserActivity;
import com.gpmonde.backgp.Services.UserActivityService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tracking")
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

