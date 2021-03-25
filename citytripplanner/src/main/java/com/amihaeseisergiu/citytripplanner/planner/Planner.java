package com.amihaeseisergiu.citytripplanner.planner;

import com.amihaeseisergiu.citytripplanner.appuser.AppUser;
import com.amihaeseisergiu.citytripplanner.itinerary.Itinerary;
import com.amihaeseisergiu.citytripplanner.planner.schedule.Schedule;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.GenericGenerator;

import javax.persistence.*;
import java.util.UUID;

@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Planner {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Fetch(FetchMode.SELECT)
    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private Schedule schedule;

    @Fetch(FetchMode.SELECT)
    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private Itinerary itinerary;

    @ManyToOne
    @JsonIgnore
    private AppUser user;

    Planner(Schedule schedule, AppUser user)
    {
        this.schedule = schedule;
        this.user = user;
    }
}