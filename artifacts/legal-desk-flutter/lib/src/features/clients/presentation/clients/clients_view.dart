import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import '../../data/client_models.dart';
import 'clients_view_model.dart';

class ClientsView extends StatefulWidget {
  const ClientsView({super.key});

  @override
  State<ClientsView> createState() => _ClientsViewState();
}

class _ClientsViewState extends State<ClientsView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<ClientsViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<ClientsViewModel>();

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
                    hintText: 'بحث بالاسم أو الهاتف...',
                    prefixIcon: Icon(Icons.search),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(
                width: 160,
                child: DropdownButtonFormField<String>(
                  initialValue: viewModel.status,
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('كل الحالات')),
                    DropdownMenuItem(value: 'new', child: Text('جديد')),
                    DropdownMenuItem(value: 'active', child: Text('نشط')),
                    DropdownMenuItem(value: 'pending', child: Text('معلق')),
                    DropdownMenuItem(value: 'completed', child: Text('مكتمل')),
                    DropdownMenuItem(value: 'closed', child: Text('مغلق')),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    viewModel.updateStatus(value);
                    viewModel.load();
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (viewModel.canManage)
            Align(
              alignment: Alignment.centerLeft,
              child: ElevatedButton.icon(
                onPressed: () => _showCreateDialog(context, viewModel),
                icon: const Icon(Icons.person_add_alt_1),
                label: const Text('إضافة موكل'),
              ),
            ),
          const SizedBox(height: 12),
          if (viewModel.state == AsyncState.loading && viewModel.clients.isEmpty)
            const SizedBox(height: 400, child: AppLoading(message: 'جارٍ تحميل الموكلين...'))
          else if (viewModel.clients.isEmpty)
            const SizedBox(
              height: 400,
              child: AppEmptyState(
                message: 'لا يوجد موكلون',
                subtitle: 'أضف أول موكل أو غيّر معايير البحث.',
              ),
            )
          else
            ...viewModel.clients.map(
              (client) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AppCard(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => context.go('/clients/${client.id}'),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: const Color(0xFFE8F0FC),
                            child: Text(client.name.characters.first),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(client.name, style: Theme.of(context).textTheme.titleMedium),
                                const SizedBox(height: 4),
                                Text(
                                  client.phone ?? 'بدون هاتف',
                                  style: const TextStyle(color: Color(0xFF64748B)),
                                ),
                                if (client.serviceType != null)
                                  Text(
                                    client.serviceType!,
                                    style: const TextStyle(color: Color(0xFF64748B)),
                                  ),
                                const SizedBox(height: 8),
                                TextButton.icon(
                                  onPressed: () => context.go('/clients/${client.id}'),
                                  icon: const Icon(Icons.open_in_new, size: 18),
                                  label: const Text('التفاصيل'),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Chip(label: Text(_statusLabel(client.status))),
                              const SizedBox(height: 8),
                              if (viewModel.canManage)
                                IconButton(
                                  onPressed: () async {
                                    final ok = await showDialog<bool>(
                                      context: context,
                                      builder: (context) => AlertDialog(
                                        title: const Text('حذف الموكل'),
                                        content: Text('هل تريد حذف "${client.name}"؟'),
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
                                      await viewModel.delete(client);
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
              ),
            ),
        ],
      ),
    );
  }

  String _statusLabel(String status) => switch (status) {
        'new' => 'جديد',
        'active' => 'نشط',
        'pending' => 'معلق',
        'completed' => 'مكتمل',
        'closed' => 'مغلق',
        _ => status,
      };

  Future<void> _showCreateDialog(BuildContext context, ClientsViewModel viewModel) async {
    final name = TextEditingController();
    final phone = TextEditingController();
    final email = TextEditingController();
    final nationalId = TextEditingController();
    final serviceType = TextEditingController();
    String status = 'new';

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('إضافة موكل جديد'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: name, decoration: const InputDecoration(labelText: 'الاسم *')),
                const SizedBox(height: 12),
                TextField(controller: phone, decoration: const InputDecoration(labelText: 'الهاتف')),
                const SizedBox(height: 12),
                TextField(controller: email, decoration: const InputDecoration(labelText: 'البريد الإلكتروني')),
                const SizedBox(height: 12),
                TextField(controller: nationalId, decoration: const InputDecoration(labelText: 'رقم الهوية')),
                const SizedBox(height: 12),
                TextField(controller: serviceType, decoration: const InputDecoration(labelText: 'نوع الخدمة')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: status,
                  items: const [
                    DropdownMenuItem(value: 'new', child: Text('جديد')),
                    DropdownMenuItem(value: 'active', child: Text('نشط')),
                    DropdownMenuItem(value: 'pending', child: Text('معلق')),
                    DropdownMenuItem(value: 'completed', child: Text('مكتمل')),
                    DropdownMenuItem(value: 'closed', child: Text('مغلق')),
                  ],
                  onChanged: (value) => setState(() => status = value ?? 'new'),
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
                if (name.text.trim().isEmpty) return;
                await viewModel.create(
                  CreateClientInput(
                    name: name.text.trim(),
                    phone: phone.text.trim().isEmpty ? null : phone.text.trim(),
                    email: email.text.trim().isEmpty ? null : email.text.trim(),
                    nationalId: nationalId.text.trim().isEmpty ? null : nationalId.text.trim(),
                    serviceType: serviceType.text.trim().isEmpty ? null : serviceType.text.trim(),
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
