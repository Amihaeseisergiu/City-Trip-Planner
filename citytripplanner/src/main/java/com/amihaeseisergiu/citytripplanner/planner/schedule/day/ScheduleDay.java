package com.amihaeseisergiu.citytripplanner.planner.schedule.day;

import com.amihaeseisergiu.citytripplanner.planner.schedule.Schedule;
import com.amihaeseisergiu.citytripplanner.planner.schedule.day.poi.SchedulePoi;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class ScheduleDay {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    @JsonIgnore
    private UUID id;

    private Long dayId;

    private String dayName;
    private Integer dayNumber;

    private String date;
    private String colour;
    private Integer dayStart;
    private Integer dayEnd;

    private String accommodation;

    @Fetch(FetchMode.SELECT)
    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "schedule_day_id")
    private List<SchedulePoi> pois;

    @ManyToOne
    @JsonIgnore
    private Schedule schedule;

    @JsonIgnore
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

    @JsonIgnore
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

    @JsonIgnore
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

    @JsonIgnore
    public int getIndexOfAccommodation()
    {
        if(accommodation != null)
        {
            for(SchedulePoi poi : pois)
            {
                if(poi.getPoiId().equals(accommodation))
                {
                    return pois.indexOf(poi);
                }
            }
        }

        return -1;
    }
}
