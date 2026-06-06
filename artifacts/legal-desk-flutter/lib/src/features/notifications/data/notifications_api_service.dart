import 'package:dio/dio.dart';

import 'notification_models.dart';

class NotificationsApiService {
  NotificationsApiService(this._dio);

  final Dio _dio;

  Future<List<NotificationModel>> list() async {
    final response = await _dio.get<List<dynamic>>('/notifications');
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(NotificationModel.fromJson)
        .toList(growable: false);
  }

  Future<NotificationModel> markRead(int id) async {
    final response = await _dio.patch<Map<String, dynamic>>('/notifications/$id/read');
    return NotificationModel.fromJson(response.data!);
  }

  Future<void> markAllRead() => _dio.patch<void>('/notifications/read-all');
}
