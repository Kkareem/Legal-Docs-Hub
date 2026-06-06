import '../../cases/data/case_models.dart';
import '../../clients/data/client_models.dart';
import '../../hearings/data/hearing_models.dart';
import '../../tasks/data/task_models.dart';

class SearchResultModel {
  const SearchResultModel({
    required this.clients,
    required this.cases,
    required this.tasks,
    required this.hearings,
  });

  final List<ClientModel> clients;
  final List<CaseModel> cases;
  final List<TaskModel> tasks;
  final List<HearingModel> hearings;

  factory SearchResultModel.fromJson(Map<String, dynamic> json) {
    return SearchResultModel(
      clients: ((json['clients'] as List<dynamic>?) ?? const [])
          .cast<Map<String, dynamic>>()
          .map(ClientModel.fromJson)
          .toList(growable: false),
      cases: ((json['cases'] as List<dynamic>?) ?? const [])
          .cast<Map<String, dynamic>>()
          .map(CaseModel.fromJson)
          .toList(growable: false),
      tasks: ((json['tasks'] as List<dynamic>?) ?? const [])
          .cast<Map<String, dynamic>>()
          .map(TaskModel.fromJson)
          .toList(growable: false),
      hearings: ((json['hearings'] as List<dynamic>?) ?? const [])
          .cast<Map<String, dynamic>>()
          .map(HearingModel.fromJson)
          .toList(growable: false),
    );
  }
}
