package com.amihaeseisergiu.citytripplanner.planner.scheduleunrestricted;

import lombok.*;

@Getter
@Setter
@EqualsAndHashCode
@AllArgsConstructor
public class DayDataUnrestricted {

    private int[] dayNumbers;
    private int[] daysStart;
    private int[] daysEnd;
}
