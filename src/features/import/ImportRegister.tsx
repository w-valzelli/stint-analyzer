import {
  AlertTriangle,
  Check,
  Copy,
  FileSpreadsheet,
  FileWarning,
  LoaderCircle,
} from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

import type { ParsedWorkbook, ParserWarning } from '../../domain/model/normalized';
import { importWorkbookFiles, type ImportProgressEvent } from '../../domain/parsing/imports';
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

export type ImportRegisterHandle = {
  reset: () => void;
};

type ImportRegisterProps = {
  onStateChange: (state: ImportRegisterState) => void;
};

const acceptedTypes = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/octet-stream': ['.xlsx'],
};

const statusLabels: Record<ImportRecordStatus, string> = {
  hashing: 'Checking bytes',
  parsing: 'Reading workbook',
  ready: 'Registered',
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
    return (
      <Check
        className="calibration-register__icon calibration-register__icon--ready"
        aria-hidden="true"
        size={15}
      />
    );
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

export const ImportRegister = forwardRef<ImportRegisterHandle, ImportRegisterProps>(
  function ImportRegister({ onStateChange }, ref) {
    const [records, setRecords] = useState<ImportRecord[]>([]);
    const [workbooks, setWorkbooks] = useState<ParsedWorkbook[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const batchId = useRef(0);

    useEffect(() => {
      setIsHydrated(true);
    }, []);

    useEffect(() => {
      onStateChange({ records, workbooks, isProcessing });
    }, [isProcessing, onStateChange, records, workbooks]);

    const reset = useCallback(() => {
      batchId.current += 1;
      setRecords([]);
      setWorkbooks([]);
      setIsProcessing(false);
    }, []);

    useImperativeHandle(ref, () => ({ reset }), [reset]);

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
          setWorkbooks((current) => [
            ...current.filter((workbook) => workbook.source.id !== parsed.source.id),
            parsed,
          ]);
        }
      },
      [updateRecord],
    );

    const handleDrop = useCallback(
      async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        const currentBatchId = batchId.current + 1;
        batchId.current = currentBatchId;
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
          await importWorkbookFiles(
            acceptedFiles,
            new Set(workbooks.map((workbook) => workbook.source.hash)),
            4,
            (event) => handleProgress(currentBatchId, event),
          );
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
            'aria-label': 'Local XLSX file register',
          })}
        >
          <input {...getInputProps()} />
          <FileSpreadsheet aria-hidden="true" size={27} strokeWidth={1.5} />
          <div>
            <strong>
              {isProcessing ? 'Registering local workbooks' : 'Drop .XLSX exports here'}
            </strong>
            <span>
              {isDragActive
                ? 'Release to check these files locally.'
                : 'Choose one or more Garage 61 files. The source bytes stay in this browser.'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isProcessing || !isHydrated}
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
            aria-label="Registered source files"
          >
            {records.map((record) => {
              const message = statusMessage(record);
              return (
                <article
                  className={`calibration-register__row calibration-register__row--${record.status}`}
                  key={record.key}
                >
                  <div className="calibration-register__identity">
                    {statusIcon(record.status)}
                    <strong title={record.name}>{record.name}</strong>
                  </div>
                  <span className="calibration-register__status">
                    {statusLabels[record.status]}
                  </span>
                  {record.source && (
                    <span className="calibration-register__facts">
                      {record.source.driverNames.join(', ') || 'No driver'} ·{' '}
                      {record.source.sectorNames.length} sectors · {record.source.fullTimedLapCount}{' '}
                      full timed laps
                    </span>
                  )}
                  {message && <p className="calibration-register__message">{message}</p>}
                  {record.warnings.length > 0 && (
                    <ul className="calibration-register__warnings">
                      {record.warnings.slice(0, 3).map((warning, index) => (
                        <li key={`${warning.code}-${warning.rowNumber ?? 'file'}-${index}`}>
                          {warning.message}
                        </li>
                      ))}
                      {record.warnings.length > 3 && (
                        <li>{record.warnings.length - 3} more parser warnings.</li>
                      )}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

ImportRegister.displayName = 'ImportRegister';
