package com.amihaeseisergiu.citytripplanner.route;

import com.amihaeseisergiu.citytripplanner.schedule.Schedule;
import lombok.*;
import org.springframework.stereotype.Component;

import java.util.Date;
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

    public Route(Schedule schedule)
    {
        this.id = schedule.getId();
        this.dayName = schedule.getDayName();
        this.dayNumber = schedule.getDayNumber();
        this.date = schedule.getDate();
        this.colour = schedule.getColour();
        this.dayStart = schedule.getDayStart();
        this.dayEnd = schedule.getDayEnd();
    }
}