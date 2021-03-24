package com.amihaeseisergiu.citytripplanner.itinerary.route.poi;

import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class RoutePoiService {

    private final RoutePoiRepository routePoiRepository;

    public Optional<RoutePoi> getByRouteAndPoiId(Route route, String poiId)
    {
        return routePoiRepository.findByRouteAndPoiId(route, poiId);
    }
}
