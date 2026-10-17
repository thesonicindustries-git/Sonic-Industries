"use client";

import { Plus, X } from "lucide-react";
import { ProductFormDataType } from "@/types";
import LabelPositionPreview from "./LabelPositionPreview";

interface LabelsFormProps {
  formData: ProductFormDataType;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormDataType>>;
}

type LabelPatch = {
  x?: number;
  y?: number;
  name?: string;
  desc?: string;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

const LabelsForm = ({ formData, setFormData }: LabelsFormProps) => {
  // The first product image is the one shown on the website hotspot section
  const imageSrc = formData.images?.[0]?.preview || "";
  const labels = formData.labels || [];

  const handleAddLabel = () => {
    setFormData((prev) => ({
      ...prev,
      labels: [...(prev.labels || []), { x: 50, y: 50, name: "", desc: "" }],
    }));
  };

  const handleRemoveLabel = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      labels: (prev.labels || []).filter((_, i) => i !== index),
    }));
  };

  const updateLabel = (index: number, patch: LabelPatch) => {
    setFormData((prev) => ({
      ...prev,
      labels: (prev.labels || []).map((label, i) =>
        i === index ? { ...label, ...patch } : label
      ),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Labels</h3>
        <button
          type="button"
          onClick={handleAddLabel}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Label
        </button>
      </div>

      {labels.length > 0 ? (
        labels.map((label, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-3 bg-gray-50"
          >
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">
                Label {index + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveLabel(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label Name *
              </label>
              <input
                type="text"
                placeholder="Label Name"
                value={label.name || ""}
                onChange={(e) => updateLabel(index, { name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Label Description"
                value={label.desc || ""}
                onChange={(e) => updateLabel(index, { desc: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  X Position (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="X"
                  value={label.x ?? 0}
                  onChange={(e) =>
                    updateLabel(index, { x: clamp(Number(e.target.value)) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Y Position (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="Y"
                  value={label.y ?? 0}
                  onChange={(e) =>
                    updateLabel(index, { y: clamp(Number(e.target.value)) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Position preview: shows where this label will appear on the image */}
            <LabelPositionPreview
              imageSrc={imageSrc}
              x={label.x ?? 0}
              y={label.y ?? 0}
              label={label.name}
              onChange={(x, y) => updateLabel(index, { x, y })}
            />
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm">
          No labels yet. Click &quot;Add Label&quot; to start.
        </p>
      )}
    </div>
  );
};

export default LabelsForm;
