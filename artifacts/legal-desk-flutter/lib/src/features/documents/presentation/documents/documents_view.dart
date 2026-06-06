import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/models/async_state.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_loading.dart';
import '../../data/document_models.dart';
import 'documents_view_model.dart';

class DocumentsView extends StatefulWidget {
  const DocumentsView({super.key});

  @override
  State<DocumentsView> createState() => _DocumentsViewState();
}

class _DocumentsViewState extends State<DocumentsView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<DocumentsViewModel>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<DocumentsViewModel>();

    return RefreshIndicator(
      onRefresh: viewModel.load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            onChanged: viewModel.updateSearch,
            decoration: const InputDecoration(
              hintText: 'بحث في المستندات...',
              prefixIcon: Icon(Icons.search),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: viewModel.docType,
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('جميع الأنواع')),
                    DropdownMenuItem(value: 'contract', child: Text('عقد')),
                    DropdownMenuItem(value: 'ruling', child: Text('حكم قضائي')),
                    DropdownMenuItem(value: 'memo', child: Text('مذكرة')),
                    DropdownMenuItem(value: 'power_of_attorney', child: Text('وكالة')),
                    DropdownMenuItem(value: 'id_copy', child: Text('هوية')),
                    DropdownMenuItem(value: 'other', child: Text('أخرى')),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    viewModel.updateDocType(value);
                    viewModel.load();
                  },
                  decoration: const InputDecoration(labelText: 'نوع المستند'),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: () => _showCreateDialog(context, viewModel),
                icon: const Icon(Icons.note_add_outlined),
                label: const Text('إضافة مستند'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (viewModel.state == AsyncState.loading && viewModel.documents.isEmpty)
            const SizedBox(height: 420, child: AppLoading(message: 'جارٍ تحميل المستندات...'))
          else if (viewModel.filteredDocuments.isEmpty)
            const SizedBox(height: 420, child: AppEmptyState(message: 'لا توجد مستندات'))
          else
            ...viewModel.filteredDocuments.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AppCard(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE8F0FC),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.description_outlined),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.fileName, style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 6),
                            Text(_docTypeLabel(item.docType), style: const TextStyle(color: Color(0xFF64748B))),
                            const SizedBox(height: 4),
                            Text(formatDate(item.createdAt), style: const TextStyle(color: Color(0xFF64748B))),
                            if (item.uploaderName != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text('رُفع بواسطة: ${item.uploaderName!}', style: const TextStyle(color: Color(0xFF64748B))),
                              ),
                            if (item.notes != null && item.notes!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Text(item.notes!, style: const TextStyle(color: Color(0xFF64748B))),
                              ),
                          ],
                        ),
                      ),
                      Column(
                        children: [
                          TextButton(
                            onPressed: () => _showUrlDialog(context, item.fileUrl),
                            child: const Text('الرابط'),
                          ),
                          IconButton(
                            onPressed: () async {
                              final ok = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('حذف المستند'),
                                  content: Text('هل تريد حذف "${item.fileName}"؟'),
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

  String _docTypeLabel(String value) => switch (value) {
        'contract' => 'عقد',
        'ruling' => 'حكم قضائي',
        'memo' => 'مذكرة',
        'power_of_attorney' => 'وكالة',
        'id_copy' => 'هوية',
        'other' => 'أخرى',
        _ => value,
      };

  Future<void> _showCreateDialog(BuildContext context, DocumentsViewModel viewModel) async {
    String fileName = '';
    String fileUrl = '';
    String docType = 'other';
    String notes = '';
    int? clientId;
    int? caseId;
    bool isOriginal = false;

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('إضافة مستند'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  onChanged: (value) => fileName = value,
                  decoration: const InputDecoration(labelText: 'اسم الملف *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  onChanged: (value) => fileUrl = value,
                  decoration: const InputDecoration(labelText: 'رابط الملف *'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: docType,
                  items: const [
                    DropdownMenuItem(value: 'contract', child: Text('عقد')),
                    DropdownMenuItem(value: 'ruling', child: Text('حكم قضائي')),
                    DropdownMenuItem(value: 'memo', child: Text('مذكرة')),
                    DropdownMenuItem(value: 'power_of_attorney', child: Text('وكالة')),
                    DropdownMenuItem(value: 'id_copy', child: Text('هوية')),
                    DropdownMenuItem(value: 'other', child: Text('أخرى')),
                  ],
                  onChanged: (value) => setState(() => docType = value ?? 'other'),
                  decoration: const InputDecoration(labelText: 'نوع المستند'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  initialValue: clientId,
                  items: viewModel.clients
                      .map((item) => DropdownMenuItem<int>(value: item.id, child: Text(item.name)))
                      .toList(growable: false),
                  onChanged: (value) => setState(() => clientId = value),
                  decoration: const InputDecoration(labelText: 'الموكل'),
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
                  onChanged: (value) => notes = value,
                  decoration: const InputDecoration(labelText: 'ملاحظات'),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: isOriginal,
                  onChanged: (value) => setState(() => isOriginal = value),
                  title: const Text('نسخة أصلية'),
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
                if (fileName.trim().isEmpty || fileUrl.trim().isEmpty) return;
                await viewModel.create(
                  CreateDocumentInput(
                    fileName: fileName.trim(),
                    fileUrl: fileUrl.trim(),
                    docType: docType,
                    isOriginal: isOriginal,
                    clientId: clientId,
                    caseId: caseId,
                    uploadedBy: viewModel.currentUserId,
                    notes: notes.trim().isEmpty ? null : notes.trim(),
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

  Future<void> _showUrlDialog(BuildContext context, String url) async {
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('رابط المستند'),
        content: SelectableText(url),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }
}
