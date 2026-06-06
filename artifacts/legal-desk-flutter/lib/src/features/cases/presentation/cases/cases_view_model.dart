import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../clients/data/client_models.dart';
import '../../../clients/data/clients_repository.dart';
import '../../../users/data/user_models.dart';
import '../../../users/data/users_repository.dart';
import '../../data/case_models.dart';
import '../../data/cases_repository.dart';

class CasesViewModel extends ChangeNotifier {
  CasesViewModel(this._casesRepository, this._clientsRepository, this._usersRepository);

  final CasesRepository _casesRepository;
  final ClientsRepository _clientsRepository;
  final UsersRepository _usersRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  List<CaseModel> _cases = const [];
  List<ClientModel> _clients = const [];
  List<UserModel> _users = const [];
  String _search = '';

  AsyncState get state => _state;
  String? get error => _error;
  List<CaseModel> get cases => _cases;
  List<ClientModel> get clients => _clients;
  List<UserModel> get users => _users;
  String get search => _search;

  List<CaseModel> get filteredCases {
    final q = _search.trim().toLowerCase();
    if (q.isEmpty) return _cases;
    return _cases.where((item) {
      return item.caseNumber.toLowerCase().contains(q) ||
          (item.clientName ?? '').toLowerCase().contains(q) ||
          (item.court ?? '').toLowerCase().contains(q) ||
          (item.opposingParty ?? '').toLowerCase().contains(q);
    }).toList(growable: false);
  }

  Future<void> load() async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _casesRepository.list(),
        _clientsRepository.list(),
        _usersRepository.list(),
      ]);
      _cases = results[0] as List<CaseModel>;
      _clients = results[1] as List<ClientModel>;
      _users = results[2] as List<UserModel>;
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل بيانات القضايا.';
    }

    notifyListeners();
  }

  void updateSearch(String value) {
    _search = value;
    notifyListeners();
  }

  Future<void> create(CreateCaseInput input) async {
    await _casesRepository.create(input);
    await load();
  }

  Future<void> delete(CaseModel item) async {
    await _casesRepository.delete(item.id);
    await load();
  }
}
