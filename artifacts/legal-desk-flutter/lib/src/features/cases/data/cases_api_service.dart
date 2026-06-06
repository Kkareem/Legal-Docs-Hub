import 'package:dio/dio.dart';

import 'case_models.dart';

class CasesApiService {
  CasesApiService(this._dio);

  final Dio _dio;

  Future<List<CaseModel>> list({
    String? status,
    String? type,
    int? lawyerId,
    int? clientId,
    String? search,
  }) async {
    final queryParameters = <String, dynamic>{};
    if (status?.isNotEmpty ?? false) queryParameters['status'] = status;
    if (type?.isNotEmpty ?? false) queryParameters['type'] = type;
    if (lawyerId != null) queryParameters['lawyerId'] = lawyerId;
    if (clientId != null) queryParameters['clientId'] = clientId;
    if (search?.isNotEmpty ?? false) queryParameters['search'] = search;

    final response = await _dio.get<List<dynamic>>(
      '/cases',
      queryParameters: queryParameters,
    );
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(CaseModel.fromJson)
        .toList(growable: false);
  }

  Future<CaseModel> get(int id) async {
    final response = await _dio.get<Map<String, dynamic>>('/cases/$id');
    return CaseModel.fromJson(response.data!);
  }

  Future<CaseModel> create(CreateCaseInput input) async {
    final response = await _dio.post<Map<String, dynamic>>('/cases', data: input.toJson());
    return CaseModel.fromJson(response.data!);
  }

  Future<CaseModel> update(int id, Map<String, dynamic> payload) async {
    final response = await _dio.patch<Map<String, dynamic>>('/cases/$id', data: payload);
    return CaseModel.fromJson(response.data!);
  }

  Future<void> delete(int id) async {
    await _dio.delete('/cases/$id');
  }
}
