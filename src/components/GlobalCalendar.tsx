import React, { useState, useEffect, useMemo } from 'react';
import { Channel, VideoIdea } from '../types';
import { api } from '../api';
import { useTranslation } from 'react-i18next';

interface GlobalCalendarProps {
  onSelectIdeaDirectly: (channel: Channel, idea: VideoIdea) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

interface CalendarIdea extends VideoIdea {
  channelName: string;
  channel: Channel;
}

export default function GlobalCalendar({ onSelectIdeaDirectly, theme, toggleTheme }: GlobalCalendarProps) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [allIdeas, setAllIdeas] = useState<CalendarIdea[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const channels = await api.getChannels();
      const ideasPromises = channels.map(async (channel) => {
        const ideas = await api.getIdeas(channel.id);
        return ideas.map(idea => ({
          ...idea,
          channelName: channel.name,
          channel: channel
        }));
      });

      const results = await Promise.all(ideasPromises);
      const flattenedIdeas = results.flat();
      setAllIdeas(flattenedIdeas);
    } catch (err) {
      console.error("Error fetching calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    t('calendar.jan', 'Janeiro'), t('calendar.feb', 'Fevereiro'), t('calendar.mar', 'Março'),
    t('calendar.apr', 'Abril'), t('calendar.may', 'Maio'), t('calendar.jun', 'Junho'),
    t('calendar.jul', 'Julho'), t('calendar.aug', 'Agosto'), t('calendar.sep', 'Setembro'),
    t('calendar.oct', 'Outubro'), t('calendar.nov', 'Novembro'), t('calendar.dec', 'Dezembro')
  ];

  const weekDays = [
    t('calendar.sun', 'Dom'), t('calendar.mon', 'Seg'), t('calendar.tue', 'Ter'),
    t('calendar.wed', 'Qua'), t('calendar.thu', 'Qui'), t('calendar.fri', 'Sex'), t('calendar.sat', 'Sáb')
  ];

  // Organize ideas by date string (YYYY-MM-DD)
  const ideasByDate = useMemo(() => {
    const map = new Map<string, CalendarIdea[]>();
    
    allIdeas.forEach(idea => {
      if (idea.deadline) {
        // Simple extraction of YYYY-MM-DD from deadline (assuming it might be ISO string)
        const dateStr = idea.deadline.split('T')[0];
        if (!map.has(dateStr)) {
          map.set(dateStr, []);
        }
        map.get(dateStr)!.push(idea);
      }
    });
    return map;
  }, [allIdeas]);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[100px] border border-yt-bg-overlay/20 p-2 opacity-30"></div>);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    // Adjust timezone offset if necessary to get correct local date string
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset*60*1000));
    const dateStr = localDate.toISOString().split('T')[0];
    
    const dayIdeas = ideasByDate.get(dateStr) || [];
    const isToday = dateStr === todayStr;

    days.push(
      <div 
        key={`day-${day}`} 
        className={`min-h-[120px] border border-yt-bg-overlay/50 p-2 flex flex-col gap-1 transition-colors hover:bg-yt-bg-elevated/30 ${isToday ? 'bg-purple-900/10 border-purple-500/30' : 'bg-yt-bg-surface/50'}`}
      >
        <span className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-purple-600 text-white' : 'text-yt-text-secondary'}`}>
          {day}
        </span>
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[120px] custom-scrollbar">
          {dayIdeas.map(idea => {
            let statusColor = "bg-gray-500/20 text-gray-300 border-gray-500/30";
            
            // Map status to colors
            switch(idea.status) {
              case 'IDEA': statusColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30'; break;
              case 'RESEARCHING': statusColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'; break;
              case 'SCRIPTING': statusColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30'; break;
              case 'READY_TO_RECORD': statusColor = 'bg-pink-500/20 text-pink-300 border-pink-500/30'; break;
              case 'RECORDED': statusColor = 'bg-orange-500/20 text-orange-300 border-orange-500/30'; break;
              case 'EDITING': statusColor = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'; break;
              case 'SCHEDULED': statusColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; break;
              case 'PUBLISHED': statusColor = 'bg-green-500/20 text-green-300 border-green-500/30'; break;
              case 'ARCHIVED': statusColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30'; break;
            }

            return (
              <div 
                key={idea.id}
                onClick={() => onSelectIdeaDirectly(idea.channel, idea)}
                className={`text-[10px] p-1.5 rounded border flex flex-col cursor-pointer transition-transform hover:scale-[1.02] hover:brightness-125 ${statusColor}`}
                title={`${idea.mainTitle} - ${idea.channelName}`}
              >
                <span className="font-bold truncate">{idea.mainTitle}</span>
                <span className="opacity-70 text-[8px] uppercase tracking-wider truncate mt-0.5">{idea.channelName}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-yt-bg-primary h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-yt-bg-overlay flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-yt-text-primary">{t('calendar.title', 'Calendário Geral')}</h1>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-yt-bg-surface hover:bg-yt-bg-elevated border border-yt-bg-overlay text-yt-text-secondary hover:text-yt-text-primary transition-all duration-200 cursor-pointer"
              title={theme === "dark" ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              <span className="material-icons text-lg">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
          </div>
          <p className="text-xs text-yt-text-secondary mt-1">
            {t('calendar.subtitle', 'Acompanhe os prazos de todas as suas ideias em todos os canais')}
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-yt-bg-surface px-4 py-2 rounded-full border border-yt-bg-overlay">
          <button onClick={prevMonth} className="text-yt-text-secondary hover:text-white transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center p-1">
            <span className="material-icons">chevron_left</span>
          </button>
          <span className="text-sm font-bold uppercase tracking-wider min-w-[120px] text-center text-yt-text-primary">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="text-yt-text-secondary hover:text-white transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center p-1">
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full gap-3">
            <span className="material-icons text-3xl text-purple-500 animate-sync-spin">sync</span>
            <p className="text-xs text-yt-text-secondary uppercase tracking-wider">{t('calendar.loading', 'Carregando calendário...')}</p>
          </div>
        ) : (
          <div className="h-full flex flex-col min-w-[800px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-bold uppercase tracking-wider text-yt-text-secondary">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-px bg-yt-bg-overlay/30 rounded-lg overflow-hidden border border-yt-bg-overlay/50">
              {days}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
