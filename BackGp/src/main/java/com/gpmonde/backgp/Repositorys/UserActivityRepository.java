package com.gpmonde.backgp.Repositorys;

import com.gpmonde.backgp.Entities.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
}

