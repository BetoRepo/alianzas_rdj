import * as AlertDialog from "@radix-ui/react-alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-2xl z-50 w-[90vw] max-w-md animate-in fade-in zoom-in-95">
          <AlertDialog.Title className="text-base font-black text-gray-900">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-xs text-gray-500 mt-2 leading-relaxed">
            {description}
          </AlertDialog.Description>
          <div className="flex gap-3 mt-6 justify-end">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors">
                {cancelText}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                  variant === "danger"
                    ? "bg-[#C62828] hover:bg-[#b71c1c]"
                    : "bg-[#622599] hover:bg-[#4a1c75]"
                }`}
              >
                {confirmText}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
