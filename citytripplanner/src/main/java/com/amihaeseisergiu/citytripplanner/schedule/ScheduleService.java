package com.amihaeseisergiu.citytripplanner.schedule;

import com.amihaeseisergiu.citytripplanner.appuser.AppUser;
import com.amihaeseisergiu.citytripplanner.appuser.AppUserService;
import com.amihaeseisergiu.citytripplanner.route.Route;
import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDay;
import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDayService;
import com.amihaeseisergiu.citytripplanner.schedule.poi.SchedulePoi;
import com.amihaeseisergiu.citytripplanner.schedule.poi.SchedulePoiService;
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
    private final AppUserService appUserService;

    public List<Route> getResolvedSchedule(List<ScheduleDay> scheduleDayList)
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

        return routes;
    }

    public void save(List<ScheduleDay> scheduleDaysList)
    {
        AppUser user = appUserService.getLoggedInUser();
        Optional<Schedule> schedule = scheduleRepository.findFirstByUser(user);

        if(schedule.isPresent())
        {
            Schedule resultingSchedule = schedule.get();

            for(ScheduleDay day : scheduleDaysList)
            {
                Optional<ScheduleDay> scheduleDay = scheduleDayService.getByScheduleAndDayId(resultingSchedule, day.getDayId());

                if(scheduleDay.isPresent())
                {
                    ScheduleDay resultingScheduleDay = scheduleDay.get();
                    day.setId(resultingScheduleDay.getId());
                    day.setSchedule(resultingSchedule);

                    for(SchedulePoi poi : day.getPois())
                    {
                        Optional<SchedulePoi> schedulePoi = schedulePoiService.getByScheduleDayAndPoiId(resultingScheduleDay, poi.getPoiId());

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
            scheduleRepository.save(resultingSchedule);
        }
        else
        {
            Schedule savedSchedule = new Schedule(scheduleDaysList, user);
            scheduleRepository.save(savedSchedule);
        }
    }

    public Schedule getUserSchedule()
    {
        AppUser user = appUserService.getLoggedInUser();
        Optional<Schedule> schedule = scheduleRepository.findFirstByUser(user);

        return schedule.orElseGet(Schedule::new);
    }
}
