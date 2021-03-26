package com.amihaeseisergiu.citytripplanner.planner;

import com.amihaeseisergiu.citytripplanner.appuser.AppUser;
import com.amihaeseisergiu.citytripplanner.appuser.AppUserService;
import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import com.amihaeseisergiu.citytripplanner.itinerary.ItineraryService;
import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import com.amihaeseisergiu.citytripplanner.planner.schedule.Schedule;
import com.amihaeseisergiu.citytripplanner.planner.schedule.ScheduleService;
import com.amihaeseisergiu.citytripplanner.planner.schedule.day.ScheduleDay;
import com.amihaeseisergiu.citytripplanner.utils.MapboxUtils;
import com.amihaeseisergiu.citytripplanner.utils.SolverUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class PlannerService {

    private final MapboxUtils mapboxUtils;
    private final SolverUtils solverUtils;
    private final PlannerRepository plannerRepository;
    private final ItineraryService itineraryService;
    private final ScheduleService scheduleService;
    private final AppUserService appUserService;

    public Itinerary getItineraryRestricted(Schedule schedule)
    {
        List<Route> routes = new ArrayList<>();

        for(ScheduleDay scheduleDay : schedule.getScheduleDays())
        {
            if(scheduleDay.getPois().size() >= 2 && scheduleDay.getPois().size() <= 25)
            {
                int[][] durationsMatrix = mapboxUtils.fetchDurationsMatrix(scheduleDay.getPois());
                Route route = solverUtils.getRoute(scheduleDay, durationsMatrix);

                if(route.getPois() != null)
                    routes.add(route);
            }
        }

        return new Itinerary(routes);
    }

    public void saveRestricted(Schedule schedule, Itinerary itinerary)
    {
        AppUser user = appUserService.getLoggedInUser();
        Optional<Planner> planner = plannerRepository.findFirstByUser(user);

        if(planner.isPresent())
        {
            Planner resultingPlanner = planner.get();

            schedule.setPlanner(resultingPlanner);
            scheduleService.assignDuplicates(schedule);

            resultingPlanner.setSchedule(schedule);

            if(itinerary != null)
            {
                itinerary.setPlanner(resultingPlanner);
                itinerary.setUserName(user.getUserName());
                itineraryService.assignDuplicates(itinerary);

                resultingPlanner.setItinerary(itinerary);
            }

            plannerRepository.save(resultingPlanner);
        }
        else
        {
            Planner plannerToSave = new Planner(schedule, user);
            schedule.setPlanner(plannerToSave);

            if(itinerary != null)
            {
                itinerary.setUserName(user.getUserName());
                plannerToSave.setItinerary(itinerary);
                itinerary.setPlanner(plannerToSave);
            }

            plannerRepository.save(plannerToSave);
        }
    }

    public Planner getUserPlanner()
    {
        AppUser user = appUserService.getLoggedInUser();
        Optional<Planner> planner = plannerRepository.findFirstByUser(user);

        return planner.orElseGet(Planner::new);
    }
}
