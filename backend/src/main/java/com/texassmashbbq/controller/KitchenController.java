package com.texassmashbbq.controller;

import com.texassmashbbq.model.Order;
import com.texassmashbbq.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api")
public class KitchenController {
    private final OrderRepository orderRepository;

    public KitchenController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping("/kitchen/orders")
    public ResponseEntity<List<Order>> getKitchenOrders() {
        List<Order> orders = orderRepository.findByOrderByCreatedAtDesc();
        orders.sort(Comparator.comparing(order -> {
            String status = order.getStatus();
            if ("NEW".equals(status)) return 0;
            if ("CONFIRMED".equals(status)) return 1;
            if ("PREPARING".equals(status)) return 2;
            if ("READY".equals(status)) return 3;
            return 4;
        }));
        return ResponseEntity.ok(orders);
    }
}
