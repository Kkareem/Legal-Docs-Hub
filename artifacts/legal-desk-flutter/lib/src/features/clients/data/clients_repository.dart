import 'client_models.dart';
import 'clients_api_service.dart';

class ClientsRepository {
  ClientsRepository(this._service);

  final ClientsApiService _service;

  Future<List<ClientModel>> list({
    String? search,
    String? status,
  }) => _service.list(search: search, status: status);

  Future<ClientModel> get(int id) => _service.get(id);

  Future<ClientSummaryModel> getSummary(int id) => _service.getSummary(id);

  Future<ClientModel> create(CreateClientInput input) => _service.create(input);

  Future<void> delete(int id) => _service.delete(id);
}
