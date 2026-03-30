import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { apiRequest, getRequestMessage } from "@/services/api";
import {
  AlertCircle,
  Archive,
  Clock,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useRef } from "react";

type ExportStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

type ExportJob = {
  id: number;
  filename: string;
  status: ExportStatus;
  sizeBytes: number | null;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes || Number.isNaN(bytes)) return "—";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const StatusBadge = ({ status }: { status: ExportStatus }) => {
  const variant =
    status === "SUCCESS"
      ? "default"
      : status === "FAILED"
        ? "destructive"
        : "outline";

  const label =
    status === "SUCCESS"
      ? "Terminé"
      : status === "FAILED"
        ? "Échec"
        : status === "RUNNING"
          ? "En cours"
          : "En file";

  return <Badge variant={variant}>{label}</Badge>;
};

export function ImportExport() {
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const hasRunningExport = useMemo(
    () => exports.some((item) => item.status === "RUNNING"),
    [exports],
  );

  const fetchExports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiRequest.get<ExportJob[]>("/export");
      setExports(data ?? []);
    } catch (err) {
      toast.error(
        `Impossible de charger les exports (${getRequestMessage(err) || "erreur inconnue"})`,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExports();
  }, [fetchExports]);

  const triggerExport = async () => {
    setIsTriggering(true);
    try {
      await apiRequest.post("/export");
      toast.success(
        "Export lancé. Cette opération peut prendre plusieurs minutes.",
      );
      await fetchExports();
    } catch (err) {
      toast.error(
        `Échec du lancement de l'export (${getRequestMessage(err) || "erreur inconnue"})`,
      );
    } finally {
      setIsTriggering(false);
    }
  };

  const downloadExport = async (job: ExportJob) => {
    setDownloadingId(job.id);
    try {
      const { data } = await apiRequest.get(`/export/${job.id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([data], { type: "application/gzip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = job.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        `Téléchargement impossible (${getRequestMessage(err) || "erreur inconnue"})`,
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const importExport = async (job: ExportJob) => {
    const confirmed = window.confirm(
      "Importer cette archive va écraser TOUTES les données et fichiers actuels. Continuer ?",
    );
    if (!confirmed) return;

    setImportingId(job.id);
    try {
      await apiRequest.post(`/export/${job.id}/import`);
      toast.success(
        "Import terminé. Pensez à recharger l'application si besoin.",
      );
    } catch (err) {
      toast.error(
        `Import impossible (${getRequestMessage(err) || "erreur inconnue"})`,
      );
    } finally {
      setImportingId(null);
      fetchExports();
    }
  };

  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };

  const handleUploadChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("archive", file);

    setIsUploading(true);
    try {
      await apiRequest.post("/export/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Archive ajoutée");
      await fetchExports();
    } catch (err) {
      toast.error(
        `Upload impossible (${getRequestMessage(err) || "erreur inconnue"})`,
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Import / Export</h1>
          <p className="text-muted-foreground max-w-2xl">
            Générez une archive tar.gz contenant des dumps CSV de la base et une
            copie du dossier fichiers. L'opération peut être longue; la page
            affiche les exports déjà réalisés pour pouvoir les récupérer.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExports}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            Ajouter une archive
          </Button>
          <Button
            onClick={triggerExport}
            disabled={isTriggering || hasRunningExport}
            className="flex items-center gap-2"
          >
            {isTriggering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            Lancer un export complet
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des exports</CardTitle>
          <CardDescription>
            Chaque export produit une archive tar.gz; les fichiers restent
            disponibles tant que le dossier d'export n'est pas nettoyé
            manuellement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Les exports peuvent prendre du temps; évitez d'en lancer plusieurs à
            la fois.
          </div>
          <Separator />
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des exports...
            </div>
          ) : exports.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Aucun export disponible pour le moment.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date de création</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Nom de fichier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        {item.status === "FAILED" && item.errorMessage && (
                          <span className="text-xs text-destructive">
                            {item.errorMessage}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatBytes(item.sizeBytes)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.filename}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              item.status !== "SUCCESS" ||
                              downloadingId === item.id
                            }
                            onClick={() => downloadExport(item)}
                          >
                            {downloadingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            Télécharger
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={importingId === item.id}
                            onClick={() => importExport(item)}
                          >
                            {importingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Archive className="h-4 w-4 mr-1" />
                            )}
                            Importer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <input
        type="file"
        accept=".tar.gz"
        className="hidden"
        ref={uploadInputRef}
        onChange={handleUploadChange}
      />
    </div>
  );
}

export default ImportExport;
