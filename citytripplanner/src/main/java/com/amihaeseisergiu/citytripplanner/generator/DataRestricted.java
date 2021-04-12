package com.amihaeseisergiu.citytripplanner.generator;

import com.amihaeseisergiu.citytripplanner.itinerary.Route;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode
@AllArgsConstructor
public class DataRestricted {

    private Route route;
    private String constraints;
}
