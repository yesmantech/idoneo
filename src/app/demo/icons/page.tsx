import DashboardCard from '@/components/profile/DashboardCard';

const DEMO_CATEGORIES = [
    { id: '1', title: 'Allievi Maresciallo', category: 'Forze Armate', progress: 72 },
    { id: '2', title: 'Allievi Agente 2025', category: 'Forze dell\'Ordine', progress: 45 },
    { id: '3', title: 'Funzionario Amministrativo', category: 'Pubblica Amministrazione', progress: 88 },
    { id: '4', title: 'Infermiere ASL Roma', category: 'Sanità', progress: 33 },
    { id: '5', title: 'Concorso Docenti 2025', category: 'Istruzione', progress: 60 },
    { id: '6', title: 'Cancelliere Tribunale', category: 'Giustizia', progress: 15 },
    { id: '7', title: 'Istruttore Comunale', category: 'Enti Locali', progress: 92 },
    { id: '8', title: 'Funzionario Tributario', category: 'Agenzia delle Entrate', progress: 50 },
    { id: '9', title: 'Test Ammissione Medicina', category: 'Università', progress: 78 },
    { id: '10', title: 'Operatore Ferroviario', category: 'Infrastrutture e Trasporti', progress: 25 },
];

export default function IconsDemoPage() {
    return (
        <div className="min-h-screen bg-black p-4 pt-safe">
            <h1 className="text-2xl font-bold text-white mb-6 px-2">Category Icons Preview</h1>
            <div className="space-y-3 max-w-md mx-auto">
                {DEMO_CATEGORIES.map((cat) => (
                    <DashboardCard
                        key={cat.id}
                        quizId={cat.id}
                        title={cat.title}
                        category={cat.category}
                        progress={cat.progress}
                        onClick={() => { }}
                    />
                ))}
            </div>
        </div>
    );
}
