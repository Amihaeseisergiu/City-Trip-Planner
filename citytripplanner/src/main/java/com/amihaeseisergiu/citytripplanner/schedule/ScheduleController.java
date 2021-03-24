package com.amihaeseisergiu.citytripplanner.schedule;

import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDay;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/schedule")
@AllArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @PostMapping
    public Itinerary solve(@RequestBody List<ScheduleDay> scheduleDays)
    {
        Itinerary itinerary = scheduleService.getItinerary(scheduleDays);
        scheduleService.save(scheduleDays, itinerary);

        return itinerary;
    }

    @PostMapping("/save")
    public void save(@RequestBody List<ScheduleDay> scheduleDays)
    {
        scheduleService.save(scheduleDays, null);
    }

    @GetMapping
    public Schedule getSchedule()
    {
        return scheduleService.getUserSchedule();
    }
}
