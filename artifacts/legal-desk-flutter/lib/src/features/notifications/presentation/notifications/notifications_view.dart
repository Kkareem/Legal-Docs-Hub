import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import 'notifications_view_model.dart';

class NotificationsView extends StatefulWidget {
  const NotificationsView({super.key});

  @override
  State<NotificationsView> createState() => _NotificationsViewState();
}

class _NotificationsViewState extends State<NotificationsView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<NotificationsViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<NotificationsViewModel>();

    return RefreshIndicator(
      onRefresh: viewModel.load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (viewModel.unreadCount > 0)
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                onPressed: viewModel.markAllRead,
                icon: const Icon(Icons.done_all_outlined),
                label: Text('تعليم الكل كمقروء (${viewModel.unreadCount})'),
              ),
            ),
          const SizedBox(height: 12),
          if (viewModel.state == AsyncState.loading && viewModel.notifications.isEmpty)
            const SizedBox(height: 420, child: AppLoading(message: 'جارٍ تحميل الإشعارات...'))
          else if (viewModel.notifications.isEmpty)
            const SizedBox(height: 420, child: AppEmptyState(message: 'لا توجد إشعارات'))
          else
            ...viewModel.notifications.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  borderRadius: BorderRadius.circular(18),
                  onTap: item.read ? null : () => viewModel.markRead(item),
                  child: AppCard(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: item.read ? const Color(0xFFF1F5F9) : const Color(0xFFE8F0FC),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(_iconForType(item.type)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      item.title,
                                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                            fontWeight: item.read ? FontWeight.w600 : FontWeight.w800,
                                          ),
                                    ),
                                  ),
                                  if (!item.read)
                                    const CircleAvatar(
                                      radius: 5,
                                      backgroundColor: Color(0xFF1E3A8A),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(item.body),
                              const SizedBox(height: 8),
                              Text(formatDateTime(item.createdAt, pattern: 'd MMM, hh:mm a'), style: const TextStyle(color: Color(0xFF64748B))),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  IconData _iconForType(String type) => switch (type) {
        'hearing' => Icons.calendar_month_outlined,
        'task' => Icons.task_alt_outlined,
        'payment' => Icons.payments_outlined,
        'poa' => Icons.description_outlined,
        'case' => Icons.warning_amber_rounded,
        _ => Icons.notifications_outlined,
      };
}
