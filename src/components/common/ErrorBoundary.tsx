import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center max-w-md">
                <div className="text-6xl mb-4">😵</div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Qualcosa è andato storto
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Si è verificato un errore imprevisto. Prova a ricaricare la pagina.
                </p>
                {error && (
                    <details className="mb-6 text-left bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <summary className="cursor-pointer text-red-600 dark:text-red-400 font-medium">
                            Dettagli errore
                        </summary>
                        <pre className="mt-2 text-xs text-red-500 dark:text-red-300 overflow-auto">
                            {error.message}
                        </pre>
                    </details>
                )}
                <button
                    onClick={resetErrorBoundary}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                    Ricarica pagina
                </button>
            </div>
        </div>
    );
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
    return (
        <ReactErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => window.location.reload()}
            onError={(error, info) => {
                console.error('ErrorBoundary caught an error:', error, info);
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
}
