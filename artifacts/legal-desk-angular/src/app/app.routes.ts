import { Routes } from '@angular/router';
import { authGuard, adminGuard, passwordGuard, staffGuard } from './core/auth.guard';
import { LawyersComponent } from './pages/lawyers.component';
import { ChangePasswordComponent } from './pages/change-password.component';
import { PublicConsultationComponent } from './pages/public-consultation.component';
import { ConsultationRequestsComponent } from './pages/consultation-requests.component';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login.component';
import { DashboardComponent } from './pages/dashboard.component';
import { ClientsComponent } from './pages/clients.component';
import { CasesComponent } from './pages/cases.component';
import { TasksComponent } from './pages/tasks.component';
import { NotFoundComponent } from './pages/not-found.component';

export const routes: Routes = [
  { path: 'consultation', component: PublicConsultationComponent },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [passwordGuard] },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: 'lawyers', component: LawyersComponent, canActivate: [adminGuard] },
      { path: 'consultation-requests', component: ConsultationRequestsComponent, canActivate: [staffGuard] },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'cases', component: CasesComponent },
      { path: 'tasks', component: TasksComponent },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
