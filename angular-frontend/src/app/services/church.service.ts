import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ChurchEvent, DailyVerse, PrayerRequest } from '../models/church.models';

@Injectable({
  providedIn: 'root'
})
export class ChurchService {
  private http = inject(HttpClient);
  private apiUrl = '/api'; // Maps to Spring Boot (port 8080) or Node.js backend

  // Angular Signals for reactive state
  events = signal<ChurchEvent[]>([]);
  todayVerse = signal<DailyVerse | null>(null);
  allVerses = signal<DailyVerse[]>([]);
  prayers = signal<PrayerRequest[]>([]);
  loading = signal<boolean>(false);

  loadAllData(): void {
    this.loading.set(true);

    this.getEvents().subscribe(data => this.events.set(data));
    this.getTodayVerse().subscribe(verse => this.todayVerse.set(verse));
    this.getAllVerses().subscribe(verses => this.allVerses.set(verses));
    this.getPrayers().subscribe(prayers => {
      this.prayers.set(prayers);
      this.loading.set(false);
    });
  }

  // Events API
  getEvents(category?: string, search?: string): Observable<ChurchEvent[]> {
    let params: any = {};
    if (category && category !== 'All') params.category = category;
    if (search) params.search = search;
    return this.http.get<ChurchEvent[]>(`${this.apiUrl}/events`, { params });
  }

  createEvent(event: Partial<ChurchEvent>): Observable<ChurchEvent> {
    return this.http.post<ChurchEvent>(`${this.apiUrl}/events`, event).pipe(
      tap(() => this.loadAllData())
    );
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/events/${id}`).pipe(
      tap(() => this.loadAllData())
    );
  }

  submitRsvp(eventId: number, rsvp: { userName: string; userEmail: string; attendeesCount: number; notes?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/${eventId}/rsvp`, rsvp).pipe(
      tap(() => this.loadAllData())
    );
  }

  // Daily Verses API
  getTodayVerse(): Observable<DailyVerse> {
    return this.http.get<DailyVerse>(`${this.apiUrl}/verses/today`);
  }

  getAllVerses(): Observable<DailyVerse[]> {
    return this.http.get<DailyVerse[]>(`${this.apiUrl}/verses`);
  }

  saveVerse(verse: Partial<DailyVerse>): Observable<DailyVerse> {
    return this.http.post<DailyVerse>(`${this.apiUrl}/verses`, verse).pipe(
      tap(() => this.loadAllData())
    );
  }

  // Prayers API
  getPrayers(): Observable<PrayerRequest[]> {
    return this.http.get<PrayerRequest[]>(`${this.apiUrl}/prayers`);
  }

  submitPrayer(prayer: { title: string; request: string; requesterName?: string; isAnonymous?: boolean; isPraise?: boolean }): Observable<PrayerRequest> {
    return this.http.post<PrayerRequest>(`${this.apiUrl}/prayers`, prayer).pipe(
      tap(() => this.loadAllData())
    );
  }

  prayForRequest(id: number): Observable<PrayerRequest> {
    return this.http.post<PrayerRequest>(`${this.apiUrl}/prayers/${id}/pray`, {}).pipe(
      tap(() => this.loadAllData())
    );
  }
}
