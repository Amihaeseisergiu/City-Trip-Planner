package com.amihaeseisergiu.citytripplanner.utils;

import com.amihaeseisergiu.citytripplanner.schedule.day.poi.SchedulePoi;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
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

    public int[][] fetchDurationsMatrix(List<SchedulePoi> schedulePois)
    {
        SchedulePoi firstPoi = schedulePois.get(0);
        StringBuilder coordinatesList = new StringBuilder(firstPoi.getLng() + "," + firstPoi.getLat());

        for(int i = 1; i < schedulePois.size(); i++)
        {
            SchedulePoi poi = schedulePois.get(i);
            coordinatesList.append(";").append(poi.getLng()).append(",").append(poi.getLat());
        }

        String url = endPoint + "directions-matrix/v1/mapbox/walking/" + coordinatesList + "?access_token={access_token}";
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

        return durationsMatrix;
    }

    public String fetchPolyLine(SchedulePoi p1, SchedulePoi p2)
    {
        String coordinatesList = p1.getLng() + "," + p1.getLat() + ";" + p2.getLng() + "," + p2.getLat();

        String url = endPoint + "directions/v5/mapbox/walking/" + coordinatesList + "?geometries=polyline6&access_token={access_token}";
        RestTemplate restTemplate = new RestTemplate();

        Map<String, String> params = new HashMap<>();
        params.put("access_token", accessToken);

        String ret = restTemplate.getForObject(url, String.class, params);

        Gson gson = new GsonBuilder().create();
        JsonObject all = gson.fromJson(ret, JsonObject.class);

        JsonArray routes = all.getAsJsonArray("routes");
        JsonObject firstRoute = routes.get(0).getAsJsonObject();

        return gson.fromJson(firstRoute.get("geometry"), String.class);
    }
}