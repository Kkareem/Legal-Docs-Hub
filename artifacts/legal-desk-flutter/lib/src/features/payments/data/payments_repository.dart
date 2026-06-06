import 'payment_models.dart';
import 'payments_api_service.dart';

class PaymentsRepository {
  PaymentsRepository(this._service);

  final PaymentsApiService _service;

  Future<List<PaymentModel>> list({String? status, int? clientId, int? caseId}) =>
      _service.list(status: status, clientId: clientId, caseId: caseId);
  Future<PaymentSummaryModel> summary() => _service.summary();
  Future<PaymentModel> create(CreatePaymentInput input) => _service.create(input);
  Future<PaymentModel> update(int id, Map<String, dynamic> payload) => _service.update(id, payload);
  Future<void> delete(int id) => _service.delete(id);
}
