package com.amihaeseisergiu.citytripplanner.itinerary;

import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping(path = "/itinerary")
@AllArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    @GetMapping("/view/{id}")
    Itinerary getItinerary(@PathVariable UUID id)
    {
        return itineraryService.getItineraryById(id);
    }
}
