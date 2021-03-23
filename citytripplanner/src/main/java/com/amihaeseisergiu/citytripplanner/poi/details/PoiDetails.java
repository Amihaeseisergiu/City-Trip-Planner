package com.amihaeseisergiu.citytripplanner.poi.details;

import com.amihaeseisergiu.citytripplanner.poi.hours.PoiHours;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class PoiDetails {

    @Id
    private String id;

    private String name;

    private Double lat;
    private Double lng;

    private String iconPrefix;
    private String iconSuffix;

    private String formattedPhone;
    private Double rating;

    private String type;

    private String photoPrefix;
    private String photoSuffix;

    private Integer priceTier;

    @OneToMany(fetch = FetchType.EAGER)
    private List<PoiHours> poiHours;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private LocalDateTime expiresAt;

    public PoiDetails(String id,
                      String name,
                      Double lat,
                      Double lng,
                      String iconPrefix,
                      String iconSuffix,
                      String formattedPhone,
                      Double rating,
                      String type,
                      String photoPrefix,
                      String photoSuffix,
                      Integer priceTier,
                      LocalDateTime expiresAt)
    {
        this.id = id;
        this.name = name;
        this.lat = lat;
        this.lng = lng;
        this.iconPrefix = iconPrefix;
        this.iconSuffix = iconSuffix;
        this.formattedPhone = formattedPhone;
        this.rating = rating;
        this.type = type;
        this.photoPrefix = photoPrefix;
        this.photoSuffix = photoSuffix;
        this.priceTier = priceTier;
        this.expiresAt = expiresAt;
    }
}
