import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import '../../data/consultation_models.dart';
import 'consultations_view_model.dart';

class ConsultationsView extends StatefulWidget {
  const ConsultationsView({super.key});

  @override
  State<ConsultationsView> createState() => _ConsultationsViewState();
}

class _ConsultationsViewState extends State<ConsultationsView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<ConsultationsViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<ConsultationsViewModel>();

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
                    DropdownMenuItem(value: 'all', child: Text('جميع الاستشارات')),
                    DropdownMenuItem(value: 'pending', child: Text('معلقة')),
                    DropdownMenuItem(value: 'under_review', child: Text('تحت المراجعة')),
                    DropdownMenuItem(value: 'responded', child: Text('تم الرد')),
                    DropdownMenuItem(value: 'scheduled', child: Text('مجدولة')),
                    DropdownMenuItem(value: 'closed', child: Text('مغلقة')),
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
                icon: const Icon(Icons.add_comment_outlined),
                label: const Text('استشارة جديدة'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (viewModel.state == AsyncState.loading && viewModel.consultations.isEmpty)
            const SizedBox(height: 420, child: AppLoading(message: 'جارٍ تحميل الاستشارات...'))
          else if (viewModel.consultations.isEmpty)
            const SizedBox(height: 420, child: AppEmptyState(message: 'لا توجد استشارات'))
          else
            ...viewModel.consultations.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.message_outlined, color: Color(0xFF1E3A8A)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.clientName ?? '#${item.clientId}', style: Theme.of(context).textTheme.titleMedium),
                                Text(formatDate(item.createdAt), style: const TextStyle(color: Color(0xFF64748B))),
                              ],
                            ),
                          ),
                          Chip(label: Text(_statusLabel(item.status))),
                          const SizedBox(width: 8),
                          Chip(label: Text(_paymentStatusLabel(item.paymentStatus))),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(item.summary),
                      if (item.fee != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text('الرسوم: ${formatCurrency(item.fee)}', style: const TextStyle(color: Color(0xFF64748B))),
                        ),
                      if (item.response != null && item.response!.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.only(top: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('الرد', style: Theme.of(context).textTheme.labelLarge),
                              const SizedBox(height: 6),
                              Text(item.response!),
                            ],
                          ),
                        ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          if (item.assigneeName != null)
                            Expanded(
                              child: Text('المسند إليه: ${item.assigneeName!}', style: const TextStyle(color: Color(0xFF64748B))),
                            )
                          else
                            const Spacer(),
                          if (item.status != 'responded' && item.status != 'closed')
                            TextButton.icon(
                              onPressed: () => _showRespondDialog(context, viewModel, item),
                              icon: const Icon(Icons.reply_outlined),
                              label: const Text('رد'),
                            ),
                          IconButton(
                            onPressed: () async {
                              final ok = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('حذف الاستشارة'),
                                  content: const Text('هل تريد حذف هذه الاستشارة؟'),
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
        'pending' => 'معلقة',
        'under_review' => 'تحت المراجعة',
        'responded' => 'تم الرد',
        'scheduled' => 'مجدولة',
        'closed' => 'مغلقة',
        _ => value,
      };

  String _paymentStatusLabel(String value) => switch (value) {
        'pending' => 'الدفع معلق',
        'paid' => 'مدفوع',
        'waived' => 'معفو',
        _ => value,
      };

  Future<void> _showCreateDialog(BuildContext context, ConsultationsViewModel viewModel) async {
    int? clientId;
    int? assignedTo;
    String summary = '';
    String paymentStatus = 'pending';
    String status = 'pending';
    String fee = '';

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('استشارة جديدة'),
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
                TextField(
                  maxLines: 4,
                  onChanged: (value) => summary = value,
                  decoration: const InputDecoration(labelText: 'ملخص الاستشارة *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  onChanged: (value) => fee = value,
                  decoration: const InputDecoration(labelText: 'الرسوم'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: paymentStatus,
                  items: const [
                    DropdownMenuItem(value: 'pending', child: Text('معلق')),
                    DropdownMenuItem(value: 'paid', child: Text('مدفوع')),
                    DropdownMenuItem(value: 'waived', child: Text('معفو')),
                  ],
                  onChanged: (value) => setState(() => paymentStatus = value ?? 'pending'),
                  decoration: const InputDecoration(labelText: 'حالة الدفع'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: assignedTo,
                  items: viewModel.users
                      .map((item) => DropdownMenuItem<int>(value: item.id, child: Text(item.name)))
                      .toList(growable: false),
                  onChanged: (value) => setState(() => assignedTo = value),
                  decoration: const InputDecoration(labelText: 'المسند إليه'),
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
                if (clientId == null || summary.trim().isEmpty) return;
                await viewModel.create(
                  CreateConsultationInput(
                    clientId: clientId!,
                    summary: summary.trim(),
                    paymentStatus: paymentStatus,
                    status: status,
                    fee: fee.trim().isEmpty ? null : num.tryParse(fee.trim()),
                    assignedTo: assignedTo,
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

  Future<void> _showRespondDialog(BuildContext context, ConsultationsViewModel viewModel, ConsultationModel item) async {
    final responseController = TextEditingController(text: item.response ?? '');

    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('الرد على الاستشارة'),
        content: TextField(
          controller: responseController,
          maxLines: 5,
          decoration: const InputDecoration(labelText: 'نص الرد'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () async {
              if (responseController.text.trim().isEmpty) return;
              await viewModel.respond(item, responseController.text.trim());
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('إرسال'),
          ),
        ],
      ),
    );
  }
}
