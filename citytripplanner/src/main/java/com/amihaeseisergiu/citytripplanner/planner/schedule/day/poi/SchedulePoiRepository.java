package com.amihaeseisergiu.citytripplanner.planner.schedule.day.poi;

import com.amihaeseisergiu.citytripplanner.planner.schedule.day.ScheduleDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
public interface SchedulePoiRepository extends JpaRepository<SchedulePoi, UUID> {

    Optional<SchedulePoi> findSchedulePoiByScheduleDayAndPoiId(ScheduleDay scheduleDay, String poiId);
}