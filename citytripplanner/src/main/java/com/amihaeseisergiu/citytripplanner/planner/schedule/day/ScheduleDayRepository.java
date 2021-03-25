package com.amihaeseisergiu.citytripplanner.planner.schedule.day;

import com.amihaeseisergiu.citytripplanner.planner.schedule.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
public interface ScheduleDayRepository extends JpaRepository<ScheduleDay, UUID> {

    Optional<ScheduleDay> findScheduleDayByScheduleAndDayId(Schedule schedule, Long dayId);
}
