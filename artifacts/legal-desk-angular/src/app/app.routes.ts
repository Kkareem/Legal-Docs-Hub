import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login.component';
import { DashboardComponent } from './pages/dashboard.component';
import { ClientsComponent } from './pages/clients.component';
import { CasesComponent } from './pages/cases.component';
import { TasksComponent } from './pages/tasks.component';
import { NotFoundComponent } from './pages/not-found.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'cases', component: CasesComponent },
      { path: 'tasks', component: TasksComponent },
    ],
  },
  { path: '**', component: NotFoundComponent },
];
