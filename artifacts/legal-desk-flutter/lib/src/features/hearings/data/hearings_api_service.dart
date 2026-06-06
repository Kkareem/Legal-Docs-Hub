import 'package:dio/dio.dart';

import 'hearing_models.dart';

class HearingsApiService {
  HearingsApiService(this._dio);

  final Dio _dio;

  Future<List<HearingModel>> list({String? status, int? caseId}) async {
    final response = await _dio.get<List<dynamic>>(
      '/hearings',
      queryParameters: {
        'status': status,
        'caseId': caseId,
      },
    );
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(HearingModel.fromJson)
        .toList(growable: false);
  }

  Future<HearingModel> create(CreateHearingInput input) async {
    final response = await _dio.post<Map<String, dynamic>>('/hearings', data: input.toJson());
    return HearingModel.fromJson(response.data!);
  }

  Future<HearingModel> update(int id, Map<String, dynamic> payload) async {
    final response = await _dio.patch<Map<String, dynamic>>('/hearings/$id', data: payload);
    return HearingModel.fromJson(response.data!);
  }

  Future<void> delete(int id) => _dio.delete<void>('/hearings/$id');
}
