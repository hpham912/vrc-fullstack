package com.church.app.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class ChurchEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category = "Worship";

    @Column(nullable = false)
    private String date; // YYYY-MM-DD

    @Column(name = "start_time", nullable = false)
    private String startTime;

    @Column(name = "end_time")
    private String endTime;

    @Column(nullable = false)
    private String location;

    private String address;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = false;

    @Column(name = "rsvp_count", nullable = false)
    private Integer rsvpCount = 0;

    @Column(name = "max_capacity")
    private Integer maxCapacity;

    @Column(name = "organizer_name")
    private String organizerName;

    @Column(name = "organizer_email")
    private String organizerEmail;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public ChurchEvent() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getIsFeatured() { return isFeatured; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured; }

    public Integer getRsvpCount() { return rsvpCount; }
    public void setRsvpCount(Integer rsvpCount) { this.rsvpCount = rsvpCount; }

    public Integer getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Integer maxCapacity) { this.maxCapacity = maxCapacity; }

    public String getOrganizerName() { return organizerName; }
    public void setOrganizerName(String organizerName) { this.organizerName = organizerName; }

    public String getOrganizerEmail() { return organizerEmail; }
    public void setOrganizerEmail(String organizerEmail) { this.organizerEmail = organizerEmail; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
