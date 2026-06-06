import 'package:dio/dio.dart';

import 'consultation_models.dart';

class ConsultationsApiService {
  ConsultationsApiService(this._dio);

  final Dio _dio;

  Future<List<ConsultationModel>> list({String? status}) async {
    final response = await _dio.get<List<dynamic>>(
      '/consultations',
      queryParameters: {
        'status': status,
      },
    );
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(ConsultationModel.fromJson)
        .toList(growable: false);
  }

  Future<ConsultationModel> create(CreateConsultationInput input) async {
    final response = await _dio.post<Map<String, dynamic>>('/consultations', data: input.toJson());
    return ConsultationModel.fromJson(response.data!);
  }

  Future<ConsultationModel> update(int id, Map<String, dynamic> payload) async {
    final response = await _dio.patch<Map<String, dynamic>>('/consultations/$id', data: payload);
    return ConsultationModel.fromJson(response.data!);
  }

  Future<void> delete(int id) => _dio.delete<void>('/consultations/$id');
}
