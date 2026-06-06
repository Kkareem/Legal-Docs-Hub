import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../cases/data/case_models.dart';
import '../../../cases/data/cases_repository.dart';
import '../../../clients/data/client_models.dart';
import '../../../clients/data/clients_repository.dart';
import '../../../users/data/user_models.dart';
import '../../../users/data/users_repository.dart';
import '../../data/poa_models.dart';
import '../../data/poa_repository.dart';

class PowerOfAttorneyViewModel extends ChangeNotifier {
  PowerOfAttorneyViewModel(this._repository, this._clientsRepository, this._casesRepository, this._usersRepository);

  final PowerOfAttorneyRepository _repository;
  final ClientsRepository _clientsRepository;
  final CasesRepository _casesRepository;
  final UsersRepository _usersRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  List<PowerOfAttorneyModel> _items = const [];
  List<ClientModel> _clients = const [];
  List<CaseModel> _cases = const [];
  List<UserModel> _users = const [];
  String _status = 'all';

  AsyncState get state => _state;
  String? get error => _error;
  List<PowerOfAttorneyModel> get items => _items;
  List<ClientModel> get clients => _clients;
  List<CaseModel> get cases => _cases;
  List<UserModel> get users => _users;
  String get status => _status;

  Future<void> load() async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.list(status: _status == 'all' ? null : _status),
        _clientsRepository.list(),
        _casesRepository.list(),
        _usersRepository.list(),
      ]);
      _items = results[0] as List<PowerOfAttorneyModel>;
      _clients = results[1] as List<ClientModel>;
      _cases = results[2] as List<CaseModel>;
      _users = results[3] as List<UserModel>;
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل بيانات الوكالات.';
    }
    notifyListeners();
  }

  void updateStatus(String value) {
    _status = value;
    notifyListeners();
  }

  Future<void> create(CreatePowerOfAttorneyInput input) async {
    await _repository.create(input);
    await load();
  }

  Future<void> markReturned(PowerOfAttorneyModel item) async {
    await _repository.update(item.id, {
      'status': 'returned',
      'returnedAt': DateTime.now().toIso8601String(),
    });
    await load();
  }

  Future<void> delete(PowerOfAttorneyModel item) async {
    await _repository.delete(item.id);
    await load();
  }
}
