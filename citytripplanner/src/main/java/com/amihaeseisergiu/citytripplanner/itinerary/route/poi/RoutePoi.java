package com.amihaeseisergiu.citytripplanner.itinerary.route.poi;

import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

import javax.persistence.*;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class RoutePoi {

    @Id
    @SequenceGenerator(
            name = "route_poi_sequence",
            sequenceName = "route_poi_sequence",
            allocationSize = 1
    )
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "route_poi_sequence"
    )
    @JsonIgnore
    private Long id;

    private String poiId;

    private Integer ord;

    private String visitTimesStart;
    private String visitTimesEnd;

    private Integer timeToNextPoi;
    private Integer waitingTime;

    private String polyLine;

    @ManyToOne
    @JsonIgnore
    private Route route;

    public RoutePoi(String poiId,
                    Integer ord,
                    String visitTimesStart,
                    String visitTimesEnd,
                    Integer timeToNextPoi,
                    Integer waitingTime,
                    String polyLine)
    {
        this.poiId = poiId;
        this.ord = ord;
        this.visitTimesStart = visitTimesStart;
        this.visitTimesEnd = visitTimesEnd;
        this.timeToNextPoi = timeToNextPoi;
        this.waitingTime = waitingTime;
        this.polyLine = polyLine;
    }
}