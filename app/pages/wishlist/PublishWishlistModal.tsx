import React, { useState } from "react";
import BaseModal from "@/modals/base-modal";
import { publish } from "./wishlistApi";

type Props = {
  onClose: () => void;
};

const PublishWishlistModal: React.FC<Props> = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return alert("Please enter a title");
    setSubmitting(true);
    let created: any = null;
    try {
      created = await publish({ title: title.trim(), description: description.trim() });
    } catch (e: any) {
      alert(`Publish failed: ${e?.message ?? String(e)}`);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onClose();

  };
  return (
    <BaseModal open={true} setOpen={(v) => { if (!v) onClose(); }} onSubmit={() => onSubmit()} size="medium">
      <BaseModal.Header>{"Publish Wishlist"}</BaseModal.Header>
      <BaseModal.Content overflowHidden className="h-full">
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-md flex-1 min-h-0 min-h-[6rem] overflow-auto"
            />
          </div>
        </div>
      </BaseModal.Content>
      <BaseModal.Footer submit={{ label: submitting ? "Publishing..." : "Publish", loading: submitting, disabled: submitting, dataTestId: "btn-publish" }} close />
    </BaseModal>
  );
};

export default PublishWishlistModal;
