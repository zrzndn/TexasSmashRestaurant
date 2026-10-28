package com.texassmashbbq.service;

import com.texassmashbbq.model.MenuCategory;
import com.texassmashbbq.model.MenuItem;
import com.texassmashbbq.model.Order;
import com.texassmashbbq.model.OrderItem;
import com.texassmashbbq.model.OrderStatusHistory;
import com.texassmashbbq.model.Promotion;
import com.texassmashbbq.model.Restaurant;
import com.texassmashbbq.model.User;
import com.texassmashbbq.repository.MenuCategoryRepository;
import com.texassmashbbq.repository.MenuItemRepository;
import com.texassmashbbq.repository.OrderRepository;
import com.texassmashbbq.repository.OrderStatusHistoryRepository;
import com.texassmashbbq.repository.PromotionRepository;
import com.texassmashbbq.repository.RestaurantRepository;
import com.texassmashbbq.repository.UserRepository;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.nio.charset.StandardCharsets;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final PromotionRepository promotionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RestaurantService(RestaurantRepository restaurantRepository,
                             MenuCategoryRepository categoryRepository,
                             MenuItemRepository itemRepository,
                             OrderRepository orderRepository,
                             OrderStatusHistoryRepository statusHistoryRepository,
                             PromotionRepository promotionRepository,
                             UserRepository userRepository,
                             PasswordEncoder passwordEncoder) {
        this.restaurantRepository = restaurantRepository;
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.orderRepository = orderRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.promotionRepository = promotionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Restaurant getRestaurant() {
        return restaurantRepository.findAll().stream().findFirst().orElseGet(() -> restaurantRepository.save(new Restaurant(null, "Texas Smash BBQ", "123 Main Street, Dallas, TX", "hello@texassmashbbq.com", "USD")));
    }

    public List<MenuCategory> getPublicMenu() {
        List<MenuCategory> categories = categoryRepository.findByActiveTrueOrderByDisplayOrderAsc();
        categories.forEach(category -> category.getItems().removeIf(item -> !item.isAvailable()));
        return categories;
    }

    public Optional<MenuItem> getMenuItem(Long id) {
        return itemRepository.findById(id).filter(MenuItem::isAvailable);
    }

    public List<Order> getOrders() {
        return orderRepository.findByOrderByCreatedAtDesc();
    }

    public List<Promotion> getPromotions() {
        return promotionRepository.findAll();
    }

    public Promotion createPromotion(PromotionRequest request) {
        String code = request.code() == null ? "" : request.code().trim();
        if (code.isBlank()) {
            throw new IllegalArgumentException("Promotion code is required");
        }
        if (promotionRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new IllegalArgumentException("Promotion code already exists");
        }

        Promotion promotion = new Promotion();
        promotion.setCode(code.toUpperCase());
        promotion.setName(request.name());
        promotion.setType(request.type() == null ? "PERCENTAGE" : request.type().toUpperCase());
        promotion.setValue(request.value() == null ? BigDecimal.ZERO : request.value());
        promotion.setMinimumOrder(request.minimumOrder() == null ? BigDecimal.ZERO : request.minimumOrder());
        promotion.setActive(Boolean.TRUE.equals(request.active()));
        promotion.setStartsAt(request.startsAt() == null ? OffsetDateTime.now() : request.startsAt());
        promotion.setExpiresAt(request.expiresAt());
        return promotionRepository.save(promotion);
    }

    public DashboardSummary getDashboardSummary() {
        List<Order> orders = getOrders();
        BigDecimal revenue = orders.stream().map(Order::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        long pending = orders.stream().filter(order -> "NEW".equals(order.getStatus()) || "CONFIRMED".equals(order.getStatus())).count();
        long ready = orders.stream().filter(order -> "READY".equals(order.getStatus())).count();
        BigDecimal average = orders.isEmpty() ? BigDecimal.ZERO : revenue.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);

        return new DashboardSummary(orders.size(), revenue, average, pending, ready);
    }

    public MenuCategory createCategory(MenuCategoryRequest request) {
        MenuCategory category = new MenuCategory();
        category.setName(request.name());
        category.setDescription(request.description());
        category.setDisplayOrder(request.displayOrder() == null ? 1 : request.displayOrder());
        category.setActive(true);
        return categoryRepository.save(category);
    }

    public MenuItem createItem(MenuItemRequest request) {
        MenuCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("Menu category not found"));

        MenuItem item = new MenuItem();
        item.setCategory(category);
        item.setName(request.name());
        item.setDescription(request.description());
        item.setPrice(request.price());
        item.setImageUrl(request.imageUrl());
        item.setDietaryLabel(request.dietaryLabel());
        item.setFeatured(Boolean.TRUE.equals(request.featured()));
        item.setAvailable(Boolean.TRUE.equals(request.available()));
        item.setPrepTimeMinutes(request.prepTimeMinutes() == null ? 10 : request.prepTimeMinutes());
        item.setTag(request.tag());
        return itemRepository.save(item);
    }

    public List<MenuCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<MenuItem> getAllItems() {
        return itemRepository.findAll();
    }

    public MenuItem updateItemAvailability(Long id, boolean available) {
        MenuItem item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));
        item.setAvailable(available);
        return itemRepository.save(item);
    }

    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        Set<String> allowed = Set.of("NEW", "CONFIRMED", "PREPARING", "READY", "SERVING", "COMPLETED", "CANCELLED");
        if (!allowed.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Unsupported order status: " + status);
        }

        String normalized = status.toUpperCase();
        order.setStatus(normalized);
        Order updated = orderRepository.save(order);
        recordStatusChange(updated, normalized);
        return updated;
    }

    public Order createOrder(User customer, CreateOrderRequest request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("Order must include at least one item");
        }

        Order order = new Order();
        order.setCustomer(customer);
        order.setOrderType(request.orderType() == null ? "DINE_IN" : request.orderType());

        BigDecimal subtotal = BigDecimal.ZERO;

        for (CreateOrderRequest.OrderLineRequest line : request.items()) {
            MenuItem item = itemRepository.findById(line.menuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + line.menuItemId()));
            if (!item.isAvailable()) {
                throw new IllegalArgumentException("Item is unavailable: " + item.getName());
            }

            int quantity = Math.max(1, line.quantity());
            BigDecimal lineTotal = item.getPrice().multiply(BigDecimal.valueOf(quantity));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItem(item);
            orderItem.setItemName(item.getName());
            orderItem.setQuantity(quantity);
            orderItem.setUnitPrice(item.getPrice());
            orderItem.setLineTotal(lineTotal);
            orderItem.setNotes(line.notes());
            orderItem.setOrder(order);
            order.getItems().add(orderItem);
        }

        BigDecimal discount = calculatePromotionDiscount(subtotal, request.promoCode());
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.0825")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal serviceCharge = subtotal.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax).add(serviceCharge).subtract(discount).max(BigDecimal.ZERO);

        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setTax(tax);
        order.setServiceCharge(serviceCharge);
        order.setDiscount(discount.setScale(2, RoundingMode.HALF_UP));
        order.setTotal(total.setScale(2, RoundingMode.HALF_UP));
        order.setStatus("NEW");
        Order savedOrder = orderRepository.save(order);
        recordStatusChange(savedOrder, "NEW");
        return savedOrder;
    }

    public ReportSummary getReportSummary() {
        List<Order> orders = getOrders();
        BigDecimal totalSales = orders.stream().map(Order::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        long cancelled = orders.stream().filter(order -> "CANCELLED".equalsIgnoreCase(order.getStatus())).count();
        BigDecimal avg = orders.isEmpty() ? BigDecimal.ZERO : totalSales.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);
        return new ReportSummary(orders.size(), totalSales, avg, cancelled, orders.stream().filter(order -> "READY".equalsIgnoreCase(order.getStatus())).count());
    }

    private BigDecimal calculatePromotionDiscount(BigDecimal subtotal, String promoCode) {
        if (promoCode == null || promoCode.isBlank()) {
            return BigDecimal.ZERO;
        }

        return promotionRepository.findByCodeIgnoreCase(promoCode.trim())
                .filter(Promotion::isActive)
                .filter(promotion -> promotion.getStartsAt() == null || !promotion.getStartsAt().isAfter(OffsetDateTime.now()))
                .filter(promotion -> promotion.getExpiresAt() == null || !promotion.getExpiresAt().isBefore(OffsetDateTime.now()))
                .filter(promotion -> subtotal.compareTo(promotion.getMinimumOrder()) >= 0)
                .map(promotion -> {
                    if ("PERCENTAGE".equalsIgnoreCase(promotion.getType())) {
                        BigDecimal percent = promotion.getValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                        return subtotal.multiply(percent).setScale(2, RoundingMode.HALF_UP);
                    }
                    return promotion.getValue().min(subtotal).setScale(2, RoundingMode.HALF_UP);
                })
                .orElse(BigDecimal.ZERO);
    }

    public void recordStatusChange(Order order, String status) {
        OrderStatusHistory history = new OrderStatusHistory(order, status.toUpperCase());
        statusHistoryRepository.save(history);
        if (order.getStatusHistory() == null) {
            order.setStatusHistory(new java.util.ArrayList<>());
        }
        order.getStatusHistory().add(history);
    }

    public User registerCustomer(RegistrationRequest request) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        if (email.isBlank() || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Enter a valid email address");
        }
        if (request.password() == null || request.password().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Password must be 72 bytes or fewer");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("User already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName() == null || request.fullName().isBlank()
                ? email.substring(0, email.indexOf('@'))
                : request.fullName().trim());
        user.setRoles(Set.of("CUSTOMER"));
        user.setEnabled(true);
        return userRepository.save(user);
    }

    public record RegistrationRequest(@NotBlank @Email @Size(max = 254) String email,
                                     @NotBlank @Size(min = 8, max = 72) String password,
                                     @Size(max = 100) String fullName) {}
    public record CreateOrderRequest(List<OrderLineRequest> items, String orderType, String promoCode) {
        public CreateOrderRequest(List<OrderLineRequest> items, String orderType) {
            this(items, orderType, null);
        }

        public record OrderLineRequest(Long menuItemId, int quantity, String notes) {}
    }
    public record MenuCategoryRequest(String name, String description, Integer displayOrder) {}
    public record MenuItemRequest(Long categoryId, String name, String description, BigDecimal price,
                                 String imageUrl, String dietaryLabel, Boolean featured, Boolean available,
                                 Integer prepTimeMinutes, String tag) {}
    public record PromotionRequest(String code, String name, String type, BigDecimal value,
                                  BigDecimal minimumOrder, Boolean active, OffsetDateTime startsAt, OffsetDateTime expiresAt) {}
    public record AvailabilityRequest(boolean available) {}
    public record OrderStatusUpdateRequest(String status) {}
    public record DashboardSummary(int totalOrders, BigDecimal totalSales, BigDecimal averageOrderValue,
                                  long pendingOrders, long readyOrders) {}
    public record ReportSummary(int totalOrders, BigDecimal totalSales, BigDecimal averageOrderValue,
                               long cancelledOrders, long readyOrders) {}
    public record OrderStatusView(Long id, String status, OffsetDateTime changedAt) {}
}
