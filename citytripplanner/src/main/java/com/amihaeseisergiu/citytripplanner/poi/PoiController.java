package com.amihaeseisergiu.citytripplanner.poi;

import com.amihaeseisergiu.citytripplanner.poi.details.PoiDetails;
import com.amihaeseisergiu.citytripplanner.poi.details.PoiDetailsService;
import com.amihaeseisergiu.citytripplanner.utils.SolverUtils;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/poi")
@AllArgsConstructor
public class PoiController {

    private final PoiService poiService;
    private final PoiDetailsService poiDetailsService;
    private final SolverUtils solverUtils;

    @GetMapping
    List<Poi> getPoisFromCenter(@RequestParam(value = "ll") List<String> center, @RequestParam(value = "radius") Double radius)
    {
        return poiService.getPoisFromCenter(Double.valueOf(center.get(0)), Double.valueOf(center.get(1)), 50, radius);
    }

    @GetMapping("/{id}")
    PoiDetails getPoiDetails(@PathVariable String id)
    {
        return poiDetailsService.getPoiDetails(id);
    }

    @PostMapping
    String solve()
    {
        solverUtils.solve();
        return "test";
    }
}
