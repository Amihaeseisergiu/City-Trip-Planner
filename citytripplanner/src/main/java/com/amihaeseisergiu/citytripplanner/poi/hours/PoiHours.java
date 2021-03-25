package com.amihaeseisergiu.citytripplanner.poi.hours;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class PoiHours {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    @JsonIgnore
    private UUID id;

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
