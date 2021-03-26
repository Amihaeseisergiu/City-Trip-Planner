package com.amihaeseisergiu.citytripplanner.itinerary;

import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import com.amihaeseisergiu.citytripplanner.planner.Planner;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Itinerary {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    private String userName;

    @Fetch(FetchMode.SELECT)
    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "itinerary_id")
    private List<Route> routes;

    @OneToOne
    @JsonIgnore
    private Planner planner;

    public Itinerary(List<Route> routes)
    {
        this.routes = routes;
    }
}
