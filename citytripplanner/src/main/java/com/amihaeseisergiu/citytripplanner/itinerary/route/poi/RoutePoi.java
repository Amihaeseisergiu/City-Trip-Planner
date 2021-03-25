package com.amihaeseisergiu.citytripplanner.itinerary.route.poi;

import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.UUID;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class RoutePoi {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    @JsonIgnore
    private UUID id;

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