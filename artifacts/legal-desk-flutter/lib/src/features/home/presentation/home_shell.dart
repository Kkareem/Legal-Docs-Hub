import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../auth/data/auth_repository.dart';

class HomeShell extends StatelessWidget {
  const HomeShell({
    required this.child,
    super.key,
  });

  final Widget child;

  static const _tabs = [
    ('/dashboard', 'لوحة التحكم', Icons.dashboard_outlined),
    ('/clients', 'الموكلون', Icons.people_outline),
    ('/cases', 'القضايا', Icons.gavel_outlined),
    ('/tasks', 'المهام', Icons.task_alt_outlined),
    ('/more', 'المزيد', Icons.apps_outlined),
  ];

  static const _pageTitles = {
    '/dashboard': 'لوحة التحكم',
    '/clients': 'الموكلون',
    '/cases': 'القضايا',
    '/tasks': 'المهام',
    '/more': 'المزيد',
    '/hearings': 'الجلسات',
    '/consultations': 'الاستشارات',
    '/payments': 'المدفوعات',
    '/documents': 'المستندات',
    '/powers-of-attorney': 'الوكالات',
    '/search': 'البحث العام',
    '/notifications': 'الإشعارات',
    '/profile': 'الملف الشخصي',
    '/users': 'فريق العمل',
  };

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final authRepository = context.watch<AuthRepository>();

    int currentIndex = _tabs.indexWhere((tab) => location.startsWith(tab.$1));
    if (currentIndex < 0) {
      if (location.startsWith('/hearings') ||
          location.startsWith('/consultations') ||
          location.startsWith('/payments') ||
          location.startsWith('/documents') ||
          location.startsWith('/powers-of-attorney') ||
          location.startsWith('/search') ||
          location.startsWith('/notifications') ||
          location.startsWith('/profile') ||
          location.startsWith('/users')) {
        currentIndex = _tabs.indexWhere((tab) => tab.$1 == '/more');
      }
    }
    if (currentIndex < 0) currentIndex = 0;

    final currentTitle = _pageTitles.entries
        .firstWhere(
          (entry) => location.startsWith(entry.key),
          orElse: () => const MapEntry('/dashboard', 'لوحة التحكم'),
        )
        .value;

    return Scaffold(
      appBar: AppBar(
        title: Text(currentTitle),
        actions: [
          IconButton(
            onPressed: () => context.go('/search'),
            icon: const Icon(Icons.search),
            tooltip: 'البحث',
          ),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(authRepository.currentUser?.name ?? ''),
            ),
          ),
          IconButton(
            onPressed: () => authRepository.logout(),
            icon: const Icon(Icons.logout),
            tooltip: 'تسجيل الخروج',
          ),
        ],
      ),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        destinations: _tabs
            .map((tab) => NavigationDestination(icon: Icon(tab.$3), label: tab.$2))
            .toList(growable: false),
        onDestinationSelected: (index) => context.go(_tabs[index].$1),
      ),
    );
  }
}
