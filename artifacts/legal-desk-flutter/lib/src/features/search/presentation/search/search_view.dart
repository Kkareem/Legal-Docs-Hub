import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import 'search_view_model.dart';

class SearchView extends StatefulWidget {
  const SearchView({super.key});

  @override
  State<SearchView> createState() => _SearchViewState();
}

class _SearchViewState extends State<SearchView> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<SearchViewModel>();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: _controller,
          onChanged: viewModel.search,
          decoration: const InputDecoration(
            hintText: 'ابحث عن موكل أو قضية أو مهمة أو جلسة...',
            prefixIcon: Icon(Icons.search),
          ),
        ),
        const SizedBox(height: 16),
        if (viewModel.state == AsyncState.loading)
          const SizedBox(height: 300, child: AppLoading(message: 'جارٍ البحث...'))
        else if (viewModel.state == AsyncState.error)
          SizedBox(height: 300, child: AppEmptyState(message: viewModel.error ?? 'تعذر البحث'))
        else if (viewModel.result == null)
          const SizedBox(height: 300, child: AppEmptyState(message: 'ابدأ بالبحث لرؤية النتائج'))
        else ...[
          _Section(
            title: 'الموكلون',
            count: viewModel.result!.clients.length,
            children: viewModel.result!.clients
                .map(
                  (item) => ListTile(
                    title: Text(item.name),
                    subtitle: Text(item.phone ?? item.email ?? item.serviceType ?? ''),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go('/clients/${item.id}'),
                  ),
                )
                .toList(growable: false),
          ),
          _Section(
            title: 'القضايا',
            count: viewModel.result!.cases.length,
            children: viewModel.result!.cases
                .map(
                  (item) => ListTile(
                    title: Text(item.caseNumber),
                    subtitle: Text(item.clientName ?? item.court ?? ''),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go('/cases/${item.id}'),
                  ),
                )
                .toList(growable: false),
          ),
          _Section(
            title: 'المهام',
            count: viewModel.result!.tasks.length,
            children: viewModel.result!.tasks
                .map(
                  (item) => ListTile(
                    title: Text(item.title),
                    subtitle: Text(item.caseNumber ?? item.assigneeName ?? ''),
                  ),
                )
                .toList(growable: false),
          ),
          _Section(
            title: 'الجلسات',
            count: viewModel.result!.hearings.length,
            children: viewModel.result!.hearings
                .map(
                  (item) => ListTile(
                    title: Text(item.court ?? item.caseNumber ?? '#${item.id}'),
                    subtitle: Text(item.assignedLawyerName ?? item.status),
                  ),
                )
                .toList(growable: false),
          ),
        ],
      ],
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.count,
    required this.children,
  });

  final String title;
  final int count;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$title ($count)', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            if (children.isEmpty)
              const Padding(
                padding: EdgeInsets.all(8),
                child: Text('لا توجد نتائج', style: TextStyle(color: Color(0xFF64748B))),
              )
            else
              ...children,
          ],
        ),
      ),
    );
  }
}
