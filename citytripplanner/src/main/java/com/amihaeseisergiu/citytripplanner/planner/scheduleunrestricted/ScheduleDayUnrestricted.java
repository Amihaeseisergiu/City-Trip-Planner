package com.amihaeseisergiu.citytripplanner.planner.scheduleunrestricted;

import com.amihaeseisergiu.citytripplanner.planner.scheduleunrestricted.ScheduleUnrestricted;
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
public class ScheduleDayUnrestricted {

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
}
