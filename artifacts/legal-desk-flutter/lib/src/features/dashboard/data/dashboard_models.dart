class DashboardSummary {
  const DashboardSummary({
    required this.activeCases,
    required this.totalClients,
    required this.pendingTasks,
    required this.overdueTasks,
    required this.todayHearings,
    required this.upcomingHearings,
    required this.pendingConsultations,
    required this.totalPendingPayments,
    required this.powersOfAttorneyOut,
    required this.overduePoAs,
  });

  final int activeCases;
  final int totalClients;
  final int pendingTasks;
  final int overdueTasks;
  final int todayHearings;
  final int upcomingHearings;
  final int pendingConsultations;
  final num totalPendingPayments;
  final int powersOfAttorneyOut;
  final int overduePoAs;

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      activeCases: json['activeCases'] as int? ?? 0,
      totalClients: json['totalClients'] as int? ?? 0,
      pendingTasks: json['pendingTasks'] as int? ?? 0,
      overdueTasks: json['overdueTasks'] as int? ?? 0,
      todayHearings: json['todayHearings'] as int? ?? 0,
      upcomingHearings: json['upcomingHearings'] as int? ?? 0,
      pendingConsultations: json['pendingConsultations'] as int? ?? 0,
      totalPendingPayments: json['totalPendingPayments'] as num? ?? 0,
      powersOfAttorneyOut: json['powersOfAttorneyOut'] as int? ?? 0,
      overduePoAs: json['overduePoAs'] as int? ?? 0,
    );
  }
}

class HearingListItem {
  const HearingListItem({
    required this.id,
    required this.caseId,
    required this.datetime,
    this.caseNumber,
    this.court,
  });

  final int id;
  final int caseId;
  final String datetime;
  final String? caseNumber;
  final String? court;

  factory HearingListItem.fromJson(Map<String, dynamic> json) {
    return HearingListItem(
      id: json['id'] as int,
      caseId: json['caseId'] as int,
      datetime: json['datetime'] as String,
      caseNumber: json['caseNumber'] as String?,
      court: json['court'] as String?,
    );
  }
}

class OverdueTaskItem {
  const OverdueTaskItem({
    required this.id,
    required this.title,
    this.assigneeName,
    this.dueDate,
  });

  final int id;
  final String title;
  final String? assigneeName;
  final String? dueDate;

  factory OverdueTaskItem.fromJson(Map<String, dynamic> json) {
    return OverdueTaskItem(
      id: json['id'] as int,
      title: json['title'] as String,
      assigneeName: json['assigneeName'] as String?,
      dueDate: json['dueDate'] as String?,
    );
  }
}

class ActivityItem {
  const ActivityItem({
    required this.action,
    this.description,
    this.entityType,
    this.createdAt,
  });

  final String action;
  final String? description;
  final String? entityType;
  final String? createdAt;

  factory ActivityItem.fromJson(Map<String, dynamic> json) {
    return ActivityItem(
      action: json['action'] as String? ?? '',
      description: json['description'] as String?,
      entityType: json['entityType'] as String?,
      createdAt: json['createdAt'] as String?,
    );
  }
}
