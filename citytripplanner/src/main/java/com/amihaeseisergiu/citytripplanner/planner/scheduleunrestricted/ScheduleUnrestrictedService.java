package com.amihaeseisergiu.citytripplanner.planner.scheduleunrestricted;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class ScheduleUnrestrictedService {

    private final ScheduleUnrestrictedRepository scheduleRepository;

    public void assignDuplicates(ScheduleUnrestricted schedule)
    {
        Optional<ScheduleUnrestricted> foundSchedule = scheduleRepository.findScheduleUnrestrictedByPlanner(schedule.getPlanner());

        if(foundSchedule.isPresent())
        {
            ScheduleUnrestricted resultingSchedule = foundSchedule.get();

            schedule.setId(resultingSchedule.getId());
        }
    }
}
