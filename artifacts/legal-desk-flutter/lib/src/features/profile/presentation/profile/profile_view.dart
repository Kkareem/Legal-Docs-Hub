import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../auth/data/auth_repository.dart';
import 'profile_view_model.dart';

class ProfileView extends StatefulWidget {
  const ProfileView({super.key});

  @override
  State<ProfileView> createState() => _ProfileViewState();
}

class _ProfileViewState extends State<ProfileView> {
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthRepository>().currentUser;
    _nameController = TextEditingController(text: user?.name ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authRepository = context.watch<AuthRepository>();
    final viewModel = context.watch<ProfileViewModel>();
    final user = authRepository.currentUser;
    if (user == null) {
      return const SizedBox.shrink();
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AppCard(
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: const Color(0xFFE8F0FC),
                child: Text(user.name.characters.first, style: Theme.of(context).textTheme.headlineSmall),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                    Text(user.email, style: const TextStyle(color: Color(0xFF64748B))),
                    const SizedBox(height: 6),
                    Chip(label: Text(_roleLabel(user.role))),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('البيانات الشخصية', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'الاسم الكامل')),
              const SizedBox(height: 12),
              TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'رقم الهاتف')),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: viewModel.state == AsyncState.loading
                    ? null
                    : () async {
                        final ok = await viewModel.updateProfile(
                          name: _nameController.text.trim(),
                          phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
                        );
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(viewModel.message ?? (ok ? 'تم الحفظ' : 'فشل الحفظ'))));
                      },
                icon: const Icon(Icons.save_outlined),
                label: Text(viewModel.state == AsyncState.loading ? 'جارٍ الحفظ...' : 'حفظ التغييرات'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('تغيير كلمة المرور', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              TextField(controller: _passwordController, obscureText: true, decoration: const InputDecoration(labelText: 'كلمة المرور الجديدة')),
              const SizedBox(height: 12),
              TextField(controller: _confirmController, obscureText: true, decoration: const InputDecoration(labelText: 'تأكيد كلمة المرور')),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: viewModel.state == AsyncState.loading
                    ? null
                    : () async {
                        if (_passwordController.text != _confirmController.text || _passwordController.text.trim().length < 6) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تحقق من تطابق كلمة المرور ومن طولها.')));
                          return;
                        }
                        final ok = await viewModel.changePassword(_passwordController.text.trim());
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(viewModel.message ?? (ok ? 'تم التحديث' : 'فشل التحديث'))));
                        if (ok) {
                          _passwordController.clear();
                          _confirmController.clear();
                        }
                      },
                icon: const Icon(Icons.lock_outline),
                label: Text(viewModel.state == AsyncState.loading ? 'جارٍ التحديث...' : 'تغيير كلمة المرور'),
              ),
            ],
          ),
        ),
      ],
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
}
