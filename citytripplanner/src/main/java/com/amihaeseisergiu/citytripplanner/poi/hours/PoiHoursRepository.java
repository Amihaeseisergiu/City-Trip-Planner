package com.amihaeseisergiu.citytripplanner.poi.hours;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional
public interface PoiHoursRepository extends JpaRepository<PoiHours, Long> {

}

