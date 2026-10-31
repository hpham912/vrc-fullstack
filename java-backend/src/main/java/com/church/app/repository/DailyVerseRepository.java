package com.church.app.repository;

import com.church.app.model.DailyVerse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface DailyVerseRepository extends JpaRepository<DailyVerse, Long> {
    Optional<DailyVerse> findByDate(String date);
    List<DailyVerse> findByOrderByDateDesc();
}
