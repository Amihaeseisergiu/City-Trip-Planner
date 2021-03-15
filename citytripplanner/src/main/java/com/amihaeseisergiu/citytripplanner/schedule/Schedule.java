package com.amihaeseisergiu.citytripplanner.schedule;

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
public class Schedule {

    private Long id;

    private String dayName;
    private Integer dayNumber;

    private Date date;
    private String colour;
    private Integer dayStart;
    private Integer dayEnd;

    private List<SchedulePoi> pois;
}
