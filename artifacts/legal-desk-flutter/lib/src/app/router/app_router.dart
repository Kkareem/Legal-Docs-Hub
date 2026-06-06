import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/presentation/login/login_view.dart';
import '../../features/case_detail/presentation/case_detail/case_detail_view.dart';
import '../../features/cases/presentation/cases/cases_view.dart';
import '../../features/client_detail/presentation/client_detail/client_detail_view.dart';
import '../../features/clients/presentation/clients/clients_view.dart';
import '../../features/consultations/presentation/consultations/consultations_view.dart';
import '../../features/dashboard/presentation/dashboard/dashboard_view.dart';
import '../../features/documents/presentation/documents/documents_view.dart';
import '../../features/hearings/presentation/hearings/hearings_view.dart';
import '../../features/home/presentation/home_shell.dart';
import '../../features/more/presentation/more_view.dart';
import '../../features/notifications/presentation/notifications/notifications_view.dart';
import '../../features/payments/presentation/payments/payments_view.dart';
import '../../features/poa/presentation/poa/poa_view.dart';
import '../../features/profile/presentation/profile/profile_view.dart';
import '../../features/search/presentation/search/search_view.dart';
import '../../features/tasks/presentation/tasks/tasks_view.dart';
import '../../features/users/presentation/users/users_view.dart';

GoRouter buildAppRouter(BuildContext context) {
  final authRepository = context.read<AuthRepository>();

  return GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: authRepository,
    redirect: (context, state) {
      final authState = authRepository.state;
      final isLoggingIn = state.matchedLocation == '/login';

      if (authState == AuthState.unknown) {
        return isLoggingIn ? null : '/login';
      }
      if (authState == AuthState.unauthenticated) {
        return isLoggingIn ? null : '/login';
      }
      if (authState == AuthState.authenticated && isLoggingIn) {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginView()),
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(path: '/dashboard', builder: (context, state) => const DashboardView()),
          GoRoute(path: '/clients', builder: (context, state) => const ClientsView()),
          GoRoute(path: '/clients/:id', builder: (context, state) => ClientDetailView(clientId: int.parse(state.pathParameters['id']!))),
          GoRoute(path: '/cases', builder: (context, state) => const CasesView()),
          GoRoute(path: '/cases/:id', builder: (context, state) => CaseDetailView(caseId: int.parse(state.pathParameters['id']!))),
          GoRoute(path: '/tasks', builder: (context, state) => const TasksView()),
          GoRoute(path: '/more', builder: (context, state) => const MoreView()),
          GoRoute(path: '/hearings', builder: (context, state) => const HearingsView()),
          GoRoute(path: '/consultations', builder: (context, state) => const ConsultationsView()),
          GoRoute(path: '/payments', builder: (context, state) => const PaymentsView()),
          GoRoute(path: '/documents', builder: (context, state) => const DocumentsView()),
          GoRoute(path: '/powers-of-attorney', builder: (context, state) => const PowerOfAttorneyView()),
          GoRoute(path: '/search', builder: (context, state) => const SearchView()),
          GoRoute(path: '/notifications', builder: (context, state) => const NotificationsView()),
          GoRoute(path: '/profile', builder: (context, state) => const ProfileView()),
          GoRoute(path: '/users', builder: (context, state) => const UsersView()),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(body: Center(child: Text('Page not found: ${state.uri}'))),
  );
}
