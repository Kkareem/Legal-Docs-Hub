import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../cases/data/case_models.dart';
import '../../../cases/data/cases_repository.dart';
import '../../../clients/data/client_models.dart';
import '../../../clients/data/clients_repository.dart';
import '../../../documents/data/document_models.dart';
import '../../../documents/data/documents_repository.dart';
import '../../../payments/data/payment_models.dart';
import '../../../payments/data/payments_repository.dart';

class ClientDetailViewModel extends ChangeNotifier {
  ClientDetailViewModel(this._clientsRepository, this._casesRepository, this._paymentsRepository, this._documentsRepository);

  final ClientsRepository _clientsRepository;
  final CasesRepository _casesRepository;
  final PaymentsRepository _paymentsRepository;
  final DocumentsRepository _documentsRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  ClientModel? _client;
  ClientSummaryModel? _summary;
  List<CaseModel> _cases = const [];
  List<PaymentModel> _payments = const [];
  List<DocumentModel> _documents = const [];

  AsyncState get state => _state;
  String? get error => _error;
  ClientModel? get client => _client;
  ClientSummaryModel? get summary => _summary;
  List<CaseModel> get cases => _cases;
  List<PaymentModel> get payments => _payments;
  List<DocumentModel> get documents => _documents;

  Future<void> load(int clientId) async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _clientsRepository.get(clientId),
        _clientsRepository.getSummary(clientId),
        _casesRepository.list(clientId: clientId),
        _paymentsRepository.list(clientId: clientId),
        _documentsRepository.list(clientId: clientId),
      ]);
      _client = results[0] as ClientModel;
      _summary = results[1] as ClientSummaryModel;
      _cases = results[2] as List<CaseModel>;
      _payments = results[3] as List<PaymentModel>;
      _documents = results[4] as List<DocumentModel>;
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل ملف الموكل.';
    }
    notifyListeners();
  }
}
