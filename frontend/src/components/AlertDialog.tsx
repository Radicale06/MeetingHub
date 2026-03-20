import { Button, Modal } from "antd";
import { ReactNode } from "react";

interface AlertDialogProps {
  visible: boolean;
  title: string;
  content: ReactNode;
  onConfirm?: () => void;
  onConfirmMsg?: string;
  onClose?: () => void;
  onCloseMsg?: string;
}

const AlertDialog = ({
  visible,
  title,
  content,
  onConfirm,
  onConfirmMsg = "Ok",
  onClose,
  onCloseMsg = "Close",
}: AlertDialogProps) => {
  return (
    <Modal
      title={title}
      open={visible}
      onOk={onClose}
      onCancel={onClose}
      footer={[
        <>
          <Button key="ok" type="primary" onClick={onConfirm}>
            {onConfirmMsg}
          </Button>
        </>,
        <>
          {onClose != undefined && (
            <Button key="ok" type="primary" onClick={onClose}>
              {onCloseMsg}
            </Button>
          )}
        </>,
      ]}
    >
      {content}
    </Modal>
  );
};

export default AlertDialog;
