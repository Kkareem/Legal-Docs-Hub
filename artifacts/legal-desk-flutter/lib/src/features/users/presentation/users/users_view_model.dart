import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../auth/data/auth_repository.dart';
import '../../data/user_models.dart';
import '../../data/users_repository.dart';

class UsersViewModel extends ChangeNotifier {
  UsersViewModel(this._repository, this._authRepository);

  final UsersRepository _repository;
  final AuthRepository _authRepository;

  AsyncState _state = AsyncState.idle;
  String? _error;
  List<UserModel> _users = const [];

  AsyncState get state => _state;
  String? get error => _error;
  List<UserModel> get users => _users;
  bool get canManage => _authRepository.currentUser?.role == 'owner';
  int? get currentUserId => _authRepository.currentUser?.id;

  Future<void> load() async {
    _state = AsyncState.loading;
    _error = null;
    notifyListeners();

    try {
      _users = await _repository.list();
      _state = AsyncState.success;
    } catch (_) {
      _state = AsyncState.error;
      _error = 'تعذر تحميل أعضاء الفريق.';
    }

    notifyListeners();
  }

  Future<void> create({
    required String name,
    required String email,
    required String password,
    String? phone,
    required String role,
  }) async {
    await _repository.create({
      'name': name,
      'email': email,
      'password': password,
      'phone': phone,
      'role': role,
    });
    await load();
  }

  Future<void> toggleActive(UserModel item) async {
    await _repository.update(item.id, {'active': !item.active});
    await load();
  }
}
