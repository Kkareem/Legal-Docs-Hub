import 'package:flutter/foundation.dart';

import '../../../../core/models/async_state.dart';
import '../../data/auth_models.dart';
import '../../data/auth_repository.dart';

class LoginViewModel extends ChangeNotifier {
  LoginViewModel(this._authRepository);

  final AuthRepository _authRepository;

  AsyncState _state = AsyncState.idle;
  String? _errorMessage;

  AsyncState get state => _state;
  String? get errorMessage => _errorMessage;

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _state = AsyncState.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.login(LoginRequest(email: email, password: password));
      _state = AsyncState.success;
      notifyListeners();
      return true;
    } catch (error) {
      _state = AsyncState.error;
      _errorMessage = 'فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.';
      notifyListeners();
      return false;
    }
  }
}
