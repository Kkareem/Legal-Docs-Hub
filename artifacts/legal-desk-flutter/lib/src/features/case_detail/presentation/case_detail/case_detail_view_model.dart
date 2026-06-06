import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../cases/data/case_models.dart';
import '../../../cases/data/cases_repository.dart';
import '../../../documents/data/document_models.dart';
import '../../../documents/data/documents_repository.dart';
import '../../../hearings/data/hearing_models.dart';
import '../../../hearings/data/hearings_repository.dart';
import '../../../tasks/data/task_models.dart';
import '../../../tasks/data/tasks_repository.dart';

class CaseDetailViewModel extends ChangeNotifier {
  CaseDetailViewModel(this._casesRepository, this._hearingsRepository, this._tasksRepository, this._documentsRepository);

  final CasesRepository _casesRepository;
  final HearingsRepository _hearingsRepository;
  final TasksRepository _tasksRepository;
  final DocumentsRepository _documentsRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  CaseModel? _caseItem;
  List<HearingModel> _hearings = const [];
  List<TaskModel> _tasks = const [];
  List<DocumentModel> _documents = const [];

  AsyncState get state => _state;
  String? get error => _error;
  CaseModel? get caseItem => _caseItem;
  List<HearingModel> get hearings => _hearings;
  List<TaskModel> get tasks => _tasks;
  List<DocumentModel> get documents => _documents;

  Future<void> load(int caseId) async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _casesRepository.get(caseId),
        _hearingsRepository.list(caseId: caseId),
        _tasksRepository.list(caseId: caseId),
        _documentsRepository.list(caseId: caseId),
      ]);
      _caseItem = results[0] as CaseModel;
      _hearings = results[1] as List<HearingModel>;
      _tasks = results[2] as List<TaskModel>;
      _documents = results[3] as List<DocumentModel>;
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل ملف القضية.';
    }
    notifyListeners();
  }

  Future<void> updateStatus(int caseId, String status) async {
    await _casesRepository.update(caseId, {'status': status});
    await load(caseId);
  }
}
