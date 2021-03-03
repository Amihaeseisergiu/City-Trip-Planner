package com.amihaeseisergiu.citytripplanner.poi;

import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(path = "/poi")
@AllArgsConstructor
public class PoiController {

    private final PoiService poiService;

    @GetMapping
    List<Poi> get(@RequestParam(value = "ll") List<String> center)
    {
        return poiService.getPoisFromCenter(Double.valueOf(center.get(0)), Double.valueOf(center.get(1)), 50, 10.0);
    }

}
