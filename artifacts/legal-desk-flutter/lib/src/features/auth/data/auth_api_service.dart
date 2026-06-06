import 'package:dio/dio.dart';

import 'auth_models.dart';

class AuthApiService {
  AuthApiService(this._dio);

  final Dio _dio;

  Future<LoginResponse> login(LoginRequest request) async {
    final response = await _dio.post<Map<String, dynamic>>('/auth/login', data: request.toJson());
    return LoginResponse.fromJson(response.data!);
  }

  Future<AuthUser> me() async {
    final response = await _dio.get<Map<String, dynamic>>('/auth/me');
    return AuthUser.fromJson(response.data!);
  }

  Future<void> logout() async {
    await _dio.post('/auth/logout');
  }
}
