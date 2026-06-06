import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page-shell">
      <div class="card empty-state">
        <h1 class="section-title">الصفحة غير موجودة</h1>
        <p class="section-subtitle">المسار المطلوب غير متاح في نسخة Angular الحالية.</p>
        <div style="margin-top: 20px;">
          <a class="btn btn-primary" routerLink="/dashboard">العودة للوحة التحكم</a>
        </div>
      </div>
    </section>
  `,
})
export class NotFoundComponent {}
