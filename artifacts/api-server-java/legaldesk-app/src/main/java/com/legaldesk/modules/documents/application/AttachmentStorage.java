package com.legaldesk.modules.documents.application;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.*;
import com.legaldesk.common.domain.NotFoundException;

@Component
public class AttachmentStorage implements ApplicationRunner {
 private final java.util.concurrent.atomic.AtomicLong lastTimestamp=new java.util.concurrent.atomic.AtomicLong();
 private final Path root;
 private final JdbcTemplate jdbc;
 private final TransactionTemplate transactions;
 public AttachmentStorage(@Value("${app.attachments-directory:.data/attachments}") String directory,JdbcTemplate jdbc,PlatformTransactionManager manager)throws IOException{
  root=Path.of(directory).toAbsolutePath().normalize();Files.createDirectories(root);this.jdbc=jdbc;transactions=new TransactionTemplate(manager);
 }
 private Path resolve(String key){
  if(key==null||key.isBlank()||key.contains("\\")||key.startsWith("/")||key.length()>700)throw new NotFoundException("Attachment not found");
  String[] parts=key.split("/",-1);
  for(String part:parts)if(part.equals(".")||part.equals("..")||!part.matches("[\\p{L}\\p{N}._-]+"))throw new NotFoundException("Attachment not found");
  boolean legacy=key.matches("[a-f0-9-]{36}\\.bin");
  if(!legacy&&!(parts.length>=3&&Set.of("Cases","cases","receipts","Profiles").contains(parts[0])))throw new NotFoundException("Attachment not found");
  Path path=root.resolve(key).normalize();if(!path.startsWith(root))throw new NotFoundException("Attachment not found");
  Path cursor=root;for(String part:parts){cursor=cursor.resolve(part);if(Files.isSymbolicLink(cursor))throw new NotFoundException("Attachment not found");}
  return path;
 }
 private String safePart(String value){
  String safe=Objects.toString(value,"").replaceAll("[^\\p{L}\\p{N}_-]","_");
  return safe.isBlank()?"unnamed":safe.substring(0,Math.min(80,safe.length()));
 }
 public String folder(Long caseId,String caseNumber,Long paymentId){
  String caseFolder=caseId==null?"general":"case_"+caseId+"_"+safePart(caseNumber);
  return "Cases/"+caseFolder+(paymentId!=null?"/receipts":"/others");
 }
 public String write(InputStream input,String folder,String originalName)throws IOException{
  String original=Objects.toString(originalName,"attachment").replace('\\','/');original=original.substring(original.lastIndexOf('/')+1);
  int dot=original.lastIndexOf('.');String extension=dot>0?original.substring(dot+1).replaceAll("[^a-zA-Z0-9]",""):"";
  if(extension.length()>16)extension=extension.substring(0,16);
  String base=safePart(dot>0?original.substring(0,dot):original);
  // Millisecond epoch timestamp, monotonically increasing for simultaneous uploads.
  // CREATE_NEW retries an existing name, so restarts/concurrent server processes cannot overwrite it.
  while(true){
   long stamp=lastTimestamp.updateAndGet(previous->Math.max(System.currentTimeMillis(),previous+1));
   String key=folder+"/"+base+"_"+stamp+(extension.isEmpty()?"":"."+extension);
   Path path=resolve(key);Files.createDirectories(path.getParent());path=resolve(key);boolean created=false;
   try(var output=Files.newOutputStream(path,StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE)){
    created=true;input.transferTo(output);return key;
   }catch(FileAlreadyExistsException ex){continue;}
   catch(IOException ex){if(created)Files.deleteIfExists(path);throw ex;}
  }
 }
 private String folderFor(Map<String,Object> row){
  Long caseId=row.get("case_id")==null?null:((Number)row.get("case_id")).longValue();
  Long payment=row.get("payment_id")==null?null:((Number)row.get("payment_id")).longValue();
  if(caseId==null&&payment!=null){var values=jdbc.queryForList("SELECT case_id FROM payments WHERE id=?",payment);if(!values.isEmpty()&&values.getFirst().get("case_id")!=null)caseId=((Number)values.getFirst().get("case_id")).longValue();}
  String number=caseId==null?"":jdbc.queryForObject("SELECT case_number FROM cases WHERE id=?",String.class,caseId);
  return folder(caseId,number,payment);
 }
 public void delete(String key)throws IOException{Files.deleteIfExists(resolve(key));}
 public void cleanupOnRollback(String key){
  if(!TransactionSynchronizationManager.isSynchronizationActive())throw new IllegalStateException("Attachment writes require a transaction");
  TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){
   @Override public void afterCompletion(int status){if(status!=STATUS_COMMITTED)try{delete(key);}catch(IOException ex){org.slf4j.LoggerFactory.getLogger(AttachmentStorage.class).error("Unable to clean rolled-back attachment {}",key,ex);}}
  });
 }
 public byte[] read(String key){try{return Files.readAllBytes(resolve(key));}catch(IOException ex){throw new NotFoundException("Attachment file is unavailable");}}
 @org.springframework.scheduling.annotation.Scheduled(fixedDelay=30000)
 public void cleanDeletedFiles(){
  for(String key:jdbc.queryForList("SELECT storage_key FROM attachment_cleanup ORDER BY created_at LIMIT 100",String.class)){
   try{delete(key);jdbc.update("DELETE FROM attachment_cleanup WHERE storage_key=?",key);}
   catch(Exception ex){org.slf4j.LoggerFactory.getLogger(AttachmentStorage.class).warn("Attachment cleanup will retry for {}",key);}
  }
 }
 @Override public void run(ApplicationArguments args){
  // One locked document at a time, so large databases are not loaded into memory.
  while(Boolean.TRUE.equals(transactions.execute(status->{
   var rows=jdbc.queryForList("SELECT id,content,file_name,case_id,payment_id FROM documents WHERE content IS NOT NULL ORDER BY id LIMIT 1 FOR UPDATE");
   if(rows.isEmpty())return false;
   var row=rows.getFirst();byte[] bytes=(byte[])row.get("content");String key;
   try{key=write(new ByteArrayInputStream(bytes),folderFor(row),(String)row.get("file_name"));}catch(IOException ex){throw new IllegalStateException("Cannot migrate attachments to disk; database bytes remain intact",ex);}
   cleanupOnRollback(key);
   if(!Arrays.equals(bytes,read(key)))throw new IllegalStateException("Attachment migration verification failed");
   jdbc.update("UPDATE documents SET storage_key=?,content=NULL WHERE id=?",key,row.get("id"));
   return true;
  }))){}
  // Reorganize old flat files; retain their old copy until the metadata commit succeeds.
  while(Boolean.TRUE.equals(transactions.execute(status->{
   var rows=jdbc.queryForList("SELECT id,storage_key,file_name,case_id,payment_id FROM documents WHERE storage_key IS NOT NULL AND (storage_key NOT LIKE 'Cases/%/others/%' AND storage_key NOT LIKE 'Cases/%/receipts/%') ORDER BY id LIMIT 1 FOR UPDATE");
   if(rows.isEmpty())return false;
   var row=rows.getFirst();String old=(String)row.get("storage_key");byte[] bytes=read(old);String key;
   try{key=write(new ByteArrayInputStream(bytes),folderFor(row),(String)row.get("file_name"));}catch(IOException ex){throw new IllegalStateException("Cannot reorganize attachments; original files remain intact",ex);}
   cleanupOnRollback(key);if(!Arrays.equals(bytes,read(key)))throw new IllegalStateException("Attachment reorganization verification failed");
   jdbc.update("UPDATE documents SET storage_key=? WHERE id=?",key,row.get("id"));
   jdbc.update("INSERT INTO attachment_cleanup(storage_key) VALUES(?) ON CONFLICT DO NOTHING",old);
   return true;
  }))){}
  jdbc.execute("ALTER TABLE documents VALIDATE CONSTRAINT documents_no_binary_content");
 }
}
