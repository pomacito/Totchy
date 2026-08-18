"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type JobSummary = {
  id: string;
  status: string;
  startedAt: string;
  recordsTotal: number | null;
  recordsFlagged: number | null;
  sourceVersion: { id: string; label: string; status: string; isDemoData: boolean; legalActTitle: string };
  openIssues: number;
  totalIssues: number;
};

type JobDetail = {
  id: string;
  validationIssues: Array<{
    id: string;
    severity: string;
    code: string;
    message: string;
    entityRef: string | null;
    resolved: boolean;
  }>;
  changelog: Array<{ changeType: string; territorialUnitRef: string; description: string }>;
  sourceVersion: { id: string; status: string };
};

export function AdminDashboard({ role, displayName }: { role: string; displayName: string }) {
  const router = useRouter();
  const [jobs, setJobs] = React.useState<JobSummary[] | null>(null);
  const [details, setDetails] = React.useState<Record<string, JobDetail>>({});
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadJobs = React.useCallback(async () => {
    const res = await fetch("/api/admin/import-jobs");
    if (res.ok) setJobs((await res.json()).items);
  }, []);

  React.useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function loadDetail(id: string) {
    if (details[id]) return;
    const res = await fetch(`/api/admin/import-jobs/${id}`);
    if (res.ok) {
      const body = await res.json();
      setDetails((prev) => ({ ...prev, [id]: body }));
    }
  }

  async function resolveIssue(issueId: string, jobId: string) {
    const comment = window.prompt("Коментар до підтвердження (обов'язково):");
    if (!comment) return;
    setBusy(issueId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/validation-issues/${issueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) {
        setError((await res.json()).error?.message ?? "Не вдалося підтвердити запис.");
        return;
      }
      setDetails((prev) => ({ ...prev, [jobId]: undefined as unknown as JobDetail }));
      await loadDetail(jobId);
      await loadJobs();
    } finally {
      setBusy(null);
    }
  }

  async function rollback(sourceVersionId: string) {
    const comment = window.prompt("Обґрунтування відкату редакції (обов'язково):");
    if (!comment) return;
    setBusy(sourceVersionId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/source-versions/${sourceVersionId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment, confirm: true }),
      });
      if (!res.ok) {
        setError((await res.json()).error?.message ?? "Не вдалося відкотити редакцію.");
        return;
      }
      await loadJobs();
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Увійшли як {displayName} ({roleLabel(role)})
        </Typography>
        <Button onClick={logout}>Вийти</Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {!jobs && <CircularProgress />}

      {jobs?.map((job) => (
        <Accordion key={job.id} onChange={(_e, expanded) => expanded && loadDetail(job.id)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Typography fontWeight={600}>{job.sourceVersion.label}</Typography>
              <Chip size="small" label={job.status} />
              {job.openIssues > 0 && <Chip size="small" color="warning" label={`${job.openIssues} відкритих зауважень`} />}
              {job.sourceVersion.status === "ROLLED_BACK" && <Chip size="small" color="error" label="відкочено" />}
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {job.sourceVersion.legalActTitle} · записів: {job.recordsTotal ?? "—"}, позначено для перевірки:{" "}
                {job.recordsFlagged ?? "—"}
              </Typography>

              {!details[job.id] ? (
                <CircularProgress size={20} />
              ) : (
                (() => {
                  const detail = details[job.id]!;
                  return (
                <>
                  <Typography variant="subtitle2">Записи перевірки</Typography>
                  {detail.validationIssues.length === 0 ? (
                    <Typography color="text.secondary">Немає зауважень.</Typography>
                  ) : (
                    <Stack spacing={1}>
                      {detail.validationIssues.map((issue) => (
                        <Box key={issue.id} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Chip size="small" label={issue.severity} color={severityColor(issue.severity)} />
                            <Typography variant="body2" fontWeight={600}>
                              {issue.code}
                            </Typography>
                            {issue.resolved && <Chip size="small" label="підтверджено" variant="outlined" />}
                          </Stack>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {issue.message}
                          </Typography>
                          {!issue.resolved && (
                            <Button
                              size="small"
                              sx={{ mt: 1 }}
                              disabled={busy === issue.id}
                              onClick={() => resolveIssue(issue.id, job.id)}
                            >
                              Підтвердити перевірку
                            </Button>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}

                  <Divider />
                  <Typography variant="subtitle2">Журнал змін цієї редакції</Typography>
                  {detail.changelog.length === 0 ? (
                    <Typography color="text.secondary">Немає записів.</Typography>
                  ) : (
                    detail.changelog.map((c, i) => (
                      <Typography variant="body2" key={i}>
                        <strong>{c.changeType}</strong> — {c.territorialUnitRef}: {c.description}
                      </Typography>
                    ))
                  )}

                  {detail.sourceVersion.status === "PUBLISHED" && (
                    <Button
                      color="error"
                      variant="outlined"
                      sx={{ alignSelf: "flex-start" }}
                      disabled={busy === job.sourceVersion.id}
                      onClick={() => rollback(job.sourceVersion.id)}
                    >
                      Відкотити цю редакцію
                    </Button>
                  )}
                </>
                  );
                })()
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}

function roleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "адміністратор";
    case "LEGAL_VERIFIER":
      return "правовий верифікатор";
    case "EDITOR":
      return "редактор";
    default:
      return role;
  }
}

function severityColor(severity: string): "default" | "warning" | "error" {
  if (severity === "CRITICAL" || severity === "ERROR") return "error";
  if (severity === "WARNING") return "warning";
  return "default";
}
