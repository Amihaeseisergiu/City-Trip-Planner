package com.amihaeseisergiu.citytripplanner.planner;

import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import com.amihaeseisergiu.citytripplanner.planner.schedule.Schedule;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(path = "/planner")
@AllArgsConstructor
public class PlannerController {

    private final PlannerService plannerService;

    @PostMapping("/solve/restricted/{id}")
    public Itinerary solveRestricted(@PathVariable UUID id, @RequestBody Schedule schedule)
    {
        Itinerary itinerary = plannerService.getItineraryRestricted(schedule);
        plannerService.saveRestricted(id, schedule, itinerary);

        return itinerary;
    }

    @PostMapping("/save/restricted/{id}")
    public void saveRestricted(@PathVariable UUID id, @RequestBody Schedule schedule)
    {
        plannerService.saveRestricted(id, schedule, null);
    }

    @PostMapping("/create")
    public Planner create(@RequestBody Planner planner)
    {
        if(planner.getType().equals("restricted") || planner.getType().equals("unrestricted"))
        {
            return plannerService.createPlanner(planner);
        }

        return null;
    }

    @PostMapping("/delete")
    public Planner delete(@RequestBody Planner planner)
    {
        return plannerService.deletePlanner(planner);
    }

    @GetMapping
    public List<Planner> getUserPlanners()
    {
        return plannerService.getUserPlanners();
    }

    @GetMapping("/{id}")
    public Planner getUserPlanner(@PathVariable UUID id)
    {
        return plannerService.getUserPlanner(id);
    }
}