import React, { useState, useEffect, useRef } from 'react';

const PrereqDropdown = ({ badges = [], formData, setFormData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleFocus = () => setIsOpen(true);
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') setIsOpen(false);
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchChange = (e) => {
    if (!isOpen) setIsOpen(true);
    setSearchTerm(e.target.value);
  };

  const addRequire = (id) => {
    if (!formData.requires) formData.requires = [];
    if (!formData.requires.includes(id)) {
      setFormData({ ...formData, requires: [...formData.requires, id] });
    }
  };

  const removeRequire = (id) => {
    setFormData({ ...formData, requires: formData.requires.filter(r => r !== id) });
  };

  const filtered = Array.isArray(badges)
    ? badges.filter(b => {
        const name = (b.name || '').toString().toLowerCase();
        const bid = (b.badgeId || String(b.id || '')).toString().toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || bid.includes(searchTerm.toLowerCase());
      })
    : [];

  const getLabel = (id) => {
    const b = badges.find(x => String(x._id || x.id) === String(id));
    return b ? `${b.name} (${b.badgeId || b.id})` : id;
  };

  return (
    <div ref={dropdownRef}>
      <div className="min-h-10 rounded-md border border-input text-sm">
        <div className="flex flex-wrap gap-2 p-2">
          {formData.requires && formData.requires.length > 0 ? formData.requires.map((r, idx) => (
            <span key={r} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-2">
              <span>{getLabel(r)}</span>
              <button type="button" onClick={() => removeRequire(r)} className="ml-1 rounded-full outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
              </button>
            </span>
          )) : null}
          <div className="flex flex-row w-full rounded-md bg-background">
            <input type="text" value={searchTerm} onFocus={handleFocus} onChange={handleSearchChange} className="flex h-10 w-full rounded-md bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none" placeholder="Search badges" />
            <button onClick={() => setIsOpen(false)} type="button" className={(isOpen ? 'inline-flex' : 'hidden') + ' p-2'}><div className="rounded-sm text-xs border py-2 px-2">Esc</div><span className="sr-only">Close</span></button>
          </div>
        </div>
      </div>

      <div className={(isOpen ? 'block' : 'hidden') + ' absolute z-50 w-full mt-2'}>
        <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 p-2 max-h-48 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((b) => {
            const id = String(b._id || b.id);
            const selected = formData.requires && formData.requires.includes(id);
            return (
              <div key={id} className="m-1">
                {!selected ? (
                  <div onClick={() => addRequire(id)} className="cursor-pointer rounded-sm m-1 px-2 py-1.5 text-sm bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10">
                    {b.name} ({b.badgeId || b.id})
                  </div>
                ) : null}
              </div>
            )
          }) : (
            <p className="text-gray-400 p-2">No badges found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrereqDropdown;
