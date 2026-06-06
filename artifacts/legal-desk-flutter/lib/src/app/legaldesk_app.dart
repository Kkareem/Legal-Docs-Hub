import 'package:flutter/material.dart';

import 'router/app_router.dart';
import 'theme/app_theme.dart';

class LegalDeskApp extends StatelessWidget {
  const LegalDeskApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = buildAppRouter(context);

    return MaterialApp.router(
      title: 'LegalDesk',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      theme: AppTheme.light(),
      locale: const Locale('ar'),
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
