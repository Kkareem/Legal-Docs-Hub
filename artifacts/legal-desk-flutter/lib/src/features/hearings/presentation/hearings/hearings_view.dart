import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import '../../data/hearing_models.dart';
import 'hearings_view_model.dart';

class HearingsView extends StatefulWidget {
  const HearingsView({super.key});

  @override
  State<HearingsView> createState() => _HearingsViewState();
}

class _HearingsViewState extends State<HearingsView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<HearingsViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<HearingsViewModel>();

    return RefreshIndicator(
      onRefresh: viewModel.load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: viewModel.status,
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('جميع الجلسات')),
                    DropdownMenuItem(value: 'scheduled', child: Text('مجدولة')),
                    DropdownMenuItem(value: 'completed', child: Text('منعقدة')),
                    DropdownMenuItem(value: 'adjourned', child: Text('مؤجلة')),
                    DropdownMenuItem(value: 'cancelled', child: Text('ملغاة')),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    viewModel.updateStatus(value);
                    viewModel.load();
                  },
                  decoration: const InputDecoration(labelText: 'الحالة'),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: () => _showCreateDialog(context, viewModel),
                icon: const Icon(Icons.add),
                label: const Text('إضافة جلسة'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (viewModel.state == AsyncState.loading && viewModel.hearings.isEmpty)
            const SizedBox(height: 420, child: AppLoading(message: 'جارٍ تحميل الجلسات...'))
          else if (viewModel.hearings.isEmpty)
            const SizedBox(height: 420, child: AppEmptyState(message: 'لا توجد جلسات'))
          else
            ...viewModel.hearings.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AppCard(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F0FC),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.event_note_outlined),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.court ?? 'محكمة غير محددة', style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 6),
                            Text(item.caseNumber ?? '#${item.caseId}', style: const TextStyle(color: Color(0xFF64748B))),
                            const SizedBox(height: 4),
                            Text(formatDateTime(item.datetime), style: const TextStyle(color: Color(0xFF64748B))),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                Chip(label: Text(_typeLabel(item.type))),
                                Chip(label: Text(_statusLabel(item.status))),
                                if (item.assignedLawyerName != null) Chip(label: Text(item.assignedLawyerName!)),
                              ],
                            ),
                            if (item.notes != null && item.notes!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(item.notes!, style: const TextStyle(color: Color(0xFF64748B))),
                              ),
                          ],
                        ),
                      ),
                      Column(
                        children: [
                          if (item.status == 'scheduled')
                            IconButton(
                              onPressed: () => viewModel.markCompleted(item),
                              icon: const Icon(Icons.check_circle_outline),
                              tooltip: 'منعقدة',
                            ),
                          IconButton(
                            onPressed: () async {
                              final ok = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('حذف الجلسة'),
                                  content: Text('هل تريد حذف "${item.court ?? item.caseNumber ?? item.id}"؟'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.of(context).pop(false),
                                      child: const Text('إلغاء'),
                                    ),
                                    FilledButton(
                                      onPressed: () => Navigator.of(context).pop(true),
                                      child: const Text('حذف'),
                                    ),
                                  ],
                                ),
                              );
                              if (ok == true) {
                                await viewModel.delete(item);
                              }
                            },
                            icon: const Icon(Icons.delete_outline),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _typeLabel(String type) => switch (type) {
        'session' => 'جلسة',
        'consultation' => 'استشارة',
        'deadline' => 'موعد نهائي',
        'other' => 'أخرى',
        _ => type,
      };

  String _statusLabel(String status) => switch (status) {
        'scheduled' => 'مجدولة',
        'completed' => 'منعقدة',
        'adjourned' => 'مؤجلة',
        'cancelled' => 'ملغاة',
        _ => status,
      };

  Future<void> _showCreateDialog(BuildContext context, HearingsViewModel viewModel) async {
    int? caseId;
    int? assignedLawyer;
    String datetime = '';
    String court = '';
    String type = 'session';
    String status = 'scheduled';
    String notes = '';

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('إضافة جلسة'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<int>(
                  initialValue: caseId,
                  items: viewModel.cases
                      .map((item) => DropdownMenuItem<int>(value: item.id, child: Text('${item.caseNumber} — ${item.clientName ?? item.clientId}')))
                      .toList(growable: false),
                  onChanged: (value) => setState(() => caseId = value),
                  decoration: const InputDecoration(labelText: 'القضية *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  onChanged: (value) => datetime = value,
                  decoration: const InputDecoration(labelText: 'التاريخ والوقت *', hintText: '2026-06-10T09:00:00+03:00'),
                ),
                const SizedBox(height: 12),
                TextField(
                  onChanged: (value) => court = value,
                  decoration: const InputDecoration(labelText: 'المحكمة'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  items: const [
                    DropdownMenuItem(value: 'session', child: Text('جلسة')),
                    DropdownMenuItem(value: 'consultation', child: Text('استشارة')),
                    DropdownMenuItem(value: 'deadline', child: Text('موعد نهائي')),
                    DropdownMenuItem(value: 'other', child: Text('أخرى')),
                  ],
                  onChanged: (value) => setState(() => type = value ?? 'session'),
                  decoration: const InputDecoration(labelText: 'النوع'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: assignedLawyer,
                  items: viewModel.users
                      .map((item) => DropdownMenuItem<int>(value: item.id, child: Text(item.name)))
                      .toList(growable: false),
                  onChanged: (value) => setState(() => assignedLawyer = value),
                  decoration: const InputDecoration(labelText: 'المحامي'),
                ),
                const SizedBox(height: 12),
                TextField(
                  onChanged: (value) => notes = value,
                  decoration: const InputDecoration(labelText: 'ملاحظات'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('إلغاء'),
            ),
            FilledButton(
              onPressed: () async {
                if (caseId == null || datetime.trim().isEmpty) return;
                await viewModel.create(
                  CreateHearingInput(
                    caseId: caseId!,
                    datetime: datetime.trim(),
                    type: type,
                    status: status,
                    court: court.trim().isEmpty ? null : court.trim(),
                    assignedLawyer: assignedLawyer,
                    notes: notes.trim().isEmpty ? null : notes.trim(),
                  ),
                );
                if (context.mounted) Navigator.of(context).pop();
              },
              child: const Text('حفظ'),
            ),
          ],
        ),
      ),
    );
  }
}
