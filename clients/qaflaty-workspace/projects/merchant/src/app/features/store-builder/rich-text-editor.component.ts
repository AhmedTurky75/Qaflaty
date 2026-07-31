import { Component, input, output, viewChild, ElementRef, effect } from '@angular/core';

/**
 * Lightweight, dependency-free WYSIWYG editor. Uses a `contenteditable` surface
 * plus a formatting toolbar (document.execCommand) and emits HTML. The stored
 * HTML is sanitized on render by the storefront Rich Text section, so merchants
 * get formatted text without writing any HTML.
 *
 * Toolbar buttons use (mousedown)+preventDefault so the text selection inside
 * the editor is preserved when a button is clicked.
 */
@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss'
})
export class RichTextEditorComponent {
  value = input<string>('');
  dir = input<'ltr' | 'rtl'>('ltr');
  placeholder = input<string>('Write here…');
  valueChange = output<string>();

  private editorRef = viewChild<ElementRef<HTMLElement>>('editor');
  private styleInit = false;

  constructor() {
    // Sync external value into the DOM only when the editor isn't being typed in,
    // so the caret never jumps while the merchant writes.
    effect(() => {
      const el = this.editorRef()?.nativeElement;
      const v = this.value() || '';
      if (el && document.activeElement !== el && el.innerHTML !== v) {
        el.innerHTML = v;
      }
    });
  }

  prevent(e: Event): void {
    e.preventDefault();
  }

  cmd(command: string, arg?: string): void {
    this.ensureSemanticTags();
    try { document.execCommand(command, false, arg); } catch { /* ignore unsupported */ }
    this.onInput();
  }

  createLink(): void {
    const url = window.prompt('Enter the link URL (https://…)');
    if (url) this.cmd('createLink', url);
  }

  onInput(): void {
    const el = this.editorRef()?.nativeElement;
    if (el) this.valueChange.emit(el.innerHTML);
  }

  /** Prefer semantic tags (<b>, <i>) over inline styles for cleaner, sanitizable HTML. */
  private ensureSemanticTags(): void {
    if (this.styleInit) return;
    this.styleInit = true;
    try { document.execCommand('styleWithCSS', false, 'false'); } catch { /* ignore */ }
  }
}
