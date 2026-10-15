import {Component, input, output} from '@angular/core';

@Component({
  selector: 'app-member-picker',
  standalone: true,
  template: `
    <label class="label" [for]="controlId()">{{label()}}</label>
    <select class="input" [id]="controlId()" #picker (change)="add(picker)">
      <option value="">اختر {{kind()}}</option>
      @for(person of options(); track person.id){
        @if(!selectedIds().includes(person.id)){<option [value]="person.id">{{person.name}}</option>}
      }
    </select>
    <div class="selected-members">
      @for(id of selectedIds(); track id){
        <button type="button" class="member-card" (click)="selectedIdsChange.emit(selectedIds().filter(removeId(id)))" [attr.aria-label]="'إزالة ' + name(id)">
          <span>{{name(id)}}</span><span aria-hidden="true">×</span>
        </button>
      }
    </div>
    @if(selectedIds().length){<p class="hint">اضغط على الاسم لإزالته من الاختيارات</p>}
  `,
  styles: [`
    :host{display:block;min-width:0}
    .selected-members{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
    .member-card{display:flex;align-items:center;gap:12px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text);font:inherit;cursor:pointer;max-width:100%;text-align:start}
    .member-card span:first-child{overflow-wrap:anywhere}
    .member-card:hover{border-color:var(--primary);color:var(--primary)}
    .member-card:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
    .hint{color:var(--muted);font-size:12px;margin:6px 0 0}
  `],
})
export class MemberPickerComponent {
  controlId=input.required<string>();
  label=input.required<string>();
  kind=input.required<string>();
  options=input<readonly {id:number;name:string}[]>([]);
  selectedIds=input<readonly number[]>([]);
  selectedIdsChange=output<number[]>();
  name(id:number){return this.options().find(person=>person.id===id)?.name || 'مشارك';}
  removeId(id:number){return (value:number)=>value!==id;}
  add(picker:HTMLSelectElement){
    const id=Number(picker.value);
    if(picker.value && this.options().some(person=>person.id===id) && !this.selectedIds().includes(id)){
      this.selectedIdsChange.emit([...this.selectedIds(),id]);
    }
    picker.value='';
  }
}
