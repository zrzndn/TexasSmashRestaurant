package com.texassmashbbq.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "promotions")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    private String name;
    private String type;
    @Column(name = "discount_value")
    private BigDecimal value = BigDecimal.ZERO;
    @Column(name = "minimum_order")
    private BigDecimal minimumOrder = BigDecimal.ZERO;
    private boolean active = true;
    private OffsetDateTime startsAt = OffsetDateTime.now();
    private OffsetDateTime expiresAt;

    public Promotion() {
    }

    public Promotion(Long id, String code, String name, String type, BigDecimal value,
                    BigDecimal minimumOrder, boolean active, OffsetDateTime startsAt, OffsetDateTime expiresAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.type = type;
        this.value = value;
        this.minimumOrder = minimumOrder;
        this.active = active;
        this.startsAt = startsAt;
        this.expiresAt = expiresAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }

    public BigDecimal getMinimumOrder() { return minimumOrder; }
    public void setMinimumOrder(BigDecimal minimumOrder) { this.minimumOrder = minimumOrder; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public OffsetDateTime getStartsAt() { return startsAt; }
    public void setStartsAt(OffsetDateTime startsAt) { this.startsAt = startsAt; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
}
