package com.amihaeseisergiu.citytripplanner.itinerary.route;

import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import com.amihaeseisergiu.citytripplanner.itinerary.route.poi.RoutePoi;
import com.amihaeseisergiu.citytripplanner.planner.schedule.day.ScheduleDay;
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
public class Route {

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