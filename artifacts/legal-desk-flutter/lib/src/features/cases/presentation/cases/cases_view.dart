import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import '../../data/case_models.dart';
import 'cases_view_model.dart';

class CasesView extends StatefulWidget {
  const CasesView({super.key});

  @override
  State<CasesView> createState() => _CasesViewState();
}

class _CasesViewState extends State<CasesView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<CasesViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<CasesViewModel>();

    return RefreshIndicator(
      onRefresh: viewModel.load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  onChanged: viewModel.updateSearch,
                  decoration: const InputDecoration(
                    hintText: 'بحث برقم القضية أو الموكل...',
                    prefixIcon: Icon(Icons.search),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: () => _showCreateDialog(context, viewModel),
                icon: const Icon(Icons.add),
                label: const Text('إضافة قضية'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (viewModel.state == AsyncState.loading && viewModel.cases.isEmpty)
            const SizedBox(height: 420, child: AppLoading(message: 'جارٍ تحميل القضايا...'))
          else if (viewModel.filteredCases.isEmpty)
            const SizedBox(height: 420, child: AppEmptyState(message: 'لا توجد قضايا'))
          else
            ...viewModel.filteredCases.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AppCard(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => context.go('/cases/${item.id}'),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.caseNumber, style: Theme.of(context).textTheme.titleMedium),
                                const SizedBox(height: 6),
                                Text(
                                  item.clientName ?? '#${item.clientId}',
                                  style: const TextStyle(color: Color(0xFF64748B)),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item.court ?? 'بدون محكمة',
                                  style: const TextStyle(color: Color(0xFF64748B)),
                                ),
                                const SizedBox(height: 6),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    Chip(label: Text(_typeLabel(item.type))),
                                    Chip(label: Text(_statusLabel(item.status))),
                                    if (item.leadLawyerName != null) Chip(label: Text(item.leadLawyerName!)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                TextButton.icon(
                                  onPressed: () => context.go('/cases/${item.id}'),
                                  icon: const Icon(Icons.open_in_new, size: 18),
                                  label: const Text('التفاصيل'),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () async {
                              final ok = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('حذف القضية'),
                                  content: Text('هل تريد حذف "${item.caseNumber}"؟'),
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
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _typeLabel(String type) => switch (type) {
        'civil' => 'مدني',
        'criminal' => 'جنائي',
        'commercial' => 'تجاري',
        'family' => 'أسري',
        'labor' => 'عمالي',
        'administrative' => 'إداري',
        'other' => 'أخرى',
        _ => type,
      };

  String _statusLabel(String status) => switch (status) {
        'new' => 'جديد',
        'active' => 'نشط',
        'upcoming_hearing' => 'جلسة قادمة',
        'verdict' => 'حكم',
        'adjourned' => 'مؤجل',
        'closed' => 'مغلق',
        _ => status,
      };

  Future<void> _showCreateDialog(BuildContext context, CasesViewModel viewModel) async {
    final caseNumber = TextEditingController();
    final courtCaseNumber = TextEditingController();
    final court = TextEditingController();
    final division = TextEditingController();
    final opposingParty = TextEditingController();
    String type = 'civil';
    String status = 'new';
    int clientId = 0;
    int? leadLawyerId;

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('إضافة قضية'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: caseNumber, decoration: const InputDecoration(labelText: 'رقم القضية *')),
                const SizedBox(height: 12),
                TextField(controller: courtCaseNumber, decoration: const InputDecoration(labelText: 'رقم المحكمة')),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: clientId == 0 ? null : clientId,
                  items: viewModel.clients
                      .map((item) => DropdownMenuItem<int>(value: item.id, child: Text(item.name)))
                      .toList(growable: false),
                  onChanged: (value) => setState(() => clientId = value ?? 0),
                  decoration: const InputDecoration(labelText: 'الموكل *'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: leadLawyerId,
                  items: viewModel.users
                      .map((item) => DropdownMenuItem<int>(value: item.id, child: Text(item.name)))
                      .toList(growable: false),
                  onChanged: (value) => setState(() => leadLawyerId = value),
                  decoration: const InputDecoration(labelText: 'المحامي المسؤول'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  items: const [
                    DropdownMenuItem(value: 'civil', child: Text('مدني')),
                    DropdownMenuItem(value: 'criminal', child: Text('جنائي')),
                    DropdownMenuItem(value: 'commercial', child: Text('تجاري')),
                    DropdownMenuItem(value: 'family', child: Text('أسري')),
                    DropdownMenuItem(value: 'labor', child: Text('عمالي')),
                    DropdownMenuItem(value: 'administrative', child: Text('إداري')),
                    DropdownMenuItem(value: 'other', child: Text('أخرى')),
                  ],
                  onChanged: (value) => setState(() => type = value ?? 'civil'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: status,
                  items: const [
                    DropdownMenuItem(value: 'new', child: Text('جديد')),
                    DropdownMenuItem(value: 'active', child: Text('نشط')),
                    DropdownMenuItem(value: 'upcoming_hearing', child: Text('جلسة قادمة')),
                    DropdownMenuItem(value: 'verdict', child: Text('حكم')),
                    DropdownMenuItem(value: 'adjourned', child: Text('مؤجل')),
                    DropdownMenuItem(value: 'closed', child: Text('مغلق')),
                  ],
                  onChanged: (value) => setState(() => status = value ?? 'new'),
                ),
                const SizedBox(height: 12),
                TextField(controller: court, decoration: const InputDecoration(labelText: 'المحكمة')),
                const SizedBox(height: 12),
                TextField(controller: division, decoration: const InputDecoration(labelText: 'الدائرة')),
                const SizedBox(height: 12),
                TextField(controller: opposingParty, decoration: const InputDecoration(labelText: 'الخصم')),
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
                if (caseNumber.text.trim().isEmpty || clientId == 0) return;
                await viewModel.create(
                  CreateCaseInput(
                    caseNumber: caseNumber.text.trim(),
                    courtCaseNumber: courtCaseNumber.text.trim().isEmpty ? null : courtCaseNumber.text.trim(),
                    type: type,
                    clientId: clientId,
                    leadLawyerId: leadLawyerId,
                    status: status,
                    court: court.text.trim().isEmpty ? null : court.text.trim(),
                    division: division.text.trim().isEmpty ? null : division.text.trim(),
                    opposingParty: opposingParty.text.trim().isEmpty ? null : opposingParty.text.trim(),
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
