package com.amihaeseisergiu.citytripplanner.schedule;

import lombok.*;
import org.springframework.stereotype.Component;

import java.util.Date;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Component
public class SchedulePoi {

    private String id;

    private Double lat;
    private Double lng;

    private String openingAt;
    private String closingAt;
    private String visitDuration;
}
