class ConsultationModel {
  const ConsultationModel({
    required this.id,
    required this.clientId,
    required this.summary,
    required this.paymentStatus,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.clientName,
    this.fee,
    this.assignedTo,
    this.assigneeName,
    this.response,
  });

  final int id;
  final int clientId;
  final String summary;
  final String paymentStatus;
  final String status;
  final String createdAt;
  final String updatedAt;
  final String? clientName;
  final num? fee;
  final int? assignedTo;
  final String? assigneeName;
  final String? response;

  factory ConsultationModel.fromJson(Map<String, dynamic> json) {
    return ConsultationModel(
      id: json['id'] as int,
      clientId: json['clientId'] as int,
      summary: json['summary'] as String? ?? '',
      paymentStatus: json['paymentStatus'] as String? ?? 'pending',
      status: json['status'] as String? ?? 'pending',
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      clientName: json['clientName'] as String?,
      fee: json['fee'] as num?,
      assignedTo: json['assignedTo'] as int?,
      assigneeName: json['assigneeName'] as String?,
      response: json['response'] as String?,
    );
  }
}

class CreateConsultationInput {
  const CreateConsultationInput({
    required this.clientId,
    required this.summary,
    required this.paymentStatus,
    required this.status,
    this.fee,
    this.assignedTo,
    this.response,
  });

  final int clientId;
  final String summary;
  final String paymentStatus;
  final String status;
  final num? fee;
  final int? assignedTo;
  final String? response;

  Map<String, dynamic> toJson() => {
        'clientId': clientId,
        'summary': summary,
        'paymentStatus': paymentStatus,
        'status': status,
        'fee': fee,
        'assignedTo': assignedTo,
        'response': response,
      };
}
