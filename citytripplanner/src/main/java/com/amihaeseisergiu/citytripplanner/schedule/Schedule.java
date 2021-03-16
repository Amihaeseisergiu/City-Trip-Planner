package com.amihaeseisergiu.citytripplanner.schedule;

import lombok.*;
import org.springframework.stereotype.Component;

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

    private String date;
    private String colour;
    private Integer dayStart;
    private Integer dayEnd;

    private List<SchedulePoi> pois;

    public int[] getOpeningTimes()
    {
        int[] openingTimes = new int[pois.size()];
        int i = 0;

        for(SchedulePoi poi : pois)
        {
            String[] split = poi.getOpeningAt().split(":");
            int openingTime = Integer.parseInt(split[0]) * 60 + Integer.parseInt(split[1]);

            openingTimes[i] = openingTime;
            i++;
        }

        return openingTimes;
    }

    public int[] getClosingTimes()
    {
        int[] closingTimes = new int[pois.size()];
        int i = 0;

        for(SchedulePoi poi : pois)
        {
            String[] splitOpening = poi.getOpeningAt().split(":");
            String[] splitClosed = poi.getClosingAt().split(":");
            int openingTime = Integer.parseInt(splitOpening[0]) * 60 + Integer.parseInt(splitOpening[1]);
            int closingTime = Integer.parseInt(splitClosed[0]) * 60 + Integer.parseInt(splitClosed[1]);

            if(openingTime >= closingTime)
            {
                closingTime = 23 * 60 + 59;
            }

            closingTimes[i] = closingTime;
            i++;
        }

        return closingTimes;
    }

    public int[] getVisitDurations()
    {
        int[] visitDurations = new int[pois.size()];
        int i = 0;

        for(SchedulePoi poi : pois)
        {
            String[] split = poi.getVisitDuration().split(":");
            int visitDuration = Integer.parseInt(split[0]) * 60 + Integer.parseInt(split[1]);

            visitDurations[i] = visitDuration;
            i++;
        }

        return visitDurations;
    }
}
