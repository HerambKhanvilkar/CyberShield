import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


const LevelRadio = ({ formData, handleChange }) => {
  const levels = ['Amateur', 'Experienced', 'Professional', 'Expert'];

  return (
<div className="flex flex-col lg:flex-row flex-wrap">
          <RadioGroup defaultValue="option1" className="flex flex-col sm:flex-row sm:flex-wrap space-y-2">
    { levels.map((level, index) => (
            <div key={index} className="flex flex-row flex-wrap items-center my-2 space-x-2">
              <RadioGroupItem 
                value={level} 
                type="button" 
                name="level"
                onClick={() => handleChange({ target: { name: "level", value:level, type: 'radio', checked:true } })}
                checked={formData.level === level}
                id={"option" + index} 
            />
              <Label htmlFor={"option" + index}>{level}</Label>
    </div>
    ))}
          </RadioGroup>
</div>
  );
};

export default LevelRadio;

