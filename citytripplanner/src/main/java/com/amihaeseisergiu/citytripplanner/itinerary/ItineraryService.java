package com.amihaeseisergiu.citytripplanner.itinerary;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;

    public void assignDuplicates(Itinerary itinerary)
    {
        Optional<Itinerary> foundItinerary = itineraryRepository.findItineraryByPlanner(itinerary.getPlanner());

        if(foundItinerary.isPresent())
        {
            Itinerary resultingItinerary = foundItinerary.get();

            itinerary.setId(resultingItinerary.getId());
        }
    }

    public Itinerary getItineraryById(UUID id)
    {
        Optional<Itinerary> itinerary = itineraryRepository.findItineraryById(id);

        return itinerary.orElse(null);
    }
}
