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
    <div id="dropLeveldownSearchButton" data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" className="min-h-10 rounded-md border border-input text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2" type="text" >
    <div className="relative flex flex-wrap gap-1" >
      {formData.skillsEarned.length > 0 ? formData.skillsEarned.map(s => (
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 data-[disabled]:bg-muted-foreground data-[disabled]:text-muted data-[disabled]:hover:bg-muted-foreground data-[fixed]:bg-muted-foreground data-[fixed]:text-muted data-[fixed]:hover:bg-muted-foreground" onClick={() => handleChange({ target: { name: "skillsEarned", value: s, type: 'checkbox' } })} >
      {s}
      <button id="bordered-checkbox-1" name="bordered-checkbox" className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-x h-3 w-3 text-muted-foreground hover:text-foreground" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
        </button>
                </div>
                )) : null }
              <input type="text" value={searchTerm} onFocus={handleFocus} onChange={handleSearchChange} className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground px-3 py-2" placeholder="Search skills" />
              <button onClick={() => { formData.skillsEarned.forEach( s => handleChange({ target: { name: "skillsEarned", value: s, type: 'checkbox' } }) )} } type="button" className={ (formData.skillsEarned.length > 0 ? 'display' : 'hidden' ) + " relative right-0 h-6 w-6 p-0"}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
    </div> 
    </div> 


    <div className="relative"> 
      <div className={(isSkillsDropDownOpen ? "display" : "hidden" ) + " relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-[selected='true']:bg-accent aria-[selected='true']:text-accent-foreground data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50"}>
      <div className="p-1 text-foreground h-full overflow-auto" aria-labelledby="dropdownSearchButton" >
    <div role="group">
        {filteredSkills.length > 0 ? (
          filteredSkills.map((skill, index) => (
            <div>
            { !formData.skillsEarned.includes(skill) ? (
              <div 
            onClick={() => handleChange({ target: { name: "skillsEarned", value: skill, type: 'checkbox', checked: true} })} 
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-[selected='true']:bg-accent aria-[selected='true']:text-accent-foreground data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50" data={skill}>
                  {skill}
              </div>
            ) : null }
            </div>
          ))
        ) : (
          <p className="text-gray-400">No skills available.</p>
        )}
      <div>
        <div onClick={() => { handleChange({ target: { name: "skillsEarned", value: searchTerm, type: 'checkbox', checked: true} }); setSearchTerm('')} } className={(searchTerm !== '' ? 'display' : 'hidden') + " relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-[selected='true']:bg-accent aria-[selected='true']:text-accent-foreground data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50"} id="radix-:rvr:" cmdk-item="" role="option" aria-disabled="false" aria-selected="false" data-disabled="false" data-selected="false" data-value="n">Create {'"' + searchTerm + '"' }</div> </div>
      </div>
    </div>
    </div>
    </div>
    </div>
    )
};
export default SkillsDropdown;

