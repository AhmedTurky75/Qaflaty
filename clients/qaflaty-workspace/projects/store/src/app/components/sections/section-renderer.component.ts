import { Component, input } from '@angular/core';
import { SectionConfigurationDto } from 'shared';
import { Product } from '../../models/product.model';
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
import { LandingMediaTextComponent } from '../landing/landing-media-text.component';
import { LandingBenefitsComponent } from '../landing/landing-benefits.component';
import { LandingFaqComponent } from '../landing/landing-faq.component';
import { LandingGuaranteeComponent } from '../landing/landing-guarantee.component';
import { LandingCtaBandComponent } from '../landing/landing-cta-band.component';
import { LandingReviewsShowcaseComponent } from '../landing/landing-reviews-showcase.component';
import { SectionWrapperComponent } from './section-wrapper.component';
import { SliderStandardComponent } from './slider/slider-standard.component';
import { VideoYoutubeComponent } from './video/video-youtube.component';
import { AnnouncementBarComponent } from './announcement/announcement-bar.component';
import { CountdownTimerComponent } from './countdown/countdown-timer.component';
import { RichTextComponent } from './rich-text/rich-text.component';
import { CtaButtonComponent } from './cta-button/cta-button.component';
import { StatsStandardComponent } from './stats/stats-standard.component';
import { ComparisonStandardComponent } from './comparison/comparison-standard.component';
import { BeforeAfterStandardComponent } from './before-after/before-after-standard.component';

@Component({
  selector: 'app-section-renderer',
  standalone: true,
  imports: [
    SectionWrapperComponent,
    HeroFullImageComponent, HeroSplitComponent, HeroSliderComponent, HeroMinimalComponent,
    GridStandardComponent, GridLargeComponent, GridListComponent, GridCompactComponent,
    CatsGridComponent, CatsSliderComponent, CatsIconsComponent,
    FeatIconsComponent, FeatCardsComponent,
    NewsInlineComponent, NewsCardComponent,
    BannerStripComponent, BannerCardComponent,
    CarouselStandardComponent,
    TestCardsComponent, TestSliderComponent,
    CustomHtmlComponent,
    LandingMediaTextComponent, LandingBenefitsComponent, LandingFaqComponent,
    LandingGuaranteeComponent, LandingCtaBandComponent, LandingReviewsShowcaseComponent,
    SliderStandardComponent, VideoYoutubeComponent, AnnouncementBarComponent,
    CountdownTimerComponent, RichTextComponent, CtaButtonComponent,
    StatsStandardComponent, ComparisonStandardComponent, BeforeAfterStandardComponent
  ],
  template: `
    @for (section of sections(); track section.id) {
      @if (section.isEnabled) {
        <section class="w-full">
          <app-section-wrapper [settingsJson]="section.settingsJson">
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
            @case ('media-text-standard') { <app-landing-media-text [config]="section" [product]="product()" /> }
            @case ('benefits-standard') { <app-landing-benefits [config]="section" /> }
            @case ('faq-accordion') { <app-landing-faq [config]="section" /> }
            @case ('guarantee-standard') { <app-landing-guarantee [config]="section" /> }
            @case ('cta-band') { <app-landing-cta-band [config]="section" /> }
            @case ('reviews-standard') { <app-landing-reviews-showcase [config]="section" [product]="product()" /> }
            @case ('slider-standard') { <app-slider-standard [config]="section" /> }
            @case ('video-youtube') { <app-video-youtube [config]="section" /> }
            @case ('announcement-bar') { <app-announcement-bar [config]="section" /> }
            @case ('countdown-standard') { <app-countdown-timer [config]="section" /> }
            @case ('rich-text') { <app-rich-text [config]="section" /> }
            @case ('cta-button') { <app-cta-button [config]="section" /> }
            @case ('benefits-strip') { <app-landing-benefits [config]="section" /> }
            @case ('stats-standard') { <app-stats-standard [config]="section" /> }
            @case ('comparison-standard') { <app-comparison-standard [config]="section" /> }
            @case ('before-after-standard') { <app-before-after-standard [config]="section" /> }
          }
          </app-section-wrapper>
        </section>
      }
    }
  `
})
export class SectionRendererComponent {
  sections = input.required<SectionConfigurationDto[]>();
  product = input<Product | null>(null);
}
