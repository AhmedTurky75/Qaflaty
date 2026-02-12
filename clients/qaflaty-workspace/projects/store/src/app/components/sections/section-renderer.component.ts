import { Component, input } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { HeroFullImageComponent } from './hero/hero-full-image.component';
import { HeroSplitComponent } from './hero/hero-split.component';
import { HeroSliderComponent } from './hero/hero-slider.component';
import { HeroMinimalComponent } from './hero/hero-minimal.component';
import { GridStandardComponent } from './product-grid/grid-standard.component';
import { GridLargeComponent } from './product-grid/grid-large.component';
import { GridListComponent } from './product-grid/grid-list.component';
import { GridCompactComponent } from './product-grid/grid-compact.component';
import { CatsGridComponent } from './category-showcase/cats-grid.component';
import { CatsSliderComponent } from './category-showcase/cats-slider.component';
import { CatsIconsComponent } from './category-showcase/cats-icons.component';
import { FeatIconsComponent } from './feature-highlights/feat-icons.component';
import { FeatCardsComponent } from './feature-highlights/feat-cards.component';
import { NewsInlineComponent } from './newsletter/news-inline.component';
import { NewsCardComponent } from './newsletter/news-card.component';
import { BannerStripComponent } from './banner/banner-strip.component';
import { BannerCardComponent } from './banner/banner-card.component';
import { CarouselStandardComponent } from './product-carousel/carousel-standard.component';
import { TestCardsComponent } from './testimonials/test-cards.component';
import { TestSliderComponent } from './testimonials/test-slider.component';
import { CustomHtmlComponent } from './custom-html/custom-html.component';

@Component({
  selector: 'app-section-renderer',
  standalone: true,
  imports: [
    HeroFullImageComponent, HeroSplitComponent, HeroSliderComponent, HeroMinimalComponent,
    GridStandardComponent, GridLargeComponent, GridListComponent, GridCompactComponent,
    CatsGridComponent, CatsSliderComponent, CatsIconsComponent,
    FeatIconsComponent, FeatCardsComponent,
    NewsInlineComponent, NewsCardComponent,
    BannerStripComponent, BannerCardComponent,
    CarouselStandardComponent,
    TestCardsComponent, TestSliderComponent,
    CustomHtmlComponent
  ],
  template: `
    @for (section of sections(); track section.id) {
      @if (section.isEnabled) {
        <section class="w-full">
          @switch (section.variantId) {
            @case ('hero-full-image') { <app-hero-full-image [config]="section" /> }
            @case ('hero-split') { <app-hero-split [config]="section" /> }
            @case ('hero-slider') { <app-hero-slider [config]="section" /> }
            @case ('hero-minimal') { <app-hero-minimal [config]="section" /> }
            @case ('grid-standard') { <app-grid-standard [config]="section" /> }
            @case ('grid-large') { <app-grid-large [config]="section" /> }
            @case ('grid-list') { <app-grid-list [config]="section" /> }
            @case ('grid-compact') { <app-grid-compact [config]="section" /> }
            @case ('cats-grid') { <app-cats-grid [config]="section" /> }
            @case ('cats-slider') { <app-cats-slider [config]="section" /> }
            @case ('cats-icons') { <app-cats-icons [config]="section" /> }
            @case ('feat-icons') { <app-feat-icons [config]="section" /> }
            @case ('feat-cards') { <app-feat-cards [config]="section" /> }
            @case ('news-inline') { <app-news-inline [config]="section" /> }
            @case ('news-card') { <app-news-card [config]="section" /> }
            @case ('banner-strip') { <app-banner-strip [config]="section" /> }
            @case ('banner-card') { <app-banner-card [config]="section" /> }
            @case ('carousel-standard') { <app-carousel-standard [config]="section" /> }
            @case ('test-cards') { <app-test-cards [config]="section" /> }
            @case ('test-slider') { <app-test-slider [config]="section" /> }
            @case ('custom-html') { <app-custom-html [config]="section" /> }
          }
        </section>
      }
    }
  `
})
export class SectionRendererComponent {
  sections = input.required<SectionConfigurationDto[]>();
}
