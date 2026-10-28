package com.texassmashbbq.controller;

import com.texassmashbbq.model.MenuCategory;
import com.texassmashbbq.model.MenuItem;
import com.texassmashbbq.model.Restaurant;
import com.texassmashbbq.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicMenuController {
    private final RestaurantService restaurantService;

    public PublicMenuController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping("/restaurant")
    public ResponseEntity<Restaurant> getRestaurant() {
        return ResponseEntity.ok(restaurantService.getRestaurant());
    }

    @GetMapping("/menu")
    public ResponseEntity<List<MenuCategory>> getMenu() {
        return ResponseEntity.ok(restaurantService.getPublicMenu());
    }

    @GetMapping("/menu-items/{id}")
    public ResponseEntity<MenuItem> getMenuItem(@PathVariable Long id) {
        return ResponseEntity.of(restaurantService.getMenuItem(id));
    }
}
