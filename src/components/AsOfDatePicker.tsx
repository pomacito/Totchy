"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TextField } from "@mui/material";

export function AsOfDatePicker({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <TextField
      type="date"
      label="Станом на дату"
      size="small"
      defaultValue={defaultValue}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set("asOf", e.target.value);
        else params.delete("asOf");
        router.push(`${pathname}?${params.toString()}`);
      }}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
}
