package com.amihaeseisergiu.citytripplanner.schedule;

import com.amihaeseisergiu.citytripplanner.route.Route;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/schedule")
@AllArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @PostMapping
    public List<Route> solve(@RequestBody List<ScheduleDay> scheduleDays)
    {
        scheduleService.save(scheduleDays);
        return scheduleService.getResolvedSchedule(scheduleDays);
    }

    @PostMapping("/save")
    public void save(@RequestBody List<ScheduleDay> scheduleDays)
    {
        scheduleService.save(scheduleDays);
    }

}
