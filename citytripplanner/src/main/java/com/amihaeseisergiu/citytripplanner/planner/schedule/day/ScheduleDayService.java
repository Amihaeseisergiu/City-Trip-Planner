package com.amihaeseisergiu.citytripplanner.planner.schedule.day;

import com.amihaeseisergiu.citytripplanner.planner.schedule.Schedule;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class ScheduleDayService {

    private final ScheduleDayRepository scheduleDayRepository;

    public Optional<ScheduleDay> getByScheduleAndDayId(Schedule schedule, Long dayId)
    {
        return scheduleDayRepository.findScheduleDayByScheduleAndDayId(schedule, dayId);
    }
}
