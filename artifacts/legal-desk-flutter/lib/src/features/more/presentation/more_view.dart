import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../auth/data/auth_repository.dart';

class MoreView extends StatelessWidget {
  const MoreView({super.key});

  @override
  Widget build(BuildContext context) {
    final authRepository = context.watch<AuthRepository>();
    final user = authRepository.currentUser;

    final items = [
      ('/hearings', 'الجلسات', Icons.calendar_month_outlined),
      ('/consultations', 'الاستشارات', Icons.chat_bubble_outline),
      ('/payments', 'المدفوعات', Icons.payments_outlined),
      ('/documents', 'المستندات', Icons.description_outlined),
      ('/powers-of-attorney', 'الوكالات', Icons.assignment_return_outlined),
      ('/search', 'البحث العام', Icons.search),
      ('/notifications', 'الإشعارات', Icons.notifications_outlined),
      ('/profile', 'الملف الشخصي', Icons.person_outline),
      if (user?.role == 'owner') ('/users', 'فريق العمل', Icons.groups_outlined),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('المزيد', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 6),
        const Text('وحدات الإدارة والتشغيل الإضافية', style: TextStyle(color: Color(0xFF64748B))),
        const SizedBox(height: 18),
        ...items.map(
          (item) => Card(
            child: ListTile(
              onTap: () => context.go(item.$1),
              leading: Icon(item.$3),
              title: Text(item.$2),
              trailing: const Icon(Icons.chevron_right),
            ),
          ),
        ),
      ],
    );
  }
}
