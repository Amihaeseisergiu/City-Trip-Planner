package com.amihaeseisergiu.citytripplanner.planner.schedule;

import com.amihaeseisergiu.citytripplanner.planner.schedule.day.ScheduleDay;
import com.amihaeseisergiu.citytripplanner.planner.schedule.day.ScheduleDayService;
import com.amihaeseisergiu.citytripplanner.planner.schedule.day.poi.SchedulePoi;
import com.amihaeseisergiu.citytripplanner.planner.schedule.day.poi.SchedulePoiService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleDayService scheduleDayService;
    private final SchedulePoiService schedulePoiService;

    public void assignDuplicates(Schedule schedule)
    {
        Optional<Schedule> foundSchedule = scheduleRepository.findScheduleByPlanner(schedule.getPlanner());

        if(foundSchedule.isPresent())
        {
            Schedule resultingSchedule = foundSchedule.get();

            for(ScheduleDay scheduleDay : schedule.getScheduleDays())
            {
                Optional<ScheduleDay> foundScheduleDay =
                        scheduleDayService.getByScheduleAndDayId(resultingSchedule, scheduleDay.getDayId());

                if(foundScheduleDay.isPresent())
                {
                    ScheduleDay resultingFoundScheduleDay = foundScheduleDay.get();

                    scheduleDay.setId(resultingFoundScheduleDay.getId());
                    scheduleDay.setSchedule(resultingSchedule);

                    for(SchedulePoi poi : scheduleDay.getPois())
                    {
                        Optional<SchedulePoi> foundPoi =
                                schedulePoiService.getByScheduleDayAndPoiId(resultingFoundScheduleDay, poi.getPoiId());

                        if(foundPoi.isPresent())
                        {
                            SchedulePoi resultingFoundPoi = foundPoi.get();

                            poi.setId(resultingFoundPoi.getId());
                            poi.setScheduleDay(resultingFoundScheduleDay);
                        }
                    }
                }
            }

            schedule.setId(resultingSchedule.getId());
        }
    }
}
