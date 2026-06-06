import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import 'case_detail_view_model.dart';

class CaseDetailView extends StatefulWidget {
  const CaseDetailView({required this.caseId, super.key});

  final int caseId;

  @override
  State<CaseDetailView> createState() => _CaseDetailViewState();
}

class _CaseDetailViewState extends State<CaseDetailView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<CaseDetailViewModel>().load(widget.caseId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<CaseDetailViewModel>();

    if (viewModel.state == AsyncState.loading && viewModel.caseItem == null) {
      return const Scaffold(body: AppLoading(message: 'جارٍ تحميل ملف القضية...'));
    }
    if (viewModel.state == AsyncState.error || viewModel.caseItem == null) {
      return Scaffold(
        appBar: AppBar(),
        body: AppEmptyState(message: viewModel.error ?? 'القضية غير موجودة'),
      );
    }

    final item = viewModel.caseItem!;
    var selectedStatus = item.status;

    return Scaffold(
      appBar: AppBar(title: Text(item.caseNumber)),
      body: RefreshIndicator(
        onRefresh: () => viewModel.load(widget.caseId),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.caseNumber,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 8),
                  Text(item.clientName ?? '#${item.clientId}'),
                  if (item.court != null) Text(item.court!),
                  if (item.leadLawyerName != null) Text('المحامي: ${item.leadLawyerName!}'),
                  if (item.opposingParty != null) Text('الخصم: ${item.opposingParty!}'),
                  if (item.description != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(item.description!),
                    ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedStatus,
                    items: const [
                      DropdownMenuItem(value: 'new', child: Text('جديد')),
                      DropdownMenuItem(value: 'active', child: Text('نشط')),
                      DropdownMenuItem(value: 'upcoming_hearing', child: Text('جلسة قادمة')),
                      DropdownMenuItem(value: 'verdict', child: Text('حكم')),
                      DropdownMenuItem(value: 'adjourned', child: Text('مؤجل')),
                      DropdownMenuItem(value: 'closed', child: Text('مغلق')),
                    ],
                    onChanged: (value) async {
                      if (value == null || value == item.status) return;
                      selectedStatus = value;
                      await viewModel.updateStatus(widget.caseId, value);
                    },
                    decoration: const InputDecoration(labelText: 'حالة القضية'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _SectionCard(
              title: 'الجلسات',
              children: viewModel.hearings
                  .map(
                    (h) => ListTile(
                      title: Text(h.court ?? h.caseNumber ?? '#${h.id}'),
                      subtitle: Text('${formatDateTime(h.datetime)} • ${h.status}'),
                    ),
                  )
                  .toList(growable: false),
            ),
            _SectionCard(
              title: 'المهام',
              children: viewModel.tasks
                  .map(
                    (t) => ListTile(
                      title: Text(t.title),
                      subtitle: Text('${t.assigneeName ?? '—'} • ${t.status}'),
                    ),
                  )
                  .toList(growable: false),
            ),
            _SectionCard(
              title: 'المستندات',
              children: viewModel.documents
                  .map(
                    (d) => ListTile(
                      title: Text(d.fileName),
                      subtitle: Text(d.docType),
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
        ),
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
