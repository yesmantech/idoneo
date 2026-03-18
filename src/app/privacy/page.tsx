import React from 'react';
import { Shield, Mail, Trash2, Lock, Eye, Server, Scale, Clock, Globe, Users, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/ui/BackButton';

export default function PrivacyPolicyPage() {
    const navigate = useNavigate();
    const lastUpdated = '18 Marzo 2026';

    const Section = ({ icon: Icon, iconColor, iconBg, title, children }: {
        icon: any; iconColor: string; iconBg: string; title: string; children: React.ReactNode;
    }) => (
        <section>
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h2 className="text-xl font-bold">{title}</h2>
            </div>
            {children}
        </section>
    );

    const P = ({ children }: { children: React.ReactNode }) => (
        <p className="text-[15px] leading-relaxed text-[var(--foreground)]/60 mb-3">{children}</p>
    );

    const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
        <div className="bg-[var(--foreground)]/[0.03] rounded-2xl p-4 mb-3">
            {title && <h3 className="font-semibold text-[15px] mb-2">{title}</h3>}
            {children}
        </div>
    );

    const List = ({ items }: { items: string[] }) => (
        <ul className="text-[14px] text-[var(--foreground)]/60 space-y-1.5 list-disc list-inside">
            {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    );

    const HR = () => <hr className="border-[var(--foreground)]/5" />;

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--foreground)]/5 safe-area-inset">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
                    <BackButton />
                    <div>
                        <h1 className="text-lg font-bold">Informativa Privacy</h1>
                        <p className="text-xs text-[var(--foreground)]/40">Ultimo aggiornamento: {lastUpdated}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

                {/* Intro */}
                <section>
                    <P>
                        La presente informativa privacy è resa ai sensi dell'art. 13 del Regolamento (UE) 2016/679 (GDPR)
                        e descrive le modalità di trattamento dei dati personali degli utenti che utilizzano l'applicazione
                        mobile e il sito web <strong>Idoneo</strong> (di seguito "il Servizio" o "l'App").
                    </P>
                    <P>
                        Ti invitiamo a leggere attentamente questa informativa prima di utilizzare il Servizio.
                        Utilizzando l'App, confermi di aver preso visione di questa informativa.
                    </P>
                </section>

                <HR />

                {/* 1. Titolare del Trattamento */}
                <Section icon={Shield} iconColor="text-sky-400" iconBg="bg-sky-500/10" title="1. Titolare del trattamento">
                    <Card>
                        <p className="text-[15px] font-semibold">Alessandro Valenza</p>
                        <p className="text-[14px] text-[var(--foreground)]/50 mt-1">Email: <a href="mailto:info@idoneo.ai" className="text-sky-400 hover:underline">info@idoneo.ai</a></p>
                        <p className="text-[14px] text-[var(--foreground)]/50">Sito web: <a href="https://idoneo.ai" className="text-sky-400 hover:underline">idoneo.ai</a></p>
                    </Card>
                    <P>
                        Per qualsiasi informazione relativa al trattamento dei tuoi dati personali, puoi contattare
                        il Titolare ai recapiti sopra indicati.
                    </P>
                </Section>

                <HR />

                {/* 2. Definizioni */}
                <Section icon={Database} iconColor="text-violet-400" iconBg="bg-violet-500/10" title="2. Definizioni">
                    <div className="space-y-2">
                        <Card>
                            <List items={[
                                "\"Dati Personali\": qualsiasi informazione riguardante una persona fisica identificata o identificabile",
                                "\"Trattamento\": qualsiasi operazione compiuta sui Dati Personali (raccolta, registrazione, conservazione, uso, comunicazione, cancellazione)",
                                "\"Interessato/Utente\": la persona fisica i cui Dati Personali sono oggetto di trattamento",
                                "\"Servizio/App\": l'applicazione mobile e il sito web Idoneo (idoneo.ai)",
                                "\"Titolare\": Alessandro Valenza, responsabile delle decisioni relative al trattamento dei dati",
                            ]} />
                        </Card>
                    </div>
                </Section>

                <HR />

                {/* 3. Tipologia di dati trattati */}
                <Section icon={Eye} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" title="3. Tipologia di dati trattati">
                    <P>Il Servizio raccoglie e tratta le seguenti tipologie di Dati Personali:</P>
                    <Card title="Dati identificativi">
                        <List items={[
                            "Indirizzo email (necessario per la registrazione e l'autenticazione tramite Supabase Auth)",
                            "Nome o nickname (utilizzato per il profilo e la classifica)",
                            "Foto profilo (opzionale, caricata volontariamente dall'Utente)",
                        ]} />
                    </Card>
                    <Card title="Dati di utilizzo">
                        <List items={[
                            "Risultati dei quiz e simulazioni (risposte date, punteggi ottenuti, tempo impiegato)",
                            "Progressi di studio e statistiche di preparazione",
                            "Streak giornaliere, punti esperienza (XP) e badge ottenuti",
                            "Concorsi seguiti e preferenze di preparazione",
                            "Conversazioni con l'AI Coach (utilizzate esclusivamente per fornire assistenza personalizzata)",
                        ]} />
                    </Card>
                    <Card title="Dati tecnici (raccolti automaticamente)">
                        <List items={[
                            "Tipo di dispositivo e sistema operativo",
                            "Dati di navigazione anonimi e aggregati (tramite Google Analytics 4)",
                            "Indirizzo IP (anonimizzato per finalità di analytics)",
                        ]} />
                    </Card>
                </Section>

                <HR />

                {/* 4. Modalità di trattamento e misure di sicurezza */}
                <Section icon={Lock} iconColor="text-amber-400" iconBg="bg-amber-500/10" title="4. Modalità di trattamento e sicurezza">
                    <P>
                        Il Titolare adotta le opportune misure di sicurezza volte ad impedire l'accesso,
                        la divulgazione, la modifica o la distruzione non autorizzata dei Dati Personali.
                    </P>
                    <P>
                        Il trattamento viene effettuato mediante strumenti informatici e telematici,
                        con modalità organizzative e logiche strettamente correlate alle finalità indicate,
                        nel pieno rispetto della normativa vigente in materia di protezione dei dati personali.
                    </P>
                    <P>
                        I dati sono protetti tramite crittografia in transito (HTTPS/TLS) e a riposo.
                        L'autenticazione avviene tramite protocolli sicuri gestiti da Supabase Auth.
                    </P>
                </Section>

                <HR />

                {/* 5. Base giuridica */}
                <Section icon={Scale} iconColor="text-indigo-400" iconBg="bg-indigo-500/10" title="5. Base giuridica del trattamento">
                    <P>Il Titolare tratta i Dati Personali quando sussiste una delle seguenti condizioni:</P>
                    <Card>
                        <List items={[
                            "L'Utente ha prestato il consenso per una o più finalità specifiche",
                            "Il trattamento è necessario all'esecuzione di un contratto con l'Utente o all'esecuzione di misure precontrattuali",
                            "Il trattamento è necessario per adempiere un obbligo legale al quale è soggetto il Titolare",
                            "Il trattamento è necessario per il perseguimento del legittimo interesse del Titolare o di terzi",
                        ]} />
                    </Card>
                </Section>

                <HR />

                {/* 6. Finalità del trattamento */}
                <Section icon={Server} iconColor="text-cyan-400" iconBg="bg-cyan-500/10" title="6. Finalità del trattamento">
                    <P>Il Titolare raccoglie e tratta i Dati per le seguenti finalità:</P>
                    <Card>
                        <List items={[
                            "Consentirti la registrazione all'App e le successive autenticazioni",
                            "Consentirti la fruizione del Servizio (quiz, simulazioni, statistiche, classifiche)",
                            "Fornirti assistenza personalizzata tramite l'AI Coach integrato",
                            "Gestire il sistema di gamification (XP, badge, streak, classifiche)",
                            "Monitorare il corretto funzionamento del Servizio",
                            "Migliorare il Servizio tramite analytics aggregate e anonime",
                            "Fornirti assistenza in caso di malfunzionamenti",
                            "Adempiere agli obblighi di legge",
                            "Tutelare i diritti e gli interessi del Titolare",
                        ]} />
                    </Card>
                    <p className="text-[14px] text-[var(--foreground)]/40 mt-2">
                        <strong>I tuoi dati non vengono mai venduti a terze parti.</strong> I dati sono utilizzati esclusivamente per le finalità sopra descritte.
                    </p>
                </Section>

                <HR />

                {/* 7. Servizi di terze parti */}
                <Section icon={Globe} iconColor="text-teal-400" iconBg="bg-teal-500/10" title="7. Servizi di terze parti">
                    <P>Per il funzionamento del Servizio, il Titolare si avvale dei seguenti servizi di terze parti:</P>
                    <Card title="Supabase (autenticazione e database)">
                        <p className="text-[14px] text-[var(--foreground)]/50">
                            Gestisce l'autenticazione degli utenti e la conservazione dei dati. I server sono localizzati nell'Unione Europea.
                            Dati trattati: email, profilo utente, dati di utilizzo.
                        </p>
                    </Card>
                    <Card title="Google Analytics 4 (analytics)">
                        <p className="text-[14px] text-[var(--foreground)]/50">
                            Raccoglie dati di navigazione anonimi e aggregati per comprendere l'utilizzo del Servizio.
                            L'indirizzo IP viene anonimizzato. Nessun dato identificativo viene condiviso.
                        </p>
                    </Card>
                    <Card title="OpenAI (AI Coach)">
                        <p className="text-[14px] text-[var(--foreground)]/50">
                            Fornisce l'intelligenza artificiale per l'assistente di studio integrato.
                            Le conversazioni vengono inviate a OpenAI per generare le risposte ma non vengono utilizzate
                            per l'addestramento dei modelli.
                        </p>
                    </Card>
                    <Card title="Vercel (hosting)">
                        <p className="text-[14px] text-[var(--foreground)]/50">
                            Ospita l'applicazione web e gestisce le API serverless. Conforme al GDPR.
                        </p>
                    </Card>
                </Section>

                <HR />

                {/* 8. Luoghi del trattamento */}
                <Section icon={Globe} iconColor="text-blue-400" iconBg="bg-blue-500/10" title="8. Luoghi del trattamento">
                    <P>
                        I Dati sono trattati presso le sedi operative del Titolare e presso i data center
                        dei fornitori di servizi sopra indicati, localizzati prevalentemente nell'Unione Europea.
                    </P>
                    <P>
                        Qualora fosse necessario trasferire i dati al di fuori dello Spazio Economico Europeo (SEE),
                        il Titolare garantisce che il trasferimento avvenga nel rispetto delle disposizioni del GDPR
                        e sulla base di adeguate garanzie (es. Clausole Contrattuali Standard della Commissione Europea).
                    </P>
                </Section>

                <HR />

                {/* 9. Tempo di conservazione */}
                <Section icon={Clock} iconColor="text-orange-400" iconBg="bg-orange-500/10" title="9. Tempo di conservazione dei dati">
                    <P>
                        I Dati Personali sono conservati per il tempo strettamente necessario al perseguimento
                        delle finalità per le quali sono stati raccolti. In particolare:
                    </P>
                    <Card>
                        <List items={[
                            "I dati dell'account sono conservati per tutta la durata del rapporto con l'Utente e cancellati alla richiesta di eliminazione dell'account",
                            "I dati di utilizzo (quiz, statistiche) sono conservati per la durata dell'account",
                            "I dati di analytics sono conservati in forma anonima e aggregata",
                            "Le conversazioni con l'AI Coach non vengono conservate a lungo termine",
                        ]} />
                    </Card>
                    <P>
                        L'Utente può richiedere la cancellazione del proprio account e di tutti i dati associati
                        in qualsiasi momento direttamente dalle <strong>Impostazioni del profilo</strong> all'interno dell'App.
                    </P>
                </Section>

                <HR />

                {/* 10. Diritti dell'Utente */}
                <Section icon={Users} iconColor="text-rose-400" iconBg="bg-rose-500/10" title="10. I tuoi diritti (Artt. 15-22 GDPR)">
                    <P>
                        In relazione al trattamento dei tuoi Dati Personali, puoi esercitare in qualsiasi
                        momento i seguenti diritti:
                    </P>
                    <Card>
                        <List items={[
                            "Diritto di accesso (Art. 15): ottenere conferma dell'esistenza dei tuoi dati e riceverne una copia",
                            "Diritto di rettifica (Art. 16): correggere dati inesatti o incompleti",
                            "Diritto alla cancellazione (Art. 17): richiedere la cancellazione dei tuoi dati (disponibile direttamente in-app)",
                            "Diritto di limitazione (Art. 18): limitare il trattamento dei tuoi dati in determinati casi",
                            "Diritto alla portabilità (Art. 20): ricevere i tuoi dati in un formato strutturato e leggibile da dispositivo automatico",
                            "Diritto di opposizione (Art. 21): opporti al trattamento dei tuoi dati per motivi legittimi",
                            "Diritto di revoca del consenso: revocare il consenso precedentemente prestato, senza pregiudicare la liceità del trattamento basato sul consenso prestato prima della revoca",
                        ]} />
                    </Card>
                    <P>
                        Per esercitare i tuoi diritti, contattaci all'indirizzo <a href="mailto:privacy@idoneo.ai" className="text-sky-400 hover:underline">privacy@idoneo.ai</a>.
                    </P>
                    <P>
                        Ti ricordiamo inoltre che hai il diritto di proporre reclamo all'Autorità Garante per la
                        Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" className="text-sky-400 hover:underline" target="_blank" rel="noopener noreferrer">www.garanteprivacy.it</a>).
                    </P>
                </Section>

                <HR />

                {/* 11. Minori */}
                <section>
                    <h2 className="text-xl font-bold mb-3">11. Minori</h2>
                    <P>
                        Il Servizio non è destinato a soggetti di età inferiore ai 16 anni. Il Titolare non raccoglie
                        consapevolmente dati personali relativi a minori. Se ritieni che un minore abbia fornito
                        dati personali, contattaci immediatamente per la rimozione.
                    </P>
                </section>

                <HR />

                {/* 12. Modifiche */}
                <section>
                    <h2 className="text-xl font-bold mb-3">12. Modifiche all'informativa</h2>
                    <P>
                        Il Titolare si riserva il diritto di apportare modifiche alla presente informativa
                        in qualunque momento, dandone comunicazione su questa pagina. Si prega di consultare
                        regolarmente questa pagina, facendo riferimento alla data di ultimo aggiornamento indicata in apertura.
                    </P>
                </section>

                <HR />

                {/* 13. Contatti */}
                <Section icon={Mail} iconColor="text-sky-400" iconBg="bg-sky-500/10" title="13. Contatti">
                    <P>Per qualsiasi domanda relativa alla presente informativa o al trattamento dei tuoi dati:</P>
                    <Card>
                        <p className="text-[15px] font-semibold">Alessandro Valenza</p>
                        <p className="text-[14px] text-[var(--foreground)]/50 mt-1">Email: <a href="mailto:privacy@idoneo.ai" className="text-sky-400 hover:underline">privacy@idoneo.ai</a></p>
                        <p className="text-[14px] text-[var(--foreground)]/50">Sito: <a href="https://idoneo.ai" className="text-sky-400 hover:underline">idoneo.ai</a></p>
                    </Card>
                </Section>

                {/* Footer spacer */}
                <div className="h-12" />
            </div>
        </div>
    );
}
