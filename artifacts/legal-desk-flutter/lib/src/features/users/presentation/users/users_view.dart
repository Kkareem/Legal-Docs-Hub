import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import 'users_view_model.dart';

class UsersView extends StatefulWidget {
  const UsersView({super.key});

  @override
  State<UsersView> createState() => _UsersViewState();
}

class _UsersViewState extends State<UsersView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<UsersViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<UsersViewModel>();

    return RefreshIndicator(
      onRefresh: viewModel.load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (viewModel.canManage)
            Align(
              alignment: Alignment.centerLeft,
              child: ElevatedButton.icon(
                onPressed: () => _showCreateDialog(context, viewModel),
                icon: const Icon(Icons.person_add_alt_1),
                label: const Text('إضافة عضو'),
              ),
            ),
          const SizedBox(height: 12),
          if (viewModel.state == AsyncState.loading && viewModel.users.isEmpty)
            const SizedBox(height: 420, child: AppLoading(message: 'جارٍ تحميل الفريق...'))
          else if (viewModel.users.isEmpty)
            const SizedBox(height: 420, child: AppEmptyState(message: 'لا يوجد أعضاء'))
          else
            ...viewModel.users.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AppCard(
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: const Color(0xFFE8F0FC),
                        child: Text(item.name.characters.first),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.name, style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 4),
                            Text(item.email, style: const TextStyle(color: Color(0xFF64748B))),
                            if (item.phone != null) Text(item.phone!, style: const TextStyle(color: Color(0xFF64748B))),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Chip(label: Text(_roleLabel(item.role))),
                          const SizedBox(height: 8),
                          if (viewModel.canManage && item.id != viewModel.currentUserId)
                            TextButton(
                              onPressed: () => viewModel.toggleActive(item),
                              child: Text(item.active ? 'تعطيل' : 'تفعيل'),
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

  String _roleLabel(String role) => switch (role) {
        'owner' => 'مالك المكتب',
        'lawyer' => 'محامي',
        'admin' => 'مشرف',
        'assistant' => 'مساعد إداري',
        'paralegal' => 'مساعد قانوني',
        _ => role,
      };

  Future<void> _showCreateDialog(BuildContext context, UsersViewModel viewModel) async {
    final name = TextEditingController();
    final email = TextEditingController();
    final password = TextEditingController();
    final phone = TextEditingController();
    String role = 'lawyer';

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('إضافة عضو جديد'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: name, decoration: const InputDecoration(labelText: 'الاسم *')),
                const SizedBox(height: 12),
                TextField(controller: email, decoration: const InputDecoration(labelText: 'البريد الإلكتروني *')),
                const SizedBox(height: 12),
                TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'كلمة المرور *')),
                const SizedBox(height: 12),
                TextField(controller: phone, decoration: const InputDecoration(labelText: 'رقم الهاتف')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: role,
                  items: const [
                    DropdownMenuItem(value: 'owner', child: Text('مالك المكتب')),
                    DropdownMenuItem(value: 'lawyer', child: Text('محامي')),
                    DropdownMenuItem(value: 'admin', child: Text('مشرف')),
                  ],
                  onChanged: (value) => setState(() => role = value ?? 'lawyer'),
                  decoration: const InputDecoration(labelText: 'الدور'),
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
                if (name.text.trim().isEmpty || email.text.trim().isEmpty || password.text.trim().isEmpty) return;
                await viewModel.create(
                  name: name.text.trim(),
                  email: email.text.trim(),
                  password: password.text.trim(),
                  phone: phone.text.trim().isEmpty ? null : phone.text.trim(),
                  role: role,
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
