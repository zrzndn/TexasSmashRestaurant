package com.texassmashbbq.repository;

import com.texassmashbbq.model.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    List<MenuCategory> findByActiveTrueOrderByDisplayOrderAsc();
}
