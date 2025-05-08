package com.gpmonde.backgp.Controllers;

// com.gpmonde.backgp.controllers.NotificationController.java

import com.gpmonde.backgp.Entities.Notification;
import com.gpmonde.backgp.Services.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications")
@RequiredArgsConstructor
public class NotificationController {

	private final NotificationService notificationService;

	@GetMapping("/user/{userId}")
	public List<Notification> getNotificationsByUserId(@PathVariable Long userId) {
		return notificationService.getNotificationsByUserId(userId);
	}
}

