package com.amihaeseisergiu.citytripplanner.utils;

import com.amihaeseisergiu.citytripplanner.schedule.SchedulePoi;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class MapboxUtils {

    private final String accessToken;
    private final String endPoint;

    public MapboxUtils(@Value("${mapbox.accesstoken}") String accessToken,
                       @Value("${mapbox.endpoint}") String endPoint)
    {
        this.accessToken = accessToken;
        this.endPoint = endPoint;
    }

    public DurationsMatrix fetchDurationsMatrix(List<SchedulePoi> schedulePois)
    {
        SchedulePoi firstPoi = schedulePois.get(0);
        String coordinatesList = firstPoi.getLng() + "," + firstPoi.getLat();

        for(int i = 1; i < schedulePois.size(); i++)
        {
            SchedulePoi poi = schedulePois.get(i);
            coordinatesList += ";" + poi.getLng() + "," + poi.getLat();
        }

        String url = endPoint + "driving/" + coordinatesList + "?access_token={access_token}";
        RestTemplate restTemplate = new RestTemplate();

        Map<String, String> params = new HashMap<>();
        params.put("access_token", accessToken);

        String ret = restTemplate.getForObject(url, String.class, params);

        Gson gson = new GsonBuilder().create();
        JsonObject all = gson.fromJson(ret, JsonObject.class);

        int[][] durationsMatrix = gson.fromJson(all.get("durations"), int[][].class);

        for(int i = 0; i < durationsMatrix.length; i++)
        {
            for(int j = 0; j < durationsMatrix.length; j++)
            {
                durationsMatrix[i][j] /= 60;
            }
        }

        return new DurationsMatrix(durationsMatrix);
    }
}