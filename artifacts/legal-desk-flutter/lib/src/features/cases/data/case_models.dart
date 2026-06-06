class CaseModel {
  const CaseModel({
    required this.id,
    required this.caseNumber,
    required this.type,
    required this.clientId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.courtCaseNumber,
    this.court,
    this.division,
    this.clientName,
    this.leadLawyerId,
    this.leadLawyerName,
    this.opposingParty,
    this.description,
    this.filingDate,
  });

  final int id;
  final String caseNumber;
  final String type;
  final int clientId;
  final String status;
  final String createdAt;
  final String updatedAt;
  final String? courtCaseNumber;
  final String? court;
  final String? division;
  final String? clientName;
  final int? leadLawyerId;
  final String? leadLawyerName;
  final String? opposingParty;
  final String? description;
  final String? filingDate;

  factory CaseModel.fromJson(Map<String, dynamic> json) {
    return CaseModel(
      id: json['id'] as int,
      caseNumber: json['caseNumber'] as String,
      type: json['type'] as String,
      clientId: json['clientId'] as int,
      status: json['status'] as String? ?? 'new',
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      courtCaseNumber: json['courtCaseNumber'] as String?,
      court: json['court'] as String?,
      division: json['division'] as String?,
      clientName: json['clientName'] as String?,
      leadLawyerId: json['leadLawyerId'] as int?,
      leadLawyerName: json['leadLawyerName'] as String?,
      opposingParty: json['opposingParty'] as String?,
      description: json['description'] as String?,
      filingDate: json['filingDate'] as String?,
    );
  }
}

class CreateCaseInput {
  const CreateCaseInput({
    required this.caseNumber,
    required this.type,
    required this.clientId,
    required this.status,
    this.courtCaseNumber,
    this.court,
    this.division,
    this.leadLawyerId,
    this.opposingParty,
    this.description,
  });

  final String caseNumber;
  final String type;
  final int clientId;
  final String status;
  final String? courtCaseNumber;
  final String? court;
  final String? division;
  final int? leadLawyerId;
  final String? opposingParty;
  final String? description;

  Map<String, dynamic> toJson() => {
        'caseNumber': caseNumber,
        'type': type,
        'clientId': clientId,
        'status': status,
        'courtCaseNumber': courtCaseNumber,
        'court': court,
        'division': division,
        'leadLawyerId': leadLawyerId,
        'opposingParty': opposingParty,
        'description': description,
      };
}
