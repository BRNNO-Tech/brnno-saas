'use client'

import { useState } from 'react'
import { ScriptsCategoriesPanel } from './scripts-categories-panel'
import { ScriptsListPanel } from './scripts-list-panel'
import { ScriptEditorPanel } from './script-editor-panel'
import { type Script } from '@/lib/actions/scripts'
import { cn } from '@/lib/utils'

interface ScriptsLibraryLayoutProps {
  initialScripts: Script[]
}

export function ScriptsLibraryLayout({ initialScripts }: ScriptsLibraryLayoutProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null)
  const [scripts, setScripts] = useState<Script[]>(initialScripts)

  const selectedScript = selectedScriptId ? scripts.find(s => s.id === selectedScriptId) : null

  // Filter scripts by category
  const filteredScripts = selectedCategory === 'all'
    ? scripts
    : scripts.filter(s => s.category === selectedCategory)

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Panel: Categories */}
      <div className="hidden lg:block w-64 flex-shrink-0 border-r border-zinc-200/50 dark:border-white/10 overflow-y-auto">
        <ScriptsCategoriesPanel
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryCounts={getCategoryCounts(scripts)}
        />
      </div>

      {/* Center Panel: Script List */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <ScriptsListPanel
          scripts={filteredScripts}
          selectedScriptId={selectedScriptId}
          onSelectScript={setSelectedScriptId}
          onScriptsUpdate={setScripts}
        />
      </div>

      {/* Right Panel: Editor + Performance */}
      <div className={cn(
        "hidden xl:block w-96 flex-shrink-0 border-l border-zinc-200/50 dark:border-white/10 overflow-hidden transition-all duration-300 ease-in-out",
        selectedScript 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-full pointer-events-none w-0"
      )}>
        {selectedScript && (
          <div className="h-full animate-in slide-in-from-right duration-300">
            <ScriptEditorPanel
              script={selectedScript}
              onClose={() => setSelectedScriptId(null)}
              onScriptUpdate={(updated) => {
                setScripts(scripts.map(s => s.id === updated.id ? updated : s))
              }}
            />
          </div>
        )}
      </div>

      {/* Mobile: Editor as Modal/Drawer */}
      {selectedScript && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-900 shadow-xl animate-in slide-in-from-right duration-300">
            <ScriptEditorPanel
              script={selectedScript}
              onClose={() => setSelectedScriptId(null)}
              onScriptUpdate={(updated) => {
                setScripts(scripts.map(s => s.id === updated.id ? updated : s))
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function getCategoryCounts(scripts: Script[]): Record<string, number> {
  const counts: Record<string, number> = {
    all: scripts.length,
  }
  
  scripts.forEach(script => {
    counts[script.category] = (counts[script.category] || 0) + 1
  })
  
  return counts
}

