import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useConcorsoData } from '@/hooks/useConcorsoData';
import { ChevronLeft, ChevronRight, Shield, Info } from 'lucide-react';

// =============================================================================
// CONCORSO CATEGORY PAGE - Idoneo Redesign
// Structure: Back arrow + Logo → Title/Subtitle → Info → Sub-competitions list
// =============================================================================
export default function ConcorsoHubPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { category: categoryData, roles, loading, error } = useConcorsoData(category || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !categoryData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Categoria non trovata</h1>
        <p className="text-slate-500 text-center mb-6">{error || "Questa categoria non esiste o è stata rimossa."}</p>
        <Link
          to="/"
          className="text-[#00B1FF] font-semibold hover:underline"
        >
          ← Torna alla Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <main className="px-5 max-w-lg mx-auto pt-4 pt-safe">
        {/* ============================================================= */}
        {/* BACK BUTTON + LOGO CONTAINER */}
        {/* ============================================================= */}
        <div className="relative mb-4">
          {/* Back button - positioned left */}
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>

          {/* Logo - centered */}
          <div className="flex justify-center">
            <div
              className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center overflow-hidden"
              style={{
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              {categoryData.inner_banner_url ? (
                <img
                  src={categoryData.inner_banner_url}
                  alt={categoryData.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#00B1FF] to-[#0099e6] flex items-center justify-center">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* TITLE & SUBTITLE */}
        {/* ============================================================= */}
        <div className="text-center mb-6">
          <p className="text-[13px] text-slate-500 mb-1">
            Preparazione per la prova scritta di preselezione
          </p>
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight">
            {categoryData.title}
          </h1>
        </div>

        {/* ============================================================= */}
        {/* INFORMATION BLOCK */}
        {/* ============================================================= */}
        {categoryData.description && (
          <section className="mb-10">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[#00B1FF]/10 flex items-center justify-center">
                  <Info className="w-3.5 h-3.5 text-[#00B1FF]" />
                </div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Info</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-[1.6]">
                {categoryData.description}
              </p>
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* AVAILABLE COMPETITIONS LIST */}
        {/* ============================================================= */}
        <section>
          <h2 className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Concorsi disponibili
          </h2>

          <div className="space-y-3">
            {roles.length > 0 ? (
              roles.map(role => (
                <Link
                  key={role.id}
                  to={`/concorsi/${category}/${role.slug}`}
                  className="group flex items-center justify-between p-4 bg-white rounded-2xl transition-all duration-200 active:scale-[0.98]"
                  style={{
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[16px] font-semibold text-slate-900 group-hover:text-[#00B1FF] transition-colors">
                      {role.title}
                    </h3>
                    {role.contests && role.contests.length > 0 && (
                      <p className="text-[13px] text-slate-500 mt-0.5">
                        {role.contests.length} {role.contests.length === 1 ? 'bando' : 'bandi'} disponibile
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#00B1FF] transition-colors flex-shrink-0" />
                </Link>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl">
                <p className="text-slate-500">
                  Nessun ruolo disponibile per questa categoria al momento.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
