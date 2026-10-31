package com.church.app.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prayer_requests")
public class PrayerRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String request;

    @Column(name = "requester_name", nullable = false)
    private String requesterName = "Church Member";

    @Column(name = "is_anonymous", nullable = false)
    private Boolean isAnonymous = false;

    @Column(name = "is_praise", nullable = false)
    private Boolean isPraise = false;

    @Column(name = "prayer_count", nullable = false)
    private Integer prayerCount = 0;

    @Column(nullable = false)
    private String status = "active"; // "active", "answered"

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public PrayerRequest() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getRequest() { return request; }
    public void setRequest(String request) { this.request = request; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public Boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(Boolean isAnonymous) { this.isAnonymous = isAnonymous; }

    public Boolean getIsPraise() { return isPraise; }
    public void setIsPraise(Boolean isPraise) { this.isPraise = isPraise; }

    public Integer getPrayerCount() { return prayerCount; }
    public void setPrayerCount(Integer prayerCount) { this.prayerCount = prayerCount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
