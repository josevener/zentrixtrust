import { toast } from "sonner";

/* -------------------------------------------------
   Helper: copy text + toast
   ------------------------------------------------- */
export const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  } 
  catch {
    toast.error("Failed to copy");
  }
};