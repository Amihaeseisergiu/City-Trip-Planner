package com.amihaeseisergiu.citytripplanner.schedule;

import com.amihaeseisergiu.citytripplanner.route.Route;
import com.amihaeseisergiu.citytripplanner.utils.DurationsMatrix;
import com.amihaeseisergiu.citytripplanner.utils.MapboxUtils;
import com.amihaeseisergiu.citytripplanner.utils.SolverUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class ScheduleService {

    private final MapboxUtils mapboxUtils;
    private final SolverUtils solverUtils;

    public List<Route> getResolvedSchedule(List<Schedule> scheduleList)
    {
        List<Route> routes = new ArrayList<>();

        for(Schedule schedule : scheduleList)
        {
            if(schedule.getPois().size() >= 2 && schedule.getPois().size() <= 25)
            {
                DurationsMatrix durationsMatrix = mapboxUtils.fetchDurationsMatrix(schedule.getPois());
                routes.add(solverUtils.getRoute(schedule, durationsMatrix));
            }
        }

        return routes;
    }
}
