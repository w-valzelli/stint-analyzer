import { AlertTriangle, Copy, FileSpreadsheet, FileWarning, LoaderCircle, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

import type { ParsedWorkbook } from '../../../domain/model/normalized';
import { importWorkbookFiles, type ImportProgressEvent } from '../../../domain/parsing/imports';
import { Button } from '../../reusable/Button';

export type ImportRecord =
  | {
      key: string;
      name: string;
      status: 'hashing';
    }
  | {
      key: string;
      name: string;
      status: 'rejected';
      message: string;
    }
  | ({ key: string } & ImportProgressEvent<File>);

export type ImportRecordStatus = ImportRecord['status'];

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
  if (record.status === 'error' || record.status === 'rejected') {
    return record.message;
  }

  return null;
}

function recordWorkbook(record: ImportRecord): ParsedWorkbook | null {
  if (record.status === 'ready' || record.status === 'error') {
    return record.parsed;
  }

  return null;
}

export function ImportRegister({ onStateChange }: ImportRegisterProps) {
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const batchId = useRef(0);
  const workbooks = useMemo(
    () => records.flatMap((record) => (record.status === 'ready' ? [record.parsed] : [])),
    [records],
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    onStateChange({ records, workbooks, isProcessing });
  }, [isProcessing, onStateChange, records, workbooks]);

  const removeRecord = useCallback((key: string) => {
    setRecords((current) =>
      current.filter(
        (record) =>
          record.key !== key || record.status === 'hashing' || record.status === 'parsing',
      ),
    );
  }, []);

  const handleDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const currentBatchId = batchId.current + 1;
      batchId.current = currentBatchId;
      const acceptedRecords: ImportRecord[] = acceptedFiles.map((file, index) => ({
        key: `${currentBatchId}:${index}`,
        name: file.name,
        status: 'hashing',
      }));
      const rejectedRecords: ImportRecord[] = fileRejections.map((rejection, index) => ({
        key: `${currentBatchId}:rejected-${index}`,
        name: rejection.file.name,
        status: 'rejected',
        message: rejectionMessage(rejection),
      }));

      if (acceptedRecords.length > 0 || rejectedRecords.length > 0) {
        setRecords((current) => [...current, ...acceptedRecords, ...rejectedRecords]);
      }

      if (acceptedFiles.length === 0) {
        return;
      }

      setIsProcessing(true);
      try {
        await importWorkbookFiles(acceptedFiles, workbooks, 4, (event) => {
          if (currentBatchId !== batchId.current) {
            return;
          }

          const key = `${currentBatchId}:${event.index}`;
          setRecords((current) =>
            current.map((record) => (record.key === key ? { key, ...event } : record)),
          );
        });
      } finally {
        if (currentBatchId === batchId.current) {
          setIsProcessing(false);
        }
      }
    },
    [workbooks],
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
            const workbook = recordWorkbook(record);
            const source = workbook?.source;
            const warnings = workbook?.warnings ?? [];
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
                {source && (
                  <details className="calibration-register__information-disclosure">
                    <summary>File information</summary>
                    <dl className="calibration-register__metadata">
                      <div>
                        <dt>Driver name</dt>
                        <dd>
                          {source.driverName ?? (source.driverNames.join(', ') || 'Not provided')}
                        </dd>
                      </div>
                      <div>
                        <dt>Track</dt>
                        <dd>{source.trackName ?? 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt>Car</dt>
                        <dd>{source.carName ?? 'Not provided'}</dd>
                      </div>
                    </dl>
                  </details>
                )}
                {message && <p className="calibration-register__message">{message}</p>}
                {warnings.length > 0 && (
                  <details className="calibration-register__warning-disclosure">
                    <summary>Warnings ({warnings.length})</summary>
                    <ul className="calibration-register__warning-list">
                      {warnings.slice(0, 3).map((warning, index) => (
                        <li key={`${warning.code}-${warning.rowNumber ?? 'file'}-${index}`}>
                          {warning.message}
                        </li>
                      ))}
                      {warnings.length > 3 && <li>{warnings.length - 3} more parser warnings.</li>}
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
