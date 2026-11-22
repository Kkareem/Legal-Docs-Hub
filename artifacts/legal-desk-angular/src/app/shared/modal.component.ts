import {AfterViewInit,Component,ElementRef,OnDestroy,input,output,viewChild} from '@angular/core';

@Component({selector:'app-modal',standalone:true,template:`
 <dialog #dialog [attr.aria-label]="title()" (cancel)="cancel($event)" (click)="backdrop($event)" dir="rtl">
  <section class="modal-content"><header><h2>{{title()}}</h2><button type="button" class="btn btn-secondary" aria-label="إغلاق النافذة" [disabled]="busy()" (click)="requestClose()">إغلاق ×</button></header><ng-content /></section>
 </dialog>`,styles:[`
 dialog{width:min(640px,calc(100vw - 32px));max-height:calc(100dvh - 32px);padding:0;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text);box-shadow:0 24px 80px #0008}
 dialog::backdrop{background:#0009}.modal-content{padding:24px;overflow-wrap:anywhere}header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}h2{font-size:23px;margin:0}header .btn{flex-shrink:0;padding:6px 12px}
 @media(max-width:480px){.modal-content{padding:18px}h2{font-size:20px}}
 `]})
export class ModalComponent implements AfterViewInit,OnDestroy {
 title=input.required<string>();busy=input(false);closed=output<void>();dialog=viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
 ngAfterViewInit(){const d=this.dialog().nativeElement;if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');}
 ngOnDestroy(){this.dialog().nativeElement.close?.();}
 requestClose(){if(!this.busy()){this.dialog().nativeElement.close?.();this.closed.emit();}}
 cancel(event:Event){event.preventDefault();this.requestClose();}
 backdrop(event:MouseEvent){if(event.target===this.dialog().nativeElement)this.requestClose();}
}
