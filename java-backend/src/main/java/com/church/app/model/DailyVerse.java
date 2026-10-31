package com.church.app.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_verses")
public class DailyVerse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String date; // YYYY-MM-DD

    @Column(name = "verse_text", nullable = false, columnDefinition = "TEXT")
    private String verseText;

    @Column(nullable = false)
    private String reference;

    @Column(nullable = false)
    private String translation = "NIV";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reflection;

    @Column(columnDefinition = "TEXT")
    private String prayer;

    private String theme;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public DailyVerse() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getVerseText() { return verseText; }
    public void setVerseText(String verseText) { this.verseText = verseText; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getTranslation() { return translation; }
    public void setTranslation(String translation) { this.translation = translation; }

    public String getReflection() { return reflection; }
    public void setReflection(String reflection) { this.reflection = reflection; }

    public String getPrayer() { return prayer; }
    public void setPrayer(String prayer) { this.prayer = prayer; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
