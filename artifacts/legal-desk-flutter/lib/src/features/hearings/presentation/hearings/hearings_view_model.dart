import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../cases/data/case_models.dart';
import '../../../cases/data/cases_repository.dart';
import '../../../users/data/user_models.dart';
import '../../../users/data/users_repository.dart';
import '../../data/hearing_models.dart';
import '../../data/hearings_repository.dart';

class HearingsViewModel extends ChangeNotifier {
  HearingsViewModel(this._repository, this._casesRepository, this._usersRepository);

  final HearingsRepository _repository;
  final CasesRepository _casesRepository;
  final UsersRepository _usersRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  List<HearingModel> _hearings = const [];
  List<CaseModel> _cases = const [];
  List<UserModel> _users = const [];
  String _status = 'all';

  AsyncState get state => _state;
  String? get error => _error;
  List<HearingModel> get hearings => _hearings;
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
        _casesRepository.list(),
        _usersRepository.list(),
      ]);
      _hearings = results[0] as List<HearingModel>;
      _cases = results[1] as List<CaseModel>;
      _users = results[2] as List<UserModel>;
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل بيانات الجلسات.';
    }

    notifyListeners();
  }

  void updateStatus(String value) {
    _status = value;
    notifyListeners();
  }

  Future<void> create(CreateHearingInput input) async {
    await _repository.create(input);
    await load();
  }

  Future<void> markCompleted(HearingModel item) async {
    await _repository.updateStatus(item.id, 'completed');
    await load();
  }

  Future<void> delete(HearingModel item) async {
    await _repository.delete(item.id);
    await load();
  }
}
