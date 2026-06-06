import 'task_models.dart';
import 'tasks_api_service.dart';

class TasksRepository {
  TasksRepository(this._service);

  final TasksApiService _service;

  Future<List<TaskModel>> list({
    String? status,
    String? priority,
    int? caseId,
  }) => _service.list(status: status, priority: priority, caseId: caseId);

  Future<TaskModel> create(CreateTaskInput input) => _service.create(input);

  Future<TaskModel> updateStatus(int id, String status) => _service.updateStatus(id, status);

  Future<void> delete(int id) => _service.delete(id);
}
