import React from 'react';
import { FileText, Shield, AlertTriangle, Scale, Users, Link2, Gavel, HelpCircle, RefreshCw, Trash2, Smartphone, Database, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/ui/BackButton';

export default function TermsPage() {
    const navigate = useNavigate();
    const lastUpdated = '18 Marzo 2026';

    const Section = ({ num, title, children }: { num: number; title: string; children: React.ReactNode }) => (
        <section>
            <h2 className="text-xl font-bold mb-3">
                <span className="text-sky-400 mr-2">{num}.</span>{title}
            </h2>
            {children}
        </section>
    );

    const P = ({ children }: { children: React.ReactNode }) => (
        <p className="text-[15px] leading-relaxed text-[var(--foreground)]/60 mb-3">{children}</p>
    );

    const Card = ({ children }: { children: React.ReactNode }) => (
        <div className="bg-[var(--foreground)]/[0.03] rounded-2xl p-4 mb-3">{children}</div>
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
                        <h1 className="text-lg font-bold">Termini e Condizioni</h1>
                        <p className="text-xs text-[var(--foreground)]/40">Ultimo aggiornamento: {lastUpdated}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

                {/* Intro */}
                <section>
                    <P>
                        Il presente documento definisce le condizioni generali e i termini che disciplinano
                        l'utilizzo dell'applicazione <strong>Idoneo</strong> (di seguito "l'App" o "il Servizio")
                        da parte dell'utente. L'utilizzo dell'App avviene nella consapevolezza e nell'accettazione
                        di quanto di seguito previsto.
                    </P>
                </section>

                <HR />

                {/* 1. Definizioni */}
                <Section num={1} title="Definizioni">
                    <Card>
                        <List items={[
                            "\"App\" o \"Servizio\": l'applicazione mobile e web Idoneo, accessibile tramite app iOS e il sito web idoneo.ai",
                            "\"Titolare\": Alessandro Valenza, proprietario e gestore dell'App",
                            "\"Utente\": qualsiasi persona fisica che si registra e/o utilizza l'App",
                            "\"Account\": il profilo personale dell'Utente, creato mediante registrazione",
                            "\"Contenuti\": le banche dati di quiz, simulazioni, spiegazioni e qualsiasi materiale presente nell'App",
                            "\"AI Coach\": l'assistente basato su intelligenza artificiale integrato nell'App",
                        ]} />
                    </Card>
                </Section>

                <HR />

                {/* 2. Titolarità */}
                <Section num={2} title="Proprietà intellettuale e Copyright">
                    <P>
                        L'App, il codice software che ne sottende il funzionamento, il design, i loghi,
                        i marchi, i contenuti originali e tutti i materiali correlati sono di proprietà esclusiva
                        di <strong>Alessandro Valenza</strong> e sono protetti dalle leggi italiane e internazionali
                        in materia di proprietà intellettuale e diritto d'autore (Legge 22 aprile 1941, n. 633 e successive modifiche).
                    </P>
                    <P>
                        Tutti i diritti di proprietà intellettuale relativi all'App sono riservati.
                        È vietata la riproduzione, distribuzione, modifica o qualsiasi utilizzo non autorizzato
                        del software e dei contenuti dell'App.
                    </P>
                    <Card>
                        <List items={[
                            "Il marchio \"Idoneo\" e il logo dell'App sono di proprietà esclusiva del Titolare e non possono essere utilizzati senza autorizzazione scritta",
                            "Le banche dati di quiz, le spiegazioni, i materiali didattici e qualsiasi contenuto originale presente nell'App sono protetti dal diritto d'autore",
                            "È vietato copiare, riprodurre, distribuire, trasmettere, pubblicare, modificare, creare opere derivate, vendere o sfruttare commercialmente qualsiasi contenuto dell'App",
                            "È vietato decompilare, disassemblare, effettuare reverse engineering o tentare di estrarre il codice sorgente dell'App",
                            "È vietato utilizzare strumenti automatizzati (bot, scraper, crawler) per estrarre contenuti o dati dall'App",
                            "All'Utente viene concessa una licenza d'uso limitata, non esclusiva, non trasferibile e revocabile per l'utilizzo personale dell'App",
                        ]} />
                    </Card>
                    <P>
                        Qualsiasi violazione dei diritti di proprietà intellettuale potrà essere perseguita
                        nelle sedi civili e penali competenti. Il Titolare si riserva il diritto di sospendere
                        o terminare l'accesso dell'Utente in caso di violazione.
                    </P>
                    <P>
                        © {new Date().getFullYear()} Alessandro Valenza — Tutti i diritti riservati.
                    </P>
                </Section>

                <HR />

                {/* 3. Oggetto */}
                <Section num={3} title="Oggetto">
                    <P>
                        Idoneo è un'applicazione dedicata alla preparazione ai concorsi pubblici italiani.
                        Il Servizio offre all'Utente la possibilità di:
                    </P>
                    <Card>
                        <List items={[
                            "Esercitarsi con quiz a risposta multipla tratti da banche dati ufficiali",
                            "Effettuare simulazioni d'esame a tempo",
                            "Consultare spiegazioni dettagliate delle risposte",
                            "Monitorare i propri progressi tramite statistiche avanzate",
                            "Utilizzare l'AI Coach per ricevere assistenza personalizzata allo studio",
                            "Partecipare a classifiche e sistemi di gamification (XP, badge, streak)",
                            "Consultare bandi di concorso attivi",
                        ]} />
                    </Card>
                </Section>

                <HR />

                {/* 4. Registrazione */}
                <Section num={4} title="Registrazione e Account">
                    <P>
                        Per utilizzare le funzionalità dell'App è necessaria la registrazione mediante
                        indirizzo email o tramite i provider di autenticazione supportati (Google, Apple).
                    </P>
                    <P>
                        Al termine della procedura di registrazione, all'Utente viene assegnato un Account
                        personale al quale sono associati i dati di utilizzo, le statistiche, i progressi
                        e le preferenze di studio.
                    </P>
                    <P>
                        L'Utente è responsabile della riservatezza delle proprie credenziali di accesso
                        e di tutte le attività che avvengono tramite il proprio Account.
                    </P>
                </Section>

                <HR />

                {/* 5. Cancellazione Account */}
                <Section num={5} title="Cancellazione dell'Account">
                    <P>
                        In qualsiasi momento l'Utente può autonomamente cancellare il proprio Account
                        utilizzando l'apposita funzione presente nelle <strong>Impostazioni del profilo</strong>.
                    </P>
                    <P>
                        La cancellazione dell'Account comporta l'eliminazione definitiva e irreversibile
                        di tutti i dati associati all'Utente, inclusi progressi, statistiche, badge e
                        posizione in classifica.
                    </P>
                </Section>

                <HR />

                {/* 6. Diritto di utilizzo */}
                <Section num={6} title="Diritto all'utilizzo del Servizio">
                    <P>
                        Con la registrazione, l'Utente acquisisce il diritto di utilizzare il Servizio
                        secondo le seguenti condizioni:
                    </P>
                    <Card>
                        <List items={[
                            "Il diritto all'utilizzo è personale e non trasferibile",
                            "L'Utente ha diritto a utilizzare l'App sia tramite il sito web che tramite l'app mobile iOS, purché il dispositivo sia dotato di un sistema operativo compatibile",
                            "Il diritto all'utilizzo è generico e non relativo a specifiche banche dati: l'Utente non potrà pretendere l'inserimento o la creazione di specifiche banche dati",
                            "Il Titolare si riserva il diritto di modificare, sospendere o interrompere il Servizio in qualsiasi momento",
                        ]} />
                    </Card>
                </Section>

                <HR />

                {/* 7. Banche dati e contenuti */}
                <Section num={7} title="Banche dati e Contenuti">
                    <P>
                        Il Titolare è libero di scegliere, in maniera totalmente autonoma, le banche dati
                        da rendere fruibili tramite l'App.
                    </P>
                    <P>
                        Il Titolare, per qualsiasi ragione di carattere giuridico o tecnico, è libero inoltre,
                        a suo insindacabile giudizio e senza alcuna formalità, di aggiungere, modificare,
                        terminare o sospendere in ogni momento la fruizione di qualsiasi banca dati o contenuto
                        presente nell'App.
                    </P>
                </Section>

                <HR />

                {/* 8. AI Coach */}
                <Section num={8} title="Utilizzo dell'AI Coach">
                    <P>
                        L'AI Coach è uno strumento di assistenza basato su intelligenza artificiale che
                        fornisce suggerimenti personalizzati di studio. L'Utente riconosce e accetta che:
                    </P>
                    <Card>
                        <List items={[
                            "Le risposte dell'AI Coach sono generate automaticamente e possono contenere imprecisioni",
                            "L'AI Coach non sostituisce lo studio approfondito sui testi ufficiali",
                            "Il Titolare non è responsabile per decisioni prese dall'Utente sulla base delle risposte dell'AI Coach",
                            "Le conversazioni con l'AI Coach possono essere elaborate da servizi di terze parti (OpenAI) nel rispetto della privacy dell'Utente",
                        ]} />
                    </Card>
                </Section>

                <HR />

                {/* 9. Esonero responsabilità */}
                <Section num={9} title="Esonero di responsabilità">
                    <P>
                        Il Titolare è esonerato da qualsiasi tipo di responsabilità in relazione a danni
                        di qualsiasi natura causati da:
                    </P>
                    <Card>
                        <List items={[
                            "Errori di formattazione dei quiz",
                            "Errata individuazione delle risposte esatte",
                            "Errori presenti nelle banche dati ufficiali o nei quiz creati dalla redazione",
                            "Errato utilizzo dell'App da parte dell'Utente",
                            "Interruzione o sospensione della fruizione di specifiche banche dati",
                            "Malfunzionamento o rimozione temporanea o permanente dell'app mobile dallo store",
                            "Malfunzionamento o disattivazione momentanea o permanente del sito web",
                            "Risposte generate dall'AI Coach che risultino inesatte o incomplete",
                        ]} />
                    </Card>
                </Section>

                <HR />

                {/* 10. Condotta dell'Utente */}
                <Section num={10} title="Condotta dell'Utente">
                    <P>L'Utente si impegna a:</P>
                    <Card>
                        <List items={[
                            "Utilizzare l'App in conformità con le presenti condizioni e la legge applicabile",
                            "Non tentare di accedere in modo non autorizzato ai sistemi o ai dati dell'App",
                            "Non utilizzare l'App per scopi illeciti o fraudolenti",
                            "Non copiare, riprodurre o distribuire i contenuti dell'App senza autorizzazione",
                            "Non utilizzare bot, scraper o altri strumenti automatizzati per accedere al Servizio",
                            "Mantenere riservate le proprie credenziali di accesso",
                        ]} />
                    </Card>
                </Section>

                <HR />

                {/* 11. Privacy */}
                <Section num={11} title="Privacy">
                    <P>
                        Ogni informazione di carattere personale che l'Utente, utilizzando l'App, trasmette
                        al Titolare, sarà trattata conformemente a quanto previsto
                        nell'<a href="/privacy" className="text-sky-400 hover:underline">Informativa Privacy</a>.
                    </P>
                </Section>

                <HR />

                {/* 12. Invalidità delle clausole */}
                <Section num={12} title="Invalidità delle clausole">
                    <P>
                        Qualora una delle precedenti clausole sia dichiarata invalida o inefficace secondo
                        la legge applicabile, la clausola invalida si considererà sostituita da altra clausola
                        valida ed efficace conforme alla volontà delle parti, e le restanti condizioni si
                        considereranno comunque efficaci.
                    </P>
                </Section>

                <HR />

                {/* 13. Cedibilità */}
                <Section num={13} title="Cedibilità">
                    <P>
                        Il Titolare può attribuire, trasferire o cedere diritti e obbligazioni previste
                        dalle presenti condizioni di utilizzo. Tale facoltà è esclusa per l'Utente.
                    </P>
                </Section>

                <HR />

                {/* 14. Link a risorse terze */}
                <Section num={14} title="Link a risorse terze">
                    <P>
                        L'App può contenere link a risorse e servizi forniti da soggetti terzi.
                        Il Titolare non è responsabile per i contenuti, le politiche sulla privacy o
                        le pratiche di siti web o servizi di terze parti.
                    </P>
                </Section>

                <HR />

                {/* 15. Foro competente */}
                <Section num={15} title="Legge applicabile e foro competente">
                    <P>
                        Le presenti condizioni sono regolate dalla legge italiana. Per qualsiasi controversia
                        relativa all'interpretazione, esecuzione o risoluzione delle presenti condizioni
                        sarà competente il Foro del luogo di residenza del consumatore, ai sensi del
                        Codice del Consumo (D.Lgs. 206/2005).
                    </P>
                </Section>

                <HR />

                {/* 16. Assistenza */}
                <Section num={16} title="Assistenza">
                    <P>
                        L'Utente ha diritto di ottenere assistenza tecnica in merito all'utilizzo dell'App.
                        Per richiedere assistenza, l'Utente può contattare il Titolare all'indirizzo
                        email <a href="mailto:info@idoneo.ai" className="text-sky-400 hover:underline">info@idoneo.ai</a>.
                    </P>
                </Section>

                <HR />

                {/* 17. Aggiornamenti */}
                <Section num={17} title="Aggiornamenti delle condizioni">
                    <P>
                        Il Titolare si riserva il diritto di apportare modifiche alle presenti condizioni
                        in qualunque momento, dandone comunicazione su questa pagina.
                        L'utilizzo continuato dell'App dopo la pubblicazione delle modifiche costituisce
                        accettazione delle nuove condizioni.
                    </P>
                    <P>
                        Si prega di consultare regolarmente questa pagina, facendo riferimento alla data
                        di ultimo aggiornamento indicata in apertura.
                    </P>
                </Section>

                {/* Footer spacer */}
                <div className="h-12" />
            </div>
        </div>
    );
}
