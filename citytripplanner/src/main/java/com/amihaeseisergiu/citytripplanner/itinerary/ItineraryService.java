package com.amihaeseisergiu.citytripplanner.itinerary;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;

    public Itinerary getItineraryById(UUID id)
    {
        Optional<Itinerary> itinerary = itineraryRepository.findItineraryById(id);

        return itinerary.orElse(null);
    }
}
