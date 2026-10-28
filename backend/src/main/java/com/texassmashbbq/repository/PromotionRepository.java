package com.texassmashbbq.repository;

import com.texassmashbbq.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    Optional<Promotion> findByCodeIgnoreCase(String code);
}
