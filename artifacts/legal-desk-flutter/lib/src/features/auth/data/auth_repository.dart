import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'auth_api_service.dart';
import 'auth_models.dart';

enum AuthState {
  unknown,
  authenticated,
  unauthenticated,
}

class AuthRepository extends ChangeNotifier {
  AuthRepository(this._service, this._preferences);

  final AuthApiService _service;
  final SharedPreferences _preferences;

  static const _lastEmailKey = 'last_login_email';

  AuthState _state = AuthState.unknown;
  AuthUser? _currentUser;

  AuthState get state => _state;
  AuthUser? get currentUser => _currentUser;
  String? get lastLoginEmail => _preferences.getString(_lastEmailKey);

  Future<void> restoreSession() async {
    _state = AuthState.unknown;
    notifyListeners();

    try {
      final user = await _service.me();
      _currentUser = user;
      _state = AuthState.authenticated;
    } catch (_) {
      _currentUser = null;
      _state = AuthState.unauthenticated;
    }

    notifyListeners();
  }

  Future<void> login(LoginRequest request) async {
    final response = await _service.login(request);
    _currentUser = response.user;
    _state = AuthState.authenticated;
    await _preferences.setString(_lastEmailKey, request.email);
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await _service.logout();
    } finally {
      _currentUser = null;
      _state = AuthState.unauthenticated;
      notifyListeners();
    }
  }
}
