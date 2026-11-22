package com.legaldesk.modules.settings.application;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.jose4j.json.JsonUtil;
@Service
public class SettingsService {
 private final JdbcTemplate jdbc;
 public SettingsService(JdbcTemplate jdbc,@Value("${app.currency:SAR}")String currency,@Value("${app.public-url:http://localhost:4020}")String publicUrl){this.jdbc=jdbc;initialize("application",Map.of("currency",Currency.getInstance(currency.toUpperCase(Locale.ROOT)).getCurrencyCode(),"publicUrl",publicUrl.replaceAll("/+$","")));}
 public Map<String,Object> get(String name){var rows=jdbc.queryForList("SELECT value::text FROM settings WHERE name=?",String.class,name);if(rows.isEmpty())return new LinkedHashMap<>();try{return new LinkedHashMap<>(JsonUtil.parseJson(rows.getFirst()));}catch(Exception e){throw new IllegalStateException("Invalid stored setting: "+name,e);}}
 @Transactional public void put(String name,Map<String,?> value){jdbc.update("INSERT INTO settings(name,value) VALUES(?,CAST(? AS JSONB)) ON CONFLICT(name) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",name,JsonUtil.toJson(value));}
 public void initialize(String name,Map<String,?> value){jdbc.update("INSERT INTO settings(name,value) VALUES(?,CAST(? AS JSONB)) ON CONFLICT DO NOTHING",name,JsonUtil.toJson(value));}
 public Map<String,Object> lock(String name){jdbc.queryForList("SELECT name FROM settings WHERE name=? FOR UPDATE",name);return get(name);}
 public int sessionMinutes(){return ((Number)get("auth.session").getOrDefault("durationMinutes",60)).intValue();}
 public String officeName(){var names=jdbc.queryForList("SELECT value #>> '{}' FROM settings WHERE name='office_name'",String.class);return names.isEmpty()||names.getFirst()==null||names.getFirst().isBlank()?"المكتب القانوني":names.getFirst();}
 public String currency(){return (String)get("application").get("currency");}
 public String publicUrl(){return (String)get("application").get("publicUrl");}
}
