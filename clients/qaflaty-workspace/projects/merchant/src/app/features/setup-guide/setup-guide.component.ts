import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SetupGuideService } from './services/setup-guide.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { SetupTask, SetupPhase, SetupPhaseGroup } from './models/setup-task.model';

@Component({
  selector: 'app-setup-guide',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './setup-guide.component.html'
})
export class SetupGuideComponent {
  private setupGuideService = inject(SetupGuideService);
  private storeContext = inject(StoreContextService);

  tasks = signal<SetupTask[]>([]);
  loading = signal(true);
  collapsed = signal(false);
  dismissed = signal(false);

  storeId = this.storeContext.currentStoreId;

  progress = computed(() =>
    this.tasks()
      .filter(t => t.isComplete)
      .reduce((sum, t) => sum + t.weight, 0)
  );

  completedCount = computed(() => this.tasks().filter(t => t.isComplete).length);
  totalCount = computed(() => this.tasks().length);

  nextTask = computed((): SetupTask | null =>
    this.tasks().find(t => !t.isComplete && t.priority === 'required') ??
    this.tasks().find(t => !t.isComplete) ??
    null
  );

  phaseGroups = computed((): SetupPhaseGroup[] => {
    const tasks = this.tasks();
    const phases: SetupPhase[] = [1, 2, 3, 4];
    return phases
      .map(phase => {
        const phaseTasks = tasks.filter(t => t.phase === phase);
        if (phaseTasks.length === 0) return null;
        const completedCount = phaseTasks.filter(t => t.isComplete).length;
        return {
          phase,
          name: phaseTasks[0].phaseName,
          tasks: phaseTasks,
          completedCount,
          totalCount: phaseTasks.length,
          isComplete: completedCount === phaseTasks.length,
        } as SetupPhaseGroup;
      })
      .filter((g): g is SetupPhaseGroup => g !== null);
  });

  constructor() {
    effect(() => {
      const storeId = this.storeContext.currentStoreId();
      if (storeId) {
        this.checkDismissed(storeId);
        if (!this.dismissed()) {
          this.loadTasks(storeId);
        }
      }
    });
  }

  private checkDismissed(storeId: string): void {
    this.dismissed.set(localStorage.getItem(`setup-guide-dismissed-${storeId}`) === 'true');
  }

  private loadTasks(storeId: string): void {
    this.loading.set(true);
    this.setupGuideService.loadTasks(storeId).subscribe({
      next: tasks => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }

  dismiss(): void {
    const storeId = this.storeContext.currentStoreId();
    if (storeId) {
      localStorage.setItem(`setup-guide-dismissed-${storeId}`, 'true');
      this.dismissed.set(true);
    }
  }
}
