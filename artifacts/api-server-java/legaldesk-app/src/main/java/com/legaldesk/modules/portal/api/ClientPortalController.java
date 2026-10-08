package com.legaldesk.modules.portal.api;
import com.legaldesk.modules.portal.application.ClientPortalService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ClientPortalController {
 private final ClientPortalService service;
 public ClientPortalController(ClientPortalService service){this.service=service;}
 public record Account(@Email @NotBlank String email,@NotBlank @Size(min=10,max=128) String password){}
 public record Review(Long lawyerId,@Min(1) @Max(5) int stars,@Size(max=2000) String comment){}
 public record Update(@NotBlank @Size(max=200) String title,@NotBlank @Size(max=10000) String body,String status){}
 public record Consultation(@NotBlank @Size(min=10,max=10000) String summary,Long caseId){}
 public record Link(@NotNull Long id,@NotNull UUID token){}
 public record Reply(@NotBlank @Size(max=20000) String response){}
 @PostMapping("/api/office-portal/clients/{id}/account")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER','LAWYER')")
 public Map<String,Object> account(@PathVariable("id")long id,@Valid @RequestBody Account r,Authentication a){return service.createAccount(id,r.email(),r.password(),a);}
 @GetMapping("/api/client-portal/overview")
 public Map<String,Object> overview(Authentication a){return service.overview(a);}
 @GetMapping("/api/client-portal/cases/{id}")
 public Map<String,Object> detail(@PathVariable("id")long id,Authentication a){return service.caseDetails(id,a,false);}
 @PostMapping("/api/client-portal/cases/{id}/files")
 public List<Map<String,Object>> upload(@PathVariable("id")long id,@RequestParam("files")MultipartFile[] files,Authentication a)throws IOException{return service.upload(id,files,a,false);}
 @PostMapping("/api/office-portal/cases/{id}/files")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER','LAWYER')")
 public List<Map<String,Object>> staffUpload(@PathVariable("id")long id,@RequestParam("files")MultipartFile[] files,Authentication a)throws IOException{return service.upload(id,files,a,true);}
 @GetMapping("/api/client-portal/files/{id}")
 public ResponseEntity<byte[]> file(@PathVariable("id")long id,Authentication a){return download(service.legacyDownload(id,a,false));}
 @GetMapping("/api/office-portal/files/{id}")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER','LAWYER')")
 public ResponseEntity<byte[]> staffFile(@PathVariable("id")long id,Authentication a){return download(service.legacyDownload(id,a,true));}
 @GetMapping("/api/client-portal/documents/{id}/content")
 public ResponseEntity<byte[]> document(@PathVariable("id")long id,Authentication a){return download(service.download(id,a,false));}
 @GetMapping("/api/office-portal/documents/{id}/content")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER','LAWYER')")
 public ResponseEntity<byte[]> staffDocument(@PathVariable("id")long id,Authentication a){return download(service.download(id,a,true));}
 private ResponseEntity<byte[]> download(Map<String,Object> file){
  return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
   .header("X-Content-Type-Options","nosniff").header("Cache-Control","no-store")
   .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename((String)file.get("file_name"),StandardCharsets.UTF_8).build().toString())
   .body((byte[])file.get("content"));
 }
 @PostMapping("/api/client-portal/cases/{id}/review")
 public void review(@PathVariable("id")long id,@Valid @RequestBody Review r,Authentication a){service.review(id,r.lawyerId(),r.stars(),r.comment()==null?"":r.comment(),a);}
 @GetMapping("/api/office-portal/cases/{id}")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER','LAWYER')")
 public Map<String,Object> staffDetail(@PathVariable("id")long id,Authentication a){return service.caseDetails(id,a,true);}
 @PostMapping("/api/office-portal/cases/{id}/updates")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER','LAWYER')")
 public void update(@PathVariable("id")long id,@Valid @RequestBody Update r,Authentication a){service.updateCase(id,r.title(),r.body(),r.status(),a);}
 @PostMapping("/api/client-portal/consultations")
 public Map<String,Long> consultation(@Valid @RequestBody Consultation r,Authentication a){return Map.of("id",service.newConsultation(r.summary(),r.caseId(),a));}
 @PostMapping("/api/client-portal/consultations/link")
 public void link(@Valid @RequestBody Link r,Authentication a){service.linkConsultation(r.id(),r.token(),a);}
 @PostMapping("/api/client-portal/consultations/{id}/reply")
 public void reply(@PathVariable("id")long id,@Valid @RequestBody Reply r,Authentication a){service.consultationReply(id,r.response(),a);}
 public record Bank(@NotBlank @Size(max=200) String bankName,@NotBlank @Size(max=200) String beneficiary,
  @NotBlank @Pattern(regexp="[A-Z]{2}[A-Z0-9]{13,32}") String iban,@Size(max=2000) String instructions){}
 public record Payment(@NotNull @DecimalMin("0.01") @Digits(integer=8,fraction=2) java.math.BigDecimal amount,@NotBlank @Size(max=2000) String notes,Long clientId){}
 public record ReceiptReview(@NotNull Boolean approve,@Size(max=2000) String notes){}
 public record Hearing(@NotNull java.time.OffsetDateTime datetime,@NotBlank @Size(max=300) String court,@NotBlank @Size(max=100) String type){}
 @GetMapping("/api/office-portal/bank")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
 public Map<String,Object> bank(){return service.bankDetails();}
 @PutMapping("/api/office-portal/bank")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
 public void saveBank(@Valid @RequestBody Bank r){service.saveBank(r.bankName(),r.beneficiary(),r.iban(),r.instructions());}
 @PostMapping("/api/office-portal/cases/{id}/payments")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER','LAWYER')")
 public Map<String,Long> requestPayment(@PathVariable("id")long id,@Valid @RequestBody Payment r,Authentication a){return Map.of("id",service.requestPayment(id,r.clientId(),r.amount(),r.notes(),a));}
 @PostMapping("/api/office-portal/clients/{id}/payments")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
 public Map<String,Long> generalPayment(@PathVariable("id")long id,@Valid @RequestBody Payment r){return Map.of("id",service.requestGeneralPayment(id,r.amount(),r.notes()));}
 @PostMapping("/api/client-portal/payments/{id}/receipt")
 public void receipt(@PathVariable("id")long id,@RequestParam("reference")String reference,@RequestParam("file")MultipartFile file,Authentication a)throws IOException{
  if(reference.isBlank() || reference.length()>200)throw new com.legaldesk.common.domain.BusinessRuleViolationException("Transfer reference is required (max 200 characters)");
  service.submitReceipt(id,reference,file,a);
 }
 @GetMapping("/api/office-portal/receipts")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
 public List<Map<String,Object>> receipts(){return service.pendingReceipts();}
 @PostMapping("/api/office-portal/receipts/{id}/review")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
 public void reviewReceipt(@PathVariable("id")long id,@Valid @RequestBody ReceiptReview r,Authentication a){service.reviewReceipt(id,r.approve(),r.notes(),a);}
 @PostMapping("/api/office-portal/cases/{id}/hearings")
 @PreAuthorize("hasAnyRole('ADMIN','OWNER','LAWYER')")
 public void hearing(@PathVariable("id")long id,@Valid @RequestBody Hearing r,Authentication a){service.addHearing(id,r.datetime(),r.court(),r.type(),a);}
}

