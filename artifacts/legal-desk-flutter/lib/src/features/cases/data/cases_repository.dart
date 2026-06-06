import 'case_models.dart';
import 'cases_api_service.dart';

class CasesRepository {
  CasesRepository(this._service);

  final CasesApiService _service;

  Future<List<CaseModel>> list({
    String? status,
    String? type,
    int? lawyerId,
    int? clientId,
    String? search,
  }) =>
      _service.list(
        status: status,
        type: type,
        lawyerId: lawyerId,
        clientId: clientId,
        search: search,
      );

  Future<CaseModel> get(int id) => _service.get(id);

  Future<CaseModel> create(CreateCaseInput input) => _service.create(input);

  Future<CaseModel> update(int id, Map<String, dynamic> payload) => _service.update(id, payload);

  Future<void> delete(int id) => _service.delete(id);
}
