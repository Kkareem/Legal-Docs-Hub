import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../users/data/users_repository.dart';

class ProfileViewModel extends ChangeNotifier {
  ProfileViewModel(this._authRepository, this._usersRepository);

  final AuthRepository _authRepository;
  final UsersRepository _usersRepository;

  AsyncState _state = AsyncState.idle;
  String? _message;

  AsyncState get state => _state;
  String? get message => _message;

  Future<bool> updateProfile({required String name, String? phone}) async {
    final user = _authRepository.currentUser;
    if (user == null) return false;

    _state = AsyncState.loading;
    _message = null;
    notifyListeners();

    try {
      await _usersRepository.update(user.id, {
        'name': name,
        'phone': phone,
      });
      await _authRepository.restoreSession();
      _state = AsyncState.success;
      _message = 'تم تحديث البيانات بنجاح.';
      notifyListeners();
      return true;
    } catch (_) {
      _state = AsyncState.error;
      _message = 'تعذر تحديث الملف الشخصي.';
      notifyListeners();
      return false;
    }
  }

  Future<bool> changePassword(String password) async {
    final user = _authRepository.currentUser;
    if (user == null) return false;

    _state = AsyncState.loading;
    _message = null;
    notifyListeners();

    try {
      await _usersRepository.update(user.id, {'password': password});
      _state = AsyncState.success;
      _message = 'تم تغيير كلمة المرور بنجاح.';
      notifyListeners();
      return true;
    } catch (_) {
      _state = AsyncState.error;
      _message = 'تعذر تغيير كلمة المرور.';
      notifyListeners();
      return false;
    }
  }
}
