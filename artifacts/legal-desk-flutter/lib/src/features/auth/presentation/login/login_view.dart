import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/widgets/app_card.dart';
import '../../data/auth_repository.dart';
import 'login_view_model.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  final TextEditingController _passwordController = TextEditingController(text: 'password123');

  @override
  void initState() {
    super.initState();
    final authRepository = context.read<AuthRepository>();
    _emailController = TextEditingController(text: authRepository.lastLoginEmail ?? 'admin@legaldesk.sa');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<LoginViewModel>();
    final isLoading = viewModel.state == AsyncState.loading;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFEFF5FD), Color(0xFFF7FBFF)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: AppCard(
                  padding: const EdgeInsets.all(28),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          margin: const EdgeInsets.only(bottom: 18),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(22),
                            gradient: const LinearGradient(
                              colors: [Color(0xFF1E3A5F), Color(0xFF122742)],
                            ),
                          ),
                          child: const Center(
                            child: Text(
                              'LD',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 24,
                              ),
                            ),
                          ),
                        ),
                        Text(
                          'LegalDesk',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF14233D),
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'منصة إدارة المكتب القانوني - Flutter edition',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: const Color(0xFF64748B),
                              ),
                        ),
                        const SizedBox(height: 24),
                        TextFormField(
                          controller: _emailController,
                          decoration: const InputDecoration(labelText: 'البريد الإلكتروني'),
                          validator: (value) => (value == null || value.isEmpty) ? 'مطلوب' : null,
                        ),
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(labelText: 'كلمة المرور'),
                          validator: (value) => (value == null || value.isEmpty) ? 'مطلوب' : null,
                        ),
                        if (viewModel.errorMessage != null) ...[
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF2F2),
                              border: Border.all(color: const Color(0xFFFECACA)),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              viewModel.errorMessage!,
                              style: const TextStyle(color: Color(0xFF991B1B)),
                            ),
                          ),
                        ],
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: isLoading
                              ? null
                              : () async {
                                  if (!_formKey.currentState!.validate()) return;
                                  await viewModel.login(
                                    email: _emailController.text.trim(),
                                    password: _passwordController.text,
                                  );
                                },
                          child: Text(isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Demo: admin@legaldesk.sa / password123',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: const Color(0xFF64748B),
                              ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
