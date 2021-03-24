package com.amihaeseisergiu.citytripplanner.itinerary.route;

import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;

    public Optional<Route> getByItineraryAndDayId(Itinerary itinerary, Long dayId)
    {
        return routeRepository.findRouteByItineraryAndDayId(itinerary, dayId);
    }
}
