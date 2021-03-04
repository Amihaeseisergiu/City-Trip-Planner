package com.amihaeseisergiu.citytripplanner.poi.hours;

import com.amihaeseisergiu.citytripplanner.utils.FoursquareUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class PoiHoursService {

    private final FoursquareUtils foursquareUtils;
    private final PoiHoursRepository poiHoursRepository;

    public List<PoiHours> getPoiHours(String poiId)
    {
        List<PoiHours> poiHours = foursquareUtils.fetchPoiHours(poiId);
        poiHoursRepository.saveAll(poiHours);

        return poiHours;
    }

    public void deleteHours(List<PoiHours> poiHours)
    {
        poiHoursRepository.deleteAll(poiHours);
    }
}
