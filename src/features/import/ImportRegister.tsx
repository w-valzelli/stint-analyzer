import { AlertTriangle, Copy, FileSpreadsheet, FileWarning, LoaderCircle, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

import type { ParsedWorkbook, ParserWarning } from '../../domain/model/normalized';
import {
  importWorkbookFiles,
  trackMismatchMessage,
  type ImportProgressEvent,
} from '../../domain/parsing/imports';
import { Button } from '../../components/ui/button';

export type ImportRecordStatus =
  'hashing' | 'parsing' | 'ready' | 'duplicate' | 'error' | 'rejected';

export type ImportRecord = {
  key: string;
  name: string;
  hash: string | null;
  status: ImportRecordStatus;
  source: ParsedWorkbook['source'] | null;
  warnings: ParserWarning[];
  message: string | null;
  duplicateReason: 'existing' | 'selection' | null;
};

export type ImportRegisterState = {
  records: ImportRecord[];
  workbooks: ParsedWorkbook[];
  isProcessing: boolean;
};

type ImportRegisterProps = {
  onStateChange: (state: ImportRegisterState) => void;
};

const acceptedTypes = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/octet-stream': ['.xlsx'],
};

const statusLabels: Record<ImportRecordStatus, string> = {
  hashing: 'Checking file',
  parsing: 'Reading workbook',
  ready: 'Ready',
  duplicate: 'Not imported',
  error: 'Needs attention',
  rejected: 'Not accepted',
};

function rejectionMessage(rejection: FileRejection): string {
  return rejection.errors.map((error) => error.message).join(' ');
}

function statusIcon(status: ImportRecordStatus) {
  if (status === 'hashing' || status === 'parsing') {
    return (
      <LoaderCircle
        className="calibration-register__icon calibration-register__icon--busy"
        aria-hidden="true"
        size={15}
      />
    );
  }
  if (status === 'ready') {
    return null;
  }
  if (status === 'duplicate') {
    return (
      <Copy
        className="calibration-register__icon calibration-register__icon--duplicate"
        aria-hidden="true"
        size={15}
      />
    );
  }
  if (status === 'rejected') {
    return (
      <FileWarning
        className="calibration-register__icon calibration-register__icon--error"
        aria-hidden="true"
        size={15}
      />
    );
  }
  return (
    <AlertTriangle
      className="calibration-register__icon calibration-register__icon--error"
      aria-hidden="true"
      size={15}
    />
  );
}

function statusMessage(record: ImportRecord): string | null {
  if (record.status === 'duplicate') {
    return record.duplicateReason === 'selection'
      ? 'The same file bytes appear more than once in this selection.'
      : 'The same file bytes are already registered.';
  }

  return record.message;
}

export function ImportRegister({ onStateChange }: ImportRegisterProps) {
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [workbooks, setWorkbooks] = useState<ParsedWorkbook[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const batchId = useRef(0);
  const pendingParsedByIndex = useRef(new Map<number, ParsedWorkbook>());

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    onStateChange({ records, workbooks, isProcessing });
  }, [isProcessing, onStateChange, records, workbooks]);

  const removeRecord = useCallback(
    (key: string) => {
      const record = records.find((current) => current.key === key);
      if (!record || record.status === 'hashing' || record.status === 'parsing') {
        return;
      }

      setRecords((current) => current.filter((item) => item.key !== key));
      if (record.source) {
        setWorkbooks((current) =>
          current.filter((workbook) => workbook.source.id !== record.source?.id),
        );
      }
    },
    [records],
  );

  const updateRecord = useCallback((key: string, update: Partial<ImportRecord>) => {
    setRecords((current) =>
      current.map((record) => (record.key === key ? { ...record, ...update } : record)),
    );
  }, []);

  const handleProgress = useCallback(
    (currentBatchId: number, event: ImportProgressEvent) => {
      if (currentBatchId !== batchId.current) {
        return;
      }

      const key = `${currentBatchId}:${event.index}`;
      updateRecord(key, {
        hash: event.hash,
        status: event.status,
        source: event.parsed?.source ?? null,
        warnings: event.parsed?.warnings ?? [],
        message: event.message ?? null,
        duplicateReason: event.duplicateReason ?? null,
      });

      const parsed = event.parsed;
      if (event.status === 'ready' && parsed) {
        pendingParsedByIndex.current.set(event.index, parsed);
      }
    },
    [updateRecord],
  );

  const handleDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const currentBatchId = batchId.current + 1;
      batchId.current = currentBatchId;
      pendingParsedByIndex.current = new Map();
      const acceptedRecords: ImportRecord[] = acceptedFiles.map((file, index) => ({
        key: `${currentBatchId}:${index}`,
        name: file.name,
        hash: null,
        status: 'hashing',
        source: null,
        warnings: [],
        message: null,
        duplicateReason: null,
      }));
      const rejectedRecords: ImportRecord[] = fileRejections.map((rejection, index) => ({
        key: `${currentBatchId}:rejected-${index}`,
        name: rejection.file.name,
        hash: null,
        status: 'rejected',
        source: null,
        warnings: [],
        message: rejectionMessage(rejection),
        duplicateReason: null,
      }));

      if (acceptedRecords.length > 0 || rejectedRecords.length > 0) {
        setRecords((current) => [...current, ...acceptedRecords, ...rejectedRecords]);
      }

      if (acceptedFiles.length === 0) {
        return;
      }

      setIsProcessing(true);
      try {
        const batch = await importWorkbookFiles(
          acceptedFiles,
          new Set(workbooks.map((workbook) => workbook.source.hash)),
          4,
          (event) => handleProgress(currentBatchId, event),
        );
        if (currentBatchId !== batchId.current) {
          return;
        }

        const parsedByIndex = new Map(pendingParsedByIndex.current);
        if (parsedByIndex.size === 0) {
          batch.parsed.forEach((parsed, index) => parsedByIndex.set(index, parsed));
        }

        const acceptedWorkbooks: ParsedWorkbook[] = [];
        for (const [index, parsed] of [...parsedByIndex.entries()].sort(
          ([left], [right]) => left - right,
        )) {
          const mismatch = trackMismatchMessage(parsed, [...workbooks, ...acceptedWorkbooks]);
          if (mismatch) {
            updateRecord(`${currentBatchId}:${index}`, {
              status: 'error',
              message: mismatch,
            });
            continue;
          }
          acceptedWorkbooks.push(parsed);
        }

        if (acceptedWorkbooks.length > 0) {
          setWorkbooks((current) => [
            ...current.filter(
              (workbook) =>
                !acceptedWorkbooks.some((accepted) => accepted.source.id === workbook.source.id),
            ),
            ...acceptedWorkbooks,
          ]);
        }
      } catch (error) {
        if (currentBatchId === batchId.current) {
          const message =
            error instanceof Error ? error.message : 'The files could not be checked.';
          acceptedRecords.forEach((record) =>
            updateRecord(record.key, { status: 'error', message }),
          );
        }
      } finally {
        if (currentBatchId === batchId.current) {
          setIsProcessing(false);
        }
      }
    },
    [handleProgress, updateRecord, workbooks],
  );

  const { getInputProps, getRootProps, isDragActive, isDragReject, open } = useDropzone({
    accept: acceptedTypes,
    disabled: isProcessing,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    onDrop: handleDrop,
  });

  return (
    <div className="calibration-import-register" data-hydrated={isHydrated}>
      <div
        {...getRootProps({
          className: `calibration-dropzone${isDragActive ? ' calibration-dropzone--active' : ''}${isDragReject ? ' calibration-dropzone--reject' : ''}${isProcessing ? ' calibration-dropzone--busy' : ''}`,
          role: 'group',
          'aria-label': 'XLSX source files',
        })}
      >
        <input {...getInputProps()} />
        <FileSpreadsheet aria-hidden="true" size={27} strokeWidth={1.5} />
        <div>
          <strong>{isProcessing ? 'Reading workbooks' : 'Drop .XLSX exports here'}</strong>
          <span>
            {isDragActive ? 'Release to check these files.' : 'Choose one or more Garage 61 files.'}
          </span>
        </div>
        <Button
          treatment="outline"
          tone="neutral"
          size="sm"
          disabled={isProcessing}
          onClick={(event) => {
            event.stopPropagation();
            open();
          }}
        >
          Choose files
        </Button>
      </div>

      {records.length > 0 && (
        <div
          className="calibration-register__list"
          aria-live="polite"
          aria-label="Imported source files"
        >
          {records.map((record) => {
            const message = statusMessage(record);
            const canRemove = record.status !== 'hashing' && record.status !== 'parsing';
            return (
              <article
                className={`calibration-register__row calibration-register__row--${record.status}`}
                key={record.key}
              >
                <div className="calibration-register__header">
                  <div className="calibration-register__identity">
                    {statusIcon(record.status)}
                    <strong title={record.name}>{record.name}</strong>
                  </div>
                  {record.status !== 'ready' && (
                    <span className="calibration-register__status">
                      {statusLabels[record.status]}
                    </span>
                  )}
                  <Button
                    className="calibration-register__remove"
                    treatment="outline"
                    tone="danger"
                    size="sm"
                    content="icon"
                    disabled={!canRemove}
                    aria-label={`Remove ${record.name}`}
                    title={`Remove ${record.name}`}
                    onClick={() => removeRecord(record.key)}
                  >
                    <X aria-hidden="true" size={14} />
                  </Button>
                </div>
                {record.source && (
                  <details className="calibration-register__information-disclosure">
                    <summary>File information</summary>
                    <dl className="calibration-register__metadata">
                      <div>
                        <dt>Driver name</dt>
                        <dd>
                          {record.source.driverName ??
                            (record.source.driverNames.join(', ') || 'Not provided')}
                        </dd>
                      </div>
                      <div>
                        <dt>Track</dt>
                        <dd>{record.source.trackName ?? 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt>Car</dt>
                        <dd>{record.source.carName ?? 'Not provided'}</dd>
                      </div>
                    </dl>
                  </details>
                )}
                {message && <p className="calibration-register__message">{message}</p>}
                {record.warnings.length > 0 && (
                  <details className="calibration-register__warning-disclosure">
                    <summary>Warnings ({record.warnings.length})</summary>
                    <ul className="calibration-register__warning-list">
                      {record.warnings.slice(0, 3).map((warning, index) => (
                        <li key={`${warning.code}-${warning.rowNumber ?? 'file'}-${index}`}>
                          {warning.message}
                        </li>
                      ))}
                      {record.warnings.length > 3 && (
                        <li>{record.warnings.length - 3} more parser warnings.</li>
                      )}
                    </ul>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

ImportRegister.displayName = 'ImportRegister';
