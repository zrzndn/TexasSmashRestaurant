package com.texassmashbbq.repository;

import com.texassmashbbq.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByAvailableTrueOrderByNameAsc();
    List<MenuItem> findByCategoryIdAndAvailableTrueOrderByNameAsc(Long categoryId);
}
