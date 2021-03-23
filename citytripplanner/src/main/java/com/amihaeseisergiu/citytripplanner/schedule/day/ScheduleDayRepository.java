package com.amihaeseisergiu.citytripplanner.schedule.day;

import com.amihaeseisergiu.citytripplanner.schedule.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
@Transactional
public interface ScheduleDayRepository extends JpaRepository<ScheduleDay, Long> {

    Optional<ScheduleDay> findScheduleDayByScheduleAndDayId(Schedule schedule, Long dayId);
}
