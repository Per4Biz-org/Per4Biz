import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import styles from './DatePicker.module.css';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Selecionar data",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    onChange(formattedDate);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;

    // Cabeçalho dos dias da semana
    const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        days.push(
          <div
            key={day.toString()}
            className={`${styles.calendarDay} ${
              !isSameMonth(day, monthStart) ? styles.disabled : ''
            } ${
              selectedDate && isSameDay(day, selectedDate) ? styles.selected : ''
            } ${
              isSameDay(day, new Date()) ? styles.today : ''
            }`}
            onClick={() => isSameMonth(cloneDay, monthStart) && handleDateSelect(cloneDay)}
          >
            {formattedDate}
          </div>
        );
        day = addDays(day, 1);
      }
      
      rows.push(
        <div key={day.toString()} className={styles.calendarWeek}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className={styles.calendar}>
        <div className={styles.calendarHeader}>
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className={styles.calendarNavButton}
          >
            <ChevronLeft size={18} />
          </button>
          
          <h3 className={styles.calendarTitle}>
            {format(currentMonth, 'MMMM yyyy', { locale: pt })}
          </h3>
          
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className={styles.calendarNavButton}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className={styles.calendarWeekDays}>
          {weekDays.map(day => (
            <div key={day} className={styles.calendarWeekDay}>
              {day}
            </div>
          ))}
        </div>

        <div className={styles.calendarBody}>
          {rows}
        </div>

        <div className={styles.calendarFooter}>
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={styles.clearButton}
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => {
              const today = format(new Date(), 'yyyy-MM-dd');
              onChange(today);
              setCurrentMonth(new Date());
              setIsOpen(false);
            }}
            className={styles.todayButton}
          >
            Hoje
          </button>
        </div>
      </div>
    );
  };

  const displayValue = selectedDate 
    ? format(selectedDate, 'dd/MM/yyyy', { locale: pt })
    : '';

  return (
    <div ref={containerRef} className={`${styles.datePickerContainer} ${className}`}>
      <div
        className={`${styles.datePickerInput} ${disabled ? styles.disabled : ''} ${isOpen ? styles.focused : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          className={styles.input}
        />
        <Calendar size={18} className={styles.calendarIcon} />
      </div>

      {isOpen && !disabled && (
        <div className={styles.calendarDropdown}>
          {renderCalendar()}
        </div>
      )}
    </div>
  );
};