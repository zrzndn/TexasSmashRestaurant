package com.texassmashbbq.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "menu_items")
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({"items", "hibernateLazyInitializer", "handler"})
    private MenuCategory category;

    private String name;

    @Column(length = 1200)
    private String description;

    private BigDecimal price;
    private String imageUrl;
    private String dietaryLabel;
    private boolean featured;
    private boolean available = true;
    private int prepTimeMinutes;
    private String tag;

    public MenuItem() {
    }

    public MenuItem(Long id, MenuCategory category, String name, String description, BigDecimal price,
                    String imageUrl, String dietaryLabel, boolean featured, boolean available,
                    int prepTimeMinutes, String tag) {
        this.id = id;
        this.category = category;
        this.name = name;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.dietaryLabel = dietaryLabel;
        this.featured = featured;
        this.available = available;
        this.prepTimeMinutes = prepTimeMinutes;
        this.tag = tag;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MenuCategory getCategory() { return category; }
    public void setCategory(MenuCategory category) { this.category = category; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getDietaryLabel() { return dietaryLabel; }
    public void setDietaryLabel(String dietaryLabel) { this.dietaryLabel = dietaryLabel; }

    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public int getPrepTimeMinutes() { return prepTimeMinutes; }
    public void setPrepTimeMinutes(int prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
}
