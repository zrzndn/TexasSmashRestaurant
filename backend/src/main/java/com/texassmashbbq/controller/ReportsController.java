package com.texassmashbbq.controller;

import com.texassmashbbq.model.Order;
import com.texassmashbbq.service.RestaurantService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class ReportsController {
    private final RestaurantService restaurantService;

    public ReportsController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping("/reports/summary")
    public ResponseEntity<RestaurantService.ReportSummary> getReportSummary() {
        return ResponseEntity.ok(restaurantService.getReportSummary());
    }

    @GetMapping("/reports/export")
    public ResponseEntity<String> exportCsv() {
        List<Order> orders = restaurantService.getOrders();
        StringBuilder csv = new StringBuilder();
        csv.append("orderId,status,total,orderType,createdAt\n");
        for (Order order : orders) {
            String safeStatus = sanitizeForCsv(order.getStatus());
            String safeType = sanitizeForCsv(order.getOrderType());
            String safeCreatedAt = sanitizeForCsv(String.valueOf(order.getCreatedAt()));
            csv.append(order.getId()).append(',')
                    .append(safeStatus).append(',')
                    .append(order.getTotal()).append(',')
                    .append(safeType).append(',')
                    .append(safeCreatedAt).append('\n');
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.setContentDispositionFormData("attachment", "sales-report.csv");
        return new ResponseEntity<>(csv.toString(), headers, 200);
    }

    private String sanitizeForCsv(String value) {
        if (value == null) {
            return "";
        }
        String cleaned = value.replace("\r", " ").replace("\n", " ");
        if (cleaned.contains(",") || cleaned.contains("\"") || cleaned.startsWith("=") || cleaned.startsWith("+") || cleaned.startsWith("-") || cleaned.startsWith("@")) {
            return '"' + cleaned.replace("\"", "\"\"") + '"';
        }
        return cleaned;
    }
}
