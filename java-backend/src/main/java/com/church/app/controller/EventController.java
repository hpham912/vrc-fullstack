package com.church.app.controller;

import com.church.app.model.ChurchEvent;
import com.church.app.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    @GetMapping
    public List<ChurchEvent> getAllEvents(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        
        List<ChurchEvent> events = eventRepository.findByOrderByDateAscStartTimeAsc();
        if (category != null && !category.equalsIgnoreCase("All")) {
            events = events.stream()
                    .filter(e -> e.getCategory().equalsIgnoreCase(category))
                    .toList();
        }
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            events = events.stream()
                    .filter(e -> e.getTitle().toLowerCase().contains(q) ||
                                 e.getDescription().toLowerCase().contains(q) ||
                                 e.getLocation().toLowerCase().contains(q))
                    .toList();
        }
        return events;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChurchEvent> getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ChurchEvent> createEvent(@RequestBody ChurchEvent event) {
        ChurchEvent saved = eventRepository.save(event);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChurchEvent> updateEvent(@PathVariable Long id, @RequestBody ChurchEvent updated) {
        return eventRepository.findById(id).map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setDescription(updated.getDescription());
            existing.setCategory(updated.getCategory());
            existing.setDate(updated.getDate());
            existing.setStartTime(updated.getStartTime());
            existing.setEndTime(updated.getEndTime());
            existing.setLocation(updated.getLocation());
            existing.setAddress(updated.getAddress());
            existing.setIsFeatured(updated.getIsFeatured());
            existing.setMaxCapacity(updated.getMaxCapacity());
            existing.setOrganizerName(updated.getOrganizerName());
            existing.setOrganizerEmail(updated.getOrganizerEmail());
            return ResponseEntity.ok(eventRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        if (!eventRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        eventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/rsvp")
    public ResponseEntity<ChurchEvent> rsvpEvent(@PathVariable Long id, @RequestParam(defaultValue = "1") int attendeesCount) {
        return eventRepository.findById(id).map(evt -> {
            evt.setRsvpCount(evt.getRsvpCount() + attendeesCount);
            return ResponseEntity.ok(eventRepository.save(evt));
        }).orElse(ResponseEntity.notFound().build());
    }
}
