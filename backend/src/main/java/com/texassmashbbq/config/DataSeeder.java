package com.texassmashbbq.config;

import com.texassmashbbq.model.MenuCategory;
import com.texassmashbbq.model.MenuItem;
import com.texassmashbbq.model.Promotion;
import com.texassmashbbq.model.Restaurant;
import com.texassmashbbq.model.User;
import com.texassmashbbq.repository.MenuCategoryRepository;
import com.texassmashbbq.repository.MenuItemRepository;
import com.texassmashbbq.repository.PromotionRepository;
import com.texassmashbbq.repository.RestaurantRepository;
import com.texassmashbbq.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private final RestaurantRepository restaurantRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository itemRepository;
    private final PromotionRepository promotionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(RestaurantRepository restaurantRepository,
                      MenuCategoryRepository categoryRepository,
                      MenuItemRepository itemRepository,
                      PromotionRepository promotionRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder) {
        this.restaurantRepository = restaurantRepository;
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.promotionRepository = promotionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (restaurantRepository.count() == 0) {
            restaurantRepository.save(new Restaurant(null, "Texas Smash BBQ", "Kuala Lumpur, Malaysia", "hello@texassmashbbq.com", "MYR"));
        }

        if (categoryRepository.count() == 0) {
            MenuCategory smashBurgers = categoryRepository.save(new MenuCategory(null, "Smash Burgers", "Crispy-edged patties, toasted buns, and house-made toppings.", 1, true));
            MenuCategory texasBbq = categoryRepository.save(new MenuCategory(null, "Texas BBQ", "Low-and-slow smoked favourites, served fresh.", 2, true));
            MenuCategory chicken = categoryRepository.save(new MenuCategory(null, "Chicken", "Crispy, juicy, and made to order.", 3, true));
            MenuCategory sides = categoryRepository.save(new MenuCategory(null, "Sides and Loaded Fries", "Comfort-food sides and loaded-up fries.", 4, true));
            MenuCategory combos = categoryRepository.save(new MenuCategory(null, "Combos and Meal Deals", "A full meal with your choice of BBQ favourites.", 5, true));
            MenuCategory drinks = categoryRepository.save(new MenuCategory(null, "Drinks", "Cold drinks, creamy shakes, and house lemonade.", 6, true));
            MenuCategory desserts = categoryRepository.save(new MenuCategory(null, "Desserts", "A sweet finish to your smokehouse meal.", 7, true));

            itemRepository.saveAll(List.of(
                    menuItem(smashBurgers, "Classic Smash Burger", "Single smashed beef patty, American cheese, pickles, and house burger sauce.", "19.90", "photo-1568901346375-23c9450c58cd", true, "Popular", 15),
                    menuItem(smashBurgers, "Double Cheese Smash", "Two crispy-edged beef patties layered with double cheese, pickles, and house sauce.", "27.90", "photo-1553979459-d2229ba7433a", true, "Popular", 18),
                    menuItem(smashBurgers, "Signature BBQ Smash", "Double smash patties, smoked cheddar, crispy onions, and tangy Texas BBQ sauce.", "25.90", "photo-1550547660-d9450f859349", true, "Signature", 18),
                    menuItem(smashBurgers, "Spicy Jalapeño Smash", "Beef patty, pepper jack, jalapeños, and a smoky chipotle mayo.", "24.90", "photo-1553979459-d2229ba7433a", false, "Spicy", 18),
                    menuItem(texasBbq, "Smoked Beef Brisket", "Slow-smoked beef brisket with house BBQ sauce and a soft brioche bun.", "34.90", "photo-1544025162-d76694265947", true, "Signature", 25),
                    menuItem(texasBbq, "BBQ Beef Short Ribs", "Tender, slow-smoked beef short ribs glazed with our peppery BBQ sauce.", "42.90", "photo-1544025162-d76694265947", true, "Popular", 30),
                    menuItem(texasBbq, "Pulled Beef Sandwich", "Smoky pulled beef piled high with slaw and BBQ sauce on a toasted bun.", "25.90", "photo-1553909489-cd47e0ef937f", false, "Popular", 18),
                    menuItem(texasBbq, "BBQ Feast Platter", "Brisket, pulled beef, short rib, slaw, pickles, and two classic sides.", "69.90", "photo-1529193591184-b1d58069ecdd", true, "Signature", 35),
                    menuItem(chicken, "Crispy Chicken Burger", "Buttermilk-style crispy chicken, lettuce, pickles, and creamy house sauce.", "20.90", "photo-1606755962773-d324e0a13086", true, "Popular", 15),
                    menuItem(chicken, "Chicken Tenders", "Golden-crisp chicken tenders served with your choice of dipping sauce.", "18.90", "photo-1562967914-608f82629710", false, "Popular", 15),
                    menuItem(sides, "Classic Fries", "Hot, golden fries finished with a pinch of seasoning.", "8.90", "photo-1573080496219-bb080dd4f877", false, "", 8),
                    menuItem(sides, "Loaded BBQ Beef Fries", "Crispy fries topped with chopped smoked beef, cheese sauce, and BBQ drizzle.", "18.90", "photo-1576100402379-8a2997d2c02f", true, "Popular", 12),
                    menuItem(sides, "Onion Rings", "Crunchy battered onion rings with a smoky dipping sauce.", "10.90", "photo-1639024471283-03518883512d", false, "", 10),
                    menuItem(sides, "Mac and Cheese", "Creamy macaroni with a rich, toasted cheese topping.", "11.90", "photo-1543339494-b4cd4f7ba686", false, "Popular", 12),
                    menuItem(sides, "Extra Smash Patty", "Add one extra seasoned beef patty to your burger.", "8.90", "photo-1553979459-d2229ba7433a", false, "UPGRADE", 5),
                    menuItem(sides, "Extra Cheese", "A serving of melted cheese to make your meal extra indulgent.", "3.00", "photo-1485963631004-f2f00b1d6606", false, "ADD_ON", 2),
                    menuItem(sides, "Smoky BBQ Sauce", "A pot of our smoky, tangy house BBQ sauce.", "1.50", "photo-1472476443507-c7a5948772fc", false, "ADD_ON", 1),
                    menuItem(sides, "Jalapeño Sauce", "A creamy, gently spicy jalapeño dipping sauce.", "1.50", "photo-1472476443507-c7a5948772fc", false, "ADD_ON", 1),
                    menuItem(combos, "Burger Meal Combo", "Classic Smash Burger with fries and a regular soft drink.", "32.90", "photo-1568901346375-23c9450c58cd", true, "Meal deal", 20),
                    menuItem(combos, "Chicken Tenders Combo", "Chicken tenders with fries, a regular soft drink, and dipping sauce.", "28.90", "photo-1562967914-608f82629710", false, "Meal deal", 18),
                    menuItem(drinks, "Milkshake", "Thick and creamy hand-spun shake. Choose chocolate, vanilla, or strawberry.", "12.90", "photo-1572490122747-3968b75cc699", true, "Popular", 5),
                    menuItem(drinks, "Soft Drink", "A chilled can of your favourite classic soft drink.", "5.90", "photo-1544145945-f90425340c7e", false, "", 2),
                    menuItem(drinks, "Texas Lemonade", "Fresh, bright lemonade served over ice.", "7.90", "photo-1513558161293-cdaf765ed2e6", false, "House favourite", 4),
                    menuItem(drinks, "Bottled Water", "Chilled bottled mineral water.", "3.90", "photo-1523362628745-0c100150b504", false, "", 1),
                    menuItem(desserts, "Brownie with Ice Cream", "Warm chocolate brownie served with a scoop of vanilla ice cream.", "14.90", "photo-1606313564200-e75d5e30476c", true, "Popular", 8),
                    menuItem(desserts, "Banana Pudding", "Creamy Southern-style banana pudding layered with vanilla wafers.", "11.90", "photo-1551024601-bec78aea704b", false, "House favourite", 5)
            ));
        }

        if (userRepository.count() == 0) {
            userRepository.saveAll(List.of(
                    new User(null, "admin@texassmashbbq.com", passwordEncoder.encode("admin123"), "Admin User", Set.of("ADMIN"), true),
                    new User(null, "manager@texassmashbbq.com", passwordEncoder.encode("manager123"), "Manager User", Set.of("MANAGER"), true),
                    new User(null, "staff@texassmashbbq.com", passwordEncoder.encode("staff123"), "Service Staff", Set.of("STAFF"), true),
                    new User(null, "customer@texassmashbbq.com", passwordEncoder.encode("customer123"), "Customer", Set.of("CUSTOMER"), true)
            ));
        }

        if (promotionRepository.count() == 0) {
            promotionRepository.save(new Promotion(null, "SMASH10", "10% lunch deal", "PERCENTAGE", new BigDecimal("10"), new BigDecimal("30.00"), true, null, null));
            promotionRepository.save(new Promotion(null, "BBQ5", "RM5 off", "FIXED", new BigDecimal("5.00"), new BigDecimal("25.00"), true, null, null));
        }
    }

    private MenuItem menuItem(MenuCategory category, String name, String description, String price,
                              String imageId, boolean featured, String tag, int prepTimeMinutes) {
        String imageUrl = "https://images.unsplash.com/" + imageId + "?auto=format&fit=crop&w=900&q=80";
        return new MenuItem(null, category, name, description, new BigDecimal(price), imageUrl, "",
                featured, true, prepTimeMinutes, tag);
    }
}
