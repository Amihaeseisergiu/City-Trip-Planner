package com.amihaeseisergiu.citytripplanner.generator;

import com.amihaeseisergiu.citytripplanner.itinerary.Route;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@EqualsAndHashCode
@AllArgsConstructor
public class DataUnrestricted {

    private List<Route> routes;
    private String constraints;
}
