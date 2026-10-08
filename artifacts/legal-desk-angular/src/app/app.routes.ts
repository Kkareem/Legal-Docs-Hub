import {NotificationsComponent} from './pages/notifications.component';
import {SettingsComponent} from './pages/settings.component';
import { Routes } from '@angular/router';
import { authGuard, adminGuard, passwordGuard, staffGuard, clientGuard } from './core/auth.guard';
import {ClientPortalComponent} from './pages/client-portal.component';
import {CaseWorkspaceComponent} from './pages/case-workspace.component';
import {PaymentManagementComponent} from './pages/payment-management.component';
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
  {path:'notifications',component:NotificationsComponent,canActivate:[authGuard]},
  {path:'settings',component:SettingsComponent,canActivate:[authGuard]},
  {path:'my-account',component:ClientPortalComponent,canActivate:[authGuard,clientGuard]},
  { path: 'consultation', component: PublicConsultationComponent },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [passwordGuard] },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard,staffGuard],
    canActivateChild: [authGuard,staffGuard],
    children: [
      {path:'case-workspace/:id',component:CaseWorkspaceComponent,canActivate:[staffGuard]},
      {path:'payment-management',component:PaymentManagementComponent,canActivate:[adminGuard]},
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
