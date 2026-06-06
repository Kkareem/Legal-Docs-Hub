import 'consultation_models.dart';
import 'consultations_api_service.dart';

class ConsultationsRepository {
  ConsultationsRepository(this._service);

  final ConsultationsApiService _service;

  Future<List<ConsultationModel>> list({String? status}) => _service.list(status: status);
  Future<ConsultationModel> create(CreateConsultationInput input) => _service.create(input);
  Future<ConsultationModel> update(int id, Map<String, dynamic> payload) => _service.update(id, payload);
  Future<void> delete(int id) => _service.delete(id);
}
