import * as React from "react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg sm:rounded-lg"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const DialogContent: React.FC<DialogContentProps> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  ...props
}) => (
  <div
    className="flex flex-col space-y-1.5 text-center sm:text-left"
    {...props}
  />
);

const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  ...props
}) => (
  <h2
    className="text-lg font-semibold leading-none tracking-tight"
    {...props}
  />
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
}