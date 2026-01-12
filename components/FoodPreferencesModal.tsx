
import React, { useState, useEffect } from 'react';
import { X, Check, Save, Utensils, Coffee, Carrot, Apple } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentPreferences: string[];
    onSave: (prefs: string[]) => void;
}

export const FoodPreferencesModal: React.FC<Props> = ({ isOpen, onClose, currentPreferences, onSave }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set(currentPreferences));

    useEffect(() => {
        setSelected(new Set(currentPreferences));
    }, [currentPreferences, isOpen]);

    if (!isOpen) return null;

    const toggle = (id: string) => {
        const newSet = new Set(selected);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelected(newSet);
    };

    const sections = [
        {
            title: "Café da Manhã",
            icon: <Coffee className="w-5 h-5 text-orange-500" />,
            options: [
                { id: 'pref_bread', label: 'Pão Francês / Integral', desc: 'Clássico pão com ovo.' },
                { id: 'pref_tapioca', label: 'Tapioca / Cuscuz', desc: 'Opções regionais sem glúten.' },
                { id: 'pref_porridge', label: 'Mingau / Aveia', desc: 'Opções quentes e lácteas.' },
                { id: 'pref_pancake', label: 'Panquecas / Crepioca', desc: 'Receitas fit com ovo e massa.' }
            ]
        },
        {
            title: "Almoço e Jantar",
            icon: <Utensils className="w-5 h-5 text-brand-500" />,
            options: [
                { id: 'pref_rice_beans', label: 'Arroz e Feijão (PF)', desc: 'O básico brasileiro essencial.' },
                { id: 'pref_roots', label: 'Raízes (Batata/Mandioca)', desc: 'Escondidinhos e cozidos.' },
                { id: 'pref_pasta', label: 'Massas', desc: 'Macarrão e variações.' }
            ]
        },
        {
            title: "Lanches",
            icon: <Apple className="w-5 h-5 text-red-500" />,
            options: [
                { id: 'pref_dairy', label: 'Iogurtes e Frutas', desc: 'Lanches leves e frescos.' },
                { id: 'pref_sandwich', label: 'Sanduíches Naturais', desc: 'Práticos para levar.' },
                { id: 'pref_shakes', label: 'Shakes / Vitaminas', desc: 'Bebidas proteicas rápidas.' }
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-transparent dark:border-gray-800">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <Carrot className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                            Personalizar Paladar
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Selecione o que você gosta de comer.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">
                                {section.icon}
                                {section.title}
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {section.options.map((opt) => {
                                    const isSelected = selected.has(opt.id);
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => toggle(opt.id)}
                                            className={`
                                                relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 group
                                                ${isSelected
                                                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                                    : 'border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                                            `}
                                        >
                                            <div className={`
                                                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                                ${isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300 dark:border-gray-600'}
                                            `}>
                                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${isSelected ? 'text-brand-700 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {opt.label}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-500">{opt.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(Array.from(selected))}
                        className="flex-1 py-3 bg-brand-600 dark:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-200 dark:shadow-brand-900/40 hover:bg-brand-700 dark:hover:bg-brand-600 hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        Salvar Preferências
                    </button>
                </div>
            </div>
        </div>
    );
};
