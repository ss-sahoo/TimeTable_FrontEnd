import { CSSProperties, FocusEvent, useMemo } from 'react';

export interface DateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
}

const splitDateTime = (value: string): { date: string; time: string } => {
  if (!value) return { date: '', time: '' };
  const [date = '', timeRaw = ''] = value.split('T');
  const time = timeRaw.slice(0, 5);
  return { date, time };
};

const join = (date: string, time: string): string => {
  if (!date && !time) return '';
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
};

export default function DateTimeInput({
  value,
  onChange,
  className = '',
  style,
  min,
  max,
  required,
  disabled,
  id,
  onFocus,
  onBlur,
}: DateTimeInputProps) {
  const { date, time } = useMemo(() => splitDateTime(value), [value]);
  const { date: minDate, time: minTime } = useMemo(() => splitDateTime(min || ''), [min]);
  const { date: maxDate, time: maxTime } = useMemo(() => splitDateTime(max || ''), [max]);

  const sameDayMin = min && date && date === minDate;
  const sameDayMax = max && date && date === maxDate;

  return (
    <div className="flex gap-2 w-full">
      <input
        id={id}
        type="date"
        value={date}
        onChange={(e) => onChange(join(e.target.value, time))}
        className={`flex-1 min-w-0 ${className}`}
        style={style}
        min={minDate || undefined}
        max={maxDate || undefined}
        required={required}
        disabled={disabled}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <input
        type="time"
        value={time}
        onChange={(e) => onChange(join(date, e.target.value))}
        className={`flex-1 min-w-0 ${className}`}
        style={style}
        min={sameDayMin ? minTime : undefined}
        max={sameDayMax ? maxTime : undefined}
        required={required}
        disabled={disabled || !date}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
}
