import 'package:dio/dio.dart';

import 'user_models.dart';

class UsersApiService {
  UsersApiService(this._dio);

  final Dio _dio;

  Future<List<UserModel>> list() async {
    final response = await _dio.get<List<dynamic>>('/users');
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(UserModel.fromJson)
        .toList(growable: false);
  }

  Future<UserModel> create(Map<String, dynamic> payload) async {
    final response = await _dio.post<Map<String, dynamic>>('/users', data: payload);
    return UserModel.fromJson(response.data!);
  }

  Future<UserModel> update(int id, Map<String, dynamic> payload) async {
    final response = await _dio.patch<Map<String, dynamic>>('/users/$id', data: payload);
    return UserModel.fromJson(response.data!);
  }
}
