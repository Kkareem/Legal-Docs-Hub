import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import '../../data/task_models.dart';
import 'tasks_view_model.dart';

class TasksView extends StatefulWidget {
  const TasksView({super.key});

  @override
  State<TasksView> createState() => _TasksViewState();
}

class _TasksViewState extends State<TasksView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<TasksViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<TasksViewModel>();

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
                    hintText: 'بحث في المهام...',
                    prefixIcon: Icon(Icons.search),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: () => _showCreateDialog(context, viewModel),
                icon: const Icon(Icons.add_task),
                label: const Text('إضافة مهمة'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: viewModel.status,
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('كل الحالات')),
                    DropdownMenuItem(value: 'new', child: Text('جديد')),
                    DropdownMenuItem(value: 'in_progress', child: Text('قيد التنفيذ')),
                    DropdownMenuItem(value: 'done', child: Text('مكتمل')),
                    DropdownMenuItem(value: 'needs_review', child: Text('مراجعة')),
                    DropdownMenuItem(value: 'overdue', child: Text('متأخر')),
                    DropdownMenuItem(value: 'cancelled', child: Text('ملغى')),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    viewModel.updateStatus(value);
                    viewModel.load();
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: viewModel.priority,
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('كل الأولويات')),
                    DropdownMenuItem(value: 'low', child: Text('منخفضة')),
                    DropdownMenuItem(value: 'medium', child: Text('متوسطة')),
                    DropdownMenuItem(value: 'high', child: Text('عالية')),
                    DropdownMenuItem(value: 'urgent', child: Text('عاجلة')),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    viewModel.updatePriority(value);
                    viewModel.load();
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (viewModel.state == AsyncState.loading && viewModel.tasks.isEmpty)
            const SizedBox(height: 420, child: AppLoading(message: 'جارٍ تحميل المهام...'))
          else if (viewModel.filteredTasks.isEmpty)
            const SizedBox(height: 420, child: AppEmptyState(message: 'لا توجد مهام'))
          else
            ...viewModel.filteredTasks.map(
              (task) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AppCard(
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(task.title, style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 6),
                            Text(
                              [
                                if (task.assigneeName != null) task.assigneeName!,
                                if (task.caseNumber != null) task.caseNumber!,
                                if (task.dueDate != null) task.dueDate!,
                              ].join(' • '),
                              style: const TextStyle(color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                Chip(label: Text(_priorityLabel(task.priority))),
                                Chip(label: Text(_statusLabel(task.status))),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Column(
                        children: [
                          if (task.status != 'done')
                            IconButton(
                              onPressed: () => viewModel.markDone(task),
                              icon: const Icon(Icons.check_circle_outline),
                            ),
                          IconButton(
                            onPressed: () async {
                              final ok = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('حذف المهمة'),
                                  content: Text('هل تريد حذف "${task.title}"؟'),
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
                                await viewModel.delete(task);
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

  String _priorityLabel(String priority) => switch (priority) {
        'low' => 'منخفضة',
        'medium' => 'متوسطة',
        'high' => 'عالية',
        'urgent' => 'عاجلة',
        _ => priority,
      };

  String _statusLabel(String status) => switch (status) {
        'new' => 'جديد',
        'in_progress' => 'قيد التنفيذ',
        'done' => 'مكتمل',
        'needs_review' => 'مراجعة',
        'overdue' => 'متأخر',
        'cancelled' => 'ملغى',
        _ => status,
      };

  Future<void> _showCreateDialog(BuildContext context, TasksViewModel viewModel) async {
    final title = TextEditingController();
    final description = TextEditingController();
    String priority = 'medium';
    String status = 'new';
    int? assignedTo;
    int? caseId;
    final dueDate = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('إضافة مهمة'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: title, decoration: const InputDecoration(labelText: 'العنوان *')),
                const SizedBox(height: 12),
                TextField(controller: description, decoration: const InputDecoration(labelText: 'الوصف')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: priority,
                  items: const [
                    DropdownMenuItem(value: 'low', child: Text('منخفضة')),
                    DropdownMenuItem(value: 'medium', child: Text('متوسطة')),
                    DropdownMenuItem(value: 'high', child: Text('عالية')),
                    DropdownMenuItem(value: 'urgent', child: Text('عاجلة')),
                  ],
                  onChanged: (value) => setState(() => priority = value ?? 'medium'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: status,
                  items: const [
                    DropdownMenuItem(value: 'new', child: Text('جديد')),
                    DropdownMenuItem(value: 'in_progress', child: Text('قيد التنفيذ')),
                    DropdownMenuItem(value: 'done', child: Text('مكتمل')),
                    DropdownMenuItem(value: 'needs_review', child: Text('مراجعة')),
                    DropdownMenuItem(value: 'overdue', child: Text('متأخر')),
                    DropdownMenuItem(value: 'cancelled', child: Text('ملغى')),
                  ],
                  onChanged: (value) => setState(() => status = value ?? 'new'),
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
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: caseId,
                  items: viewModel.cases
                      .map((item) => DropdownMenuItem<int>(value: item.id, child: Text(item.caseNumber)))
                      .toList(growable: false),
                  onChanged: (value) => setState(() => caseId = value),
                  decoration: const InputDecoration(labelText: 'القضية'),
                ),
                const SizedBox(height: 12),
                TextField(controller: dueDate, decoration: const InputDecoration(labelText: 'تاريخ الاستحقاق YYYY-MM-DD')),
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
                if (title.text.trim().isEmpty) return;
                await viewModel.create(
                  CreateTaskInput(
                    title: title.text.trim(),
                    description: description.text.trim().isEmpty ? null : description.text.trim(),
                    priority: priority,
                    status: status,
                    assignedTo: assignedTo,
                    caseId: caseId,
                    dueDate: dueDate.text.trim().isEmpty ? null : dueDate.text.trim(),
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
