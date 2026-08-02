import { Injectable, signal } from '@angular/core';

/**
 * Whether a section drag is in flight anywhere in the builder.
 *
 * The library and the canvas are siblings, so the drop-target treatment (canvas
 * focus ring, visible section boundaries, dimmed non-droppable chrome) needs one
 * piece of state both can see.
 */
@Injectable({ providedIn: 'root' })
export class BuilderDragStateService {
  readonly dragging = signal(false);

  start(): void {
    this.dragging.set(true);
  }

  end(): void {
    this.dragging.set(false);
  }
}
