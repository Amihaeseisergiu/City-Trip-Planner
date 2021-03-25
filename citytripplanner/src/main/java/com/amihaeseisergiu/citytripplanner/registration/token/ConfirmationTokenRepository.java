package com.amihaeseisergiu.citytripplanner.registration.token;

import com.amihaeseisergiu.citytripplanner.appuser.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConfirmationTokenRepository extends JpaRepository<ConfirmationToken, UUID> {

    Optional<ConfirmationToken> findByToken(String token);

    @Transactional
    @Query("select t from ConfirmationToken t where t.appUser = ?1")
    ConfirmationToken getUserToken(AppUser user);

    @Transactional
    @Modifying
    @Query("delete from ConfirmationToken t where t.expiresAt <= ?1")
    void deleteAllExpiredSince(LocalDateTime now);
}
