package com.amihaeseisergiu.citytripplanner.registration.token;

import com.amihaeseisergiu.citytripplanner.appuser.AppUser;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ConfirmationTokenService {

    private final ConfirmationTokenRepository confirmationTokenRepository;

    public void saveConfirmationToken(ConfirmationToken token)
    {
        confirmationTokenRepository.save(token);
    }

    public Optional<ConfirmationToken> getToken(String token) {
        return confirmationTokenRepository.findByToken(token);
    }

    public String getUserToken(AppUser user) {
        return confirmationTokenRepository.getUserToken(user).getToken();
    }

    public void deleteConfirmationToken(UUID id) {
        confirmationTokenRepository.deleteById(id);
    }
}
