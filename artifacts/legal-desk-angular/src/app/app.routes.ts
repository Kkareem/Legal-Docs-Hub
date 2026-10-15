import {NotificationsComponent} from './pages/notifications.component';
import { Routes } from '@angular/router';
import { authGuard, adminGuard, passwordGuard, staffGuard, clientGuard } from './core/auth.guard';
import {ClientPortalComponent} from './pages/client-portal.component';
import {PaymentManagementComponent} from './pages/payment-management.component';
import { LawyersComponent } from './pages/lawyers.component';
import { ChangePasswordComponent } from './pages/change-password.component';
import { ConsultationRequestsComponent } from './pages/consultation-requests.component';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login.component';
import { DashboardComponent } from './pages/dashboard.component';
import { ClientsComponent } from './pages/clients.component';
import { CasesComponent } from './pages/cases.component';
import { TasksComponent } from './pages/tasks.component';
import { NotFoundComponent } from './pages/not-found.component';

export const routes: Routes = [
  {path:'',pathMatch:'full',loadComponent:()=>import('./pages/home.component').then(m=>m.HomeComponent)},
  {path:'notifications',component:NotificationsComponent,canActivate:[authGuard]},
  {path:'settings',loadComponent:()=>import('./pages/settings.component').then(m=>m.SettingsComponent),canActivate:[authGuard]},
  {path:'my-account',component:ClientPortalComponent,canActivate:[authGuard,clientGuard]},
  { path: 'consultation', loadComponent:()=>import('./pages/public-consultation.component').then(m=>m.PublicConsultationComponent) },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [passwordGuard] },
  {path:'forgot-password',loadComponent:()=>import('./pages/password-recovery.component').then(m=>m.PasswordRecoveryComponent)},
  {path:'reset-password',loadComponent:()=>import('./pages/password-recovery.component').then(m=>m.PasswordRecoveryComponent)},
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard,staffGuard],
    canActivateChild: [authGuard,staffGuard],
    children: [
      {path:'case-workspace/:id',loadComponent:()=>import('./pages/case-workspace.component').then(m=>m.CaseWorkspaceComponent),canActivate:[staffGuard]},
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
