import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import 'dashboard_view_model.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({super.key});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<DashboardViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<DashboardViewModel>();
    final currency = NumberFormat.currency(locale: 'ar_SA', symbol: 'SAR ', decimalDigits: 0);

    if (viewModel.state == AsyncState.loading && viewModel.summary == null) {
      return const AppLoading();
    }

    if (viewModel.state == AsyncState.error && viewModel.summary == null) {
      return AppEmptyState(message: viewModel.error ?? 'حدث خطأ');
    }

    final summary = viewModel.summary;
    if (summary == null) {
      return const AppEmptyState(message: 'لا توجد بيانات متاحة');
    }

    return RefreshIndicator(
      onRefresh: viewModel.load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'لوحة التحكم',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(
            'نظرة عامة على المكتب القانوني',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF64748B)),
          ),
          const SizedBox(height: 18),
          GridView.count(
            crossAxisCount: MediaQuery.of(context).size.width > 800 ? 4 : 2,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            childAspectRatio: 1.35,
            children: [
              _StatCard(label: 'القضايا النشطة', value: summary.activeCases.toString(), icon: Icons.gavel_outlined),
              _StatCard(label: 'الموكلون', value: summary.totalClients.toString(), icon: Icons.people_alt_outlined),
              _StatCard(label: 'المهام المعلقة', value: summary.pendingTasks.toString(), icon: Icons.task_alt_outlined),
              _StatCard(label: 'جلسات اليوم', value: summary.todayHearings.toString(), icon: Icons.event_note_outlined),
              _StatCard(label: 'المتأخر', value: summary.overdueTasks.toString(), icon: Icons.warning_amber_rounded),
              _StatCard(label: 'الاستشارات المعلقة', value: summary.pendingConsultations.toString(), icon: Icons.chat_bubble_outline),
              _StatCard(label: 'الوكالات خارج المكتب', value: summary.powersOfAttorneyOut.toString(), icon: Icons.assignment_return_outlined),
              _StatCard(label: 'الدفعات المعلقة', value: currency.format(summary.totalPendingPayments), icon: Icons.payments_outlined),
            ],
          ),
          const SizedBox(height: 18),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('الجلسات القادمة', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                if (viewModel.hearings.isEmpty)
                  const AppEmptyState(message: 'لا توجد جلسات قادمة')
                else
                  ...viewModel.hearings.map(
                    (hearing) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(hearing.court ?? 'محكمة غير محددة'),
                      subtitle: Text(hearing.caseNumber ?? '#${hearing.caseId}'),
                      trailing: Text(DateFormat('d MMM, hh:mm a', 'ar').format(DateTime.parse(hearing.datetime))),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('المهام المتأخرة', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                if (viewModel.overdueTasks.isEmpty)
                  const AppEmptyState(message: 'لا توجد مهام متأخرة')
                else
                  ...viewModel.overdueTasks.map(
                    (task) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(task.title),
                      subtitle: Text(task.assigneeName ?? 'غير محدد'),
                      trailing: Text(task.dueDate ?? '—'),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const Spacer(),
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF64748B))),
          const SizedBox(height: 6),
          Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}
