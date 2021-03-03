package com.amihaeseisergiu.citytripplanner.poi;

import lombok.AllArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
@AllArgsConstructor
public class PoiPurgeTask {

    private final PoiRepository poiRepository;

    @Scheduled(cron = "0 0 0 */1 * ?")
    public void purgeExpired() {
        poiRepository.deleteAllExpiredSince(LocalDateTime.now());
    }
}