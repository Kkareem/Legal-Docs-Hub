import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../cases/data/case_models.dart';
import '../../../cases/data/cases_repository.dart';
import '../../../clients/data/client_models.dart';
import '../../../clients/data/clients_repository.dart';
import '../../data/document_models.dart';
import '../../data/documents_repository.dart';

class DocumentsViewModel extends ChangeNotifier {
  DocumentsViewModel(this._repository, this._authRepository, this._casesRepository, this._clientsRepository);

  final DocumentsRepository _repository;
  final AuthRepository _authRepository;
  final CasesRepository _casesRepository;
  final ClientsRepository _clientsRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  List<DocumentModel> _documents = const [];
  List<CaseModel> _cases = const [];
  List<ClientModel> _clients = const [];
  String _search = '';
  String _docType = 'all';

  AsyncState get state => _state;
  String? get error => _error;
  List<DocumentModel> get documents => _documents;
  List<CaseModel> get cases => _cases;
  List<ClientModel> get clients => _clients;
  int? get currentUserId => _authRepository.currentUser?.id;
  String get docType => _docType;

  List<DocumentModel> get filteredDocuments {
    final q = _search.trim().toLowerCase();
    if (q.isEmpty) return _documents;
    return _documents.where((item) => item.fileName.toLowerCase().contains(q)).toList(growable: false);
  }

  Future<void> load() async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.list(docType: _docType == 'all' ? null : _docType),
        _casesRepository.list(),
        _clientsRepository.list(),
      ]);
      _documents = results[0] as List<DocumentModel>;
      _cases = results[1] as List<CaseModel>;
      _clients = results[2] as List<ClientModel>;
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل المستندات.';
    }

    notifyListeners();
  }

  void updateSearch(String value) {
    _search = value;
    notifyListeners();
  }

  void updateDocType(String value) {
    _docType = value;
    notifyListeners();
  }

  Future<void> create(CreateDocumentInput input) async {
    await _repository.create(input);
    await load();
  }

  Future<void> delete(DocumentModel item) async {
    await _repository.delete(item.id);
    await load();
  }
}
