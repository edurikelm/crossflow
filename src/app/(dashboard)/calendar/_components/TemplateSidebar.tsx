"use client";

import type { ClassTemplate } from "@/types";
interface TemplateSidebarProps {
  classTemplates: ClassTemplate[];
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateSidebar({
  classTemplates,
  onSelectTemplate,
}: TemplateSidebarProps) {
  return (
    <div className="lg:col-span-1 bg-surface_container_low rounded-lg p-4">
      <h3 className="font-display font-bold text-sm uppercase tracking-widest text-outline mb-3">
        Plantillas
      </h3>
      <div className="space-y-2">
        {classTemplates.map((template) => (
          <div
            key={template.id}
            className="flex items-center gap-2 rounded-md border border-outline-variant/20 p-2 cursor-pointer hover:bg-surface_container_high transition-colors"
            onClick={() => onSelectTemplate(template.id)}
          >
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: template.color }}
            />
            <span className="text-sm truncate">{template.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
