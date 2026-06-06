import 'package:dio/dio.dart';

import 'task_models.dart';

class TasksApiService {
  TasksApiService(this._dio);

  final Dio _dio;

  Future<List<TaskModel>> list({
    String? status,
    String? priority,
    int? caseId,
  }) async {
    final queryParameters = <String, dynamic>{};
    if (status?.isNotEmpty ?? false) queryParameters['status'] = status;
    if (priority?.isNotEmpty ?? false) queryParameters['priority'] = priority;
    if (caseId != null) queryParameters['caseId'] = caseId;

    final response = await _dio.get<List<dynamic>>(
      '/tasks',
      queryParameters: queryParameters,
    );
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(TaskModel.fromJson)
        .toList(growable: false);
  }

  Future<TaskModel> create(CreateTaskInput input) async {
    final response = await _dio.post<Map<String, dynamic>>('/tasks', data: input.toJson());
    return TaskModel.fromJson(response.data!);
  }

  Future<TaskModel> updateStatus(int id, String status) async {
    final response = await _dio.patch<Map<String, dynamic>>('/tasks/$id', data: {'status': status});
    return TaskModel.fromJson(response.data!);
  }

  Future<void> delete(int id) async {
    await _dio.delete('/tasks/$id');
  }
}
