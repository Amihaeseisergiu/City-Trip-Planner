package com.amihaeseisergiu.citytripplanner.itinerary.route.poi;

import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
@Transactional
public interface RoutePoiRepository extends JpaRepository<RoutePoi, Long> {

    Optional<RoutePoi> findByRouteAndPoiId(Route route, String poiId);
}
