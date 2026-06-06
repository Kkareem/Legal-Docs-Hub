import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/config/app_config.dart';
import '../core/network/api_client.dart';
import '../features/auth/data/auth_api_service.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/auth/presentation/login/login_view_model.dart';
import '../features/case_detail/presentation/case_detail/case_detail_view_model.dart';
import '../features/cases/data/cases_api_service.dart';
import '../features/cases/data/cases_repository.dart';
import '../features/cases/presentation/cases/cases_view_model.dart';
import '../features/client_detail/presentation/client_detail/client_detail_view_model.dart';
import '../features/clients/data/clients_api_service.dart';
import '../features/clients/data/clients_repository.dart';
import '../features/clients/presentation/clients/clients_view_model.dart';
import '../features/consultations/data/consultations_api_service.dart';
import '../features/consultations/data/consultations_repository.dart';
import '../features/consultations/presentation/consultations/consultations_view_model.dart';
import '../features/dashboard/data/dashboard_api_service.dart';
import '../features/dashboard/data/dashboard_repository.dart';
import '../features/dashboard/presentation/dashboard/dashboard_view_model.dart';
import '../features/documents/data/documents_api_service.dart';
import '../features/documents/data/documents_repository.dart';
import '../features/documents/presentation/documents/documents_view_model.dart';
import '../features/hearings/data/hearings_api_service.dart';
import '../features/hearings/data/hearings_repository.dart';
import '../features/hearings/presentation/hearings/hearings_view_model.dart';
import '../features/notifications/data/notifications_api_service.dart';
import '../features/notifications/data/notifications_repository.dart';
import '../features/notifications/presentation/notifications/notifications_view_model.dart';
import '../features/payments/data/payments_api_service.dart';
import '../features/payments/data/payments_repository.dart';
import '../features/payments/presentation/payments/payments_view_model.dart';
import '../features/poa/data/poa_api_service.dart';
import '../features/poa/data/poa_repository.dart';
import '../features/poa/presentation/poa/poa_view_model.dart';
import '../features/profile/presentation/profile/profile_view_model.dart';
import '../features/search/data/search_api_service.dart';
import '../features/search/data/search_repository.dart';
import '../features/search/presentation/search/search_view_model.dart';
import '../features/tasks/data/tasks_api_service.dart';
import '../features/tasks/data/tasks_repository.dart';
import '../features/tasks/presentation/tasks/tasks_view_model.dart';
import '../features/users/data/users_api_service.dart';
import '../features/users/data/users_repository.dart';
import '../features/users/presentation/users/users_view_model.dart';
import 'legaldesk_app.dart';

class AppBootstrap {
  AppBootstrap._(this.app);

  final Widget app;

  static Future<AppBootstrap> create() async {
    final sharedPreferences = await SharedPreferences.getInstance();
    final config = AppConfig.fromEnvironment(sharedPreferences);
    final dio = await ApiClientFactory.create(config);

    final authService = AuthApiService(dio);
    final dashboardService = DashboardApiService(dio);
    final clientsService = ClientsApiService(dio);
    final casesService = CasesApiService(dio);
    final tasksService = TasksApiService(dio);
    final usersService = UsersApiService(dio);
    final hearingsService = HearingsApiService(dio);
    final consultationsService = ConsultationsApiService(dio);
    final paymentsService = PaymentsApiService(dio);
    final documentsService = DocumentsApiService(dio);
    final notificationsService = NotificationsApiService(dio);
    final poaService = PowerOfAttorneyApiService(dio);
    final searchService = SearchApiService(dio);

    final authRepository = AuthRepository(authService, sharedPreferences)..restoreSession();
    final dashboardRepository = DashboardRepository(dashboardService);
    final clientsRepository = ClientsRepository(clientsService);
    final casesRepository = CasesRepository(casesService);
    final tasksRepository = TasksRepository(tasksService);
    final usersRepository = UsersRepository(usersService);
    final hearingsRepository = HearingsRepository(hearingsService);
    final consultationsRepository = ConsultationsRepository(consultationsService);
    final paymentsRepository = PaymentsRepository(paymentsService);
    final documentsRepository = DocumentsRepository(documentsService);
    final notificationsRepository = NotificationsRepository(notificationsService);
    final poaRepository = PowerOfAttorneyRepository(poaService);
    final searchRepository = SearchRepository(searchService);

    final app = MultiProvider(
      providers: [
        Provider.value(value: config),
        Provider.value(value: dio),
        Provider.value(value: sharedPreferences),
        ChangeNotifierProvider.value(value: authRepository),
        Provider.value(value: dashboardRepository),
        Provider.value(value: clientsRepository),
        Provider.value(value: casesRepository),
        Provider.value(value: tasksRepository),
        Provider.value(value: usersRepository),
        Provider.value(value: hearingsRepository),
        Provider.value(value: consultationsRepository),
        Provider.value(value: paymentsRepository),
        Provider.value(value: documentsRepository),
        Provider.value(value: notificationsRepository),
        Provider.value(value: poaRepository),
        Provider.value(value: searchRepository),
        ChangeNotifierProxyProvider<AuthRepository, LoginViewModel>(
          create: (context) => LoginViewModel(context.read<AuthRepository>()),
          update: (context, authRepository, previous) => previous ?? LoginViewModel(authRepository),
        ),
        ChangeNotifierProxyProvider<DashboardRepository, DashboardViewModel>(
          create: (context) => DashboardViewModel(context.read<DashboardRepository>()),
          update: (context, dashboardRepository, previous) => previous ?? DashboardViewModel(dashboardRepository),
        ),
        ChangeNotifierProxyProvider2<ClientsRepository, AuthRepository, ClientsViewModel>(
          create: (context) => ClientsViewModel(context.read<ClientsRepository>(), context.read<AuthRepository>()),
          update: (context, clientsRepository, authRepository, previous) => previous ?? ClientsViewModel(clientsRepository, authRepository),
        ),
        ChangeNotifierProxyProvider3<CasesRepository, ClientsRepository, UsersRepository, CasesViewModel>(
          create: (context) => CasesViewModel(context.read<CasesRepository>(), context.read<ClientsRepository>(), context.read<UsersRepository>()),
          update: (context, casesRepository, clientsRepository, usersRepository, previous) => previous ?? CasesViewModel(casesRepository, clientsRepository, usersRepository),
        ),
        ChangeNotifierProxyProvider3<TasksRepository, CasesRepository, UsersRepository, TasksViewModel>(
          create: (context) => TasksViewModel(context.read<TasksRepository>(), context.read<CasesRepository>(), context.read<UsersRepository>()),
          update: (context, tasksRepository, casesRepository, usersRepository, previous) => previous ?? TasksViewModel(tasksRepository, casesRepository, usersRepository),
        ),
        ChangeNotifierProxyProvider3<HearingsRepository, CasesRepository, UsersRepository, HearingsViewModel>(
          create: (context) => HearingsViewModel(context.read<HearingsRepository>(), context.read<CasesRepository>(), context.read<UsersRepository>()),
          update: (context, hearingsRepository, casesRepository, usersRepository, previous) => previous ?? HearingsViewModel(hearingsRepository, casesRepository, usersRepository),
        ),
        ChangeNotifierProxyProvider3<ConsultationsRepository, ClientsRepository, UsersRepository, ConsultationsViewModel>(
          create: (context) => ConsultationsViewModel(context.read<ConsultationsRepository>(), context.read<ClientsRepository>(), context.read<UsersRepository>()),
          update: (context, consultationsRepository, clientsRepository, usersRepository, previous) => previous ?? ConsultationsViewModel(consultationsRepository, clientsRepository, usersRepository),
        ),
        ChangeNotifierProxyProvider3<PaymentsRepository, ClientsRepository, CasesRepository, PaymentsViewModel>(
          create: (context) => PaymentsViewModel(context.read<PaymentsRepository>(), context.read<ClientsRepository>(), context.read<CasesRepository>()),
          update: (context, paymentsRepository, clientsRepository, casesRepository, previous) => previous ?? PaymentsViewModel(paymentsRepository, clientsRepository, casesRepository),
        ),
        ChangeNotifierProxyProvider4<DocumentsRepository, AuthRepository, CasesRepository, ClientsRepository, DocumentsViewModel>(
          create: (context) => DocumentsViewModel(context.read<DocumentsRepository>(), context.read<AuthRepository>(), context.read<CasesRepository>(), context.read<ClientsRepository>()),
          update: (context, documentsRepository, authRepository, casesRepository, clientsRepository, previous) => previous ?? DocumentsViewModel(documentsRepository, authRepository, casesRepository, clientsRepository),
        ),
        ChangeNotifierProxyProvider<NotificationsRepository, NotificationsViewModel>(
          create: (context) => NotificationsViewModel(context.read<NotificationsRepository>()),
          update: (context, notificationsRepository, previous) => previous ?? NotificationsViewModel(notificationsRepository),
        ),
        ChangeNotifierProxyProvider4<PowerOfAttorneyRepository, ClientsRepository, CasesRepository, UsersRepository, PowerOfAttorneyViewModel>(
          create: (context) => PowerOfAttorneyViewModel(context.read<PowerOfAttorneyRepository>(), context.read<ClientsRepository>(), context.read<CasesRepository>(), context.read<UsersRepository>()),
          update: (context, poaRepository, clientsRepository, casesRepository, usersRepository, previous) => previous ?? PowerOfAttorneyViewModel(poaRepository, clientsRepository, casesRepository, usersRepository),
        ),
        ChangeNotifierProxyProvider<SearchRepository, SearchViewModel>(
          create: (context) => SearchViewModel(context.read<SearchRepository>()),
          update: (context, searchRepository, previous) => previous ?? SearchViewModel(searchRepository),
        ),
        ChangeNotifierProxyProvider2<AuthRepository, UsersRepository, ProfileViewModel>(
          create: (context) => ProfileViewModel(context.read<AuthRepository>(), context.read<UsersRepository>()),
          update: (context, authRepository, usersRepository, previous) => previous ?? ProfileViewModel(authRepository, usersRepository),
        ),
        ChangeNotifierProxyProvider2<UsersRepository, AuthRepository, UsersViewModel>(
          create: (context) => UsersViewModel(context.read<UsersRepository>(), context.read<AuthRepository>()),
          update: (context, usersRepository, authRepository, previous) => previous ?? UsersViewModel(usersRepository, authRepository),
        ),
        ChangeNotifierProxyProvider4<ClientsRepository, CasesRepository, PaymentsRepository, DocumentsRepository, ClientDetailViewModel>(
          create: (context) => ClientDetailViewModel(context.read<ClientsRepository>(), context.read<CasesRepository>(), context.read<PaymentsRepository>(), context.read<DocumentsRepository>()),
          update: (context, clientsRepository, casesRepository, paymentsRepository, documentsRepository, previous) =>
              previous ?? ClientDetailViewModel(clientsRepository, casesRepository, paymentsRepository, documentsRepository),
        ),
        ChangeNotifierProxyProvider4<CasesRepository, HearingsRepository, TasksRepository, DocumentsRepository, CaseDetailViewModel>(
          create: (context) => CaseDetailViewModel(context.read<CasesRepository>(), context.read<HearingsRepository>(), context.read<TasksRepository>(), context.read<DocumentsRepository>()),
          update: (context, casesRepository, hearingsRepository, tasksRepository, documentsRepository, previous) =>
              previous ?? CaseDetailViewModel(casesRepository, hearingsRepository, tasksRepository, documentsRepository),
        ),
      ],
      child: const LegalDeskApp(),
    );

    return AppBootstrap._(app);
  }
}
