package com.texassmashbbq.controller;

import com.texassmashbbq.model.Order;
import com.texassmashbbq.model.User;
import com.texassmashbbq.repository.UserRepository;
import com.texassmashbbq.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {
    private final RestaurantService restaurantService;
    private final UserRepository userRepository;

    public OrderController(RestaurantService restaurantService, UserRepository userRepository) {
        this.restaurantService = restaurantService;
        this.userRepository = userRepository;
    }

    @PostMapping("/orders")
    public ResponseEntity<Order> createOrder(@AuthenticationPrincipal UserDetails principal,
                                            @RequestBody RestaurantService.CreateOrderRequest request) {
        User customer = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        return ResponseEntity.ok(restaurantService.createOrder(customer, request));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getOrders(@AuthenticationPrincipal UserDetails principal) {
        User customer = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        if (customer.getRoles().stream().noneMatch(role -> role.equals("ADMIN") || role.equals("MANAGER") || role.equals("STAFF"))) {
            return ResponseEntity.ok(restaurantService.getOrders().stream()
                    .filter(order -> order.getCustomer() != null && order.getCustomer().getId().equals(customer.getId()))
                    .toList());
        }
        return ResponseEntity.ok(restaurantService.getOrders());
    }
}
