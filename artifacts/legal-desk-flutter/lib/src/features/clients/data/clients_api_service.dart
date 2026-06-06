import 'package:dio/dio.dart';

import 'client_models.dart';

class ClientsApiService {
  ClientsApiService(this._dio);

  final Dio _dio;

  Future<List<ClientModel>> list({
    String? search,
    String? status,
  }) async {
    final response = await _dio.get<List<dynamic>>(
      '/clients',
      queryParameters: {
        if (search != null && search.isNotEmpty) 'search': search,
        if (status != null && status.isNotEmpty) 'status': status,
      },
    );

    return response.data!
        .cast<Map<String, dynamic>>()
        .map(ClientModel.fromJson)
        .toList(growable: false);
  }

  Future<ClientModel> get(int id) async {
    final response = await _dio.get<Map<String, dynamic>>('/clients/$id');
    return ClientModel.fromJson(response.data!);
  }

  Future<ClientSummaryModel> getSummary(int id) async {
    final response = await _dio.get<Map<String, dynamic>>('/clients/$id/summary');
    return ClientSummaryModel.fromJson(response.data!);
  }

  Future<ClientModel> create(CreateClientInput input) async {
    final response = await _dio.post<Map<String, dynamic>>('/clients', data: input.toJson());
    return ClientModel.fromJson(response.data!);
  }

  Future<void> delete(int id) async {
    await _dio.delete('/clients/$id');
  }
}
