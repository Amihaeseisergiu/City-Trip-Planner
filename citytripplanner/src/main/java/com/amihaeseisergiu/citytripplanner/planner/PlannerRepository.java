package com.amihaeseisergiu.citytripplanner.planner;

import com.amihaeseisergiu.citytripplanner.appuser.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
public interface PlannerRepository extends JpaRepository<Planner, UUID> {

    Optional<Planner> findFirstByUser(AppUser user);
}
