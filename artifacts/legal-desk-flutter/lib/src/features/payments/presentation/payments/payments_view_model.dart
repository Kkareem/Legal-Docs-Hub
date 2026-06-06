import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../cases/data/case_models.dart';
import '../../../cases/data/cases_repository.dart';
import '../../../clients/data/client_models.dart';
import '../../../clients/data/clients_repository.dart';
import '../../data/payment_models.dart';
import '../../data/payments_repository.dart';

class PaymentsViewModel extends ChangeNotifier {
  PaymentsViewModel(this._repository, this._clientsRepository, this._casesRepository);

  final PaymentsRepository _repository;
  final ClientsRepository _clientsRepository;
  final CasesRepository _casesRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  List<PaymentModel> _payments = const [];
  List<ClientModel> _clients = const [];
  List<CaseModel> _cases = const [];
  PaymentSummaryModel? _summary;
  String _status = 'all';

  AsyncState get state => _state;
  String? get error => _error;
  List<PaymentModel> get payments => _payments;
  List<ClientModel> get clients => _clients;
  List<CaseModel> get cases => _cases;
  PaymentSummaryModel? get summary => _summary;
  String get status => _status;

  Future<void> load() async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.list(status: _status == 'all' ? null : _status),
        _repository.summary(),
        _clientsRepository.list(),
        _casesRepository.list(),
      ]);
      _payments = results[0] as List<PaymentModel>;
      _summary = results[1] as PaymentSummaryModel;
      _clients = results[2] as List<ClientModel>;
      _cases = results[3] as List<CaseModel>;
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل بيانات المدفوعات.';
    }

    notifyListeners();
  }

  void updateStatus(String value) {
    _status = value;
    notifyListeners();
  }

  Future<void> create(CreatePaymentInput input) async {
    await _repository.create(input);
    await load();
  }

  Future<void> markPaid(PaymentModel item) async {
    await _repository.update(item.id, {
      'status': 'paid',
      'paidAt': DateTime.now().toIso8601String(),
    });
    await load();
  }

  Future<void> delete(PaymentModel item) async {
    await _repository.delete(item.id);
    await load();
  }
}
