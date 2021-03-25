package com.amihaeseisergiu.citytripplanner.planner.schedule;

import com.amihaeseisergiu.citytripplanner.planner.Planner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
public interface ScheduleRepository extends JpaRepository<Schedule, UUID> {

    Optional<Schedule> findScheduleByPlanner(Planner planner);
}