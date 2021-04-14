package com.amihaeseisergiu.citytripplanner.planner.scheduleunrestricted;

import com.amihaeseisergiu.citytripplanner.planner.Planner;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class ScheduleUnrestricted {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Fetch(FetchMode.SELECT)
    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleDayUnrestricted> scheduleDays;

    @Fetch(FetchMode.SELECT)
    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SchedulePoiUnrestricted> schedulePois;

    @Fetch(FetchMode.SELECT)
    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private SchedulePoiUnrestricted accommodationPoi;

    @OneToOne
    @JsonIgnore
    private Planner planner;

    @JsonIgnore
    public String getCoordinatesList()
    {
        SchedulePoiUnrestricted firstPoi = schedulePois.get(0);
        StringBuilder coordinatesList = new StringBuilder(firstPoi.getCoordsString());

        for(int i = 1; i < schedulePois.size(); i++)
        {
            SchedulePoiUnrestricted poi = schedulePois.get(i);
            coordinatesList.append(";").append(poi.getCoordsString());
        }

        if(accommodationPoi != null)
        {
            coordinatesList.append(";").append(accommodationPoi.getCoordsString());
        }

        return coordinatesList.toString();
    }

    @JsonIgnore
    public DayDataUnrestricted getDayData()
    {
        int[] dayNumbers = new int[scheduleDays.size()];
        int[] daysStart = new int[scheduleDays.size()];
        int[] daysEnd = new int[scheduleDays.size()];
        int i = 0;

        for(ScheduleDayUnrestricted day : scheduleDays)
        {
            dayNumbers[i] = day.getDayNumber() - 1;
            daysStart[i] = day.getDayStart();
            daysEnd[i] = day.getDayEnd();
            i++;
        }

        return new DayDataUnrestricted(dayNumbers, daysStart, daysEnd);
    }

    @JsonIgnore
    public PoiDataUnrestricted getPoiData()
    {
        int[][] openingTimes = new int[schedulePois.size()][7];
        int[][] closingTimes = new int[schedulePois.size()][7];
        int[] visitDurations = new int[schedulePois.size()];
        int i = 0;

        for(SchedulePoiUnrestricted poi : schedulePois)
        {
            for(int j = 0; j < 7; j++)
            {
                int finalJ = j;
                SchedulePoiHoursUnrestricted hours = poi.getHours().stream().filter(h -> h.getDayNumber() == finalJ)
                        .findFirst().orElse(null);

                if(hours != null)
                {
                    String[] splitOpening = hours.getOpeningAt().split(":");
                    String[] splitClosed = hours.getClosingAt().split(":");
                    int openingTime = Integer.parseInt(splitOpening[0]) * 60 + Integer.parseInt(splitOpening[1]);
                    int closingTime = Integer.parseInt(splitClosed[0]) * 60 + Integer.parseInt(splitClosed[1]);

                    if(openingTime >= closingTime)
                    {
                        closingTime = 23 * 60 + 59;
                    }

                    openingTimes[i][j] = openingTime;
                    closingTimes[i][j] = closingTime;
                }
            }

            String[] split = poi.getVisitDuration().split(":");
            int visitDuration = Integer.parseInt(split[0]) * 60 + Integer.parseInt(split[1]);

            visitDurations[i] = visitDuration;
            i++;
        }

        return new PoiDataUnrestricted(openingTimes, closingTimes, visitDurations);
    }

    @JsonIgnore
    public int getIndexOfAccommodation()
    {
        if(accommodationPoi != null)
        {
            return schedulePois.size();
        }

        return -1;
    }
}
