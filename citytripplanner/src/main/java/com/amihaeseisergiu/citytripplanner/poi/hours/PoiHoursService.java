package com.amihaeseisergiu.citytripplanner.poi.hours;

import com.amihaeseisergiu.citytripplanner.utils.FoursquareUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class PoiHoursService {

    private final FoursquareUtils foursquareUtils;

    public List<PoiHours> getPoiHours(String poiId)
    {
        return foursquareUtils.fetchPoiHours(poiId);
    }
}
