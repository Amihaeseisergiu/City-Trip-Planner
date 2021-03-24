package com.amihaeseisergiu.citytripplanner.itinerary;

import com.amihaeseisergiu.citytripplanner.itinerary.route.Route;
import com.amihaeseisergiu.citytripplanner.schedule.Schedule;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import javax.persistence.*;
import java.util.List;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Itinerary {

    @Id
    @SequenceGenerator(
            name = "itinerary_sequence",
            sequenceName = "itinerary_sequence",
            allocationSize = 1
    )
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "itinerary_sequence"
    )
    @JsonIgnore
    private Long id;

    @Fetch(FetchMode.SELECT)
    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "itinerary_id")
    private List<Route> routes;

    @OneToOne
    @JsonIgnore
    private Schedule schedule;

    public Itinerary(List<Route> routes)
    {
        this.routes = routes;
    }
}
