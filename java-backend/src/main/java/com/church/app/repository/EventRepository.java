package com.church.app.repository;

import com.church.app.model.ChurchEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<ChurchEvent, Long> {
    List<ChurchEvent> findByCategoryIgnoreCase(String category);
    List<ChurchEvent> findByOrderByDateAscStartTimeAsc();
}
