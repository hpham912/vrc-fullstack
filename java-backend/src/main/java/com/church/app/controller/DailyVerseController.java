package com.church.app.controller;

import com.church.app.model.DailyVerse;
import com.church.app.repository.DailyVerseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/verses")
@CrossOrigin(origins = "*")
public class DailyVerseController {

    @Autowired
    private DailyVerseRepository verseRepository;

    @GetMapping("/today")
    public ResponseEntity<DailyVerse> getTodayVerse() {
        String today = LocalDate.now().toString();
        return verseRepository.findByDate(today)
                .or(() -> verseRepository.findByOrderByDateDesc().stream().findFirst())
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    DailyVerse fallback = new DailyVerse();
                    fallback.setDate(today);
                    fallback.setReference("Philippians 4:6-7");
                    fallback.setVerseText("Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.");
                    fallback.setTranslation("NIV");
                    fallback.setReflection("God invites us to trade our anxieties for His peace.");
                    fallback.setPrayer("Heavenly Father, grant us peace today. Amen.");
                    fallback.setTheme("Peace & Trust");
                    return ResponseEntity.ok(fallback);
                });
    }

    @GetMapping
    public List<DailyVerse> getAllVerses() {
        return verseRepository.findByOrderByDateDesc();
    }

    @PostMapping
    public ResponseEntity<DailyVerse> saveVerse(@RequestBody DailyVerse verse) {
        // If verse exists for this date, update it
        DailyVerse saved = verseRepository.findByDate(verse.getDate()).map(existing -> {
            existing.setVerseText(verse.getVerseText());
            existing.setReference(verse.getReference());
            existing.setTranslation(verse.getTranslation());
            existing.setReflection(verse.getReflection());
            existing.setPrayer(verse.getPrayer());
            existing.setTheme(verse.getTheme());
            return verseRepository.save(existing);
        }).orElseGet(() -> verseRepository.save(verse));

        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVerse(@PathVariable Long id) {
        if (!verseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        verseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
