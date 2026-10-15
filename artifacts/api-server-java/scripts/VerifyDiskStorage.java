import java.nio.file.*;
import java.io.*;
import java.util.*;
import com.legaldesk.modules.documents.application.AttachmentStorage;
import org.springframework.transaction.*;
import org.springframework.transaction.support.*;

public class VerifyDiskStorage {
 public static void main(String[] args)throws Exception{
  Path root=Files.createTempDirectory("legaldesk-disk-test-");
  PlatformTransactionManager manager=new PlatformTransactionManager(){
   public TransactionStatus getTransaction(TransactionDefinition d){return new SimpleTransactionStatus();}
   public void commit(TransactionStatus s){} public void rollback(TransactionStatus s){}
  };
  var storage=new AttachmentStorage(root.toString(),null,manager);
  byte[] bytes={0,1,(byte)255};String key=storage.write(new ByteArrayInputStream(bytes),storage.folder(1L,"LD-2026-001",null),"evidence.png");
  if(!Arrays.equals(bytes,storage.read(key)))throw new AssertionError("Binary bytes must round-trip exactly");
  TransactionSynchronizationManager.initSynchronization();storage.cleanupOnRollback(key);
  for(var hook:TransactionSynchronizationManager.getSynchronizations())hook.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
  TransactionSynchronizationManager.clearSynchronization();
  if(Files.exists(root.resolve(key)))throw new AssertionError("Rollback must remove written file");
  key=storage.write(new ByteArrayInputStream(bytes),storage.folder(1L,"LD-2026-001",null),"evidence.png");TransactionSynchronizationManager.initSynchronization();storage.cleanupOnRollback(key);
  for(var hook:TransactionSynchronizationManager.getSynchronizations())hook.afterCompletion(TransactionSynchronization.STATUS_COMMITTED);
  TransactionSynchronizationManager.clearSynchronization();
  if(!Files.exists(root.resolve(key)))throw new AssertionError("Commit must retain file");
  try{storage.read("../settings.key");throw new AssertionError("Traversal should be rejected");}catch(com.legaldesk.common.domain.NotFoundException expected){}
  String receipt=storage.write(new ByteArrayInputStream(bytes),storage.folder(1L,"LD-2026-001",5L),"receipt.pdf");
  if(!receipt.startsWith("Cases/case_1_LD-2026-001/receipts/receipt_")||!key.matches("Cases/case_1_LD-2026-001/others/evidence_[0-9]+\\.png"))throw new AssertionError("Type, case folder, timestamp and original extension");
  String duplicate=storage.write(new ByteArrayInputStream(bytes),storage.folder(1L,"LD-2026-001",null),"evidence.png");if(duplicate.equals(key))throw new AssertionError("Repeated names must remain unique");
  storage.delete(duplicate);storage.delete(receipt);storage.delete(key);storage.delete(key);
  Files.delete(root.resolve("Cases/case_1_LD-2026-001/receipts"));Files.delete(root.resolve("Cases/case_1_LD-2026-001/others"));Files.delete(root.resolve("Cases/case_1_LD-2026-001"));Files.delete(root.resolve("Cases"));Files.delete(root);
  System.out.println("PASS: binary round-trip, rollback cleanup, committed files retained, path traversal rejected, idempotent deletion");
 }
}
