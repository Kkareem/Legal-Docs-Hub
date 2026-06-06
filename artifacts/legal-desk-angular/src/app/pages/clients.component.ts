import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Client, CreateClientBody } from '../core/models';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
})
export class ClientsComponent {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly clients = signal<Client[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal('all');
  readonly showCreate = signal(false);
  readonly form = signal<CreateClientBody>({
    name: '',
    phone: '',
    email: '',
    nationalId: '',
    serviceType: '',
    status: 'new',
  });

  readonly statusLabels: Record<string, string> = {
    new: 'جديد',
    active: 'نشط',
    pending: 'معلق',
    completed: 'مكتمل',
    closed: 'مغلق',
  };

  constructor() {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.api
      .listClients({
        search: this.search() || undefined,
        status: this.statusFilter() === 'all' ? undefined : this.statusFilter(),
      })
      .subscribe({
        next: (clients) => {
          this.clients.set(clients);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  updateForm<K extends keyof CreateClientBody>(key: K, value: CreateClientBody[K]) {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  create() {
    const payload = this.form();
    if (!payload.name?.trim()) return;

    this.saving.set(true);
    this.api.createClient(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showCreate.set(false);
        this.form.set({ name: '', phone: '', email: '', nationalId: '', serviceType: '', status: 'new' });
        this.refresh();
      },
      error: () => this.saving.set(false),
    });
  }

  remove(client: Client) {
    if (!confirm(`حذف الموكل "${client.name}"؟`)) return;
    this.api.deleteClient(client.id).subscribe(() => this.refresh());
  }
}
