import React, { useState, useEffect, useRef } from 'react';

const CoursesDropDown = ({ courses, formData, handleChange }) => {
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
    console.log(formData);
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
    setSearchTerm(event.target.value)
  };


  // Filter skills based on the search term (case-insensitive)
  const filteredSkills = Array.isArray(courses)
    ? courses.filter((course) =>
        course.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];


  return (
    <div ref={dropdownRef}>
    <div id="dropLeveldownSearchButton" data-dropdown-toggle="dropdownSearch" data-dropdown-placement="bottom" className="min-h-10 rounded-md border border-input text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2" type="text" >
    <div className="relative flex flex-wrap gap-1" >
      {formData.course !== '' ? (
        <div className="inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 data-[disabled]:bg-muted-foreground data-[disabled]:text-muted data-[disabled]:hover:bg-muted-foreground data-[fixed]:bg-muted-foreground data-[fixed]:text-muted data-[fixed]:hover:bg-muted-foreground" >
        {formData.course}
        ajslkdfj;aljsdf;lkajsd;lfja
        </div>
                ) : 
  <input type="text" value={searchTerm} onFocus={handleFocus} onChange={handleSearchChange} className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground px-3 py-2" placeholder="Search course" />
      }
  <input disabled={ true } type="text" className={(formData.course !== '' ? 'display' : 'hidden' ) + " invisible flex-1 bg-transparent outline-none placeholder:text-muted-foreground px-3 py-2"} placeholder="Search course" />
        <button 
        onClick={() => { handleChange({ target: { name: "course", value: "", type: 'radio' } })} } type="button" 
        className={ (formData.course !== '' ? 'display' : 'hidden' ) + " relative right-0 h-6 w-6 p-0"}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>
    </div> 
    </div> 


    <div className="relative"> 
      <div className={(isSkillsDropDownOpen ? "display" : "hidden" ) + " relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-[selected='true']:bg-accent aria-[selected='true']:text-accent-foreground data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50"}>
      <div className="p-1 text-foreground h-full overflow-auto" aria-labelledby="dropdownSearchButton" >
    <div role="group">
        {filteredSkills.length > 0 ? (
          filteredSkills.map((course, index) => (
              <div 
            key={index}
            onClick={() => handleChange({ target: { name: "course", value: course, type: 'radio', checked: true} })} 
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-[selected='true']:bg-accent aria-[selected='true']:text-accent-foreground data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50">
                  {course}
              </div>
          ))
        ) : (
          <p className="text-gray-400">No skills available.</p>
        )}
      <div>
        <div onClick={() => { handleChange({ target: { name: "course", value: searchTerm, type: 'radio', checked: true} }); setSearchTerm('')} } className={(searchTerm !== '' ? 'display' : 'hidden') + " relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-[selected='true']:bg-accent aria-[selected='true']:text-accent-foreground data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50"} id="radix-:rvr:" cmdk-item="" role="option" aria-disabled="false" aria-selected="false" data-disabled="false" data-selected="false" data-value="n">Create {'"' + searchTerm + '"' }</div> </div>
      </div>
    </div>
    </div>
    </div>
    </div>
    )
};
export default CoursesDropDown;

