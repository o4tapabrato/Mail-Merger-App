"use client";
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import AgentPicker from '../components/AgentPicker';

function VariableButton({ name, onInsert }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onInsert(name)}
      className="bg-gray-800 hover:bg-blue-600 transition-all text-gray-200 p-3 rounded-lg border border-gray-700 text-sm font-mono flex items-center justify-between group cursor-pointer w-full"
    >
      {`{{${name}}}`}
      <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Insert</span>
    </button>
  );
}

export default function ComposePage() {
  const [template, setTemplate] = useState({
    name: '',
    subject: '',
    cc: '',
    bcc: '',
    body: '',
    assignedAgentId: '',
    priority: 0
  });
  const [variables, setVariables] = useState([]);
  const [fileData, setFileData] = useState([]);
  const [focusedField, setFocusedField] = useState('body');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const refs = {
    subject: useRef(null),
    cc: useRef(null),
    bcc: useRef(null),
    body: useRef(null)
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (data.length > 0) {
        setVariables(Object.keys(data[0]));
        setFileData(data);
      }
    };
    reader.readAsBinaryString(file);
  };

  const insertVariable = (varName) => {
    const variableTag = `{{${varName}}}`;
    const field = refs[focusedField]?.current;
    if (!field) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const value = field.value;
    const newValue = value.substring(0, start) + variableTag + value.substring(end);
    setTemplate(prev => ({ ...prev, [focusedField]: newValue }));
    setTimeout(() => { field.focus(); field.setSelectionRange(start + variableTag.length, start + variableTag.length); }, 0);
  };

  const handleAction = async (shouldSend) => {
    if (!template.name) return alert("Campaign name is required!");
    setLoading(true);

    const saveRes = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: template.name, template, fileData }),
    });

    const saved = await saveRes.json();
    if (!saved.success) { 
      setLoading(false); 
      return alert("Failed to save campaign."); 
    }

    const targetId = saved.campaign?.id || saved.id;

    if (shouldSend) {
      if (fileData.length === 0) { 
        setLoading(false); 
        return alert("Upload data first!"); 
      }
      
      const sendRes = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetId }),
      });
      
      const sendData = await sendRes.json();
      if (sendData.success) {
        alert("Campaign saved and sending started!");
        router.push('/campaigns');
      } else {
        alert("Campaign saved, but sending failed to start: " + (sendData.error || "Unknown error"));
      }
    } else {
      alert("Campaign saved successfully!");
      router.push('/campaigns');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      <main className="flex-1 p-10 flex flex-col bg-gray-950">
        <header className="mb-6 flex justify-between items-center">
          <input
            className="text-2xl font-bold bg-transparent outline-none border-b border-transparent focus:border-blue-600 w-1/2"
            placeholder="Campaign Name..."
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
          />
          <div className="flex gap-4">
            <button onClick={() => handleAction(false)} disabled={loading} className="bg-gray-800 px-6 py-2 rounded-lg font-semibold text-sm hover:bg-gray-700">Save Draft</button>
            <button onClick={() => handleAction(true)} disabled={loading} className="bg-blue-600 px-6 py-2 rounded-lg font-semibold text-sm hover:bg-blue-500">Send Campaign</button>
          </div>
        </header>

        <div className="flex-grow bg-gray-900 rounded-2xl border border-gray-800 flex flex-col overflow-hidden">
          <div className="border-b border-gray-800">
            <input ref={refs.subject} className="w-full bg-transparent p-4 border-b border-gray-800 outline-none text-sm" placeholder="Subject" value={template.subject} onFocus={() => setFocusedField('subject')} onChange={e => setTemplate({ ...template, subject: e.target.value })} />
            <div className="flex">
              <input ref={refs.cc} className="w-1/2 bg-transparent p-4 border-r border-gray-800 outline-none text-sm" placeholder="CC" value={template.cc} onFocus={() => setFocusedField('cc')} onChange={e => setTemplate({ ...template, cc: e.target.value })} />
              <input ref={refs.bcc} className="w-1/2 bg-transparent p-4 outline-none text-sm" placeholder="BCC" value={template.bcc} onFocus={() => setFocusedField('bcc')} onChange={e => setTemplate({ ...template, bcc: e.target.value })} />
            </div>
          </div>
          <textarea ref={refs.body} className="flex-grow p-6 bg-transparent outline-none resize-none font-mono text-sm" placeholder="Write your email body..." value={template.body} onFocus={() => setFocusedField('body')} onChange={e => setTemplate({ ...template, body: e.target.value })} />
        </div>
      </main>

      <aside className="w-80 bg-gray-900 border-l border-gray-800 p-8 flex flex-col">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase">1. Recipient Data</h3>
        <input type="file" onChange={handleFileUpload} className="mb-8 w-full text-sm text-gray-400 file:bg-gray-800 file:border-none file:p-2 file:rounded-lg" />
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase">2. Available Variables</h3>
        <div className="flex-grow space-y-2 overflow-y-auto mb-8">{variables.map(v => <VariableButton key={v} name={v} onInsert={insertVariable} />)}</div>
        <AgentPicker
          value={template.assignedAgentId}
          onChange={(val) => setTemplate(prev => ({ ...prev, assignedAgentId: val }))}
        />
        <div className="mt-8 border-t border-gray-800 pt-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase">4. Campaign Priority</h3>
          <input
            type="number"
            value={template.priority}
            onChange={(e) => setTemplate(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
            className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 text-white text-sm"
            placeholder="0 (Low) to 10 (High)"
          />
        </div>
      </aside>
    </div>
  );
}