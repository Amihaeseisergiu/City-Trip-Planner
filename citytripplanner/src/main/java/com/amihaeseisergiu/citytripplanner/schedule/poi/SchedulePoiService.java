package com.amihaeseisergiu.citytripplanner.schedule.poi;

import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDay;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class SchedulePoiService {

    private final SchedulePoiRepository schedulePoiRepository;

    public Optional<SchedulePoi> getByScheduleDayAndPoiId(ScheduleDay scheduleDay, String poiId)
    {
        return schedulePoiRepository.findSchedulePoiByScheduleDayAndPoiId(scheduleDay, poiId);
    }
}
