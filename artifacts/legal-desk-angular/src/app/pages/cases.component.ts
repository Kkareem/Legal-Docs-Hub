import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { CaseItem, Client, CreateCaseBody, User } from '../core/models';

@Component({
  selector: 'app-cases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cases.component.html',
})
export class CasesComponent {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly cases = signal<CaseItem[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly users = signal<User[]>([]);
  readonly search = signal('');
  readonly showCreate = signal(false);
  readonly typeLabels: Record<string, string> = {
    civil: 'مدني',
    criminal: 'جنائي',
    commercial: 'تجاري',
    family: 'أسري',
    labor: 'عمالي',
    administrative: 'إداري',
    other: 'أخرى',
  };
  readonly statusLabels: Record<string, string> = {
    new: 'جديد',
    active: 'نشط',
    upcoming_hearing: 'جلسة قادمة',
    verdict: 'حكم',
    adjourned: 'مؤجل',
    closed: 'مغلق',
  };

  readonly form = signal<CreateCaseBody>({
    caseNumber: '',
    courtCaseNumber: '',
    type: 'civil',
    court: '',
    division: '',
    clientId: 0,
    leadLawyerId: undefined,
    status: 'new',
    opposingParty: '',
    description: '',
  });

  constructor() {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api.listCases().subscribe({
      next: (cases) => {
        this.cases.set(cases);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api.listClients().subscribe((clients) => this.clients.set(clients));
    this.api.listUsers().subscribe((users) => this.users.set(users));
  }

  filteredCases() {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.cases();
    return this.cases().filter((item) =>
      item.caseNumber.toLowerCase().includes(q) ||
      (item.clientName || '').toLowerCase().includes(q) ||
      (item.court || '').toLowerCase().includes(q) ||
      (item.opposingParty || '').toLowerCase().includes(q),
    );
  }

  updateForm<K extends keyof CreateCaseBody>(key: K, value: CreateCaseBody[K]) {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  create() {
    const payload = this.form();
    if (!payload.caseNumber.trim() || !payload.clientId) return;

    this.saving.set(true);
    this.api.createCase(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showCreate.set(false);
        this.form.set({
          caseNumber: '',
          courtCaseNumber: '',
          type: 'civil',
          court: '',
          division: '',
          clientId: 0,
          leadLawyerId: undefined,
          status: 'new',
          opposingParty: '',
          description: '',
        });
        this.refresh();
      },
      error: () => this.saving.set(false),
    });
  }

  remove(item: CaseItem) {
    if (!confirm(`حذف القضية "${item.caseNumber}"؟`)) return;
    this.api.deleteCase(item.id).subscribe(() => this.refresh());
  }
}
