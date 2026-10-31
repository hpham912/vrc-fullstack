import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChurchService } from './services/church.service';
import { ChurchEvent } from './models/church.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  church = inject(ChurchService);

  activeTab: 'events' | 'verse' | 'prayers' | 'admin' = 'events';
  selectedCategory = 'All';
  searchQuery = '';

  // RSVP Modal state
  selectedEventForRsvp: ChurchEvent | null = null;
  rsvpName = '';
  rsvpEmail = '';
  rsvpAttendees = 1;
  rsvpNotes = '';
  rsvpSubmitted = false;

  // Admin New Event state
  newEvent = {
    title: '',
    description: '',
    category: 'Worship',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    location: 'Main Sanctuary',
    isFeatured: false
  };

  ngOnInit() {
    this.church.loadAllData();
  }

  get filteredEvents(): ChurchEvent[] {
    return this.church.events().filter(e => {
      const matchCat = this.selectedCategory === 'All' || e.category.toLowerCase() === this.selectedCategory.toLowerCase();
      const matchSearch = e.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          e.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          e.location.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  openRsvp(event: ChurchEvent) {
    this.selectedEventForRsvp = event;
    this.rsvpSubmitted = false;
  }

  closeRsvp() {
    this.selectedEventForRsvp = null;
  }

  submitRsvp() {
    if (!this.selectedEventForRsvp || !this.rsvpName || !this.rsvpEmail) return;
    this.church.submitRsvp(this.selectedEventForRsvp.id, {
      userName: this.rsvpName,
      userEmail: this.rsvpEmail,
      attendeesCount: this.rsvpAttendees,
      notes: this.rsvpNotes
    }).subscribe(() => {
      this.rsvpSubmitted = true;
    });
  }

  createEvent() {
    this.church.createEvent(this.newEvent).subscribe(() => {
      alert('Event successfully posted to church calendar!');
      this.activeTab = 'events';
    });
  }

  deleteEvent(id: number) {
    if (confirm('Delete this gathering?')) {
      this.church.deleteEvent(id).subscribe();
    }
  }

  prayFor(id: number) {
    this.church.prayForRequest(id).subscribe();
  }
}
