package com.amihaeseisergiu.citytripplanner.itinerary.route;

import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
@Transactional
public interface RouteRepository extends JpaRepository<Route, Long> {

    Optional<Route> findRouteByItineraryAndDayId(Itinerary itinerary, Long dayId);
}
