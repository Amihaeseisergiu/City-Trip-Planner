package com.amihaeseisergiu.citytripplanner.utils;

import com.amihaeseisergiu.citytripplanner.poi.Poi;
import com.google.gson.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Component
public class FoursquareUtils {

    private final String clientId;
    private final String clientSecret;
    private final String version;
    private final String endPoint;

    public FoursquareUtils(@Value("${foursquare.client.id}") String clientId,
                      @Value("${foursquare.client.secret}") String clientSecret,
                      @Value("${foursquare.endpoint}") String endPoint,
                      @Value("${foursquare.version}") String version)
    {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.endPoint = endPoint;
        this.version = version;
    }

    public List<Poi> fetchNewPois(String center, Integer limit)
    {
        String url = endPoint + "venues/search?client_id={client_id}&client_secret={client_secret}&v={version}&" +
                                "ll={center}&limit={limit}";
        RestTemplate restTemplate = new RestTemplate();

        Map<String, String> params = new HashMap<>();
        params.put("client_id", clientId);
        params.put("client_secret", clientSecret);
        params.put("version", version);
        params.put("center", center);
        params.put("limit", String.valueOf(limit));

        String ret = restTemplate.getForObject(url, String.class, params);

        List<Poi> venues = new ArrayList<>();

        Gson gson = new GsonBuilder().create();
        JsonObject all = gson.fromJson(ret, JsonObject.class);
        JsonObject response = all.getAsJsonObject("response");
        JsonArray venuesArray = response.getAsJsonArray("venues");

        for(JsonElement e : venuesArray)
        {
            JsonObject venue = e.getAsJsonObject();

            String id = gson.fromJson(venue.get("id"), String.class);
            String name = gson.fromJson(venue.get("name"), String.class);

            JsonObject location = venue.getAsJsonObject("location");
            Double lat = gson.fromJson(location.get("lat"), Double.class);
            Double lng = gson.fromJson(location.get("lng"), Double.class);

            String iconPrefix = "undefined";
            String iconSuffix = "undefined";

            JsonArray categories = venue.getAsJsonArray("categories");

            if(categories.size() >= 1)
            {
                JsonObject categoriesIn = categories.get(0).getAsJsonObject();

                JsonObject icon = categoriesIn.getAsJsonObject("icon");
                iconPrefix = gson.fromJson(icon.get("prefix"), String.class);
                iconSuffix = gson.fromJson(icon.get("suffix"), String.class);
            }

            venues.add(new  Poi(id, name, lat, lng, iconPrefix, iconSuffix, LocalDateTime.now().plusDays(1)));

        }

        return venues;
    }
}
