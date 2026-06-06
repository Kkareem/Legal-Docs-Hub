import 'user_models.dart';
import 'users_api_service.dart';

class UsersRepository {
  UsersRepository(this._service);

  final UsersApiService _service;

  Future<List<UserModel>> list() => _service.list();
  Future<UserModel> create(Map<String, dynamic> payload) => _service.create(payload);
  Future<UserModel> update(int id, Map<String, dynamic> payload) => _service.update(id, payload);
}
