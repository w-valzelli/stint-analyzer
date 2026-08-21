import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

export const buttonVariants = cva('calibration-button', {
  variants: {
    treatment: {
      solid: 'calibration-button--solid',
      outline: 'calibration-button--outline',
      ghost: 'calibration-button--ghost',
      control: 'calibration-button--control',
      tab: 'calibration-button--tab',
    },
    tone: {
      neutral: 'calibration-button--neutral',
      accent: 'calibration-button--accent',
      danger: 'calibration-button--danger',
    },
    size: {
      default: 'calibration-button--default',
      sm: 'calibration-button--sm',
      lg: 'calibration-button--lg',
      tab: 'calibration-button--tab-size',
    },
    content: {
      text: 'calibration-button--content-text',
      icon: 'calibration-button--content-icon',
    },
  },
  defaultVariants: {
    treatment: 'solid',
    tone: 'neutral',
    size: 'default',
    content: 'text',
  },
});

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'content'> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, treatment, tone, size, content, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ treatment, tone, size, content, className }))}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
