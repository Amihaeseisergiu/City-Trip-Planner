package com.amihaeseisergiu.citytripplanner.schedule.day.poi;

import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
@Transactional
public interface SchedulePoiRepository extends JpaRepository<SchedulePoi, Long> {

    Optional<SchedulePoi> findSchedulePoiByScheduleDayAndPoiId(ScheduleDay scheduleDay, String poiId);
}