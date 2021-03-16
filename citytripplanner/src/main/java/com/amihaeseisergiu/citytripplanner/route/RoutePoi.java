package com.amihaeseisergiu.citytripplanner.route;

import lombok.*;
import org.springframework.stereotype.Component;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Component
public class RoutePoi {

    private String id;

    private Integer ord;

    private String visitTimesStart;
    private String visitTimesEnd;

    private Integer timeToNextPoi;
    private Integer waitingTime;
}