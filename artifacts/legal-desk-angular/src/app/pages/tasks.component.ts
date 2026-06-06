import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { CaseItem, CreateTaskBody, TaskItem, User } from '../core/models';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
})
export class TasksComponent {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly tasks = signal<TaskItem[]>([]);
  readonly users = signal<User[]>([]);
  readonly cases = signal<CaseItem[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal('all');
  readonly priorityFilter = signal('all');
  readonly showCreate = signal(false);
  readonly form = signal<CreateTaskBody>({
    title: '',
    description: '',
    caseId: undefined,
    assignedTo: undefined,
    dueDate: '',
    priority: 'medium',
    status: 'new',
  });

  readonly statusLabels: Record<string, string> = {
    new: 'جديد',
    in_progress: 'قيد التنفيذ',
    done: 'مكتمل',
    needs_review: 'مراجعة',
    overdue: 'متأخر',
    cancelled: 'ملغى',
  };

  readonly priorityLabels: Record<string, string> = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجلة',
  };

  constructor() {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api
      .listTasks({
        status: this.statusFilter() === 'all' ? undefined : this.statusFilter(),
        priority: this.priorityFilter() === 'all' ? undefined : this.priorityFilter(),
      })
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    this.api.listUsers().subscribe((users) => this.users.set(users));
    this.api.listCases().subscribe((cases) => this.cases.set(cases));
  }

  filteredTasks() {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.tasks();
    return this.tasks().filter((task) => task.title.toLowerCase().includes(q));
  }

  updateForm<K extends keyof CreateTaskBody>(key: K, value: CreateTaskBody[K]) {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  create() {
    const payload = this.form();
    if (!payload.title?.trim()) return;
    this.saving.set(true);
    this.api.createTask(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showCreate.set(false);
        this.form.set({
          title: '',
          description: '',
          caseId: undefined,
          assignedTo: undefined,
          dueDate: '',
          priority: 'medium',
          status: 'new',
        });
        this.refresh();
      },
      error: () => this.saving.set(false),
    });
  }

  markDone(task: TaskItem) {
    this.api.updateTask(task.id, { status: 'done' }).subscribe(() => this.refresh());
  }

  remove(task: TaskItem) {
    if (!confirm(`حذف المهمة "${task.title}"؟`)) return;
    this.api.deleteTask(task.id).subscribe(() => this.refresh());
  }
}
