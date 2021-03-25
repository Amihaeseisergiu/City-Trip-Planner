package com.amihaeseisergiu.citytripplanner.planner.schedule.day.poi;

import com.amihaeseisergiu.citytripplanner.planner.schedule.day.ScheduleDay;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class SchedulePoi {

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

    private Double lat;
    private Double lng;

    @Fetch(FetchMode.SELECT)
    @ElementCollection(fetch = FetchType.EAGER)
    private Set<String> colours;

    private String openingAt;
    private String closingAt;
    private String visitDuration;

    @ManyToOne
    @JsonIgnore
    private ScheduleDay scheduleDay;
}
