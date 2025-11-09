import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from '@/lib/icons';
import { cn } from '@/lib/utils';

/**
 * Modal acessível com focus trap e gerenciamento de foco
 * Baseado em Dialog do Radix UI com melhorias de acessibilidade
 */

const AccessibleModal = DialogPrimitive.Root;

const AccessibleModalTrigger = DialogPrimitive.Trigger;

const AccessibleModalPortal = DialogPrimitive.Portal;

const AccessibleModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
AccessibleModalOverlay.displayName = 'AccessibleModalOverlay';

interface AccessibleModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Label descritivo do modal (obrigatório para acessibilidade)
   */
  'aria-label'?: string;

  /**
   * ID do elemento que contém o título do modal
   */
  'aria-labelledby'?: string;

  /**
   * ID do elemento que contém a descrição do modal
   */
  'aria-describedby'?: string;

  /**
   * Se true, oculta o botão de fechar
   */
  hideCloseButton?: boolean;

  /**
   * Label do botão de fechar para leitores de tela
   */
  closeButtonLabel?: string;
}

const AccessibleModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AccessibleModalContentProps
>(
  (
    {
      className,
      children,
      hideCloseButton = false,
      closeButtonLabel = 'Fechar modal',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      'aria-describedby': ariaDescribedby,
      ...props
    },
    ref
  ) => (
    <AccessibleModalPortal>
      <AccessibleModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-200 bg-white p-6 shadow-lg duration-200',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          'sm:rounded-lg',
          className
        )}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none"
            aria-label={closeButtonLabel}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </AccessibleModalPortal>
  )
);
AccessibleModalContent.displayName = 'AccessibleModalContent';

const AccessibleModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
AccessibleModalHeader.displayName = 'AccessibleModalHeader';

interface AccessibleModalTitleProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
  /**
   * ID do título (usado para aria-labelledby do modal)
   */
  id?: string;
}

const AccessibleModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  AccessibleModalTitleProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
AccessibleModalTitle.displayName = 'AccessibleModalTitle';

interface AccessibleModalDescriptionProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {
  /**
   * ID da descrição (usado para aria-describedby do modal)
   */
  id?: string;
}

const AccessibleModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  AccessibleModalDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-neutral-500', className)}
    {...props}
  />
));
AccessibleModalDescription.displayName = 'AccessibleModalDescription';

const AccessibleModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
AccessibleModalFooter.displayName = 'AccessibleModalFooter';

export {
  AccessibleModal,
  AccessibleModalTrigger,
  AccessibleModalContent,
  AccessibleModalHeader,
  AccessibleModalTitle,
  AccessibleModalDescription,
  AccessibleModalFooter,
  AccessibleModalOverlay,
  AccessibleModalPortal,
};

/**
 * @example
 * ```tsx
 * <AccessibleModal>
 *   <AccessibleModalTrigger asChild>
 *     <Button>Abrir Modal</Button>
 *   </AccessibleModalTrigger>
 *
 *   <AccessibleModalContent
 *     aria-labelledby="modal-title"
 *     aria-describedby="modal-description"
 *   >
 *     <AccessibleModalHeader>
 *       <AccessibleModalTitle id="modal-title">
 *         Confirmar Ação
 *       </AccessibleModalTitle>
 *       <AccessibleModalDescription id="modal-description">
 *         Esta ação não pode ser desfeita.
 *       </AccessibleModalDescription>
 *     </AccessibleModalHeader>
 *
 *     <AccessibleModalFooter>
 *       <Button variant="outline">Cancelar</Button>
 *       <Button>Confirmar</Button>
 *     </AccessibleModalFooter>
 *   </AccessibleModalContent>
 * </AccessibleModal>
 * ```
 */
