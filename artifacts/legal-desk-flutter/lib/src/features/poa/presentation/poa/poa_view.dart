import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import '../../data/poa_models.dart';
import 'poa_view_model.dart';

class PowerOfAttorneyView extends StatefulWidget {
  const PowerOfAttorneyView({super.key});

  @override
  State<PowerOfAttorneyView> createState() => _PowerOfAttorneyViewState();
}

class _PowerOfAttorneyViewState extends State<PowerOfAttorneyView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<PowerOfAttorneyViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<PowerOfAttorneyViewModel>();

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
                    DropdownMenuItem(value: 'all', child: Text('جميع الوكالات')),
                    DropdownMenuItem(value: 'in_office', child: Text('في المكتب')),
                    DropdownMenuItem(value: 'with_client', child: Text('مع الموكل')),
                    DropdownMenuItem(value: 'returned', child: Text('معادة')),
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
                label: const Text('إضافة وكالة'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (viewModel.state == AsyncState.loading && viewModel.items.isEmpty)
            const SizedBox(height: 420, child: AppLoading(message: 'جارٍ تحميل الوكالات...'))
          else if (viewModel.items.isEmpty)
            const SizedBox(height: 420, child: AppEmptyState(message: 'لا توجد وكالات'))
          else
            ...viewModel.items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: AppCard(
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.clientName ?? '#${item.clientId}', style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: 6),
                              Text(item.caseNumber ?? 'بدون قضية', style: const TextStyle(color: Color(0xFF64748B))),
                              const SizedBox(height: 4),
                              Text('استلمها: ${item.receivedByName ?? '—'}', style: const TextStyle(color: Color(0xFF64748B))),
                              const SizedBox(height: 4),
                              Text('تاريخ الاستلام: ${formatDate(item.receivedAt ?? item.createdAt)}', style: const TextStyle(color: Color(0xFF64748B))),
                              if (item.returnBy != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text('موعد الإرجاع: ${formatDate(item.returnBy)}', style: const TextStyle(color: Color(0xFF64748B))),
                                ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Chip(label: Text(_statusLabel(item.status))),
                            const SizedBox(height: 6),
                            if (item.status != 'returned')
                              TextButton(onPressed: () => viewModel.markReturned(item), child: const Text('إرجاع')),
                            IconButton(
                              onPressed: () async {
                                final ok = await showDialog<bool>(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    title: const Text('حذف الوكالة'),
                                    content: const Text('هل تريد حذف هذه الوكالة؟'),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('إلغاء')),
                                      FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('حذف')),
                                    ],
                                  ),
                                );
                                if (ok == true) await viewModel.delete(item);
                              },
                              icon: const Icon(Icons.delete_outline),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                )),
        ],
      ),
    );
  }

  String _statusLabel(String value) => switch (value) {
        'in_office' => 'في المكتب',
        'with_client' => 'مع الموكل',
        'returned' => 'معادة',
        _ => value,
      };

  Future<void> _showCreateDialog(BuildContext context, PowerOfAttorneyViewModel viewModel) async {
    int? clientId;
    int? caseId;
    int? receivedBy;
    String handedBy = '';
    String receivedAt = '';
    String returnBy = '';
    String notes = '';
    String status = 'in_office';

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('إضافة وكالة'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<int>(
                  initialValue: clientId,
                  items: viewModel.clients.map((e) => DropdownMenuItem(value: e.id, child: Text(e.name))).toList(growable: false),
                  onChanged: (value) => setState(() => clientId = value),
                  decoration: const InputDecoration(labelText: 'الموكل *'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: caseId,
                  items: viewModel.cases.where((e) => clientId == null || e.clientId == clientId).map((e) => DropdownMenuItem(value: e.id, child: Text(e.caseNumber))).toList(growable: false),
                  onChanged: (value) => setState(() => caseId = value),
                  decoration: const InputDecoration(labelText: 'القضية'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: receivedBy,
                  items: viewModel.users.map((e) => DropdownMenuItem(value: e.id, child: Text(e.name))).toList(growable: false),
                  onChanged: (value) => setState(() => receivedBy = value),
                  decoration: const InputDecoration(labelText: 'استلمها'),
                ),
                const SizedBox(height: 12),
                TextField(onChanged: (value) => handedBy = value, decoration: const InputDecoration(labelText: 'سُلّمت بواسطة')),
                const SizedBox(height: 12),
                TextField(onChanged: (value) => receivedAt = value, decoration: const InputDecoration(labelText: 'تاريخ الاستلام', hintText: '2026-06-06T09:00:00+03:00')),
                const SizedBox(height: 12),
                TextField(onChanged: (value) => returnBy = value, decoration: const InputDecoration(labelText: 'موعد الإرجاع', hintText: '2026-07-06T09:00:00+03:00')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: status,
                  items: const [
                    DropdownMenuItem(value: 'in_office', child: Text('في المكتب')),
                    DropdownMenuItem(value: 'with_client', child: Text('مع الموكل')),
                    DropdownMenuItem(value: 'returned', child: Text('معادة')),
                  ],
                  onChanged: (value) => setState(() => status = value ?? 'in_office'),
                  decoration: const InputDecoration(labelText: 'الحالة'),
                ),
                const SizedBox(height: 12),
                TextField(onChanged: (value) => notes = value, decoration: const InputDecoration(labelText: 'ملاحظات')),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('إلغاء')),
            FilledButton(
              onPressed: () async {
                if (clientId == null) return;
                await viewModel.create(CreatePowerOfAttorneyInput(
                  clientId: clientId!,
                  caseId: caseId,
                  receivedBy: receivedBy,
                  handedBy: handedBy.trim().isEmpty ? null : handedBy.trim(),
                  receivedAt: receivedAt.trim().isEmpty ? null : receivedAt.trim(),
                  returnBy: returnBy.trim().isEmpty ? null : returnBy.trim(),
                  status: status,
                  notes: notes.trim().isEmpty ? null : notes.trim(),
                ));
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
