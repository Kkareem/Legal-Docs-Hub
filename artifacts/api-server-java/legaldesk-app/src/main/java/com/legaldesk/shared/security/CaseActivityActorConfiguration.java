package com.legaldesk.shared.security;

import java.lang.reflect.Method;
import org.aopalliance.intercept.MethodInterceptor;
import org.springframework.aop.Advisor;
import org.springframework.aop.support.*;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Configuration
@EnableTransactionManagement(order=0)
public class CaseActivityActorConfiguration {
 @Bean @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
 public static Advisor caseActivityActorAdvisor(org.springframework.beans.factory.ObjectProvider<JdbcTemplate> jdbc,org.springframework.beans.factory.ObjectProvider<CurrentUserFacade> current){
  var pointcut=new StaticMethodMatcherPointcut(){public boolean matches(Method method,Class<?> target){return target.getName().startsWith("com.legaldesk.modules.");}};
  var advisor=new DefaultPointcutAdvisor(pointcut,(MethodInterceptor)invocation->{
   if(TransactionSynchronizationManager.isActualTransactionActive()&&!TransactionSynchronizationManager.isCurrentTransactionReadOnly()){
    Long user=current.getObject().currentUserIdOrNull();
    jdbc.getObject().queryForObject("SELECT set_config('app.actor_id',?,true)",String.class,user==null?"":user.toString());
   }
   return invocation.proceed();
  });
  advisor.setOrder(1);return advisor;
 }
}
