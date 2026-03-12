import { useState } from "react";
import { useAppStore } from "../store";
import { Direction } from "../data";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

export function SelectedWeapons() {
  const { selectedWeapon, setSelectedWeapon, patterns, setPatterns } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editWeapon, setEditWeapon] = useState(selectedWeapon);

  // Sync edit state when selected weapon changes
  if (!isEditing && editWeapon.id !== selectedWeapon.id) {
    setEditWeapon(selectedWeapon);
  }

  const handleSave = () => {
    // Sort turns by bullet
    const sortedTurns = [...editWeapon.turns].sort((a, b) => a.bullet - b.bullet);
    const updatedWeapon = { ...editWeapon, turns: sortedTurns };
    
    setSelectedWeapon(updatedWeapon);
    
    // Update in patterns array
    const newPatterns = patterns.map(p => p.id === updatedWeapon.id ? updatedWeapon : p);
    setPatterns(newPatterns);
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditWeapon(selectedWeapon);
    setIsEditing(false);
  };

  const addTurn = () => {
    const maxBullet = editWeapon.turns.length > 0 ? Math.max(...editWeapon.turns.map(t => t.bullet)) : 0;
    const newBullet = Math.min(maxBullet + 5, editWeapon.magSize);
    setEditWeapon({
      ...editWeapon,
      turns: [...editWeapon.turns, { bullet: newBullet, dir: "left" }]
    });
  };

  const removeTurn = (index: number) => {
    const newTurns = [...editWeapon.turns];
    newTurns.splice(index, 1);
    setEditWeapon({ ...editWeapon, turns: newTurns });
  };

  const updateTurn = (index: number, field: string, value: any) => {
    const newTurns = [...editWeapon.turns];
    newTurns[index] = { ...newTurns[index], [field]: value };
    setEditWeapon({ ...editWeapon, turns: newTurns });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold tracking-wide flex items-center gap-3">
          {isEditing ? (
            <input 
              type="text" 
              value={editWeapon.name} 
              onChange={e => setEditWeapon({...editWeapon, name: e.target.value})}
              className="bg-black/50 border border-white/20 rounded px-2 py-1 text-xl w-48"
            />
          ) : (
            <span>{selectedWeapon.name}</span>
          )}
          
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-white/50 hover:text-white transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isEditing && (
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded text-sm font-medium transition-colors">
              <Check className="w-4 h-4" /> 保存
            </button>
            <button onClick={handleCancel} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm font-medium transition-colors">
              <X className="w-4 h-4" /> 取消
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="bg-black/30 rounded-lg p-4 border border-white/10 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-white/60 mb-1">射速 (RPM)</label>
              <input 
                type="number" 
                value={editWeapon.rpm} 
                onChange={e => setEditWeapon({...editWeapon, rpm: parseInt(e.target.value) || 0})}
                className="w-full bg-black/50 border border-white/20 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">弹匣容量</label>
              <input 
                type="number" 
                value={editWeapon.magSize} 
                onChange={e => setEditWeapon({...editWeapon, magSize: parseInt(e.target.value) || 0})}
                className="w-full bg-black/50 border border-white/20 rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-white/80">拐点配置 (按第几发)</label>
              <button onClick={addTurn} className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors">
                <Plus className="w-3 h-3" /> 添加拐点
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scroll pr-2">
              {editWeapon.turns.map((turn, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 p-2 rounded border border-white/5">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-white/50 w-12">第</span>
                    <input 
                      type="number" 
                      value={turn.bullet} 
                      onChange={e => updateTurn(idx, 'bullet', parseInt(e.target.value) || 1)}
                      className="w-16 bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-center"
                      min="1"
                      max={editWeapon.magSize}
                    />
                    <span className="text-xs text-white/50 w-12">发</span>
                  </div>
                  
                  <div className="flex-1">
                    <select 
                      value={turn.dir} 
                      onChange={e => updateTurn(idx, 'dir', e.target.value as Direction)}
                      className="w-full bg-black/50 border border-white/20 rounded px-2 py-1 text-sm appearance-none"
                    >
                      <option value="left">向左 (A)</option>
                      <option value="right">向右 (D)</option>
                      <option value="down">向下 (S)</option>
                    </select>
                  </div>
                  
                  <button onClick={() => removeTurn(idx)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {editWeapon.turns.length === 0 && (
                <div className="text-center text-white/40 text-sm py-4">
                  暂无拐点，请添加
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 text-sm text-white/60">
          <div className="bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
            射速: <span className="text-white font-medium">{selectedWeapon.rpm} RPM</span>
          </div>
          <div className="bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
            弹匣: <span className="text-white font-medium">{selectedWeapon.magSize} 发</span>
          </div>
          <div className="bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
            拐点: <span className="text-white font-medium">{selectedWeapon.turns.length} 个</span>
          </div>
        </div>
      )}
    </div>
  );
}
