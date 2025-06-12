import React, { useState, useEffect, useRef } from 'react';

const SkillsDropdown = ({ skillsEarned, formData, handleChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const [isSkillsDropDownOpen, setIsSkillsDropDownOpen] = useState(false);

  const handleFocus = () => {
    setIsSkillsDropDownOpen(true);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsSkillsDropDownOpen(false); // Close dropdown if clicked outside
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsSkillsDropDownOpen(false); // Close dropdown on 'Esc' key press
    }
  };

  useEffect(() => {
    // Add event listener for clicks outside
    document.addEventListener('mousedown', handleClickOutside);
      // Add event listener for keydown
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      // Cleanup the event listener on component unmount
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);

    };
  }, []);

  const handleSearchChange = (event) => {
    if(!isSkillsDropDownOpen) setIsSkillsDropDownOpen(true)
    console.log('aksdflajsd');
    setSearchTerm(event.target.value)
  };


  // Filter skills based on the search term (case-insensitive)
  const filteredSkills = Array.isArray(skillsEarned)
    ? skillsEarned.filter((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];


  return (
    <div ref={dropdownRef}>
    <div id="dropLeveldownSearchButton" data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" className="min-h-10 rounded-md border border-input text-sm ring-offset-background" type="text" >
    <div className="flex flex-wrap gap-2" >
      {formData.skillsEarned.length > 0 ? formData.skillsEarned.map((s, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded" onClick={() => handleChange({ target: { name: "skillsEarned", value: s, type: 'checkbox' } })} >
      {s}
      <button id="bordered-checkbox-1" name="bordered-checkbox" className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-3 w-3 text-muted-foreground hover:text-foreground" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
        </button>
                </span>
                )) : null }
    <div className="flex flex-row w-full rounded-md bg-background">
              <input type="text" value={searchTerm} onFocus={handleFocus} onChange={handleSearchChange} className="flex h-10 w-full rounded-md border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm flex-grow border-0 focus:ring-0" placeholder="Search skills" />
    <button onClick={() => setIsSkillsDropDownOpen(false)} type="button" className={ (isSkillsDropDownOpen ? "display" : "hidden" ) + " relative rounded-sm opacity-70 ring-offset-background transition-opacity p-2 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"}><div className="rounded-sm text-xs border py-2 px-2 hover:bg-muted">Esc</div><span className="sr-only">Close</span></button>
              <button onClick={() => { formData.skillsEarned.forEach( s => handleChange({ target: { name: "skillsEarned", value: s, type: 'checkbox' } }) )} } type="button" className={ (formData.skillsEarned.length > 0 ? 'display' : 'hidden' ) + " p-2"}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
    </div> 
    </div> 
    </div> 


    <div className="relative"> 
      <div className={(isSkillsDropDownOpen ? "display" : "hidden" ) + " absolute z-50  w-full flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm rounded-2xl bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]"}>
      <div className="p-1 text-foreground w-full max-h-50 overflow-y-auto" aria-labelledby="dropdownSearchButton" >
    <div role="group">
        {filteredSkills.length > 0 ? (
          filteredSkills.map((skill, index) => (
            <div key={index}>
            { !formData.skillsEarned.includes(skill) ? (
              <div 
            onClick={() => handleChange({ target: { name: "skillsEarned", value: skill, type: 'checkbox', checked: true} })} 
            className="relative flex cursor-default select-none items-center rounded-sm m-1 px-2 py-1.5 text-sm bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]" data={skill}>
                  {skill}
              </div>
            ) : null }
            </div>
          ))
        ) : (
          <p className="text-gray-400">No skills available.</p>
        )}
      <div>
        <div onClick={() => { handleChange({ target: { name: "skillsEarned", value: searchTerm, type: 'checkbox', checked: true} }); setSearchTerm('')} } className={(searchTerm !== '' ? 'display' : 'hidden') + " relative flex cursor-default select-none items-center rounded-sm m-1 px-2 py-1.5 text-sm bg-gradient-to-br from-white/10 to-white/5 via-cyan-400/10 backdrop-blur-md border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]"} id="radix-:rvr:" cmdk-item="" role="option" aria-disabled="false" aria-selected="false" data-disabled="false" data-selected="false" data-value="n">Create {'"' + searchTerm + '"' }</div> 
    </div>
      </div>
    </div>
    </div>
    </div>
    </div>
    )
};
export default SkillsDropdown;

