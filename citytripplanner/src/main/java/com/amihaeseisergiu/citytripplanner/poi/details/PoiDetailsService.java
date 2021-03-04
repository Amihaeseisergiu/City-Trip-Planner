package com.amihaeseisergiu.citytripplanner.poi.details;

import com.amihaeseisergiu.citytripplanner.poi.hours.PoiHours;
import com.amihaeseisergiu.citytripplanner.poi.hours.PoiHoursService;
import com.amihaeseisergiu.citytripplanner.utils.FoursquareUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class PoiDetailsService {

    private final FoursquareUtils foursquareUtils;
    private final PoiDetailsRepository poiDetailsRepository;
    private final PoiHoursService poiHoursService;

    public PoiDetails getPoiDetails(String poiId)
    {
        Optional<PoiDetails> poiDetails = poiDetailsRepository.findById(poiId);

        if(poiDetails.isPresent())
        {
            return poiDetails.get();
        }

        PoiDetails toAdd = foursquareUtils.fetchPoiDetails(poiId);

        List<PoiHours> poiHours = poiHoursService.getPoiHours(poiId);
        toAdd.setPoiHours(poiHours);

        poiDetailsRepository.save(toAdd);

        return toAdd;
    }
}
