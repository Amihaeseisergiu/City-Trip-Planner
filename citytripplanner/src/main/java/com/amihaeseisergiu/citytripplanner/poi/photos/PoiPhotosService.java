package com.amihaeseisergiu.citytripplanner.poi.photos;

import com.amihaeseisergiu.citytripplanner.utils.ScraperUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class PoiPhotosService {

    private final ScraperUtils scraperUtils;

    public List<PoiPhotos> getPoiPhotos(String poiId)
    {
        return scraperUtils.fetchPoiPhotos(poiId);
    }
}
