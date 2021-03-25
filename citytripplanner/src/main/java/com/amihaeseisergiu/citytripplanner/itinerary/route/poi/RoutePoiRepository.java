package com.amihaeseisergiu.citytripplanner.itinerary.route.poi;

import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
public interface RoutePoiRepository extends JpaRepository<RoutePoi, UUID> {

    Optional<RoutePoi> findByRouteAndPoiId(Route route, String poiId);
}
