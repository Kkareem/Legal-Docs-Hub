import {Component,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {IconComponent} from '../shared/icon.component';
@Component({standalone:true,imports:[RouterLink,IconComponent],templateUrl:'./home.component.html',styleUrl:'./home.component.scss'})
export class HomeComponent {
 menuOpen=signal(false);year=new Date().getFullYear();
 services=[{icon:'gavel',title:'القضايا المدنية والجنائية',body:'متابعة قضاياك والدفاع عن حقوقك في مختلف مراحل التقاضي.'},{icon:'briefcase',title:'الشركات والأعمال',body:'تنظيم المسائل القانونية لأعمالك ومتابعة العقود والقضايا التجارية.'},{icon:'users',title:'الأسرة والأحوال الشخصية',body:'متابعة قضايا الأسرة مع احترام الخصوصية والعناية بالتفاصيل.'},{icon:'building',title:'العقارات والملكية',body:'متابعة المعاملات والمنازعات المتعلقة بالعقارات وحقوق الملكية.'},{icon:'file',title:'العقود والاستشارات القانونية',body:'أرسل استشارتك للمكتب وتابع رد المحامي المختص من خلال طلبك.'},{icon:'scale',title:'القضايا الإدارية والعمالية',body:'متابعة منازعات العمل والقرارات الإدارية والخطوات القانونية المتعلقة بها.'}];
}
