import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useConcorsoData } from '@/hooks/useConcorsoData';
import ConcorsoHubHeader from '@/components/concorsi/ConcorsoHubHeader';
import RoleAccordion from '@/components/concorsi/RoleAccordion';

export default function ConcorsoHubPage() {
  const { category } = useParams<{ category: string }>();
  const { category: categoryData, roles, loading, error } = useConcorsoData(category || '');

  // Accordion state - only one open at a time for cleanliness
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);

  const toggleRole = (roleId: string) => {
    setOpenRoleId(prev => prev === roleId ? null : roleId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !categoryData) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Ops! Qualcosa è andato storto.</h1>
        <p className="text-slate-600 mb-8">{error || "Categoria non trovata."}</p>
        <Link to="/" className="text-emerald-600 font-medium hover:underline">
          ← Torna alla Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Breadcrumb / Top Nav Placeholder */}
      <div className="bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-emerald-600">Home</Link>
          <span>/</span>
          <span className="font-medium text-slate-900 capitalize">{categoryData.title}</span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 1. Standardized Hero Header */}
        <ConcorsoHubHeader
          title={categoryData.title}
          subtitle={`Preparazione completa per i concorsi ${categoryData.title}`}
          description={categoryData.description}
          logoUrl={categoryData.inner_banner_url}
        />

        {/* 2. Roles Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Ruoli Disponibili <span className="text-slate-400 font-normal ml-2">({roles.length})</span>
            </h2>
          </div>

          <div className="space-y-4">
            {roles.length > 0 ? (
              roles.map(role => (
                <RoleAccordion
                  key={role.id}
                  role={role}
                  isOpen={openRoleId === role.id}
                  onToggle={() => toggleRole(role.id)}
                />
              ))
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                Nessun ruolo disponibile per questa categoria al momento.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
