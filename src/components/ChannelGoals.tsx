import React, { useState, useEffect } from "react";
import { Channel, Goal } from "../types";
import { api, ValidationError } from "../api";
import { swal } from "../utils/swal";

interface ChannelGoalsProps {
  channel: Channel;
}

export default function ChannelGoals({ channel }: ChannelGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Goal Fields
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchGoals();
  }, [channel.id]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await api.getGoals(channel.id);
      setGoals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    // Active client-side validations
    const errors: Record<string, string> = {};
    if (!title || !title.trim()) {
      errors.title = "O título da meta é obrigatório.";
    }
    if (!targetValue || !targetValue.trim()) {
      errors.targetValue = "O valor alvo é obrigatório.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await api.createGoal(channel.id, title, Number(targetValue), deadline || undefined);
      setShowAddModal(false);
      setTitle("");
      setTargetValue("");
      setDeadline("");
      fetchGoals();
    } catch (err: any) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.errors);
      } else {
        setError(err.message || "Erro ao criar meta");
      }
    }
  };

  const handleToggleGoal = async (goal: Goal) => {
    try {
      const updated = await api.updateGoal(goal.id, { completed: !goal.completed });
      setGoals(goals.map(g => g.id === goal.id ? updated : g));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const confirmDelete = await swal.confirm(
      "Excluir Meta?",
      "Esta ação não pode ser desfeita. Deseja realmente excluir esta meta?",
      "Excluir",
      "Cancelar"
    );
    if (!confirmDelete) return;
    try {
      await api.deleteGoal(id);
      setGoals(goals.filter(g => g.id !== id));
      swal.toast("Meta excluída com sucesso!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f1f1f1] uppercase tracking-widest flex items-center gap-2">
          <span className="material-icons text-[#ff5045]">flag</span>
          Metas de Crescimento
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="yt-btn-secondary py-1.5 px-3 text-[10px] flex items-center gap-1.5"
        >
          <span className="material-icons text-sm">add</span>
          Definir Meta
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <span className="material-icons animate-sync-spin text-[#ff5045]">sync</span>
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-[#1c1c1c] border border-[#404040] rounded-sm p-8 text-center">
          <p className="text-xs text-[#717171] uppercase font-mono tracking-wider">Nenhuma meta definida para este canal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map(goal => (
            <div key={goal.id} className="bg-[#1c1c1c] border border-[#404040] p-4 rounded-sm hover:border-[#aaaaaa] transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => handleToggleGoal(goal)}
                      className={`material-icons text-lg ${goal.completed ? 'text-[#2ba640]' : 'text-[#717171]'} cursor-pointer`}
                    >
                      {goal.completed ? 'check_circle' : 'radio_button_unchecked'}
                    </button>
                    <h4 className={`text-sm font-semibold ${goal.completed ? 'text-[#717171] line-through' : 'text-[#f1f1f1]'}`}>
                      {goal.title}
                    </h4>
                  </div>
                  
                  {goal.targetValue && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-[#404040] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${goal.completed ? 'bg-[#2ba640]' : 'bg-[#ff5045]'}`} 
                          style={{ width: goal.completed ? '100%' : '30%' }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-mono text-[#aaaaaa]">ALVO: {goal.targetValue}</span>
                    </div>
                  )}

                  {goal.deadline && (
                    <p className="text-[10px] text-[#ff5045] font-bold mt-2 flex items-center gap-1 uppercase tracking-wider">
                      <span className="material-icons text-xs">event</span>
                      Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-1.5 text-[#717171] hover:text-[#ff5045] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-icons text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <form 
            onSubmit={handleAddGoal}
            className="bg-[#1c1c1c] border border-[#404040] rounded-sm w-full max-w-md p-6 relative z-10 shadow-2xl"
          >
            <h3 className="text-base font-semibold text-[#f1f1f1] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-icons text-[#ff5045]">flag</span>
              Definir Nova Meta de Canal
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaaaaa] mb-1.5">
                  Título da Meta
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: "" }));
                  }}
                  placeholder="ex: Chegar a 10.000 inscritos"
                  className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 px-3 focus:outline-none focus:border-[#ff5045] text-sm"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-xs text-[#ff5045] font-sans">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaaaaa] mb-1.5">
                  Valor Alvo (Números)
                </label>
                <input
                  type="number"
                  required
                  value={targetValue}
                  onChange={(e) => {
                    setTargetValue(e.target.value);
                    if (fieldErrors.targetValue) setFieldErrors(prev => ({ ...prev, targetValue: "" }));
                  }}
                  placeholder="ex: 10000"
                  className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 px-3 focus:outline-none focus:border-[#ff5045] text-sm"
                />
                {fieldErrors.targetValue && (
                  <p className="mt-1 text-xs text-[#ff5045] font-sans">{fieldErrors.targetValue}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#aaaaaa] mb-1.5">
                  Prazo Final
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#404040] text-[#f1f1f1] rounded-sm py-2 px-3 focus:outline-none focus:border-[#ff5045] text-sm color-scheme-dark"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-[#404040]">
              <button type="button" onClick={() => setShowAddModal(false)} className="yt-btn-secondary">Cancelar</button>
              <button type="submit" className="yt-btn-primary">Criar Meta</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
