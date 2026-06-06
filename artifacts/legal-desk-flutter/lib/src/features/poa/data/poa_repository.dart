import 'poa_api_service.dart';
import 'poa_models.dart';

class PowerOfAttorneyRepository {
  PowerOfAttorneyRepository(this._service);

  final PowerOfAttorneyApiService _service;

  Future<List<PowerOfAttorneyModel>> list({String? status}) => _service.list(status: status);
  Future<PowerOfAttorneyModel> create(CreatePowerOfAttorneyInput input) => _service.create(input);
  Future<PowerOfAttorneyModel> update(int id, Map<String, dynamic> payload) => _service.update(id, payload);
  Future<void> delete(int id) => _service.delete(id);
}
