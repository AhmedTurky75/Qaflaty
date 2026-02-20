import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GuestSessionService {
  private readonly KEY = 'qaflaty_guest_id';

  /**
   * Returns the existing guest UUID or generates a new one and persists it.
   * Called before every guest cart API request.
   */
  getOrCreateGuestId(): string {
    let id = localStorage.getItem(this.KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(this.KEY, id);
    }
    return id;
  }

  /**
   * Returns the current guest UUID without creating one.
   * Returns null if no guest session exists yet.
   */
  getGuestId(): string | null {
    return localStorage.getItem(this.KEY);
  }

  /**
   * Removes the guest UUID from localStorage.
   * Called after a successful cart sync on login so the guest cart
   * cannot be accessed again with the old UUID.
   */
  clearGuestId(): void {
    localStorage.removeItem(this.KEY);
  }
}
