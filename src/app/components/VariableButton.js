export default function VariableButton({ name, onInsert }) {
  return (
    <button
      onClick={() => onInsert(name)}
      className="bg-gray-800 hover:bg-blue-600 transition-all text-gray-200 p-3 rounded-lg border border-gray-700 text-sm font-mono flex items-center justify-between group cursor-pointer w-full"
    >
      {`{{${name}}}`}
      <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Insert</span>
    </button>
  );
}