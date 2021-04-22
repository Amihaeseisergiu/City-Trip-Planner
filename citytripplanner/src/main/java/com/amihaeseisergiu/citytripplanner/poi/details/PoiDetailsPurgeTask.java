package com.amihaeseisergiu.citytripplanner.poi.details;

import lombok.AllArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@AllArgsConstructor
public class PoiDetailsPurgeTask {

    private final PoiDetailsRepository poiDetailsRepository;

    @Scheduled(cron = "0 0 0 */1 * ?")
    public void purgeExpired() {
        List<PoiDetails> expiredDetails = poiDetailsRepository.getAllExpiredSince(LocalDateTime.now());

        poiDetailsRepository.deleteAll(expiredDetails);
    }
}
