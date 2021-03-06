package com.amihaeseisergiu.citytripplanner.poi;

import com.amihaeseisergiu.citytripplanner.utils.FoursquareUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class PoiService {

    private final PoiRepository poiRepository;
    private final FoursquareUtils foursquareUtils;

    public List<Poi> getPoisFromCenter(Double lat, Double lng, Integer limit, Double radius)
    {
        List<Poi> databasePois = poiRepository.findPoiByDistance(lat, lng, radius);
        System.out.println(databasePois.size());

        if(databasePois.size() < 5)
        {
            List<Poi> pois = foursquareUtils.fetchNewPois(lat + "," + lng, limit);
            poiRepository.saveAll(pois);
            System.out.println("Adding new");

            return pois;
        }

        System.out.println("Returning from database");

        return databasePois;
    }
}
