import { Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImportingPhaseProps {
  progress: {
    current: number;
    total: number;
    message: string;
  };
}

export function ImportingPhase({ progress }: ImportingPhaseProps) {
  const { t } = useTranslation();
  const percentComplete = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">{t('importModal.importing.title')}</h3>
            <p className="text-sm text-blue-700 mb-4">
              {progress.message}
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${percentComplete}%`
                }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {t('importModal.importing.progress', { current: progress.current, total: progress.total })} ({percentComplete}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}