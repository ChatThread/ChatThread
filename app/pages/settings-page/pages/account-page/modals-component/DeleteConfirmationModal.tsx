import { DialogClose } from "@radix-ui/react-dialog";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangeEvent } from "react";

export default function DeleteConfirmationModal({
  children,
  onConfirm,
  password,
  setPassword,
  description,
  asChild,
  open,
  setOpen,
  note = "",
}: {
  children: JSX.Element;
  onConfirm: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  description?: string;
  asChild?: boolean;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  password?: string;
  setPassword?: (pwd: string) => void;
  note?: string;
}) {
  const handleFocus = (event) => event.target.select();
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      // if (value.length >= maxLength) {
      //   setIsMaxLength(true);
      // } else {
      //   setIsMaxLength(false);
      // }
      // let invalid = false;
      // for (let i = 0; i < invalidNameList!.length; i++) {
      //   if (value === invalidNameList![i]) {
      //     invalid = true;
      //     break;
      //   }
      //   invalid = false;
      // }
      // setIsInvalidName(invalid);
      setPassword!(value);
    };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={asChild} tabIndex={-1}>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center">
              <span className="pr-2">Delete</span>
              <Trash2
                className="h-6 w-6 pl-1 text-foreground"
                strokeWidth={1.5}
              />
            </div>
          </DialogTitle>
        </DialogHeader>
        <span>
          Are you sure you want to delete the {" "}
          {description ?? "component"}?<br></br>
          {note && (
            <>
              {note}
              <br></br>
            </>
          )}
          Note: This action is irreversible.
        </span>

          <Label>
            <div className="edit-flow-arrangement">
              <span className="font-medium">Please input current password</span>{" "}
            </div>
   
              <Input
                className="nopan nodelete nodrag noflow mt-2 font-normal"
                onChange={handleNameChange}
                type="password"
                name="password"
                value={password ?? ""}
                placeholder="password"
                id="password"
                maxLength={30}
                onDoubleClickCapture={(event) => {
                  handleFocus(event);
                }}
                data-testid="input-flow-password"
              />
          </Label>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              onClick={(e) => e.stopPropagation()}
              className="mr-1"
              variant="outline"
            >
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="submit"
              variant="destructive"
              onClick={(e) => {
                onConfirm(e);
              }}
            >
              Delete
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
