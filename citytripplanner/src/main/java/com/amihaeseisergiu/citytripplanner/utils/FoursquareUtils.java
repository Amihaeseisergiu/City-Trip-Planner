package com.amihaeseisergiu.citytripplanner.utils;

import com.amihaeseisergiu.citytripplanner.poi.Poi;
import com.amihaeseisergiu.citytripplanner.poi.details.PoiDetails;
import com.amihaeseisergiu.citytripplanner.poi.hours.PoiHours;
import com.google.gson.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

    public List<PoiHours> fetchPoiHours(String poiId)
    {
        String url = endPoint + "venues/{id}/hours?client_id={client_id}&client_secret={client_secret}&v={version}";
        RestTemplate restTemplate = new RestTemplate();

        Map<String, String> params = new HashMap<>();
        params.put("client_id", clientId);
        params.put("client_secret", clientSecret);
        params.put("version", version);
        params.put("id", poiId);

        String ret = restTemplate.getForObject(url, String.class, params);

        Gson gson = new GsonBuilder().create();
        JsonObject all = gson.fromJson(ret, JsonObject.class);
        JsonObject response = all.getAsJsonObject("response");
        JsonObject hours = response.getAsJsonObject("hours");
        JsonObject popular = response.getAsJsonObject("popular");

        List<PoiHours> poiHours = new ArrayList<>();
        List<String> dayNames = List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");
        Pattern pattern = Pattern.compile("(\\d\\d)(\\d\\d)");

        JsonArray timeFrames = null;
        if(hours.has("timeframes"))
        {
            timeFrames = hours.getAsJsonArray("timeframes");
        }
        else if(popular.has("timeframes"))
        {
            timeFrames = popular.getAsJsonArray("timeframes");
        }

        if(timeFrames != null)
        {
            for(JsonElement e : timeFrames)
            {
                JsonObject element = e.getAsJsonObject();
                List<Double> days = gson.fromJson(element.get("days"), ArrayList.class);

                if(element.getAsJsonArray("open").size() > 0)
                {
                    JsonObject open = element.getAsJsonArray("open").get(0).getAsJsonObject();
                    String start = gson.fromJson(open.get("start"), String.class);
                    String end = gson.fromJson(open.get("end"), String.class);
                    LocalTime startTime = null;
                    LocalTime endTime = null;

                    Matcher matcher = pattern.matcher(start);
                    if(matcher.find())
                    {
                        startTime = LocalTime.parse(matcher.group(1) + ":" + matcher.group(2));
                    }

                    matcher = pattern.matcher(end);
                    if(matcher.find())
                    {
                        endTime = LocalTime.parse(matcher.group(1) + ":" + matcher.group(2));
                    }

                    for(Double dayNumber : days)
                    {
                        String dayName = dayNames.get(dayNumber.intValue() - 1);

                        poiHours.add(new PoiHours(dayNumber.intValue(), dayName, startTime, endTime));
                    }
                }
                else
                {
                    for(Double dayNumber : days)
                    {
                        String dayName = dayNames.get(dayNumber.intValue() - 1);

                        LocalTime startTime = LocalTime.parse("00:00");
                        LocalTime endTime = LocalTime.parse("23:59");
                        poiHours.add(new PoiHours(dayNumber.intValue(), dayName, startTime, endTime));
                    }
                }
            }

            for(String dayName : dayNames)
            {
                if(poiHours.stream().noneMatch(p -> p.getDayName().equals(dayName)))
                {
                    LocalTime startTime = LocalTime.parse("00:00");
                    LocalTime endTime = LocalTime.parse("23:59");
                    poiHours.add(new PoiHours(dayNames.indexOf(dayName) + 1, dayName, startTime, endTime));
                }
            }
        }
        else
        {
            for(String dayName : dayNames)
            {
                LocalTime startTime = LocalTime.parse("00:00");
                LocalTime endTime = LocalTime.parse("23:59");
                poiHours.add(new PoiHours(dayNames.indexOf(dayName) + 1, dayName, startTime, endTime));
            }
        }

        return poiHours;
    }

    public PoiDetails fetchPoiDetails(String poiId)
    {
        String url = endPoint + "venues/{id}?client_id={client_id}&client_secret={client_secret}&v={version}";
        RestTemplate restTemplate = new RestTemplate();

        Map<String, String> params = new HashMap<>();
        params.put("client_id", clientId);
        params.put("client_secret", clientSecret);
        params.put("version", version);
        params.put("id", poiId);

        String ret = restTemplate.getForObject(url, String.class, params);

        Gson gson = new GsonBuilder().create();
        JsonObject all = gson.fromJson(ret, JsonObject.class);
        JsonObject response = all.getAsJsonObject("response");
        JsonObject venue = response.getAsJsonObject("venue");

        String name = null;
        if(venue.has("name"))
        {
            name = gson.fromJson(venue.get("name"), String.class);
        }

        Double lat = null, lng = null;
        if(venue.has("location"))
        {
            JsonObject location = venue.getAsJsonObject("location");

            if(location.has("lat") && location.has("lng"))
            {
                lat = gson.fromJson(location.get("lat"), Double.class);
                lng = gson.fromJson(location.get("lng"), Double.class);
            }
        }

        String iconPrefix = null, iconSuffix = null;
        if(venue.has("categories"))
        {
            JsonArray categories = venue.getAsJsonArray("categories");
            JsonObject firstCategory = categories.get(0).getAsJsonObject();

            if(firstCategory.has("icon"))
            {
                JsonObject icon = firstCategory.getAsJsonObject("icon");

                if(icon.has("prefix") && icon.has("suffix"))
                {
                    iconPrefix = gson.fromJson(icon.get("prefix"), String.class);
                    iconSuffix = gson.fromJson(icon.get("suffix"), String.class);
                }
            }
        }

        String formattedPhone = null;
        if(venue.has("contact"))
        {
            JsonObject contact = venue.getAsJsonObject("contact");
            if(contact.has("formattedPhone"))
            {
                formattedPhone = gson.fromJson(contact.get("formattedPhone"), String.class);
            }
        }

        Double rating = null;
        if(venue.has("rating"))
        {
            rating = gson.fromJson(venue.get("rating"), Double.class);
        }

        String type = null;
        if(venue.has("categories"))
        {
            JsonArray categories = venue.getAsJsonArray("categories");

            if(categories.size() >= 1)
            {
                JsonObject firstCategory = categories.get(0).getAsJsonObject();
                type = gson.fromJson(firstCategory.get("name"), String.class);
            }

        }

        Integer priceTier = 1;
        if(venue.has("price"))
        {
            JsonObject price = venue.getAsJsonObject("price");
            priceTier = gson.fromJson(price.get("tier"), Integer.class);
        }

        String photoPrefix = null;
        String photoSuffix = null;
        if(venue.has("bestPhoto"))
        {
            JsonObject bestPhoto = venue.getAsJsonObject("bestPhoto");
            if(bestPhoto.has("prefix"))
            {
                photoPrefix = gson.fromJson(bestPhoto.get("prefix"), String.class);
                photoSuffix = gson.fromJson(bestPhoto.get("suffix"), String.class);
            }
        }

        return new PoiDetails(poiId, name, lat, lng, iconPrefix, iconSuffix, formattedPhone,
                rating, type, photoPrefix, photoSuffix, priceTier, LocalDateTime.now().plusDays(1));
    }

    public List<Poi> fetchNewPois(String center, Integer limit)
    {
        String url = endPoint + "venues/explore?client_id={client_id}&client_secret={client_secret}&v={version}&" +
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
        JsonArray groups = response.getAsJsonArray("groups");
        JsonObject groupsIn = groups.get(0).getAsJsonObject();
        JsonArray items = groupsIn.getAsJsonArray("items");

        for(JsonElement e : items)
        {
            JsonObject item = e.getAsJsonObject();
            JsonObject venue = item.getAsJsonObject("venue");

            String id = gson.fromJson(venue.get("id"), String.class);
            String name = gson.fromJson(venue.get("name"), String.class);

            JsonObject location = venue.getAsJsonObject("location");
            Double lat = gson.fromJson(location.get("lat"), Double.class);
            Double lng = gson.fromJson(location.get("lng"), Double.class);

            String type = null;
            String iconPrefix = null;
            String iconSuffix = null;

            JsonArray categories = venue.getAsJsonArray("categories");

            if(categories.size() >= 1)
            {
                JsonObject categoriesIn = categories.get(0).getAsJsonObject();

                type = gson.fromJson(categoriesIn.get("name"), String.class);

                JsonObject icon = categoriesIn.getAsJsonObject("icon");
                iconPrefix = gson.fromJson(icon.get("prefix"), String.class);
                iconSuffix = gson.fromJson(icon.get("suffix"), String.class);
            }

            if(iconPrefix != null)
            {
                venues.add(new  Poi(id, name, lat, lng, type, iconPrefix, iconSuffix, LocalDateTime.now().plusDays(1)));
            }

        }

        return venues;
    }
}
