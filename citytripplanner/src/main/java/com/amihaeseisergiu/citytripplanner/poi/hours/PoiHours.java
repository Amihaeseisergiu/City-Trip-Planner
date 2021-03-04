package com.amihaeseisergiu.citytripplanner.poi.hours;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.persistence.*;
import java.time.LocalTime;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class PoiHours {

    @Id
    @SequenceGenerator(
            name = "hours_sequence",
            sequenceName = "hours_sequence",
            allocationSize = 1
    )
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "hours_sequence"
    )
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Long id;

    private Integer dayNumber;
    private String dayName;

    private LocalTime openingAt;
    private LocalTime closingAt;

    public PoiHours(Integer dayNumber,
                    String dayName,
                    LocalTime openingAt,
                    LocalTime closingAt)
    {
        this.dayNumber = dayNumber;
        this.dayName = dayName;
        this.openingAt = openingAt;
        this.closingAt = closingAt;
    }
}
