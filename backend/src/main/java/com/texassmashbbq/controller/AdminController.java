package com.texassmashbbq.controller;

import com.texassmashbbq.model.MenuCategory;
import com.texassmashbbq.model.MenuItem;
import com.texassmashbbq.model.Order;
import com.texassmashbbq.model.Promotion;
import com.texassmashbbq.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final RestaurantService restaurantService;

    public AdminController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<RestaurantService.DashboardSummary> getDashboard() {
        return ResponseEntity.ok(restaurantService.getDashboardSummary());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getOrders() {
        return ResponseEntity.ok(restaurantService.getOrders());
    }

    @GetMapping("/promotions")
    public ResponseEntity<List<Promotion>> getPromotions() {
        return ResponseEntity.ok(restaurantService.getPromotions());
    }

    @PostMapping("/promotions")
    public ResponseEntity<Promotion> createPromotion(@RequestBody RestaurantService.PromotionRequest request) {
        return ResponseEntity.ok(restaurantService.createPromotion(request));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id,
                                                  @RequestBody RestaurantService.OrderStatusUpdateRequest request) {
        return ResponseEntity.ok(restaurantService.updateOrderStatus(id, request.status()));
    }

    @GetMapping("/menu/categories")
    public ResponseEntity<List<MenuCategory>> listCategories() {
        return ResponseEntity.ok(restaurantService.getAllCategories());
    }

    @PostMapping("/menu/categories")
    public ResponseEntity<MenuCategory> createCategory(@RequestBody RestaurantService.MenuCategoryRequest request) {
        return ResponseEntity.ok(restaurantService.createCategory(request));
    }

    @GetMapping("/menu/items")
    public ResponseEntity<List<MenuItem>> listItems() {
        return ResponseEntity.ok(restaurantService.getAllItems());
    }

    @PostMapping("/menu/items")
    public ResponseEntity<MenuItem> createItem(@RequestBody RestaurantService.MenuItemRequest request) {
        return ResponseEntity.ok(restaurantService.createItem(request));
    }

    @PatchMapping("/menu/items/{id}/availability")
    public ResponseEntity<MenuItem> updateAvailability(@PathVariable Long id,
                                                       @RequestBody RestaurantService.AvailabilityRequest request) {
        return ResponseEntity.ok(restaurantService.updateItemAvailability(id, request.available()));
    }
}
