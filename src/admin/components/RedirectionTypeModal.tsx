import { useState } from "@wordpress/element";

export type RedirectionType =
  | "one-way"
  | "same-site"
  | "popup"
  | "query-string";

interface RedirectionTypeOption {
  type: RedirectionType;
  title: string;
  description: string;
  example: string;
}

const redirectionTypes: RedirectionTypeOption[] = [
  {
    type: "one-way",
    title: "One-way redirection",
    description:
      "Redirect visitors from one URL to another based on their location.",
    example: "example.com → example.fr (for visitors from France)",
  },
  {
    type: "same-site",
    title: "Same-site redirection",
    description: "Redirect visitors to a different path on the same domain.",
    example: "example.com → example.com/fr (for visitors from France)",
  },
  {
    type: "query-string",
    title: "Query String redirection",
    description: "Add location parameters to URLs without changing the page.",
    example: "example.com → example.com?country=fr",
  },
  {
    type: "popup",
    title: "Popup redirection",
    description:
      "Show a popup asking visitors if they want to be redirected to a location-specific page.",
    example: "Show popup: 'Visit our French site?' → example.fr",
  },
];

interface RedirectionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: RedirectionType) => void;
}

export function RedirectionTypeModal({
  isOpen,
  onClose,
  onSelect,
}: RedirectionTypeModalProps): JSX.Element {
  const [selectedType, setSelectedType] = useState<RedirectionType | null>(
    null,
  );

  if (!isOpen) return <></>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-none hard-shadow max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl mb-2 text-secondary">
            Choose redirection type
          </h2>
          <button className="btn btn-sm btn-circle" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {redirectionTypes.map((option) => (
            <div
              key={option.type}
              className={`
                border rounded-none p-4 cursor-pointer transition-all
                ${
                  selectedType === option.type
                    ? "border-primary bg-primary bg-opacity-5"
                    : "border-gray-200 hover:border-primary"
                }
              `}
              onClick={() => setSelectedType(option.type)}
            >
              <h3 className="text-lg font-semibold mb-2">{option.title}</h3>
              <p className="text-gray-600 mb-4">{option.description}</p>
              <div className="bg-base-200 p-3">
                <span className="text-sm font-medium">Example:</span>
                <p className="text-sm text-gray-600">{option.example}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!selectedType}
            onClick={() => selectedType && onSelect(selectedType)}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
