"use client";

import * as React from "react";
import { Button, Snackbar } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export function CopyConclusionButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<ContentCopyIcon />}
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        }}
      >
        Копіювати висновок
      </Button>
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        message="Висновок скопійовано до буфера обміну"
      />
    </>
  );
}
