import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../auth/data/auth_repository.dart';
import '../../data/client_models.dart';
import '../../data/clients_repository.dart';

class ClientsViewModel extends ChangeNotifier {
  ClientsViewModel(this._repository, this._authRepository);

  final ClientsRepository _repository;
  final AuthRepository _authRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  List<ClientModel> _clients = const [];
  String _search = '';
  String _status = 'all';

  AsyncState get state => _state;
  String? get error => _error;
  List<ClientModel> get clients => _clients;
  String get search => _search;
  String get status => _status;
  bool get canManage => _authRepository.currentUser != null;

  Future<void> load() async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      _clients = await _repository.list(
        search: _search.isEmpty ? null : _search,
        status: _status == 'all' ? null : _status,
      );
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل بيانات الموكلين.';
    }

    notifyListeners();
  }

  void updateSearch(String value) {
    _search = value;
    notifyListeners();
  }

  void updateStatus(String value) {
    _status = value;
    notifyListeners();
  }

  Future<void> create(CreateClientInput input) async {
    await _repository.create(input);
    await load();
  }

  Future<void> delete(ClientModel client) async {
    await _repository.delete(client.id);
    await load();
  }
}
