import 'package:dio/dio.dart';

import 'poa_models.dart';

class PowerOfAttorneyApiService {
  PowerOfAttorneyApiService(this._dio);

  final Dio _dio;

  Future<List<PowerOfAttorneyModel>> list({String? status}) async {
    final response = await _dio.get<List<dynamic>>(
      '/powers-of-attorney',
      queryParameters: {'status': status},
    );
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(PowerOfAttorneyModel.fromJson)
        .toList(growable: false);
  }

  Future<PowerOfAttorneyModel> create(CreatePowerOfAttorneyInput input) async {
    final response = await _dio.post<Map<String, dynamic>>('/powers-of-attorney', data: input.toJson());
    return PowerOfAttorneyModel.fromJson(response.data!);
  }

  Future<PowerOfAttorneyModel> update(int id, Map<String, dynamic> payload) async {
    final response = await _dio.patch<Map<String, dynamic>>('/powers-of-attorney/$id', data: payload);
    return PowerOfAttorneyModel.fromJson(response.data!);
  }

  Future<void> delete(int id) => _dio.delete<void>('/powers-of-attorney/$id');
}
