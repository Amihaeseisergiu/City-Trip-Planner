package com.amihaeseisergiu.citytripplanner.utils;

import com.amihaeseisergiu.citytripplanner.poi.photos.PoiPhotos;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class ScraperUtils {

    public List<PoiPhotos> fetchPoiPhotos(String poiId)
    {
        List<PoiPhotos> poiPhotos = new ArrayList<>();

        String url = "https://foursquare.com/v/" + poiId + "/photos";

        try {
            Document document = Jsoup.connect(url).get();

            Elements photos = document.getElementsByClass("mainPhoto");

            for(Element photo : photos)
            {
                String src = photo.attr("src");
                String[] prefixSuffix = src.split("600x600");

                poiPhotos.add(new PoiPhotos(prefixSuffix[0], prefixSuffix[1]));
            }
        } catch (IOException e) {
            return poiPhotos;
        }

        return poiPhotos;
    }
}
