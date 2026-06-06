class TaskModel {
  const TaskModel({
    required this.id,
    required this.title,
    required this.priority,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.description,
    this.caseId,
    this.caseNumber,
    this.assignedTo,
    this.assigneeName,
    this.dueDate,
  });

  final int id;
  final String title;
  final String priority;
  final String status;
  final String createdAt;
  final String updatedAt;
  final String? description;
  final int? caseId;
  final String? caseNumber;
  final int? assignedTo;
  final String? assigneeName;
  final String? dueDate;

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'] as int,
      title: json['title'] as String,
      priority: json['priority'] as String? ?? 'medium',
      status: json['status'] as String? ?? 'new',
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      description: json['description'] as String?,
      caseId: json['caseId'] as int?,
      caseNumber: json['caseNumber'] as String?,
      assignedTo: json['assignedTo'] as int?,
      assigneeName: json['assigneeName'] as String?,
      dueDate: json['dueDate'] as String?,
    );
  }
}

class CreateTaskInput {
  const CreateTaskInput({
    required this.title,
    required this.priority,
    required this.status,
    this.description,
    this.caseId,
    this.assignedTo,
    this.dueDate,
  });

  final String title;
  final String priority;
  final String status;
  final String? description;
  final int? caseId;
  final int? assignedTo;
  final String? dueDate;

  Map<String, dynamic> toJson() => {
        'title': title,
        'priority': priority,
        'status': status,
        'description': description,
        'caseId': caseId,
        'assignedTo': assignedTo,
        'dueDate': dueDate,
      };
}
