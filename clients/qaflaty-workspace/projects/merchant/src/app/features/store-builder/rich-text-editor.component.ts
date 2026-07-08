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
  template: `
    <div class="border border-gray-300 rounded-md overflow-hidden bg-white">
      <div class="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-1.5 py-1">
        <button type="button" title="Bold" (mousedown)="prevent($event)" (click)="cmd('bold')" class="rte-btn font-bold">B</button>
        <button type="button" title="Italic" (mousedown)="prevent($event)" (click)="cmd('italic')" class="rte-btn italic">I</button>
        <button type="button" title="Underline" (mousedown)="prevent($event)" (click)="cmd('underline')" class="rte-btn underline">U</button>
        <span class="rte-sep"></span>
        <button type="button" title="Heading" (mousedown)="prevent($event)" (click)="cmd('formatBlock', 'H2')" class="rte-btn">H2</button>
        <button type="button" title="Subheading" (mousedown)="prevent($event)" (click)="cmd('formatBlock', 'H3')" class="rte-btn">H3</button>
        <button type="button" title="Paragraph" (mousedown)="prevent($event)" (click)="cmd('formatBlock', 'P')" class="rte-btn text-xs">¶</button>
        <span class="rte-sep"></span>
        <button type="button" title="Bulleted list" (mousedown)="prevent($event)" (click)="cmd('insertUnorderedList')" class="rte-btn">• List</button>
        <button type="button" title="Numbered list" (mousedown)="prevent($event)" (click)="cmd('insertOrderedList')" class="rte-btn">1. List</button>
        <span class="rte-sep"></span>
        <button type="button" title="Align" (mousedown)="prevent($event)" (click)="cmd('justifyLeft')" class="rte-btn">⯇</button>
        <button type="button" title="Center" (mousedown)="prevent($event)" (click)="cmd('justifyCenter')" class="rte-btn">≡</button>
        <span class="rte-sep"></span>
        <button type="button" title="Add link" (mousedown)="prevent($event)" (click)="createLink()" class="rte-btn">🔗</button>
        <button type="button" title="Remove link" (mousedown)="prevent($event)" (click)="cmd('unlink')" class="rte-btn">⛓️‍💥</button>
        <button type="button" title="Clear formatting" (mousedown)="prevent($event)" (click)="cmd('removeFormat')" class="rte-btn">⌫</button>
      </div>
      <div #editor contenteditable="true" [attr.dir]="dir()"
        (input)="onInput()" (blur)="onInput()"
        class="rte-surface min-h-[9rem] max-h-72 overflow-y-auto px-3 py-2 text-sm text-gray-800 focus:outline-none"
        [attr.data-placeholder]="placeholder()"></div>
    </div>
  `,
  styles: [`
    .rte-btn {
      min-width: 1.75rem; height: 1.75rem; padding: 0 .35rem;
      font-size: .8rem; color: #374151; border-radius: .25rem;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .rte-btn:hover { background: #e5e7eb; }
    .rte-sep { width: 1px; height: 1.1rem; background: #d1d5db; margin: 0 .15rem; }
    .rte-surface:empty::before { content: attr(data-placeholder); color: #9ca3af; }
    .rte-surface h2 { font-size: 1.25rem; font-weight: 700; margin: .5rem 0; }
    .rte-surface h3 { font-size: 1.1rem; font-weight: 600; margin: .4rem 0; }
    .rte-surface p { margin: .35rem 0; }
    .rte-surface ul { list-style: disc; padding-inline-start: 1.4rem; margin: .35rem 0; }
    .rte-surface ol { list-style: decimal; padding-inline-start: 1.4rem; margin: .35rem 0; }
    .rte-surface a { color: #2563eb; text-decoration: underline; }
  `]
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
