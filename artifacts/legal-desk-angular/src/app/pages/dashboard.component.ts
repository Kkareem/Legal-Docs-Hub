import {CurrencyService} from '../core/currency.service';
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ActivityItem, DashboardSummary, Hearing, PaymentSummary, TaskItem } from '../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
 readonly currency=inject(CurrencyService);
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly hearings = signal<Hearing[]>([]);
  readonly overdueTasks = signal<TaskItem[]>([]);
  readonly paymentSummary = signal<PaymentSummary | null>(null);
  readonly recentActivity = signal<ActivityItem[]>([]);

  constructor() {
    forkJoin({
      summary: this.api.getDashboardSummary(),
      hearings: this.api.getUpcomingHearings(),
      overdueTasks: this.api.getOverdueTasks(),
      paymentSummary: this.api.getPaymentSummary(),
      recentActivity: this.api.getRecentActivity(),
    }).subscribe({
      next: (result) => {
        this.summary.set(result.summary);
        this.hearings.set(result.hearings);
        this.overdueTasks.set(result.overdueTasks);
        this.paymentSummary.set(result.paymentSummary);
        this.recentActivity.set(result.recentActivity);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatCurrency(value: number) {
    return this.currency.format(value);
  }
}
