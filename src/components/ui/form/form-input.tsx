import React, { InputHTMLAttributes, useState, useCallback } from 'react';
import styles from './form-input.module.css';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function FormInput({ error, className = '', type, ...props }: FormInputProps) {
  return (
    <input
      {...props}
      type={type}
      className={`${styles.input} ${error ? styles.hasError : ''} ${className}`}
    />
  );
}