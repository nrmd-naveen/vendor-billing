'use client';

import { useState, useEffect } from 'react';
import { useVegetables } from '@/lib/storage';
import { Vegetable } from '@/lib/types';
import { Plus, Pencil, Trash2, Check, X, IndianRupee, Leaf } from 'lucide-react';

const EMOJI_OPTIONS = [
  '🍆', '🍅', '🥔', '🧅', '🥕', '🫘', '🥒', '🌿', '🥬', '🥦',
  '👌', '🍌', '🍠', '🎃', '🫛', '🌽', '🌸', '🌶️', '🧄', '🫑',
  '🥑', '🌰', '🥝', '🍋', '🍊',
];

interface EditState {
  name: string;
  englishName: string;
  nicknames: string;
  emoji: string;
  defaultPrice: string;
  code: string;
}

export default function VegetablesPage() {
  const { vegetables, addVegetable, updateVegetable, deleteVegetable, loaded } = useVegetables();
  const [mounted, setMounted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<EditState>({ name: '', englishName: '', nicknames: '', emoji: '🥦', defaultPrice: '', code: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditState>({ name: '', englishName: '', nicknames: '', emoji: '', defaultPrice: '', code: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted || !loaded) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  const handleAdd = () => {
    if (!addForm.name.trim() || !addForm.emoji) return;
    addVegetable({
      name: addForm.name.trim(),
      englishName: addForm.englishName.trim(),
      nicknames: addForm.nicknames.split(',').map(n => n.trim()).filter(n => n !== '').slice(0, 2),
      emoji: addForm.emoji,
      defaultPrice: parseFloat(addForm.defaultPrice) || 0,
      code: addForm.code ? parseInt(addForm.code) : undefined,
    });
    setAddForm({ name: '', englishName: '', nicknames: '', emoji: '🥦', defaultPrice: '', code: '' });
    setShowAdd(false);
  };

  const startEdit = (v: Vegetable) => {
    setEditingId(v.id);
    setEditForm({
      name: v.name, englishName: v.englishName || '',
      nicknames: v.nicknames?.join(', ') || '',
      emoji: v.emoji, defaultPrice: v.defaultPrice.toString(),
      code: v.code ? String(v.code) : '',
    });
  };

  const saveEdit = () => {
    if (!editingId || !editForm.name.trim()) return;
    updateVegetable(editingId, {
      name: editForm.name.trim(), englishName: editForm.englishName.trim(),
      nicknames: editForm.nicknames.split(',').map(n => n.trim()).filter(n => n !== '').slice(0, 2),
      emoji: editForm.emoji, defaultPrice: parseFloat(editForm.defaultPrice) || 0,
      code: editForm.code ? parseInt(editForm.code) : undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Vegetables</h1>
          <p className="text-gray-500 text-sm mt-1">
            {vegetables.length} vegetable{vegetables.length !== 1 ? 's' : ''} in catalog
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Vegetable
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Add New Vegetable</h3>
          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setAddForm({ ...addForm, emoji: em })}
                  className={`text-2xl p-1.5 rounded-lg border-2 transition-colors ${
                    addForm.emoji === em ? 'border-green-500 bg-green-50' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  {em}
                </button>
              ))}
              <input
                type="text"
                placeholder="or type emoji"
                value={EMOJI_OPTIONS.includes(addForm.emoji) ? '' : addForm.emoji}
                onChange={(e) => setAddForm({ ...addForm, emoji: e.target.value })}
                className="border border-gray-400 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Name (Tamil) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g. கத்தரிக்காய்"
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">English Name</label>
              <input
                type="text"
                value={addForm.englishName}
                onChange={(e) => setAddForm({ ...addForm, englishName: e.target.value })}
                placeholder="e.g. Brinjal"
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nicknames (max 2, comma separated)</label>
              <input
                type="text"
                value={addForm.nicknames}
                onChange={(e) => setAddForm({ ...addForm, nicknames: e.target.value })}
                placeholder="e.g. Eggplant, Katsiri"
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Price / kg (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" min="0" step="0.5" value={addForm.defaultPrice}
                  onChange={(e) => setAddForm({ ...addForm, defaultPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full border border-gray-400 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Code (number)</label>
              <input type="number" min="1" value={addForm.code}
                onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
                placeholder="e.g. 1"
                className="w-full border border-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" />
              <p className="text-xs text-gray-400 mt-1">Type this number in bill to quickly select</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 sm:flex-none border border-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Add Vegetable
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Remove Vegetable?</h3>
            <p className="text-gray-500 text-sm mb-5">
              This removes it from the catalog. Existing bills will not be affected.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button
                onClick={() => { deleteVegetable(deleteId); setDeleteId(null); }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vegetable grid */}
      {vegetables.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Leaf className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No vegetables in catalog.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vegetables.map((v: Vegetable) => (
            <div
              key={v.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {editingId === v.id ? (
                <div className="p-4 space-y-3">
                  {/* Emoji picker in edit */}
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJI_OPTIONS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, emoji: em })}
                        className={`text-xl p-1 rounded-lg border-2 transition-colors ${
                          editForm.emoji === em ? 'border-green-500 bg-green-50' : 'border-transparent hover:border-gray-200'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Tamil Name"
                      className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                    />
                    <input
                      type="text"
                      value={editForm.englishName}
                      onChange={(e) => setEditForm({ ...editForm, englishName: e.target.value })}
                      placeholder="English Name"
                      className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                    />
                    <input
                      type="text"
                      value={editForm.nicknames}
                      onChange={(e) => setEditForm({ ...editForm, nicknames: e.target.value })}
                      placeholder="Nicknames (comma separated)"
                      className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="number" min="0" step="0.5" value={editForm.defaultPrice}
                      onChange={(e) => setEditForm({ ...editForm, defaultPrice: e.target.value })}
                      className="w-full border border-gray-400 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" />
                  </div>
                  <input type="number" min="1" value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    placeholder="Code (number)"
                    className="w-full border border-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="flex-1 border border-gray-200 text-gray-600 py-1.5 rounded-lg text-sm hover:bg-gray-50">
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                    <button onClick={saveEdit} className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-sm hover:bg-green-700">
                      <Check className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-center gap-3">
                  <div className="text-3xl w-10 text-center shrink-0">{v.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {v.code && <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">{v.code}</span>}
                      <span className="font-medium text-gray-900 truncate">{v.name}</span>
                    </div>
                    {v.englishName && <div className="text-gray-500 text-xs truncate">{v.englishName}</div>}
                    {v.nicknames && v.nicknames.length > 0 && (
                      <div className="text-gray-400 text-[10px] truncate italic">&quot;{v.nicknames.join(', ')}&quot;</div>
                    )}
                    <div className="text-green-700 text-sm font-semibold flex items-center gap-0.5 mt-0.5">
                      <IndianRupee className="w-3 h-3" />{v.defaultPrice}/kg
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(v)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(v.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
