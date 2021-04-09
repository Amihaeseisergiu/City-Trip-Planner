package com.amihaeseisergiu.citytripplanner.planner.schedule;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;

    public void assignDuplicates(Schedule schedule)
    {
        Optional<Schedule> foundSchedule = scheduleRepository.findScheduleByPlanner(schedule.getPlanner());

        if(foundSchedule.isPresent())
        {
            Schedule resultingSchedule = foundSchedule.get();

            schedule.setId(resultingSchedule.getId());
        }
    }
}
