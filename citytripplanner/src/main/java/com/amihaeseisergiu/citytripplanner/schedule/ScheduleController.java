package com.amihaeseisergiu.citytripplanner.schedule;

import com.amihaeseisergiu.citytripplanner.utils.SolverUtils;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(path = "/schedule")
@AllArgsConstructor
public class ScheduleController {

    private final SolverUtils solverUtils;

    @PostMapping
    List<Schedule> solve(@RequestBody List<Schedule> schedules)
    {
        //solverUtils.solve();
        return schedules;
    }
}
