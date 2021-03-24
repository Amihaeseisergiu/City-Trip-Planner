package com.amihaeseisergiu.citytripplanner.schedule.day.poi;

import com.amihaeseisergiu.citytripplanner.schedule.day.ScheduleDay;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

import javax.persistence.*;
import java.util.Set;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class SchedulePoi {

    @Id
    @SequenceGenerator(
            name = "schedule_poi_sequence",
            sequenceName = "schedule_poi_sequence",
            allocationSize = 1
    )
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "schedule_poi_sequence"
    )
    @JsonIgnore
    private Long id;

    private String poiId;

    private Double lat;
    private Double lng;

    @ElementCollection(fetch = FetchType.EAGER)
    private Set<String> colours;

    private String openingAt;
    private String closingAt;
    private String visitDuration;

    @ManyToOne
    @JsonIgnore
    private ScheduleDay scheduleDay;
}
