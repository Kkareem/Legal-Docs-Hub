import 'hearing_models.dart';
import 'hearings_api_service.dart';

class HearingsRepository {
  HearingsRepository(this._service);

  final HearingsApiService _service;

  Future<List<HearingModel>> list({String? status, int? caseId}) => _service.list(status: status, caseId: caseId);
  Future<HearingModel> create(CreateHearingInput input) => _service.create(input);
  Future<HearingModel> updateStatus(int id, String status) => _service.update(id, {'status': status});
  Future<void> delete(int id) => _service.delete(id);
}
