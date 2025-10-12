import * as React from 'react';

import { cn } from '@/lib/utils';

// Card Google Material Design 3
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white rounded-xl border border-neutral-200 shadow-elevation-1 hover:shadow-elevation-2 transition-shadow duration-200',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

// CardHeader com espaçamento Material Design
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// CardTitle com tipografia Google
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-medium text-neutral-900 tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// CardDescription com cor Google
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-neutral-700', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

// CardContent com padding consistente
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 pb-6', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// CardFooter com bordas opcionais
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center px-6 pb-6', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
