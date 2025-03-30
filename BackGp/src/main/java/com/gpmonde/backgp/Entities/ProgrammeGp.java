package com.gpmonde.backgp.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class ProgrammeGp {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String description;
	@Column(name = "depart")
	private String depart;
	@Column(name = "destination")
	private String destination;

	private Double prix;
	private Double garantie;

	@Temporal(TemporalType.DATE)
	private Date dateline;

	@ManyToOne
	@JoinColumn(name = "agent_id", nullable = false)
	private AgentGp agentGp;
}
