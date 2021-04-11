package com.amihaeseisergiu.citytripplanner.itinerary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional
public interface ItineraryRepository extends JpaRepository<Itinerary, UUID> {

    Optional<Itinerary> findItineraryById(UUID id);
}
