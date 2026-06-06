import 'notification_models.dart';
import 'notifications_api_service.dart';

class NotificationsRepository {
  NotificationsRepository(this._service);

  final NotificationsApiService _service;

  Future<List<NotificationModel>> list() => _service.list();
  Future<NotificationModel> markRead(int id) => _service.markRead(id);
  Future<void> markAllRead() => _service.markAllRead();
}
