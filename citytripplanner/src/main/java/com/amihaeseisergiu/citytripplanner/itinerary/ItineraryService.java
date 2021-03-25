package com.amihaeseisergiu.citytripplanner.itinerary;

import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import com.amihaeseisergiu.citytripplanner.itinerary.route.RouteService;
import com.amihaeseisergiu.citytripplanner.itinerary.route.poi.RoutePoi;
import com.amihaeseisergiu.citytripplanner.itinerary.route.poi.RoutePoiService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;
    private final RouteService routeService;
    private final RoutePoiService routePoiService;

    public void assignDuplicates(Itinerary itinerary)
    {
        Optional<Itinerary> foundItinerary = itineraryRepository.findItineraryByPlanner(itinerary.getPlanner());

        if(foundItinerary.isPresent())
        {
            Itinerary resultingItinerary = foundItinerary.get();

            for(Route route : itinerary.getRoutes())
            {
                Optional<Route> foundRoute =
                        routeService.getByItineraryAndDayId(resultingItinerary, route.getDayId());

                if(foundRoute.isPresent())
                {
                    Route resultingFoundRoute = foundRoute.get();

                    route.setId(resultingFoundRoute.getId());
                    route.setItinerary(resultingItinerary);

                    for(RoutePoi poi : route.getPois())
                    {
                        Optional<RoutePoi> foundPoi =
                                routePoiService.getByRouteAndPoiId(resultingFoundRoute, poi.getPoiId());

                        if(foundPoi.isPresent())
                        {
                            RoutePoi resultingFoundPoi = foundPoi.get();

                            poi.setId(resultingFoundPoi.getId());
                            poi.setRoute(resultingFoundRoute);
                        }
                    }
                }
            }

            itinerary.setId(resultingItinerary.getId());
        }
    }
}
