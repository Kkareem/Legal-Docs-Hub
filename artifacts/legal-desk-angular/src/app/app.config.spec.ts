import { DatePipe } from '@angular/common';
import './app.config';

describe('Arabic dates in office pages', () => {
  it('formats a case or hearing date with the locale used by the templates', () => {
    expect(() => new DatePipe('en-US').transform('2026-10-11T12:00:00Z', 'dd/MM/yyyy', 'UTC', 'ar-SA')).not.toThrow();
    expect(new DatePipe('en-US').transform('2026-10-11T12:00:00Z', 'dd/MM/yyyy', 'UTC', 'ar-SA')).toBe('11/10/2026');
  });
});
