class HearingModel {
  const HearingModel({
    required this.id,
    required this.caseId,
    required this.datetime,
    required this.type,
    required this.status,
    required this.createdAt,
    this.caseNumber,
    this.court,
    this.assignedLawyer,
    this.assignedLawyerName,
    this.notes,
  });

  final int id;
  final int caseId;
  final String datetime;
  final String type;
  final String status;
  final String createdAt;
  final String? caseNumber;
  final String? court;
  final int? assignedLawyer;
  final String? assignedLawyerName;
  final String? notes;

  factory HearingModel.fromJson(Map<String, dynamic> json) {
    return HearingModel(
      id: json['id'] as int,
      caseId: json['caseId'] as int,
      datetime: json['datetime'] as String? ?? '',
      type: json['type'] as String? ?? 'session',
      status: json['status'] as String? ?? 'scheduled',
      createdAt: json['createdAt'] as String? ?? '',
      caseNumber: json['caseNumber'] as String?,
      court: json['court'] as String?,
      assignedLawyer: json['assignedLawyer'] as int?,
      assignedLawyerName: json['assignedLawyerName'] as String?,
      notes: json['notes'] as String?,
    );
  }
}

class CreateHearingInput {
  const CreateHearingInput({
    required this.caseId,
    required this.datetime,
    required this.type,
    required this.status,
    this.court,
    this.assignedLawyer,
    this.notes,
  });

  final int caseId;
  final String datetime;
  final String type;
  final String status;
  final String? court;
  final int? assignedLawyer;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'caseId': caseId,
        'datetime': datetime,
        'type': type,
        'status': status,
        'court': court,
        'assignedLawyer': assignedLawyer,
        'notes': notes,
      };
}
