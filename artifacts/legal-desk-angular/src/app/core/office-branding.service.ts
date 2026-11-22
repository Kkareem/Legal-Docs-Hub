import {Injectable, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Title} from '@angular/platform-browser';
@Injectable({providedIn:'root'})
export class OfficeBrandingService {
  readonly name=signal('المكتب القانوني');
  private readonly title=inject(Title);
  constructor(){inject(HttpClient).get<{officeName:string}>('/api/public/office').subscribe({next:config=>{if(config.officeName?.trim()){this.name.set(config.officeName);this.title.setTitle(config.officeName + ' — إدارة المكتب القانوني');}},error:()=>{}});}
}
