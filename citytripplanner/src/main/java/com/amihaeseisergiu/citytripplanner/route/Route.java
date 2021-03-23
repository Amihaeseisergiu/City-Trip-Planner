package com.amihaeseisergiu.citytripplanner.route;

import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDay;
import lombok.*;
import org.springframework.stereotype.Component;

import java.util.List;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Component
public class Route {

    private Long id;

    private String dayName;
    private Integer dayNumber;

    private String date;
    private String colour;
    private Integer dayStart;
    private Integer dayEnd;

    private List<RoutePoi> pois;

    private String accommodation;

    public Route(ScheduleDay scheduleDay)
    {
        this.id = scheduleDay.getId();
        this.dayName = scheduleDay.getDayName();
        this.dayNumber = scheduleDay.getDayNumber();
        this.date = scheduleDay.getDate();
        this.colour = scheduleDay.getColour();
        this.dayStart = scheduleDay.getDayStart();
        this.dayEnd = scheduleDay.getDayEnd();
    }
}