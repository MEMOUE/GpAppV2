package com.gpmonde.backgp.Entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
public class UserActivity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String ip;
	private String page;
	private LocalDateTime timestamp;
	private String country;
	private String city;
}