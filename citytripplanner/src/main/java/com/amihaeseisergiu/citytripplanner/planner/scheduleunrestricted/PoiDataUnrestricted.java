package com.amihaeseisergiu.citytripplanner.planner.scheduleunrestricted;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode
@AllArgsConstructor
public class PoiDataUnrestricted {

    private int[][] openingTimes;
    private int[][] closingTimes;
    private int[] visitDurations;
}
