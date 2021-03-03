package com.amihaeseisergiu.citytripplanner.poi;

import lombok.*;

import javax.persistence.Entity;
import javax.persistence.Id;
import java.time.LocalDateTime;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Poi {

    @Id
    private String id;
    private String name;

    private Double lat;
    private Double lng;

    private String iconPrefix;
    private String iconSuffix;

    private LocalDateTime expiresAt;
}
