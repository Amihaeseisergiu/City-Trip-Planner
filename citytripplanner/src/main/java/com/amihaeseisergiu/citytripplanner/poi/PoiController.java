package com.amihaeseisergiu.citytripplanner.poi;

import com.amihaeseisergiu.citytripplanner.poi.details.PoiDetails;
import com.amihaeseisergiu.citytripplanner.poi.details.PoiDetailsService;
import com.amihaeseisergiu.citytripplanner.poi.hours.PoiHoursService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/poi")
@AllArgsConstructor
public class PoiController {

    private final PoiService poiService;
    private final PoiDetailsService poiDetailsService;

    @GetMapping
    List<Poi> getPoisFromCenter(@RequestParam(value = "ll") List<String> center)
    {
        return poiService.getPoisFromCenter(Double.valueOf(center.get(0)), Double.valueOf(center.get(1)), 50, 10.0);
    }

    @GetMapping("/{id}")
    PoiDetails getPoiDetails(@PathVariable String id)
    {
        return poiDetailsService.getPoiDetails(id);
    }

}
