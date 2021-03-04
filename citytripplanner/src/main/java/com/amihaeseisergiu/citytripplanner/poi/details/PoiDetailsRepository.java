package com.amihaeseisergiu.citytripplanner.poi.details;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;


@Repository
@Transactional
public interface PoiDetailsRepository extends JpaRepository<PoiDetails, String> {

    @Transactional
    @Modifying
    @Query("SELECT p FROM PoiDetails p WHERE p.expiresAt <= ?1")
    List<PoiDetails> getAllExpiredSince(LocalDateTime now);
}
