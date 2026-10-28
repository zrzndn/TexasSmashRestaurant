package com.texassmashbbq;

import com.texassmashbbq.model.MenuCategory;
import com.texassmashbbq.model.MenuItem;
import com.texassmashbbq.model.Order;
import com.texassmashbbq.model.User;
import com.texassmashbbq.service.RestaurantService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class RestaurantServiceTests {

    @Autowired
    private RestaurantService restaurantService;

    @Test
    void shouldCreateMenuCategoryAndOrder() {
        User customer = restaurantService.registerCustomer(
                new RestaurantService.RegistrationRequest("order@example.com", "secret123", "Test Customer")
        );

        MenuCategory category = restaurantService.createCategory(
                new RestaurantService.MenuCategoryRequest("Lunch", "Midday favourites", 10)
        );

        MenuItem item = restaurantService.createItem(
                new RestaurantService.MenuItemRequest(
                        category.getId(),
                        "Smash Burger Deluxe",
                        "Loaded burger",
                        new BigDecimal("16.00"),
                        "https://example.com/burger.jpg",
                        "Halal friendly",
                        true,
                        true,
                        15,
                        "Popular"
                )
        );

        Order order = restaurantService.createOrder(customer,
                new RestaurantService.CreateOrderRequest(
                        List.of(new RestaurantService.CreateOrderRequest.OrderLineRequest(item.getId(), 2, "Extra pickles")),
                        "TAKEAWAY"
                )
        );

        assertThat(order.getId()).isNotNull();
        assertThat(order.getStatus()).isEqualTo("NEW");
        assertThat(order.getTotal()).isGreaterThan(BigDecimal.ZERO);
        assertThat(order.getItems()).hasSize(1);
    }
}
