import { Component, signal, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Qaflaty Landing');
  protected readonly mobileMenuOpen = signal(false);
  protected readonly isScrolled = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  // Merchant app URLs
  protected readonly merchantLoginUrl = 'http://localhost:4201';
  protected readonly merchantSignupUrl = 'http://localhost:4201/auth/register';

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  scrollToSection(sectionId: string) {
    this.closeMobileMenu();
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Height of fixed navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  navigateToMerchantApp(url: string) {
    window.location.href = url;
  }
}
