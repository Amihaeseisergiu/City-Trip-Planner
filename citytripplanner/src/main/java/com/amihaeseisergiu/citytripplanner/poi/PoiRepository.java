package com.amihaeseisergiu.citytripplanner.poi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
@Transactional
public interface PoiRepository extends JpaRepository<Poi, String> {

    @Transactional
    @Modifying
    @Query("delete from Poi p where p.expiresAt <= ?1")
    void deleteAllExpiredSince(LocalDateTime now);

    @Transactional
    @Query(value = "SELECT * FROM Poi p WHERE (6371 * acos(cos(radians(:latitude)) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(:longitude)) + sin(radians(:latitude)) * sin(radians(p.lat)))) < :distance",
           nativeQuery = true)
    List<Poi> findPoiByDistance(@Param("latitude") Double latitude, @Param("longitude") Double longitude, @Param("distance") Double distance);
}
