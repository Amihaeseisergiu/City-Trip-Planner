package com.amihaeseisergiu.citytripplanner.itinerary.route;

import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import com.amihaeseisergiu.citytripplanner.itinerary.route.poi.RoutePoi;
import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDay;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import javax.persistence.*;
import java.util.List;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Route {

    @Id
    @SequenceGenerator(
            name = "route_sequence",
            sequenceName = "route_sequence",
            allocationSize = 1
    )
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "route_sequence"
    )
    @JsonIgnore
    private Long id;

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
    @JoinColumn(name = "route_id")
    private List<RoutePoi> pois;

    @ManyToOne
    @JsonIgnore
    private Itinerary itinerary;

    public Route(ScheduleDay scheduleDay)
    {
        this.dayId = scheduleDay.getDayId();
        this.dayName = scheduleDay.getDayName();
        this.dayNumber = scheduleDay.getDayNumber();
        this.date = scheduleDay.getDate();
        this.colour = scheduleDay.getColour();
        this.dayStart = scheduleDay.getDayStart();
        this.dayEnd = scheduleDay.getDayEnd();
    }
}