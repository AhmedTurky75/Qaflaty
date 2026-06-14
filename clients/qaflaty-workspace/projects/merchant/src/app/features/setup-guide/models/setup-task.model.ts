export type SetupPhase = 1 | 2 | 3 | 4;
export type TaskPriority = 'required' | 'optional';

export interface SetupTask {
  id: string;
  phase: SetupPhase;
  phaseName: string;
  title: string;
  description: string;
  route: string;
  priority: TaskPriority;
  weight: number;
  icon: string;
  isComplete: boolean;
}

export interface SetupPhaseGroup {
  phase: SetupPhase;
  name: string;
  tasks: SetupTask[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
}
