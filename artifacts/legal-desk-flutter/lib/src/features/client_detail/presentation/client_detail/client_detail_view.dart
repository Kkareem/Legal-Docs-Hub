import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import 'client_detail_view_model.dart';

class ClientDetailView extends StatefulWidget {
  const ClientDetailView({required this.clientId, super.key});

  final int clientId;

  @override
  State<ClientDetailView> createState() => _ClientDetailViewState();
}

class _ClientDetailViewState extends State<ClientDetailView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<ClientDetailViewModel>().load(widget.clientId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<ClientDetailViewModel>();

    if (viewModel.state == AsyncState.loading && viewModel.client == null) {
      return const Scaffold(body: AppLoading(message: 'جارٍ تحميل ملف الموكل...'));
    }
    if (viewModel.state == AsyncState.error || viewModel.client == null) {
      return Scaffold(
        appBar: AppBar(),
        body: AppEmptyState(message: viewModel.error ?? 'الموكل غير موجود'),
      );
    }

    final client = viewModel.client!;
    final summary = viewModel.summary;

    return Scaffold(
      appBar: AppBar(title: Text(client.name)),
      body: RefreshIndicator(
        onRefresh: () => viewModel.load(widget.clientId),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(client.name, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  if (client.phone != null) Text(client.phone!),
                  if (client.email != null) Text(client.email!),
                  if (client.address != null) Text(client.address!),
                  if (client.notes != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(client.notes!)),
                ],
              ),
            ),
            if (summary != null) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _SummaryCard(label: 'المحصّل', value: formatCurrency(summary.totalPaid))),
                  const SizedBox(width: 12),
                  Expanded(child: _SummaryCard(label: 'المستحق', value: formatCurrency(summary.totalDue))),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _SummaryCard(label: 'قضايا نشطة', value: summary.activeCases.toString())),
                  const SizedBox(width: 12),
                  Expanded(child: _SummaryCard(label: 'إجمالي القضايا', value: summary.totalCases.toString())),
                ],
              ),
            ],
            const SizedBox(height: 16),
            _SectionCard(
              title: 'القضايا',
              children: viewModel.cases
                  .map((item) => ListTile(
                        title: Text(item.caseNumber),
                        subtitle: Text(item.court ?? item.status),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.go('/cases/${item.id}'),
                      ))
                  .toList(growable: false),
            ),
            _SectionCard(
              title: 'المدفوعات',
              children: viewModel.payments
                  .map((item) => ListTile(
                        title: Text(formatCurrency(item.amount)),
                        subtitle: Text(item.caseNumber ?? item.status),
                      ))
                  .toList(growable: false),
            ),
            _SectionCard(
              title: 'المستندات',
              children: viewModel.documents
                  .map((item) => ListTile(
                        title: Text(item.fileName),
                        subtitle: Text(item.docType),
                      ))
                  .toList(growable: false),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            if (children.isEmpty)
              const Padding(
                padding: EdgeInsets.all(8),
                child: Text('لا توجد بيانات', style: TextStyle(color: Color(0xFF64748B))),
              )
            else
              ...children,
          ],
        ),
      ),
    );
  }
}
