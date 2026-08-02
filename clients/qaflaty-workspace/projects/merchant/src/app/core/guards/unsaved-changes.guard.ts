import { CanDeactivateFn } from '@angular/router';

/** Implemented by any screen that can hold unsaved work. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Blocks navigation away from a screen with unsaved edits until the merchant
 * confirms. The page builder keeps its whole section list in memory until Save,
 * so leaving without this would silently discard the layout.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component?.hasUnsavedChanges?.()) return true;
  return confirm('You have unsaved changes on this page. Leave without saving?');
};
