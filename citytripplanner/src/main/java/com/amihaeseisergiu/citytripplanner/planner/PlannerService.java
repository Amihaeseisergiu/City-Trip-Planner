package com.amihaeseisergiu.citytripplanner.planner;

import com.amihaeseisergiu.citytripplanner.appuser.AppUser;
import com.amihaeseisergiu.citytripplanner.appuser.AppUserService;
import com.amihaeseisergiu.citytripplanner.generator.DataRestricted;
import com.amihaeseisergiu.citytripplanner.generator.DataUnrestricted;
import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import com.amihaeseisergiu.citytripplanner.itinerary.Route;
import com.amihaeseisergiu.citytripplanner.planner.schedule.Schedule;
import com.amihaeseisergiu.citytripplanner.planner.schedule.ScheduleDay;
import com.amihaeseisergiu.citytripplanner.planner.scheduleunrestricted.ScheduleUnrestricted;
import com.amihaeseisergiu.citytripplanner.utils.MapboxUtils;
import com.amihaeseisergiu.citytripplanner.generator.RouteGenerator;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class PlannerService {

    private final MapboxUtils mapboxUtils;
    private final RouteGenerator routeGenerator;
    private final PlannerRepository plannerRepository;
    private final AppUserService appUserService;

    public Itinerary getItineraryRestricted(Schedule schedule)
    {
        List<Route> routes = new ArrayList<>();
        StringBuilder constraints = new StringBuilder();

        for(ScheduleDay scheduleDay : schedule.getScheduleDays())
        {
            if(scheduleDay.getPois().size() >= 2 && scheduleDay.getPois().size() <= 25)
            {
                int[][] durationsMatrix = mapboxUtils.fetchDurationsMatrix(scheduleDay.getCoordinatesList());
                DataRestricted dataRestricted = routeGenerator.getRouteRestricted(scheduleDay, durationsMatrix);

                if(dataRestricted.getRoute().getPois() != null)
                {
                    routes.add(dataRestricted.getRoute());
                    constraints.append(dataRestricted.getConstraints());
                }
            }
        }

        return new Itinerary(routes, constraints.toString());
    }

    public Itinerary getItineraryUnrestricted(ScheduleUnrestricted schedule)
    {
        List<Route> routes = new ArrayList<>();
        String constraints = null;

        if(schedule.getScheduleDays().size() > 0 && schedule.getSchedulePois().size() >= 2 && schedule.getSchedulePois().size() <= 25)
        {
            int[][] durationsMatrix = mapboxUtils.fetchDurationsMatrix(schedule.getCoordinatesList());
            DataUnrestricted dataUnrestricted = routeGenerator.getRoutesUnrestricted(schedule, durationsMatrix);

            routes = dataUnrestricted.getRoutes();
            constraints = dataUnrestricted.getConstraints();
        }

        return new Itinerary(routes, constraints);
    }

    public void saveRestricted(UUID plannerId, Schedule schedule, Itinerary itinerary)
    {
        AppUser user = appUserService.getLoggedInUser();
        Optional<Planner> planner = plannerRepository.findById(plannerId);

        if(planner.isPresent())
        {
            Planner resultingPlanner = planner.get();

            if(resultingPlanner.getUser().equals(user))
            {
                schedule.setPlanner(resultingPlanner);

                resultingPlanner.setSchedule(schedule);

                if(itinerary != null)
                {
                    itinerary.setPlanner(resultingPlanner);
                    itinerary.setUserName(user.getUserName());

                    resultingPlanner.setItinerary(itinerary);
                }

                Planner savedPlanner = plannerRepository.saveAndFlush(resultingPlanner);

                if(itinerary != null)
                {
                    itinerary.setId(savedPlanner.getItinerary().getId());
                }
            }
        }
        else
        {
            Planner plannerToSave = new Planner(schedule, user);
            schedule.setPlanner(plannerToSave);

            if(itinerary != null)
            {
                itinerary.setUserName(user.getUserName());
                plannerToSave.setItinerary(itinerary);
                plannerToSave.setName("API Generated");
                plannerToSave.setType("restricted");
                itinerary.setPlanner(plannerToSave);
            }

            Planner savedPlanner = plannerRepository.saveAndFlush(plannerToSave);

            if(itinerary != null)
            {
                itinerary.setId(savedPlanner.getItinerary().getId());
            }
        }
    }

    public void saveUnrestricted(UUID plannerId, ScheduleUnrestricted schedule, Itinerary itinerary)
    {
        AppUser user = appUserService.getLoggedInUser();
        Optional<Planner> planner = plannerRepository.findById(plannerId);

        if(planner.isPresent())
        {
            Planner resultingPlanner = planner.get();

            if(resultingPlanner.getUser().equals(user))
            {
                schedule.setPlanner(resultingPlanner);

                resultingPlanner.setScheduleUnrestricted(schedule);

                if(itinerary != null)
                {
                    itinerary.setPlanner(resultingPlanner);
                    itinerary.setUserName(user.getUserName());

                    resultingPlanner.setItinerary(itinerary);
                }

                Planner savedPlanner = plannerRepository.saveAndFlush(resultingPlanner);

                if(itinerary != null)
                {
                    itinerary.setId(savedPlanner.getItinerary().getId());
                }
            }
        }
        else
        {
            Planner plannerToSave = new Planner(schedule, user);
            schedule.setPlanner(plannerToSave);

            if(itinerary != null)
            {
                itinerary.setUserName(user.getUserName());
                plannerToSave.setItinerary(itinerary);
                plannerToSave.setName("API Generated");
                plannerToSave.setType("unrestricted");
                itinerary.setPlanner(plannerToSave);
            }

            Planner savedPlanner = plannerRepository.saveAndFlush(plannerToSave);

            if(itinerary != null)
            {
                itinerary.setId(savedPlanner.getItinerary().getId());
            }
        }
    }

    public Planner createPlanner(Planner planner)
    {
        AppUser user = appUserService.getLoggedInUser();
        planner.setUser(user);

        return plannerRepository.saveAndFlush(planner);
    }

    public Planner deletePlanner(Planner planner)
    {
        AppUser user = appUserService.getLoggedInUser();
        Optional<Planner> foundPlanner = plannerRepository.findByIdAndUser(planner.getId(), user);

        if(foundPlanner.isPresent())
        {
            plannerRepository.delete(foundPlanner.get());
            return planner;
        }

        return null;
    }

    public List<Planner> getUserPlanners()
    {
        AppUser user = appUserService.getLoggedInUser();
        return plannerRepository.findByUser(user);
    }

    public Planner getUserPlanner(UUID plannerId)
    {
        AppUser user = appUserService.getLoggedInUser();
        Optional<Planner> planner = plannerRepository.findById(plannerId);

        if(planner.isPresent())
        {
            Planner resultingPlanner = planner.get();

            if(resultingPlanner.getUser().equals(user))
            {
                return resultingPlanner;
            }
        }
        return null;
    }
}
