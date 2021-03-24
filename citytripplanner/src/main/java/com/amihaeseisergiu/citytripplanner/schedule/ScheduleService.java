package com.amihaeseisergiu.citytripplanner.schedule;

import com.amihaeseisergiu.citytripplanner.appuser.AppUser;
import com.amihaeseisergiu.citytripplanner.appuser.AppUserService;
import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import com.amihaeseisergiu.citytripplanner.itinerary.ItineraryService;
import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDay;
import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDayService;
import com.amihaeseisergiu.citytripplanner.schedule.day.poi.SchedulePoi;
import com.amihaeseisergiu.citytripplanner.schedule.day.poi.SchedulePoiService;
import com.amihaeseisergiu.citytripplanner.utils.MapboxUtils;
import com.amihaeseisergiu.citytripplanner.utils.SolverUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class ScheduleService {

    private final MapboxUtils mapboxUtils;
    private final SolverUtils solverUtils;
    private final ScheduleRepository scheduleRepository;
    private final ScheduleDayService scheduleDayService;
    private final SchedulePoiService schedulePoiService;
    private final ItineraryService itineraryService;
    private final AppUserService appUserService;

    public Itinerary getItinerary(List<ScheduleDay> scheduleDayList)
    {
        List<Route> routes = new ArrayList<>();

        for(ScheduleDay scheduleDay : scheduleDayList)
        {
            if(scheduleDay.getPois().size() >= 2 && scheduleDay.getPois().size() <= 25)
            {
                int[][] durationsMatrix = mapboxUtils.fetchDurationsMatrix(scheduleDay.getPois());
                routes.add(solverUtils.getRoute(scheduleDay, durationsMatrix));
            }
        }

        return new Itinerary(routes);
    }

    public void save(List<ScheduleDay> scheduleDaysList, Itinerary itinerary)
    {
        AppUser user = appUserService.getLoggedInUser();
        Optional<Schedule> schedule = scheduleRepository.findFirstByUser(user);

        if(schedule.isPresent())
        {
            Schedule resultingSchedule = schedule.get();

            for(ScheduleDay day : scheduleDaysList)
            {
                Optional<ScheduleDay> scheduleDay =
                        scheduleDayService.getByScheduleAndDayId(resultingSchedule, day.getDayId());

                if(scheduleDay.isPresent())
                {
                    ScheduleDay resultingScheduleDay = scheduleDay.get();
                    day.setId(resultingScheduleDay.getId());
                    day.setSchedule(resultingSchedule);

                    for(SchedulePoi poi : day.getPois())
                    {
                        Optional<SchedulePoi> schedulePoi =
                                schedulePoiService.getByScheduleDayAndPoiId(resultingScheduleDay, poi.getPoiId());

                        if(schedulePoi.isPresent())
                        {
                            SchedulePoi resultingSchedulePoi = schedulePoi.get();
                            poi.setId(resultingSchedulePoi.getId());
                            poi.setScheduleDay(resultingScheduleDay);
                        }
                    }
                }
            }

            resultingSchedule.setScheduleDays(scheduleDaysList);

            if(itinerary != null)
            {
                itinerary.setSchedule(resultingSchedule);
                itineraryService.assignDuplicates(itinerary);

                resultingSchedule.setItinerary(itinerary);
            }

            scheduleRepository.save(resultingSchedule);
        }
        else
        {
            Schedule scheduleToSave = new Schedule(scheduleDaysList, user);

            if(itinerary != null)
            {
                scheduleToSave.setItinerary(itinerary);
                itinerary.setSchedule(scheduleToSave);
            }

            scheduleRepository.save(scheduleToSave);
        }
    }

    public Schedule getUserSchedule()
    {
        AppUser user = appUserService.getLoggedInUser();
        Optional<Schedule> schedule = scheduleRepository.findFirstByUser(user);

        return schedule.orElseGet(Schedule::new);
    }
}
