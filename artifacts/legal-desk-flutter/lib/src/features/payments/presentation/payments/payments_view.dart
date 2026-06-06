import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import '../../data/payment_models.dart';
import 'payments_view_model.dart';

class PaymentsView extends StatefulWidget {
  const PaymentsView({super.key});

  @override
  State<PaymentsView> createState() => _PaymentsViewState();
}

class _PaymentsViewState extends State<PaymentsView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<PaymentsViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<PaymentsViewModel>();

    return RefreshIndicator(
      onRefresh: viewModel.load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (viewModel.summary != null)
            Row(
              children: [
                Expanded(child: _SummaryCard(label: 'المحصّل', value: formatCurrency(viewModel.summary!.totalCollected), color: const Color(0xFFE8F5E9))),
                const SizedBox(width: 12),
                Expanded(child: _SummaryCard(label: 'معلق', value: formatCurrency(viewModel.summary!.totalPending), color: const Color(0xFFFFF7E0))),
                const SizedBox(width: 12),
                Expanded(child: _SummaryCard(label: 'متأخر', value: formatCurrency(viewModel.summary!.totalOverdue), color: const Color(0xFFFFEBEE))),
              ],
            ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: viewModel.status,
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('جميع المدفوعات')),
                    DropdownMenuItem(value: 'pending', child: Text('معلق')),
                    DropdownMenuItem(value: 'paid', child: Text('مدفوع')),
                    DropdownMenuItem(value: 'partial', child: Text('جزئي')),
                    DropdownMenuItem(value: 'overdue', child: Text('متأخر')),
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
                icon: const Icon(Icons.add_card_outlined),
                label: const Text('إضافة دفعة'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (viewModel.state == AsyncState.loading && viewModel.payments.isEmpty)
            const SizedBox(height: 420, child: AppLoading(message: 'جارٍ تحميل المدفوعات...'))
          else if (viewModel.payments.isEmpty)
            const SizedBox(height: 420, child: AppEmptyState(message: 'لا توجد مدفوعات'))
          else
            ...viewModel.payments.map(
              (item) => Padding(
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
                            Text(_typeLabel(item.type), style: const TextStyle(color: Color(0xFF64748B))),
                            const SizedBox(height: 6),
                            Text(formatCurrency(item.amount), style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Chip(label: Text(_statusLabel(item.status))),
                          const SizedBox(height: 6),
                          Text(formatDate(item.paidAt ?? item.createdAt), style: const TextStyle(color: Color(0xFF64748B))),
                          const SizedBox(height: 6),
                          if (item.status != 'paid')
                            TextButton(
                              onPressed: () => viewModel.markPaid(item),
                              child: const Text('تحصيل'),
                            ),
                          IconButton(
                            onPressed: () async {
                              final ok = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('حذف الدفعة'),
                                  content: const Text('هل تريد حذف هذه الدفعة؟'),
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

  String _statusLabel(String value) => switch (value) {
        'pending' => 'معلق',
        'paid' => 'مدفوع',
        'partial' => 'جزئي',
        'overdue' => 'متأخر',
        _ => value,
      };

  String _typeLabel(String value) => switch (value) {
        'case_fee' => 'رسوم قضية',
        'consultation_fee' => 'رسوم استشارة',
        'retainer' => 'أتعاب',
        'expense' => 'مصروفات',
        'other' => 'أخرى',
        _ => value,
      };

  Future<void> _showCreateDialog(BuildContext context, PaymentsViewModel viewModel) async {
    int? clientId;
    int? caseId;
    String amount = '';
    String type = 'case_fee';
    String status = 'pending';

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('إضافة دفعة'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<int>(
                  initialValue: clientId,
                  items: viewModel.clients
                      .map((item) => DropdownMenuItem<int>(value: item.id, child: Text(item.name)))
                      .toList(growable: false),
                  onChanged: (value) => setState(() => clientId = value),
                  decoration: const InputDecoration(labelText: 'الموكل *'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: caseId,
                  items: viewModel.cases
                      .where((item) => clientId == null || item.clientId == clientId)
                      .map((item) => DropdownMenuItem<int>(value: item.id, child: Text(item.caseNumber)))
                      .toList(growable: false),
                  onChanged: (value) => setState(() => caseId = value),
                  decoration: const InputDecoration(labelText: 'القضية'),
                ),
                const SizedBox(height: 12),
                TextField(
                  onChanged: (value) => amount = value,
                  decoration: const InputDecoration(labelText: 'المبلغ *'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  items: const [
                    DropdownMenuItem(value: 'case_fee', child: Text('رسوم قضية')),
                    DropdownMenuItem(value: 'consultation_fee', child: Text('رسوم استشارة')),
                    DropdownMenuItem(value: 'retainer', child: Text('أتعاب')),
                    DropdownMenuItem(value: 'expense', child: Text('مصروفات')),
                    DropdownMenuItem(value: 'other', child: Text('أخرى')),
                  ],
                  onChanged: (value) => setState(() => type = value ?? 'case_fee'),
                  decoration: const InputDecoration(labelText: 'النوع'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: status,
                  items: const [
                    DropdownMenuItem(value: 'pending', child: Text('معلق')),
                    DropdownMenuItem(value: 'paid', child: Text('مدفوع')),
                    DropdownMenuItem(value: 'partial', child: Text('جزئي')),
                    DropdownMenuItem(value: 'overdue', child: Text('متأخر')),
                  ],
                  onChanged: (value) => setState(() => status = value ?? 'pending'),
                  decoration: const InputDecoration(labelText: 'الحالة'),
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
                if (clientId == null || amount.trim().isEmpty) return;
                await viewModel.create(
                  CreatePaymentInput(
                    clientId: clientId!,
                    caseId: caseId,
                    amount: num.parse(amount.trim()),
                    type: type,
                    status: status,
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

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Container(
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }
}
