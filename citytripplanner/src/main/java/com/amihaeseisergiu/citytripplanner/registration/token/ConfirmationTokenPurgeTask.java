package com.amihaeseisergiu.citytripplanner.registration.token;

import lombok.AllArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
@AllArgsConstructor
public class ConfirmationTokenPurgeTask {

    private final ConfirmationTokenRepository confirmationTokenRepository;

    @Scheduled(cron = "0 0 */2 * * ?")
    public void purgeExpired() {
        confirmationTokenRepository.deleteAllExpiredSince(LocalDateTime.now());
    }
}
