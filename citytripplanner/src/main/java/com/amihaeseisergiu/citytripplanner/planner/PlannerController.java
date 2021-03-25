package com.amihaeseisergiu.citytripplanner.planner;

import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import com.amihaeseisergiu.citytripplanner.planner.schedule.Schedule;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/planner")
@AllArgsConstructor
public class PlannerController {

    private final PlannerService plannerService;

    @PostMapping("/solve/restricted")
    public Itinerary solveRestricted(@RequestBody Schedule schedule)
    {
        Itinerary itinerary = plannerService.getItineraryRestricted(schedule);
        plannerService.saveRestricted(schedule, itinerary);

        return itinerary;
    }

    @PostMapping("/save/restricted")
    public void saveRestricted(@RequestBody Schedule schedule)
    {
        plannerService.saveRestricted(schedule, null);
    }

    @GetMapping("/restricted")
    public Planner getPlannerRestricted()
    {
        return plannerService.getUserPlanner();
    }
}