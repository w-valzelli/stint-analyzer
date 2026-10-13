import { Check, ChevronDown, Download, FileDown } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import type { AnalysisReport } from '../../../domain/model/report';
import { AnchoredPopup, type AnchoredPopupPosition } from '../../reusable/AnchoredPopup';
import { Button } from '../../reusable/Button';
import { downloadReportFormats, type ExportFormat } from './downloads';

const formatOptions: readonly { value: ExportFormat; label: string; detail: string }[] = [
  { value: 'xlsx', label: 'Excel workbook', detail: '.xlsx · 9 sheets' },
  { value: 'json', label: 'JSON report', detail: '.json · exact data' },
  { value: 'markdown-summary', label: 'Markdown summary', detail: '.md · compact' },
  { value: 'markdown-full', label: 'Markdown full', detail: '.md · lap audit' },
];

type ExportMenuProps = {
  report: AnalysisReport | null;
};

export function ExportMenu({ report }: ExportMenuProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ExportFormat[]>([]);
  const [status, setStatus] = useState<'idle' | 'working' | 'complete' | 'error'>('idle');

  const placePanel = (bounds: DOMRect, panel: HTMLElement | null): AnchoredPopupPosition => {
    const margin = 8;
    const gap = 6;
    const width = Math.min(260, window.innerWidth - margin * 2);
    const panelHeight = panel?.getBoundingClientRect().height ?? 300;
    const spaceBelow = window.innerHeight - bounds.bottom - gap - margin;
    const spaceAbove = bounds.top - gap - margin;
    const opensAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.max(72, opensAbove ? spaceAbove : spaceBelow);
    const top = opensAbove
      ? Math.max(margin, bounds.top - gap - Math.min(panelHeight, maxHeight))
      : bounds.bottom + gap;
    const left = Math.min(
      Math.max(margin, bounds.right - width),
      Math.max(margin, window.innerWidth - width - margin),
    );
    return { top, left, width, maxHeight };
  };

  const toggleFormat = (format: ExportFormat) => {
    setStatus('idle');
    setSelected((current) =>
      current.includes(format)
        ? current.filter((candidate) => candidate !== format)
        : [...current, format],
    );
  };

  const handleExport = async () => {
    if (!report || selected.length === 0) return;
    setStatus('working');
    try {
      await downloadReportFormats(report, selected);
      setStatus('complete');
      setOpen(false);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="export-menu">
      <Button
        treatment="outline"
        tone="neutral"
        size="sm"
        disabled={!report || status === 'working'}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        ref={triggerRef}
        onClick={() => {
          setStatus('idle');
          setOpen((current) => !current);
        }}
      >
        <FileDown aria-hidden="true" size={14} />
        Export report
        <ChevronDown aria-hidden="true" className="export-menu__chevron" size={14} />
      </Button>

      <AnchoredPopup
        open={open}
        anchorRef={triggerRef}
        place={placePanel}
        layoutKey={status}
        onDismiss={() => setOpen(false)}
      >
        {(popup) => (
          <div
            className="export-menu__panel"
            id={panelId}
            ref={popup.ref}
            role="dialog"
            aria-label="Export format selection"
            style={popup.style}
          >
            <div className="export-menu__list">
              {formatOptions.map((option) => {
                const checked = selected.includes(option.value);
                return (
                  <label className="export-menu__option" key={option.value}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFormat(option.value)}
                    />
                    <span className="export-menu__check" aria-hidden="true">
                      {checked ? <Check size={13} strokeWidth={2.2} /> : null}
                    </span>
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.detail}</small>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="export-menu__footer">
              {status === 'error' ? (
                <span aria-live="polite">Export failed. Review the analysis and try again.</span>
              ) : null}
              <Button
                treatment="solid"
                tone="neutral"
                size="sm"
                disabled={selected.length === 0 || status === 'working'}
                onClick={handleExport}
              >
                <Download aria-hidden="true" size={14} />
                {status === 'working' ? 'Preparing…' : 'Download selected'}
              </Button>
            </div>
          </div>
        )}
      </AnchoredPopup>

      {status === 'complete' ? <span className="sr-only">Export downloads started.</span> : null}
    </div>
  );
}
